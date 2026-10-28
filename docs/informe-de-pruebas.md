# Informe de pruebas

Ejecución del 27 de octubre de 2026 en Linux, Node.js 22.22.2, npm 10.9.7.
Versiones: Vite 6.4.4, Vitest 4.1.11, Playwright 1.56.0 (Chromium 141), ESLint 9.39.5.

## Resumen

| Comprobación | Comando | Resultado |
|---|---|---|
| Calidad de código | `npm run lint` | Sin errores (incluye: sin variables ni importaciones sin uso, sin `eval`, `innerHTML` solo en el constructor de SVG fijo) |
| Unitarias e integración | `npm test` | **164 de 164** aprobadas en 18 archivos |
| Extremo a extremo | `npm run test:e2e` | **41 aprobadas, 1 omitida** a propósito (teclado físico en el perfil móvil) |
| Compilación | `npm run build` | Correcta: 166,6 KB de JS (58,3 KB comprimido) |
| Archivo único | `npm run build:single` | `calaverarte.html` de 194 KB, copiado a `docs/index.html`; probado abierto desde disco |

## Pruebas unitarias y de integración (Vitest)

| Archivo | Pruebas | Cubre |
|---|---|---|
| normalization | 6 | Tildes, ñ, nombres compuestos, mayúsculas, signos |
| rhyme-engine | 26 | Separación silábica, acentuación, rima por sonido, esquemas de 2 a 8 versos |
| rhythm-checker | 3 | Sinalefas, ley del acento final, detección de versos desiguales |
| generation-schema | 7 | Validación del formulario y límites por perfil educativo |
| engine | 19 | Además de lo anterior: hilo conductor en las estrofas 3 y 4 (≥85 % de 200 poemas), defensa presente en 300 de 300 poemas variados, contracciones «al/del», gancho conservado al regenerar |
| editor-session | 7 | Edición, deshacer/rehacer, bloqueo, límites, cambios sin guardar |
| version-service | 4 | Instantáneas, restauración con punto de recuperación, comparación |
| evaluator | 6 | No modifica el poema (objeto congelado), tres estados, detección de fallos |
| search-service | 3 | Búsqueda por campo sin tildes ni ñ, filtros y orden |
| json-service | 6 | Conservación de datos, rechazo de archivos inválidos, lista blanca, conflictos |
| migrations | 3 | v1 → v2, idempotencia, versiones futuras |
| activities | 13 | Las 10 actividades en los 5 perfiles |
| preferences | 4 | Persistencia, datos corruptos, almacenamiento que falla, límites de diseño |
| repository (IndexedDB simulado) | 6 | CRUD, persistencia entre conexiones, migración al leer, errores de cuota y de disponibilidad |
| backup-roundtrip | 1 | Respaldo completo de un dispositivo a otro con conflictos |
| formula | 3 | La guía cubre las seis etapas; la calaverita modelo mide 8 sílabas en sus 16 versos y tiene rima ABAB consonante |
| literary-cases | 30 | 30 casos literarios (ver abajo) |

## Criterios de aceptación (Playwright, escritorio y Pixel 7)

| Criterio | Evidencia | Resultado |
|---|---|---|
| CA-01 Inicia sin errores | Recorre las 9 vistas, genera, crea variante y actividad sin errores de consola | Aprobado |
| CA-02 Validación | Resumen de errores, `aria-invalid`, valores conservados, límite de nombres | Aprobado |
| CA-03 Extensión | 5×6 genera exactamente 5 estrofas de 6 versos | Aprobado |
| CA-04 Datos incorporados | El nombre aparece en la primera estrofa | Aprobado |
| CA-05 Variantes sin sobrescribir | La variante crea la versión «Antes de la nueva variante» y se puede comparar | Aprobado |
| CA-06 Estrofas bloqueadas | Texto idéntico tras la variante; solo lectura; «Regenerar» desactivado | Aprobado |
| CA-07 Operaciones del editor | Editar, deshacer, rehacer, añadir/mover/eliminar estrofas y versos, confirmación, guardar | Aprobado |
| CA-08 Evaluar no modifica | Versos idénticos antes y después de evaluar dos veces | Aprobado |
| CA-09 Persistencia | La obra aparece en la biblioteca tras recargar | Aprobado |
| CA-10 Errores de almacenamiento | Con cuota llena simulada se muestra un mensaje comprensible y la app sigue funcionando | Aprobado |
| CA-11 Exportar/importar | Respaldo descargado con acentos y ñ intactos; reimportado como copia; archivo ajeno rechazado | Aprobado |
| CA-12 Impresión | Llama al diálogo del navegador; en modo impresión solo se ve la hoja | Aprobado |
| CA-13 Adaptación | Ninguna de las 9 vistas se desborda en móvil ni escritorio | Aprobado |
| CA-14 Teclado y nombres accesibles | Generación con teclado; todos los controles tienen etiqueta o nombre | Aprobado (escritorio) |
| CA-15 Sin llamadas externas | Ninguna petición sale de `localhost`; la compilación incluye `connect-src 'none'` | Aprobado |
| CA-16 Sin botones sin función | Cada botón visible de las 9 vistas tiene un manejador de clic (inspección con el protocolo de Chromium) | Aprobado |

Además: el Taller muestra los seis pasos de la fórmula y la calaverita modelo con 8 sílabas en cada verso; la defensa escrita en el formulario aparece en el poema y el editor muestra el hilo conductor y la guía por estrofa; actividad educativa con instrucciones editadas e impresión con clave de respuestas; buscador de rimas y contador de sílabas; tema y tamaño de letra que persisten al recargar.

## 30 casos literarios

Detalle y poemas en [informe-casos-literarios.md](informe-casos-literarios.md).

- Rima: 239 de 245 parejas (97,6 %).
- Datos personales reconocibles: 55 de 57 (96,5 %).
- Hilo conductor: los 22 casos con gancho lo retoman en el conflicto, la resolución o el remate.
- Versos vacíos o repetidos: 0. Términos no aptos en casos infantiles: 0. Palabras prohibidas que aparecieron: 0.

**Lectura humana.** Las métricas no miden naturalidad, así que se leyeron los poemas. Esa lectura reveló defectos que se corrigieron antes de este informe:

- la Muerte que no aparecía en poemas cortos;
- frases terminadas en coma sin continuación;
- la Muerte llegando dos veces;
- verbos en singular en títulos de grupos;
- exceso de diálogos;
- datos repetidos hasta cinco veces.

**Calidad observada:** en extensiones de 2 a 5 estrofas de 4 versos los poemas tienen arco narrativo reconocible y rima consistente. Los poemas de 6 a 8 estrofas largas se vuelven genéricos y repetitivos en la parte central. El ritmo es irregular porque las plantillas no tienen medida fija.

**Conclusión:** el motor es útil como punto de partida para editar, no como sustituto de la escritura. Ver [limitaciones.md](limitaciones.md).

## Hilo conductor: medición antes y después

Pregunta de diseño: ¿las estrofas 3 y 4 hablan del protagonista o son genéricas?

| Medición (200 poemas de 4×4 con todos los datos) | Antes | Después |
|---|---|---|
| Algún dato personal escrito en las estrofas 3 y 4 | 0 de 60 (0 %) en la medición inicial | 143 de 200 (72 %) |
| Hilo conductor en las estrofas 3 y 4 (explícito o implícito) | — | 186 de 200 (93 %) |

Durante el trabajo se encontraron y corrigieron tres fallos del propio motor:

- la regla contra palabras repetidas castigaba justo las palabras del gancho;
- solo se evaluaban 6 de las 14 familias de rima;
- la prioridad del gancho se agotaba en la llegada de la Muerte.

Una prueba de navegador resultó inestable porque la defensa solo aparecía en el 90 % de los poemas. Se corrigió el motor, no la prueba: ahora aparece en 300 de 300, y la prueba pasó 20 de 20 repeticiones.

## Medida de los versos y validación guiada

| Medición (200 poemas variados) | Antes | Después |
|---|---|---|
| Versos de 8 ± 1 sílabas | 41,1 % | 59,4 % |
| Datos personales reconocibles (30 casos) | 94,7 % | 96,5 % |
| Tiempo de generación por calaverita | — | 30 ms |

Primero el filtro llegó al 63 % de octosílabos, pero bajó los datos personales al 84 %; se decidió priorizar la historia y los datos sobre la medida. Un recorte automático de muletillas («Y», «Pero») no mejoró nada y se retiró. La validación guiada se prueba con conversiones como «el futbol» → «jugar futbol» y «darle un abrazo» → «le dio un abrazo», y con pretéritos irregulares («le detuvo un penal») que no deben marcarse.

Nuevas pruebas en navegador: el botón del instructivo se ve al cargar la portada en escritorio y celular y abre el PDF en Google Drive en una pestaña nueva (también el enlace del pie de página); *Autoría y créditos* está enlazada y ofrece los documentos; la corrección guiada se acepta con un toque y el editor cuenta sílabas al escribir.

## Seguridad de dependencias

La aplicación publicada **no tiene dependencias en tiempo de ejecución**. `npm audit` informa 2 avisos moderados en `@vitest/mocker` (herramienta de pruebas, afecta a Windows). Su corrección (Vitest 4.1.12) tenía menos de dos semanas de publicada y no se instaló, como precaución ante paquetes comprometidos recién publicados. Conviene actualizarla más adelante.

## No probado

- Firefox y Safari (solo Chromium).
- Impresión física y PDF real (se verificó la vista de impresión, no el papel).
- Lectores de pantalla reales (se verificaron etiquetas y nombres accesibles, no la experiencia con NVDA o VoiceOver).
- Publicación en GitHub Pages (el flujo está escrito pero no se ejecutó en GitHub).
