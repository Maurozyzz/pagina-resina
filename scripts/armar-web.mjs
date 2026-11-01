// Copia a dist/ solo lo que puede ser publico. Lo que no este en esta lista no se publica.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const PUBLICOS = ['index.html', 'productos.html', 'gracias.html', 'escuela.html', 'favicon.svg',
  'robots.txt', 'sitemap.xml', 'css', 'js'];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const ruta of PUBLICOS) {
  if (!existsSync(ruta)) throw new Error(`Falta ${ruta}`);
  cpSync(ruta, `dist/${ruta}`, { recursive: true });
}
console.log(`dist/ listo con ${PUBLICOS.length} elementos publicos`);
