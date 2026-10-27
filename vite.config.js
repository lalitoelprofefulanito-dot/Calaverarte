import { defineConfig } from 'vite';

// Política de seguridad solo en la compilación. La app no hace conexiones de red
// (connect-src 'none'). Se permite CSS en línea porque el editor y las preferencias
// ajustan estilos mediante propiedades DOM; el JavaScript sigue limitado a archivos
// del mismo origen y no se permiten scripts en línea. En desarrollo se omite CSP
// porque Vite necesita su WebSocket de recarga.
const cspPlugin = {
  name: 'calaverarte-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
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
