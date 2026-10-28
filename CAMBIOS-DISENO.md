# Cambios de diseño y publicación

## Por qué se veía "sin nada"
GitHub Pages estaba publicando el **código fuente** (el `index.html` que carga `/src/main.js`),
no la versión compilada. El navegador no puede importar archivos `.css` desde JavaScript,
así que la app nunca arrancaba.

## Cómo arreglarlo (una sola vez)
En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Después sube estos archivos a `main`. La pestaña **Actions** compila (`npm run build`) y publica la carpeta `dist/`.

## Qué cambió
- `src/styles/*`: nueva paleta (noche morada, cempasúchil, rosa mexicano, turquesa), papel picado bajo el encabezado, flores en los títulos, tarjetas y botones con más personalidad.
- `src/modules/home/home-view.js` + `hero-art.js`: portada con calavera ilustrada y sección "Así se arma una calaverita".
- `src/assets/`: `papel-picado.svg` y `cempasuchil.svg`.
- `.github/workflows/deploy.yml`: la publicación ya no depende de las pruebas (corren aparte y avisan si fallan).
- `public/favicon.svg`, `manifest.webmanifest`, `index.html`: colores nuevos.

## Publicación sin Actions
`docs/index.html` es la app ya compilada en un solo archivo. En Settings → Pages elige
*Deploy from a branch* → rama `main` → carpeta `/docs`.

## Fusión del 28 de octubre de 2026
Se tomó este repositorio como base y se conservaron todos sus cambios de diseño (paleta, portada ilustrada, papel picado, créditos, flujo de publicación y `docs/`). Se integraron:
- Hilo conductor, campo «¿Qué haría frente a la Muerte?», guía «La fórmula de la calaverita» en el Taller y guía por estrofa en el Editor.
- Validación guiada de los datos, preferencia por octosílabos y conteo de sílabas por verso en el Editor; comprobación «Versos octosílabos (8 ± 1)» en Evaluación.
- Aviso destacado con el instructivo para familias (PDF) al inicio de la portada y enlace en el pie de página.
- La vista de créditos, que existía pero no estaba conectada, ahora tiene ruta (`#/creditos`) e incluye los documentos del proyecto (instructivo y resumen ejecutivo).
- `docs/index.html` regenerado con la versión nueva, junto con el PDF y el documento de Word.

## Ajustes del 28 de octubre de 2026 (segunda parte)
- El botón «Ver el instructivo (PDF)», el enlace del pie de página y el de *Autoría y créditos* abren el instructivo en Google Drive. Se quitó la copia local del PDF para que haya una sola versión.
- Instructivo actualizado a 9 páginas: se añadieron las páginas 7 a 9 («Novedades») sobre el dato «¿Qué haría frente a la Muerte?», la ayuda al escribir los datos, el hilo conductor, el contador de sílabas, las guías, la revisión de octosílabos y *Autoría y créditos*. Para actualizarlo sin cambiar el enlace: en Drive, *Administrar versiones → Subir nueva versión*.
- Resumen ejecutivo corregido (35 cambios con control de cambios): resultados no medidos replanteados como pendientes, cita de la antología de Zavala Armenta corregida (2021, libro electrónico), ejemplos sustituidos por versos verificados de ocho sílabas con rima consonante y recomendación de IA alineada con el motor local sin conexión.
