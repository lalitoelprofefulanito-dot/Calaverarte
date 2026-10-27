# Reparación de CalaverArte en GitHub Pages

## Qué provoca la pantalla blanca o sin estilos

El `index.html` de desarrollo carga `src/main.js` y ese módulo importa hojas CSS y datos que Vite debe procesar. Si GitHub Pages publica la raíz de la rama como si fuera un sitio HTML estático, el navegador recibe el código fuente en vez del resultado compilado: el CSS no se prepara y la aplicación puede quedarse sin iniciar.

## Forma recomendada de corregirlo

1. Conserva el proyecto completo, no subas únicamente `index.html` ni el archivo generado para modo de un solo archivo.
2. Asegúrate de que exista este archivo en el repositorio: `.github/workflows/deploy.yml`.
3. En GitHub, abre **Settings → Pages → Build and deployment → Source** y selecciona **GitHub Actions**.
4. Sube todos los cambios a la rama `main`, incluida la carpeta oculta `.github/workflows/`.
5. Abre la pestaña **Actions** y espera a que termine el flujo **Validar y publicar CalaverArte**. Debe finalizar en verde.
6. El flujo ejecuta `npm ci`, `npm run lint`, `npm test` y `npm run build`, verifica que el resultado tenga HTML, CSS y JavaScript compilados y publica únicamente `dist/`.
7. Abre la URL de Pages y recarga sin caché con `Ctrl + F5`.

No configures Pages para publicar la raíz de `main` ni `/src`. El código fuente debe permanecer en `main`; lo publicado es el artefacto compilado `dist/`.

## Si no aparece el flujo de publicación

Comprueba que `.github/workflows/deploy.yml` se haya subido a GitHub. Si no puedes subir carpetas ocultas desde la interfaz web, crea el archivo desde **Add file → Create new file** y escribe como ruta `.github/workflows/deploy.yml`; copia dentro el contenido del archivo del proyecto.

## Si el flujo falla

Abre **Actions**, selecciona la ejecución fallida y revisa el primer paso rojo. No vuelvas a publicar el HTML fuente como sustitución. Corrige el error de instalación, lint, pruebas o compilación y vuelve a subir el cambio.
