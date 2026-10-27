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
