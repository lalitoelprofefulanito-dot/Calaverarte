# CalaverArte

**Generador, editor, evaluador y taller de calaveritas literarias mexicanas.**
*«La Catrina pone la idea; tú pones la historia».*

CalaverArte crea calaveritas con rima a partir de los datos de un protagonista, permite editarlas verso por verso, revisarlas con comprobaciones automáticas, darles formato para imprimir y convertirlas en actividades escolares. Funciona por completo en el navegador: **no usa inteligencia artificial, no necesita conexión y no envía tus textos a ningún servidor.**

## Cómo funciona el generador

El motor es local y está basado en reglas y plantillas, no en un modelo de lenguaje:

1. Reparte seis etapas narrativas entre los versos: presentación, rasgo, llegada de la Muerte, conflicto, resolución y remate.
2. Para cada grupo de versos que deben rimar elige una **familia de rima** (‑ía, ‑ón, ‑ente…) con versos escritos para esa etapa (`src/data/rhyme-families.json`).
3. Rellena los huecos con los datos del protagonista, con concordancia de género.
4. Evita repeticiones, respeta el desenlace elegido y las palabras prohibidas. Si no hay una rima natural, deja el verso sin rimar y lo avisa en lugar de forzarla.

La rima se comprueba por sonido aproximado (separación silábica, acento y equivalencias b/v, s/z/c, h muda). Consulta [las limitaciones](docs/limitaciones.md).

## Requisitos

- Node.js 20 o superior (probado con 22.22) y npm.

## Instalación y uso

El archivo `.npmrc` activa `legacy-peer-deps` para evitar un fallo de npm 10.9 con las dependencias opcionales de Vitest 4.

```bash
npm install
npm run dev          # servidor de desarrollo en http://localhost:5173
npm run build        # compilación de producción en dist/
npm run preview      # sirve dist/ en http://localhost:4173
npm run build:single # dist-single/calaverarte.html: toda la app en un solo archivo
```

## Pruebas

```bash
npm run lint         # ESLint: código sin uso, eval prohibido, innerHTML restringido
npm test             # Vitest: pruebas unitarias, de integración y 30 casos literarios
npx playwright install chromium   # solo la primera vez
npm run test:e2e     # Playwright: flujos completos en escritorio y móvil
```

`npm test` reescribe `docs/informe-casos-literarios.md` con los 30 poemas de prueba y sus métricas. Resultados de la última ejecución: [docs/informe-de-pruebas.md](docs/informe-de-pruebas.md).

## Publicación

La carpeta `dist/` es un sitio estático: sirve en cualquier hosting con HTTPS (GitHub Pages, Netlify, Cloudflare Pages). La base relativa (`base: './'`) permite publicarla en una subcarpeta.

**GitHub Pages:** sube el repositorio y activa *Settings → Pages → Source: GitHub Actions*. El flujo `.github/workflows/deploy.yml` ejecuta lint y pruebas, compila y publica en cada `push` a `main`. Después abre la dirección publicada y crea una calaverita para verificarla.

La compilación incluye una política de seguridad (`connect-src 'none'`) que impide cualquier conexión de red desde la app.

## Estructura

```
src/
  core/            modelo de datos, normalización, validación, DOM seguro, ids, errores
  storage/         IndexedDB: apertura, migraciones y repositorio único
  data/            familias de rima, vocabulario, patrones narrativos, perfiles educativos
  adapters/        contrato de proveedores de generación (solo el local)
  modules/
    literary-engine/  motor de rimas, métrica, plantillas, constructor narrativo y de estrofas
    generator/        formulario, esquema y servicio de generación
    editor/           sesión con deshacer/rehacer, versiones, vista
    evaluator/        comprobaciones de estructura, rima, ritmo, repetición y contenido
    education/        perfiles y 10 tipos de actividad imprimible
    library/          búsqueda y vista de la biblioteca
    designer/         7 estilos gráficos y hoja de impresión
    export/           JSON (respaldo e importación) e impresión
    settings/         preferencias (localStorage) y vista
    workshop/         buscador de rimas y contador de sílabas
    home/             inicio
tests/  unit/  integration/  e2e/
docs/   modelo de datos, limitaciones, informe de pruebas, casos literarios
```

## Privacidad

- Las obras se guardan en IndexedDB y las preferencias en localStorage, **solo en este navegador**.
- El almacenamiento **no está cifrado** y se pierde si se borran los datos del navegador: usa *Biblioteca → Descargar respaldo completo*.
- Sin cuentas, sin servidor, sin telemetría, sin dependencias en tiempo de ejecución.

## Integración futura con IA

`src/adapters/generation-provider.js` define el contrato que tendría que cumplir otro proveedor. No se incluye ninguno; añadirlo requiere pedir consentimiento explícito antes de enviar texto y ampliar `connect-src` en `vite.config.js`.

## Licencia

MIT. Las ilustraciones (papel picado, calaverita, cempasúchil) son SVG originales del proyecto. Las tipografías son las del sistema; no se descargan fuentes externas.
