# CALAVERARTE — LEEME PRIMERO

Este paquete contiene el proyecto completo de CalaverArte y la documentación para crear un repositorio nuevo y publicarlo en GitHub Pages.

## QUÉ CONTIENE

- Código fuente de la aplicación web.
- Configuración de Vite, npm y pruebas.
- Flujo de GitHub Actions en `.github/workflows/deploy.yml`.
- Pruebas automatizadas.
- Documentación técnica.
- Sección de autoría, referencia APA y prompts en `docs/autoria-y-prompts.md`.
- Esta guía de instalación y publicación.

No necesitas descargar otro ZIP, el TAR.GZ ni el documento de autoría por separado.

## PASO 1. EXTRAER EL ZIP

1. Descarga `CalaverArte-TODO-EN-UNO.zip`.
2. En Windows, haz clic derecho y elige **Extraer todo**.
3. Abre la carpeta `calaverarte` que se extrajo.
4. Verifica que veas `index.html`, `package.json`, `vite.config.js`, `src`, `public`, `tests`, `docs` y `.github`.
5. Si no ves `.github`, activa en el Explorador de archivos **Ver > Mostrar > Elementos ocultos**.

## PASO 2. CREAR UN REPOSITORIO VACÍO

1. Abre https://github.com/new e inicia sesión.
2. Nombre recomendado: `calaverarte`.
3. Elige **Public** para que la publicación sea accesible como GitHub Pages.
4. No marques las opciones para crear README, `.gitignore` ni licencia; el proyecto ya incluye estos archivos.
5. Haz clic en **Create repository**.

Si el nombre `calaverarte` no está disponible en tu cuenta, usa `calaverarte-app`; en ese caso la dirección pública tendrá ese nombre.

## PASO 3. CLONAR EL REPOSITORIO CON GITHUB DESKTOP

1. Instala y abre GitHub Desktop: https://desktop.github.com/.
2. Inicia sesión con la cuenta que creó el repositorio.
3. Selecciona **File > Clone repository**.
4. Selecciona tu repositorio nuevo `calaverarte` y elige una carpeta local.
5. Espera a que termine la clonación. El directorio clonado estará vacío porque creaste el repositorio sin archivos.

## PASO 4. COPIAR EL PROYECTO

1. Abre la carpeta extraída del ZIP y selecciona **todo su contenido**, incluidas las carpetas `src`, `public`, `tests`, `docs` y `.github` y los archivos ocultos.
2. Copia ese contenido directamente dentro de la carpeta local que GitHub Desktop clonó.
3. No copies la carpeta externa `calaverarte` dentro de otra carpeta `calaverarte`: `index.html` y `package.json` deben quedar directamente en la raíz del repositorio clonado.
4. No copies ni subas `node_modules`; las dependencias se instalarán en el proceso de compilación.

La raíz del repositorio debe parecerse a esta estructura:

```
.github/workflows/deploy.yml
public/
src/
tests/
docs/
index.html
package.json
package-lock.json
vite.config.js
README.md
.gitignore
```

## PASO 5. ENVIAR LOS ARCHIVOS A GITHUB

1. Vuelve a GitHub Desktop. Debe mostrar los archivos nuevos.
2. En el cuadro **Summary**, escribe: `Restablecer CalaverArte con publicación automatizada`.
3. Haz clic en **Commit to main**.
4. Después haz clic en **Push origin**.
5. Abre el repositorio en GitHub y confirma que exista `.github/workflows/deploy.yml`.

## PASO 6. CONFIGURAR GITHUB PAGES

1. En el repositorio de GitHub, abre **Settings > Pages**.
2. En **Build and deployment > Source**, selecciona **GitHub Actions**.
3. No selecciones `Deploy from a branch`.
4. Guarda si GitHub muestra un botón para guardar.

El proyecto se debe publicar desde `dist/`, después de que Vite lo compile. No publiques directamente el `index.html` fuente de la raíz ni la carpeta `src`.

## PASO 7. REVISAR EL DESPLIEGUE

1. Abre la pestaña **Actions** del repositorio.
2. Busca el flujo **Validar y publicar CalaverArte**.
3. Ábrelo y revisa que termine con una marca verde.
4. El flujo realiza la instalación, lint, pruebas, compilación y publicación de `dist/`.
5. Si falla, abre el primer paso rojo y lee el mensaje de error. No publiques manualmente el HTML fuente como solución.
6. Si el nombre del repositorio es `calaverarte`, la URL esperada será:
   https://lalitoelprofefulanito-dot.github.io/calaverarte/
   Si usas otro nombre, reemplaza `calaverarte` en la URL por ese nombre.
7. Cuando el flujo termine, abre la URL y recarga con **Ctrl + F5**.

## REQUISITOS PARA PROBAR LOCALMENTE (OPCIONAL)

Se requiere Node.js 20 o superior y npm. Dentro de la carpeta del proyecto abre una terminal y ejecuta:

```
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Para probar el navegador con Playwright, consulta `README.md` y sigue las instrucciones para instalar Chromium.

## DOCUMENTACIÓN INCLUIDA

- `README.md`: instalación, desarrollo, pruebas y publicación.
- `REPARACION-GITHUB-PAGES.md`: diagnóstico de errores de despliegue.
- `docs/autoria-y-prompts.md`: declaración de autoría, referencia APA y prompts registrados.
- `docs/modelo-de-datos.md`: modelo de datos.
- `docs/limitaciones.md`: limitaciones conocidas.
- `docs/informe-de-pruebas.md` y `docs/informe-casos-literarios.md`: documentación existente de pruebas; vuelve a ejecutar las pruebas para confirmar el estado del código actual.

## IMPORTANTE SOBRE LA VERIFICACIÓN

El paquete incluye pruebas y un flujo automatizado, pero la existencia de esos archivos no demuestra por sí sola que todas las pruebas hayan pasado en tu repositorio. Considera la aplicación publicada y verificada únicamente cuando el flujo de GitHub Actions termine correctamente y hayas comprobado las funciones principales en el sitio.
