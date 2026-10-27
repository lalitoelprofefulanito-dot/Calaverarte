import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const VIEWS = ['inicio', 'crear', 'editor', 'taller', 'evaluacion', 'educacion', 'biblioteca', 'disenador', 'configuracion', 'creditos'];

/** Genera una calaverita desde el formulario y espera al editor. */
async function createPoem(page, { name = 'Doña Lupe', stanzas = '3', verses = '4' } = {}) {
  await page.goto('/#/crear');
  await page.fill('#f-names', name);
  await page.selectOption('#f-gender', 'a');
  await page.fill('#f-oficio', 'cocinera');
  await page.fill('#f-gusto', 'hacer tamales');
  await page.selectOption('#f-stanzas', stanzas);
  await page.selectOption('#f-verses', verses);
  await page.getByRole('button', { name: 'Generar calaverita' }).click();
  await expect(page).toHaveURL(/#\/editor/);
  await expect(page.locator('.stanza-card')).toHaveCount(Number(stanzas));
}

const verseValues = (page, stanza) => page.locator('.stanza-card').nth(stanza).locator('.verse-row input').evaluateAll((els) => els.map((e) => e.value));

test.describe('CalaverArte', () => {
  test('Autoría y referencias: muestra la cita APA y los prompts documentados', async ({ page }) => {
    await page.goto('/#/creditos');
    await expect(page.getByRole('heading', { name: 'Autoría y referencias' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cómo citar CalaverArte en APA 7' })).toBeVisible();
    await expect(page.locator('.credits__citation')).toContainText('Kantún Martínez, E. (2026)');
    await expect(page.getByRole('heading', { name: 'Autoría y reconocimiento del apoyo de IA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prompts documentados' })).toBeVisible();
    await expect(page.locator('.credits__prompt')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Descargar registro completo en Markdown' })).toBeVisible();
  });

  test('CA-01 / CA-15: inicia sin errores y sin peticiones externas', async ({ page }) => {
    const errors = [];
    const external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4173') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
    for (const view of VIEWS) {
      await page.goto(`/#/${view}`);
      await expect(page.locator('h1')).toBeVisible();
    }
    await createPoem(page);
    await page.getByRole('button', { name: 'Nueva variante' }).click();
    await page.goto('/#/educacion');
    await expect(page.locator('.activity-sheet')).toBeVisible();
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });

  test('CA-02: la validación explica errores y conserva lo escrito', async ({ page }) => {
    await page.goto('/#/crear');
    await page.fill('#f-oficio', 'panadero');
    await page.getByRole('button', { name: 'Generar calaverita' }).click();
    await expect(page.locator('.error-summary')).toBeVisible();
    await expect(page.locator('.error-summary')).toContainText('al menos un nombre');
    await expect(page.locator('#f-names')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#f-oficio')).toHaveValue('panadero');
    await page.fill('#f-names', 'A, B, C, D');
    await page.getByRole('button', { name: 'Generar calaverita' }).click();
    await expect(page.locator('.error-summary')).toContainText('como máximo 3');
  });

  test('CA-03 / CA-04: respeta la extensión e incorpora los datos', async ({ page }) => {
    await createPoem(page, { stanzas: '5', verses: '6' });
    for (let i = 0; i < 5; i += 1) expect(await verseValues(page, i)).toHaveLength(6);
    expect((await verseValues(page, 0)).join(' ')).toContain('Doña Lupe');
  });

  test('CA-05 / CA-06: las variantes guardan versión y respetan estrofas bloqueadas', async ({ page }) => {
    await createPoem(page);
    const lockedBefore = await verseValues(page, 0);
    await page.locator('.stanza-card').nth(0).getByRole('button', { name: 'Bloquear' }).click();
    await expect(page.locator('.stanza-card').nth(0).locator('input').first()).toHaveAttribute('readonly', '');
    await page.getByRole('button', { name: 'Nueva variante' }).click();
    await expect(page.getByRole('heading', { name: /Versiones \(1\)/ })).toBeVisible();
    expect(await verseValues(page, 0)).toEqual(lockedBefore);
    await expect(page.locator('.stanza-card').nth(0).getByRole('button', { name: 'Regenerar' })).toBeDisabled();
    await page.getByRole('button', { name: /Comparar «Antes de la nueva variante»/ }).click();
    await expect(page.locator('.diff')).toBeVisible();
  });

  test('CA-07: operaciones del editor, deshacer y confirmación al eliminar', async ({ page }) => {
    await createPoem(page);
    const first = page.locator('.stanza-card').nth(1).locator('.verse-row input').first();
    const original = await first.inputValue();
    await first.fill('Un verso escrito a mano');
    await expect(page.locator('.save-state')).toHaveText('Cambios sin guardar');
    await page.getByRole('button', { name: 'Deshacer' }).click();
    await expect(page.locator('.stanza-card').nth(1).locator('.verse-row input').first()).toHaveValue(original);
    await page.getByRole('button', { name: 'Rehacer' }).click();
    await expect(page.locator('.stanza-card').nth(1).locator('.verse-row input').first()).toHaveValue('Un verso escrito a mano');
    await page.getByRole('button', { name: 'Añadir estrofa después de la 3' }).click();
    await expect(page.locator('.stanza-card')).toHaveCount(4);
    await page.getByRole('button', { name: 'Bajar estrofa 1' }).click();
    await page.getByRole('button', { name: 'Añadir verso después del 4 en la estrofa 1' }).click();
    expect(await verseValues(page, 0)).toHaveLength(5);
    await page.getByRole('button', { name: 'Eliminar estrofa 4' }).click();
    await expect(page.locator('#confirm-dialog')).toBeVisible();
    await page.locator('#confirm-dialog [data-role="cancel"]').click();
    await expect(page.locator('.stanza-card')).toHaveCount(4);
    await page.getByRole('button', { name: 'Eliminar estrofa 4' }).click();
    await page.locator('#confirm-dialog [data-role="confirm"]').click();
    await expect(page.locator('.stanza-card')).toHaveCount(3);
    await page.fill('#poem-title', 'Título nuevo');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.locator('.save-state')).toHaveText('Guardado en este dispositivo');
  });

  test('CA-08: evaluar no modifica el contenido', async ({ page }) => {
    await createPoem(page);
    const before = await page.locator('.verse-row input').evaluateAll((els) => els.map((e) => e.value));
    await page.goto('/#/evaluacion');
    await expect(page.locator('.check-list .check').first()).toBeVisible();
    await expect(page.getByText('No verificable automáticamente').first()).toBeVisible();
    await page.getByRole('button', { name: 'Evaluar de nuevo' }).click();
    await page.goto('/#/editor');
    const after = await page.locator('.verse-row input').evaluateAll((els) => els.map((e) => e.value));
    expect(after).toEqual(before);
  });

  test('CA-09: las obras persisten al recargar', async ({ page }) => {
    await createPoem(page, { name: 'Persistencio' });
    await page.reload();
    await page.goto('/#/biblioteca');
    await expect(page.locator('.poem-item').filter({ hasText: 'Persistencio' })).toHaveCount(1);
    await page.fill('#bib-buscar', 'persistencio');
    await expect(page.locator('.poem-item')).toHaveCount(1);
    await page.fill('#bib-buscar', 'no-existe-xyz');
    await expect(page.getByText('Ninguna obra coincide')).toBeVisible();
  });

  test('CA-10: un fallo de almacenamiento se informa sin romper la app', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', { value: { open() { const e = new Error('lleno'); e.name = 'QuotaExceededError'; throw e; } } });
    });
    await page.goto('/#/inicio');
    await expect(page.getByText(/espacio de almacenamiento del navegador está lleno/)).toBeVisible();
    await page.goto('/#/biblioteca');
    await expect(page.locator('[role="alert"]').filter({ hasText: /almacenamiento/ }).first()).toBeVisible();
  });

  test('CA-11: exportar e importar conserva los datos y resuelve conflictos', async ({ page }) => {
    await createPoem(page, { name: 'Josefina Ñúñez' });
    const verses = await page.locator('.verse-row input').evaluateAll((els) => els.map((e) => e.value));
    await page.goto('/#/biblioteca');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar respaldo completo' }).click();
    const file = await (await download).path();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(data.format).toBe('calaverarte-respaldo');
    const exported = data.poems.find((p) => p.params.names === 'Josefina Ñúñez');
    expect(exported.stanzas.flatMap((s) => s.verses)).toEqual(verses);

    await page.locator('#bib-importar').setInputFiles(file);
    await expect(page.getByText(/ya existen en este dispositivo/)).toBeVisible();
    await page.getByLabel('Guardar las del archivo como copias nuevas').check();
    await page.getByRole('button', { name: 'Importar', exact: true }).click();
    await expect(page.locator('.poem-item').filter({ hasText: '(importada)' }).first()).toBeVisible();

    await page.locator('#bib-importar').setInputFiles({ name: 'malo.json', mimeType: 'application/json', buffer: Buffer.from('{"hola":1}') });
    await expect(page.getByText(/no es un respaldo de CalaverArte/)).toBeVisible();
  });

  test('CA-12: la impresión monta la hoja legible y llama al diálogo del navegador', async ({ page }) => {
    await page.addInitScript(() => { window.__prints = 0; window.print = () => { window.__prints += 1; }; });
    await createPoem(page);
    const title = await page.inputValue('#poem-title');
    await page.goto('/#/disenador');
    await page.selectOption('#dis-estilo', 'cuaderno');
    await page.getByRole('button', { name: 'Imprimir o guardar como PDF' }).click();
    expect(await page.evaluate(() => window.__prints)).toBe(1);
    await expect(page.locator('#print-root .sheet__title')).toHaveText(title);
    await expect(page.locator('#print-root .sheet')).toHaveClass(/sheet--cuaderno/);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#print-root .sheet')).toBeVisible();
    await expect(page.locator('.app-header')).toBeHidden();
  });

  test('CA-13: ninguna vista se desborda horizontalmente', async ({ page }) => {
    await createPoem(page);
    for (const view of VIEWS) {
      await page.goto(`/#/${view}`);
      await expect(page.locator('h1')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `desbordamiento en ${view}`).toBeLessThanOrEqual(1);
    }
  });

  test('CA-14: se puede crear una calaverita solo con teclado y todos los controles tienen nombre', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Prueba de teclado físico solo en escritorio');
    await page.goto('/#/crear');
    await page.locator('#f-names').focus();
    await page.keyboard.type('Teclado');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/editor/);
    await page.keyboard.press('Control+z');
    for (const view of VIEWS) {
      await page.goto(`/#/${view}`);
      await expect(page.locator('h1')).toBeVisible();
      const unnamed = await page.evaluate(() => [...document.querySelectorAll('main input, main select, main textarea, main button')]
        .filter((n) => n.offsetParent !== null || n.type === 'file')
        .filter((n) => !(n.labels?.length || n.getAttribute('aria-label') || (n.tagName === 'BUTTON' && n.textContent.trim())))
        .map((n) => n.outerHTML.slice(0, 80)));
      expect(unnamed, `controles sin nombre en ${view}`).toEqual([]);
    }
  });

  test('CA-16: no hay botones visibles sin función', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium');
    await createPoem(page);
    const cdp = await page.context().newCDPSession(page);
    for (const view of VIEWS) {
      await page.goto(`/#/${view}`);
      await expect(page.locator('h1')).toBeVisible();
      const { result } = await cdp.send('Runtime.evaluate', { expression: '[...document.querySelectorAll("button")].filter(b => b.offsetParent !== null && b.type !== "submit")' });
      const { result: props } = await cdp.send('Runtime.getProperties', { objectId: result.objectId, ownProperties: true });
      const dead = [];
      for (const prop of props.filter((p) => /^\d+$/.test(p.name))) {
        const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: prop.value.objectId });
        if (!listeners.some((l) => l.type === 'click')) dead.push(prop.value.description);
      }
      expect(dead, `botones sin acción en ${view}`).toEqual([]);
    }
  });

  test('Flujo C: actividad educativa con instrucciones editadas', async ({ page }) => {
    await page.addInitScript(() => { window.print = () => { window.__printed = true; }; });
    await page.goto('/#/educacion');
    await page.selectOption('#edu-perfil', 'preescolar');
    await page.selectOption('#edu-tipo', 'rimas');
    await page.fill('#edu-instrucciones', 'Instrucción escrita por la maestra.');
    await expect(page.locator('.activity-sheet')).toContainText('Instrucción escrita por la maestra.');
    await expect(page.locator('.activity-sheet table')).toBeVisible();
    await page.getByRole('button', { name: 'Imprimir' }).click();
    expect(await page.evaluate(() => window.__printed)).toBe(true);
    await expect(page.locator('#print-root .activity-sheet')).toContainText('Clave de respuestas');
  });

  test('Taller: buscador de rimas y contador de sílabas', async ({ page }) => {
    await page.goto('/#/taller');
    await page.fill('#rima-palabra', 'panteón');
    await page.getByRole('button', { name: 'Buscar rimas' }).click();
    await expect(page.getByText('corazón', { exact: true })).toBeVisible();
    await page.fill('#verso-medida', 'y la Muerte se llevó');
    await page.getByRole('button', { name: 'Contar sílabas' }).click();
    await expect(page.getByText('Medida aproximada: 8 sílabas métricas')).toBeVisible();
  });

  test('Configuración: el tamaño de letra y el tema se aplican y persisten', async ({ page }) => {
    await page.goto('/#/configuracion');
    await page.selectOption('#conf-tema', 'contraste');
    await page.selectOption('#conf-tamano', '1.3');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'contraste');
    const size = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(size).toBeGreaterThan(24);
  });
});
