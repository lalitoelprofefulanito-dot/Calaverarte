/**
 * Genera dist-single/calaverarte.html: la app compilada en un único archivo
 * (JS y CSS incrustados) para abrirla sin servidor o publicarla como una sola
 * página. Se omite la CSP porque los scripts en línea no la cumplirían; el
 * código sigue sin hacer peticiones de red.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/, '');
html = html.replace(/<script type="module" crossorigin src="\.\/assets\/[^"]+\.js"><\/script>\s*/, '').replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/, (_, file) => `<style>${fs.readFileSync(path.join(dist, file), 'utf8')}</style>`);

const jsFile = fs.readdirSync(path.join(dist, 'assets')).find((f) => f.endsWith('.js'));
const code = fs.readFileSync(path.join(dist, 'assets', jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
html = html.replace('</body>', `<script type="module">${code}</script>\n</body>`);

const favicon = fs.readFileSync(path.join(dist, 'favicon.svg'), 'utf8');
html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}">`);
html = html.replace(/<link rel="manifest"[^>]*>\s*/, '');

fs.mkdirSync('dist-single', { recursive: true });
fs.writeFileSync('dist-single/calaverarte.html', html);
console.log(`dist-single/calaverarte.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
