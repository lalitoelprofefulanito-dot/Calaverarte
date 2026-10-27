import { defineConfig } from 'vite';

// Política de seguridad de contenido solo en la compilación: impide cualquier
// conexión de red desde la app (connect-src 'none'). En desarrollo se omite
// porque el servidor de Vite necesita su WebSocket de recarga.
const cspPlugin = {
  name: 'calaverarte-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
    return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
  },
};

export default defineConfig({
  base: './',
  plugins: [cspPlugin],
  build: { target: 'es2020', sourcemap: false },
  test: {
    include: ['tests/unit/**/*.test.js', 'tests/integration/**/*.test.js'],
    environment: 'node',
  },
});
