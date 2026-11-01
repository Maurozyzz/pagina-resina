// Cifra lecciones y descargas para guardarlas en el repositorio publico.
// Uso: node scripts/cifrar-cursos.mjs   (genera .env la primera vez)
import { createCipheriv, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DESCARGAS } from '../netlify/lib/descargas.mjs';

function leerEnv() {
  if (!existsSync('.env')) return {};
  return Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
}

const env = leerEnv();
if (!env.ESCUELA_CLAVE || !env.ACCESO_SECRETO) {
  env.ESCUELA_CLAVE ||= randomBytes(32).toString('hex');
  env.ACCESO_SECRETO ||= randomBytes(32).toString('hex');
  env.MP_ACCESS_TOKEN ||= '';
  writeFileSync('.env', Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
  console.log('.env creado con claves nuevas');
}

const clave = Buffer.from(env.ESCUELA_CLAVE, 'hex');
function cifrar(origen, destino) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', clave, iv);
  const datos = Buffer.concat([c.update(readFileSync(origen)), c.final()]);
  writeFileSync(destino, Buffer.concat([iv, c.getAuthTag(), datos]));
}

mkdirSync('privado', { recursive: true });
cifrar('sitio/lecciones.json', 'privado/lecciones.enc');
for (const [id, d] of Object.entries(DESCARGAS)) cifrar(d.origen, `privado/${id}.enc`);
console.log(`Cifrados: lecciones y ${Object.keys(DESCARGAS).length} descargas`);
