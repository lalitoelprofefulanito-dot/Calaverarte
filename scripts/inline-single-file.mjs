/**
 * Genera dist-single/calaverarte.html a partir de la compilación de Vite.
 * Incrusta CSS y JavaScript, y convierte las imágenes locales referenciadas
 * desde CSS en data URIs para que el archivo sea realmente autónomo.
 *
 * Esta variante de un solo archivo no se utiliza en el despliegue normal de
 * GitHub Pages, que publica dist/. Se conserva como opción de distribución.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const htmlFile = path.join(dist, 'index.html');
if (!fs.existsSync(htmlFile)) {
  throw new Error('No existe dist/index.html. Ejecuta primero: npm run build');
}

let html = fs.readFileSync(htmlFile, 'utf8');
let inlinedCssCount = 0;
let inlinedJsCount = 0;

function readDistAsset(reference, sourceFile = htmlFile) {
  const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  const candidate = cleanReference.startsWith('/')
    ? path.resolve(dist, `.${cleanReference}`)
    : path.resolve(path.dirname(sourceFile), cleanReference);
  const relative = path.relative(dist, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`El recurso sale de dist/: ${reference}`);
  }
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    throw new Error(`No se encontró un recurso compilado: ${reference}`);
  }
  return candidate;
}

function mimeType(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
  })[ext] || 'application/octet-stream';
}

function inlineCssAssets(css, cssFile) {
  return css.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, (whole, _quote, url) => {
    if (/^(?:data:|https?:|\/\/|#|blob:)/i.test(url)) return whole;
    const assetPath = readDistAsset(url, cssFile);
    const data = fs.readFileSync(assetPath).toString('base64');
    return `url("data:${mimeType(assetPath)};base64,${data}")`;
  });
}

// Se eliminan CSP de meta-etiqueta porque el CSS y el JavaScript estarán en línea.
html = html.replace(/<meta\b(?=[^>]*\bhttp-equiv=["']Content-Security-Policy["'])[^>]*>\s*/gi, '');

// Incrusta todas las hojas de estilo, sin asumir el orden de sus atributos.
html = html.replace(/<link\b[^>]*>/gi, (tag) => {
  if (!/\brel=["']stylesheet["']/i.test(tag)) return tag;
  const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (!href) throw new Error(`La hoja de estilo no tiene href: ${tag}`);
  const cssFile = readDistAsset(href);
  const css = inlineCssAssets(fs.readFileSync(cssFile, 'utf8'), cssFile)
    .replace(/<\/style/gi, '<\\/style');
  if (!css.trim()) throw new Error(`La hoja de estilo está vacía: ${href}`);
  inlinedCssCount += 1;
  return `<style>${css}</style>`;
});

// La compilación actual debe poder distribuirse como un único módulo JavaScript.
html = html.replace(/<script\b([^>]*)><\/script>/gi, (tag, attributes) => {
  const source = attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  if (!source) return tag;
  if (!/\btype=["']module["']/i.test(attributes)) {
    throw new Error(`Se encontró un script externo no compatible con el empaquetado: ${source}`);
  }
  const jsFile = readDistAsset(source);
  const code = fs.readFileSync(jsFile, 'utf8').replace(/<\/script/gi, '<\\/script');
  if (!code.trim()) throw new Error(`El JavaScript compilado está vacío: ${source}`);
  inlinedJsCount += 1;
  return `<script type="module">${code}</script>`;
});

// Los precargados dejan de ser necesarios y la página no depende de un manifest externo.
html = html.replace(/<link\b[^>]*\brel=["']modulepreload["'][^>]*>\s*/gi, '');
html = html.replace(/<link\b(?=[^>]*\brel=["']manifest["'])[^>]*>\s*/gi, '');

const favicon = path.join(dist, 'favicon.svg');
if (fs.existsSync(favicon)) {
  const data = encodeURIComponent(fs.readFileSync(favicon, 'utf8'));
  html = html.replace(/<link\b[^>]*\brel=["']icon["'][^>]*>/i, `<link rel="icon" href="data:image/svg+xml,${data}">`);
}

if (!inlinedCssCount) throw new Error('No se incrustó ninguna hoja CSS; se cancela para evitar un archivo sin diseño.');
if (!inlinedJsCount) throw new Error('No se incrustó ningún módulo JavaScript; se cancela para evitar una app inactiva.');
if (/<script\b[^>]*\bsrc=/i.test(html) || /<link\b[^>]*\brel=["']stylesheet["']/i.test(html)) {
  throw new Error('Quedaron dependencias externas de JS o CSS después de incrustar.');
}

const outDir = path.resolve('dist-single');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'calaverarte.html');
fs.writeFileSync(outFile, html);
console.log(`Archivo autónomo generado: ${path.relative(process.cwd(), outFile)} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB; ${inlinedCssCount} CSS; ${inlinedJsCount} JS).`);
