import { el } from '../../core/dom.js';
import { button, field, setFieldError, select, textInput, checkbox, viewHeader } from '../../core/ui-kit.js';
import { TONES, SCHEMES, ENDING_OPTIONS, DEFAULT_PARAMS, LIMITS } from './generation-schema.js';
import { PROFILES, getProfile } from '../education/grade-profiles.js';
import { generatePoem } from './generation-service.js';

const range = ([min, max]) => Array.from({ length: max - min + 1 }, (_, i) => ({ id: min + i, label: String(min + i) }));

export function renderGenerator(app) {
  const values = { ...DEFAULT_PARAMS, ...(app.lastForm || {}) };
  const controls = {
    names: textInput(values.names, { required: true, maxlength: '120', autocomplete: 'off' }),
    gender: select([{ id: 'o', label: 'Él (concordancia en masculino)' }, { id: 'a', label: 'Ella (concordancia en femenino)' }], values.gender),
    oficio: textInput(values.oficio, { maxlength: '120' }),
    gusto: textInput(values.gusto, { maxlength: '120' }),
    cualidad: textInput(values.cualidad, { maxlength: '120' }),
    lugar: textInput(values.lugar, { maxlength: '120' }),
    anecdota: textInput(values.anecdota, { maxlength: '120' }),
    tone: select(TONES, values.tone),
    stanzas: select(range(LIMITS.stanzas), values.stanzas),
    verses: select(range(LIMITS.verses), values.verses),
    scheme: select(SCHEMES, values.scheme),
    ending: select(ENDING_OPTIONS, values.ending),
    level: select(PROFILES.filter((p) => p.id !== 'general'), values.level === 'general' ? 'primaria-alta' : values.level),
    mustInclude: textInput(values.mustInclude, { maxlength: '120' }),
    avoid: textInput(values.avoid, { maxlength: '120' }),
  };
  const dialogue = checkbox('Incluir diálogos con la Muerte cuando sea posible', values.preferDialogue);
  const audienceGeneral = el('input', { type: 'radio', name: 'audience', value: 'general', checked: values.audience !== 'educativo' });
  const audienceEdu = el('input', { type: 'radio', name: 'audience', value: 'educativo', checked: values.audience === 'educativo' });

  const fields = {
    names: field({ id: 'f-names', label: 'Nombre del protagonista', hint: 'Hasta 3 nombres separados por comas o «y». Ejemplo: Doña Lupe, o Ana y Luis.', control: controls.names }),
    gender: field({ id: 'f-gender', label: 'Cómo nombrarlo', hint: 'Sirve para la concordancia (asustado/asustada). Con varios nombres se usa «la pandilla».', control: controls.gender }),
    oficio: field({ id: 'f-oficio', label: 'Oficio o papel', optional: true, hint: 'Una o dos palabras. Ejemplo: maestra, panadero, portero del equipo.', control: controls.oficio }),
    gusto: field({ id: 'f-gusto', label: 'Gusto o hábito', optional: true, hint: 'Empieza con un verbo en infinitivo. Ejemplo: bailar cumbia, hacer tamales, leer cuentos.', control: controls.gusto }),
    cualidad: field({ id: 'f-cualidad', label: 'Forma de ser', optional: true, hint: 'Un adjetivo que concuerde. Ejemplo: muy platicadora, bien distraído.', control: controls.cualidad }),
    lugar: field({ id: 'f-lugar', label: 'Escenario', optional: true, hint: 'Con artículo. Ejemplo: la escuela, el mercado, la biblioteca.', control: controls.lugar }),
    anecdota: field({ id: 'f-anecdota', label: 'Anécdota', optional: true, hint: 'Una frase en pasado. Ejemplo: se quedó dormido en la junta.', control: controls.anecdota }),
    tone: field({ id: 'f-tone', label: 'Tono', control: controls.tone }),
    stanzas: field({ id: 'f-stanzas', label: 'Número de estrofas', hint: 'Entre 2 y 8.', control: controls.stanzas }),
    verses: field({ id: 'f-verses', label: 'Versos por estrofa', hint: 'Entre 2 y 8. Lo más común son 4.', control: controls.verses }),
    scheme: field({ id: 'f-scheme', label: 'Esquema de rima', control: controls.scheme }),
    ending: field({ id: 'f-ending', label: 'Desenlace', control: controls.ending }),
    level: field({ id: 'f-level', label: 'Nivel educativo', control: controls.level }),
    mustInclude: field({ id: 'f-must', label: 'Elementos que deben aparecer', optional: true, hint: 'Objetos con artículo, separados por comas. Ejemplo: un balón, una guitarra.', control: controls.mustInclude }),
    avoid: field({ id: 'f-avoid', label: 'Palabras que deben evitarse', optional: true, hint: 'Separadas por comas. Ejemplo: panteón, tumba.', control: controls.avoid }),
  };
  const levelBox = el('div', { hidden: values.audience !== 'educativo' }, fields.level,
    el('p', { class: 'hint', id: 'nivel-recomendacion', 'aria-live': 'polite' }),
    button('Usar los valores recomendados para este nivel', { small: true, onClick: applyRecommended }));

  function updateRecommendation() {
    const profile = getProfile(controls.level.value);
    const { recommended: r, limits } = profile;
    levelBox.querySelector('#nivel-recomendacion').textContent =
      `Recomendado para ${profile.label}: ${r.stanzas} estrofas de ${r.verses} versos, tono ${TONES.find((t) => t.id === r.tone).label.toLowerCase()}, rima ${r.scheme}. Máximo: ${limits.maxStanzas} estrofas de ${limits.maxVerses} versos.`;
  }
  function applyRecommended() {
    const { recommended } = getProfile(controls.level.value);
    controls.stanzas.value = String(recommended.stanzas);
    controls.verses.value = String(recommended.verses);
    controls.tone.value = recommended.tone;
    controls.scheme.value = recommended.scheme;
    app.toast('Se aplicaron los valores recomendados.', 'success');
  }
  const onAudience = () => { levelBox.hidden = !audienceEdu.checked; if (audienceEdu.checked) updateRecommendation(); };
  audienceGeneral.addEventListener('change', onAudience);
  audienceEdu.addEventListener('change', onAudience);
  controls.level.addEventListener('change', updateRecommendation);
  if (values.audience === 'educativo') updateRecommendation();

  const summary = el('div', { class: 'error-summary', tabindex: '-1', hidden: true, role: 'alert' });
  const submit = el('button', { type: 'submit', class: 'btn btn--accent' }, 'Generar calaverita');

  const readForm = () => ({
    names: controls.names.value, gender: controls.gender.value, oficio: controls.oficio.value,
    gusto: controls.gusto.value, cualidad: controls.cualidad.value, lugar: controls.lugar.value,
    anecdota: controls.anecdota.value, tone: controls.tone.value, stanzas: Number(controls.stanzas.value),
    verses: Number(controls.verses.value), scheme: controls.scheme.value, ending: controls.ending.value,
    preferDialogue: dialogue.querySelector('input').checked, mustInclude: controls.mustInclude.value,
    avoid: controls.avoid.value, audience: audienceEdu.checked ? 'educativo' : 'general',
    level: audienceEdu.checked ? controls.level.value : 'general',
  });

  const fieldFor = { names: 'names', gender: 'gender', tone: 'tone', stanzas: 'stanzas', verses: 'verses', scheme: 'scheme' };

  async function onSubmit(event) {
    event.preventDefault();
    const raw = readForm();
    app.lastForm = raw;
    Object.values(fields).forEach((f) => setFieldError(f, null));
    summary.hidden = true;
    try {
      const { poem, warnings } = generatePoem(raw);
      if (!(await app.setSession(poem))) return;
      submit.disabled = true;
      submit.textContent = 'Guardando…';
      await app.saveSession();
      app.pendingWarnings = warnings;
      app.toast('Calaverita generada y guardada en este dispositivo.', 'success');
      app.go('editor');
    } catch (error) {
      submit.disabled = false;
      submit.textContent = 'Generar calaverita';
      if (error.fieldErrors) {
        const entries = Object.entries(error.fieldErrors);
        entries.forEach(([key, message]) => fields[fieldFor[key] || key] && setFieldError(fields[fieldFor[key] || key], message));
        summary.replaceChildren(
          el('h2', {}, `Hay ${entries.length} dato${entries.length === 1 ? '' : 's'} por corregir`),
          el('ul', {}, entries.map(([key, message]) => el('li', {}, el('a', { href: `#f-${key === 'mustInclude' ? 'must' : key}`, on: { click: (e) => { e.preventDefault(); fields[key]?.querySelector('input, select')?.focus(); } } }, message)))));
        summary.hidden = false;
        summary.focus();
      } else {
        app.reportError(error);
      }
    }
  }

  const form = el('form', { class: 'form', novalidate: true, on: { submit: onSubmit } },
    summary,
    el('fieldset', {}, el('legend', {}, '¿Para quién es?'),
      el('div', { class: 'row', role: 'radiogroup', 'aria-label': 'Modo' },
        el('label', { class: 'choice' }, audienceGeneral, 'Uso general'),
        el('label', { class: 'choice' }, audienceEdu, 'Uso educativo (escuela)')),
      levelBox),
    el('fieldset', {}, el('legend', {}, 'Protagonista'),
      el('div', { class: 'fields-2' }, fields.names, fields.gender, fields.oficio, fields.lugar),
      el('div', { class: 'fields-2', style: { marginTop: '1rem' } }, fields.gusto, fields.cualidad),
      el('div', { style: { marginTop: '1rem' } }, fields.anecdota)),
    el('fieldset', {}, el('legend', {}, 'Estilo y extensión'),
      el('div', { class: 'fields-2' }, fields.tone, fields.ending, fields.stanzas, fields.verses, fields.scheme),
      el('div', { style: { marginTop: '1rem' } }, dialogue)),
    el('fieldset', {}, el('legend', {}, 'Elementos'),
      el('div', { class: 'fields-2' }, fields.mustInclude, fields.avoid)),
    el('div', { class: 'row' }, submit,
      el('p', { class: 'hint' }, 'Se genera en tu dispositivo con reglas y plantillas, sin conexión a internet.')));

  return el('div', {}, viewHeader('Crear una calaverita', 'Solo el nombre es obligatorio. Cuantos más datos des, más personal será la calaverita.'), form);
}
