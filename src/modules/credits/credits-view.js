import { el, downloadText } from '../../core/dom.js';
import { button, viewHeader, icon } from '../../core/ui-kit.js';
import { DOCUMENTS } from '../home/documents.js';

const APP_URL = 'https://lalitoelprofefulanito-dot.github.io/calaverarte/';

const APA_REFERENCE = `Kantún Martínez, E. (2026). CalaverArte: Generador, editor y taller de calaveritas literarias [Aplicación web]. GitHub Pages. ${APP_URL}`;

const AUTHORSHIP_NOTE = `CalaverArte es un proyecto concebido y dirigido por Eduardo Kantún Martínez. El desarrollo contó con apoyo de ChatGPT (OpenAI) y Claude (Anthropic) para organizar los requisitos, redactar la especificación funcional, preparar instrucciones de desarrollo y analizar problemas técnicos. La autoría del proyecto, las decisiones sobre su propósito y la responsabilidad de revisar sus resultados corresponden a Eduardo Kantún Martínez. El uso de estas herramientas no demuestra por sí solo que todas las funciones estén probadas o que la aplicación esté libre de defectos.`;

const PROMPTS = [
  {
    id: 'plan-inicial',
    title: '1. Plan de creación',
    tool: 'ChatGPT',
    purpose: 'Definir el propósito y plan de desarrollo desde cero.',
    text: 'Crea un plan para hacer desde cero una aplicación que genere calaveritas literarias',
  },
  {
    id: 'especificacion',
    title: '2. Plan técnico definitivo',
    tool: 'ChatGPT',
    purpose: 'Definir arquitectura, módulos, estructura, flujos y criterios de aceptación.',
    text: 'Desarrolla el plan técnico definitivo y la especificación funcional de CalaverArte con estas decisiones: plataforma=web; propósito=ambos; generación=prototipo; almacenamiento=local; alcance inicial=avanzada. Define arquitectura, módulos, estructura de archivos, flujos de usuario, criterios de aceptación y orden exacto de implementación. No afirmes que la aplicación ya está construida.',
  },
  {
    id: 'prompt-para-claude',
    title: '3. Preparar el prompt para Claude',
    tool: 'ChatGPT',
    purpose: 'Solicitar la consolidación de lo acordado en una instrucción integral de desarrollo.',
    text: 'Dame en un prompt todo lo que me has explicado hasta ahora en esta conversación para que Claude IA realice el diseño del código y cree toda la app ya completa',
  },
  {
    id: 'prompt-maestro',
    title: '4. Prompt maestro de implementación',
    tool: 'Claude (prompt preparado con apoyo de ChatGPT)',
    purpose: 'Solicitar la construcción de una aplicación modular completa, con motor local de calaveritas, editor, evaluación, modo educativo, biblioteca IndexedDB, diseñador, exportación, pruebas, documentación y publicación verificable.',
    text: `PROMPT MAESTRO PARA CLAUDE IA — CALAVERARTE\n\nActúa como arquitecto de software, ingeniero frontend, especialista en algoritmos de rima, diseñador UX/UI y responsable de calidad. Diseña, programa, integra, prueba y documenta CalaverArte como aplicación web completa; no te limites a entregar un plan o una maqueta.\n\nDecisiones del producto: aplicación web adaptable; público general y educativo; prototipo inicial sin API de IA; generación mediante reglas, patrones narrativos y vocabulario local; almacenamiento en IndexedDB y preferencias en localStorage; arquitectura modular con Vite, JavaScript ES modules, Vitest y Playwright.\n\nImplementa estas áreas: generador personalizable; motor literario local; editor por versos y estrofas; bloqueo de estrofas, deshacer y rehacer; versionado y comparación; evaluador literario no destructivo; perfiles y actividades educativas; biblioteca, favoritos y búsqueda; diseñador visual; impresión, exportación e importación JSON; configuración, accesibilidad, privacidad y gestión de errores.\n\nOrganiza el código por módulos y responsabilidades. Mantén separados interfaz, motor literario, almacenamiento, evaluación y exportación. No concentres todo en un archivo monolítico ni dejes funciones huérfanas, código muerto o botones sin acción. Valida todos los datos importados y evita insertar texto de usuario como HTML ejecutable.\n\nEl motor deberá usar datos del protagonista, construir una secuencia narrativa coherente, diversificar patrones, evitar repeticiones, buscar rimas naturales y reconocer que la métrica y la evaluación automática tienen limitaciones. No lo presentes como inteligencia artificial generativa. No envíes poemas a servicios externos. Deja preparada una interfaz desacoplada para una futura integración de IA, pero mantenla inactiva.\n\nSigue las fases: fundamentos; interfaz; motor literario; edición y evaluación; almacenamiento; educación y diseño; exportación; auditoría y publicación. Ejecuta las pruebas disponibles, corrige errores, compila y verifica el resultado cuando el entorno permita hacerlo. No declares ejecutadas pruebas, compilaciones o publicaciones que no hayas comprobado.\n\nEntrega código fuente completo, configuración, estilos, datos locales, pruebas, README, documentación del modelo de datos, limitaciones conocidas, resultados reales de validación e instrucciones de publicación. Inspecciona primero cualquier proyecto previo y conserva lo que funcione. Comienza con la inspección del entorno y avanza hasta donde permitan las herramientas disponibles.`,
    note: 'Este registro reproduce una versión documental resumida del prompt maestro preparado en esta conversación. No se presenta como una captura automática del historial privado de Claude ni como prueba de que el texto copiado en aquella sesión haya sido idéntico en cada palabra.',
  },
  {
    id: 'diagnostico-publicacion',
    title: '5. Diagnóstico de la publicación',
    tool: 'ChatGPT',
    purpose: 'Solicitar ayuda tras observar una página sin estilos y controles que no ejecutaban acciones.',
    text: 'NO tiene un buen html y la app no funciona ya la subi a github y además tiene esta presentación que no ejecuta nada podrías ayudarme po favor',
    note: 'La solicitud estuvo acompañada de una captura de pantalla de la aplicación publicada.',
  },
];

const APA_AI_REFERENCES = [
  'Anthropic. (2026). Claude [Modelo de lenguaje]. https://claude.ai/',
  'OpenAI. (2026). ChatGPT [Modelo de lenguaje]. https://chatgpt.com/',
];

function copyText(text, app, label) {
  return async () => {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('El portapapeles seguro no está disponible.');
      }
      app.toast(`${label} copiado al portapapeles.`, 'success');
    } catch {
      try {
        const area = el('textarea', {
          class: 'copy-fallback',
          readonly: true,
          'aria-label': `Texto para copiar: ${label}`,
        });
        area.value = text;
        document.body.append(area);
        area.select();
        const copied = document.execCommand('copy');
        area.remove();
        if (!copied) throw new Error('No fue posible copiar automáticamente.');
        app.toast(`${label} copiado al portapapeles.`, 'success');
      } catch {
        downloadText('calaverarte-texto-para-copiar.txt', text, 'text/plain');
        app.toast('El navegador no permitió copiarlo. Se descargó un archivo de texto como alternativa.', 'warning');
      }
    }
  };
}

function citationCard(app) {
  return el('section', { class: 'card credits__reference', 'aria-labelledby': 'credits-apa' },
    el('p', { class: 'credits__eyebrow' }, 'Referencia bibliográfica'),
    el('h2', { id: 'credits-apa' }, 'Cómo citar CalaverArte en APA 7'),
    el('p', { class: 'credits__citation' }, APA_REFERENCE),
    el('div', { class: 'row' },
      button('Copiar referencia APA', { variant: 'primary', iconName: 'copy', onClick: copyText(APA_REFERENCE, app, 'La referencia APA') }),
      el('a', { class: 'btn btn--secondary', href: APP_URL, target: '_blank', rel: 'noopener noreferrer' }, 'Abrir aplicación publicada')),
    el('div', { class: 'credits__citation-examples' },
      el('h3', {}, 'Cita dentro del texto'),
      el('p', {}, 'Parentética: (Kantún Martínez, 2026).'),
      el('p', {}, 'Narrativa: Kantún Martínez (2026).')),
    el('p', { class: 'hint' }, 'La referencia identifica el proyecto publicado en GitHub Pages. El año corresponde a la versión documentada en 2026; actualiza la referencia si cambia el año de publicación o la URL.'));
}

function authorshipCard(app) {
  return el('section', { class: 'card', 'aria-labelledby': 'credits-author' },
    el('h2', { id: 'credits-author' }, 'Autoría y reconocimiento del apoyo de IA'),
    el('p', {}, 'Autor y responsable del proyecto: Eduardo Kantún Martínez.'),
    el('p', {}, 'CalaverArte es un proyecto concebido y dirigido por Eduardo Kantún Martínez. Durante su desarrollo se utilizaron ChatGPT, de OpenAI, y Claude, de Anthropic, como herramientas de apoyo para estructurar requisitos, planificar la arquitectura, preparar instrucciones de desarrollo y analizar problemas técnicos.'),
    el('p', {}, 'El diseño del propósito, la selección de funciones y las decisiones sobre el proyecto corresponden a su autor. La asistencia de IA no sustituye la revisión humana, ni constituye por sí sola evidencia de que cada función esté implementada o verificada.'),
    el('p', { class: 'notice' }, 'Transparencia de funcionamiento: ChatGPT y Claude se utilizaron como apoyo durante el proceso de desarrollo. La versión de CalaverArte descrita aquí genera poemas con reglas, plantillas y vocabulario local; no utiliza un modelo de IA para generar las calaveritas ni envía los textos del usuario a servicios externos.'),
    button('Copiar nota de autoría', { iconName: 'copy', onClick: copyText(AUTHORSHIP_NOTE, app, 'La nota de autoría') }));
}

function promptsCard(app) {
  const promptEntries = PROMPTS.map((prompt) => el('details', { class: 'credits__prompt', open: prompt.id === 'plan-inicial' },
    el('summary', {}, prompt.title),
    el('p', { class: 'credits__prompt-meta' }, `${prompt.tool} · ${prompt.purpose}`),
    el('pre', { class: 'credits__prompt-text' }, prompt.text),
    prompt.note ? el('p', { class: 'hint' }, prompt.note) : null,
    button('Copiar este prompt', { small: true, iconName: 'copy', onClick: copyText(prompt.text, app, prompt.title) })));

  const completeRecord = [
    '# CalaverArte — Autoría y registro de prompts',
    '',
    `Referencia APA 7: ${APA_REFERENCE}`,
    '',
    '## Autoría y reconocimiento',
    AUTHORSHIP_NOTE,
    '',
    '## Referencias de herramientas utilizadas',
    ...APA_AI_REFERENCES,
    '',
    '## Registro de prompts documentados en esta conversación',
    ...PROMPTS.flatMap((prompt) => [`### ${prompt.title}`, `Herramienta: ${prompt.tool}`, `Finalidad: ${prompt.purpose}`, '', prompt.text, '', ...(prompt.note ? [prompt.note, ''] : [])]),
    '## Nota de alcance documental',
    'Este registro reúne los prompts identificados en la conversación usada para preparar el proyecto. No es una exportación automática ni exhaustiva de una sesión externa de Claude; el prompt maestro se presenta en versión documental resumida.',
    '',
  ].join('\n');

  return el('section', { class: 'card', 'aria-labelledby': 'credits-prompts' },
    el('p', { class: 'credits__eyebrow' }, 'Trazabilidad del proceso'),
    el('h2', { id: 'credits-prompts' }, 'Prompts documentados'),
    el('p', {}, 'Estos son los prompts principales identificados en la conversación de planificación, especificación y diagnóstico. Puedes abrir cada apartado y copiar su texto.'),
    el('div', { class: 'credits__prompt-list' }, promptEntries),
    el('p', { class: 'notice notice--warn' }, 'Alcance del registro: la lista documenta los prompts identificados en esta conversación. No es una exportación automática del historial de Claude. El prompt maestro se presenta aquí en una versión documental resumida, no como una transcripción certificada de lo que pudo haberse pegado en una sesión externa.'),
    button('Descargar registro completo en Markdown', {
      variant: 'primary',
      iconName: 'save',
      onClick: () => downloadText('CalaverArte-autoria-y-prompts.md', completeRecord, 'text/markdown'),
    }));
}

function referencesCard(app) {
  return el('section', { class: 'card', 'aria-labelledby': 'credits-references' },
    el('h2', { id: 'credits-references' }, 'Referencias de las herramientas'),
    el('p', {}, 'Las siguientes entradas identifican las herramientas utilizadas como apoyo durante el proceso de desarrollo; no implican que estas herramientas sean autoras de la aplicación.'),
    el('ol', { class: 'credits__refs' }, APA_AI_REFERENCES.map((reference) => el('li', {}, reference))),
    button('Copiar referencias de herramientas', { iconName: 'copy', onClick: copyText(APA_AI_REFERENCES.join('\n\n'), app, 'Las referencias de herramientas') }),
    el('p', { class: 'hint' }, 'Para una documentación académica estricta, añade el nombre o versión exacta de cada modelo solo si se conoce y se puede comprobar.'));
}

function documentsCard() {
  return el('section', { class: 'card', 'aria-labelledby': 'credits-docs' },
    el('h2', { id: 'credits-docs' }, 'Documentos del proyecto'),
    el('ul', { class: 'credits__docs' }, Object.values(DOCUMENTS).map((doc) => el('li', {},
      el('p', {}, el('strong', {}, doc.title), el('br'), el('span', { class: 'hint' }, doc.detail)),
      doc.external
        ? el('a', { class: 'btn btn--secondary', href: doc.href, target: '_blank', rel: 'noopener noreferrer' }, icon('book'), 'Abrir en Drive')
        : el('a', { class: 'btn btn--secondary', href: doc.href, download: doc.download }, icon('download'), 'Descargar')))));
}

export function renderCredits(app) {
  return el('div', { class: 'stack credits' },
    viewHeader('Autoría y referencias', 'Cita la aplicación, consulta el reconocimiento de asistencia tecnológica y revisa el registro de prompts documentados durante su desarrollo.'),
    el('section', { class: 'credits__hero', 'aria-label': 'Presentación de autoría' },
      el('p', { class: 'credits__hero-kicker' }, 'CalaverArte · Proyecto 2026'),
      el('h2', {}, 'La autoría humana y la asistencia tecnológica, explicadas con transparencia'),
      el('p', {}, 'Esta sección documenta quién dirige el proyecto, cómo se utilizaron las herramientas de IA y qué instrucciones principales se registraron en el proceso.')),
    citationCard(app),
    documentsCard(),
    authorshipCard(app),
    promptsCard(app),
    referencesCard(app));
}
