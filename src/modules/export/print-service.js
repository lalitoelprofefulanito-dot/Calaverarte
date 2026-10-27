/**
 * Impresión. Monta el contenido en #print-root y abre el diálogo del
 * navegador; desde ahí se puede imprimir o «Guardar como PDF». La app no
 * genera archivos PDF por sí misma.
 */
import { clear } from '../../core/dom.js';

export function printContent(node) {
  const root = document.getElementById('print-root');
  clear(root).append(node);
  document.body.classList.add('is-printing');
  const media = window.matchMedia?.('print');
  const cleanup = () => {
    document.body.classList.remove('is-printing');
    window.removeEventListener('afterprint', cleanup);
    media?.removeEventListener?.('change', onMediaChange);
  };
  const onMediaChange = (event) => { if (!event.matches) cleanup(); };
  window.addEventListener('afterprint', cleanup);
  media?.addEventListener?.('change', onMediaChange);
  window.print();
}

/** Copia texto al portapapeles con alternativa para navegadores sin API. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }
}
