// Servidor local con Mercado Pago simulado, para probar la compra sin dinero real.
// Uso: node scripts/servidor-prueba.mjs   y abrir http://localhost:8767/escuela.html
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
Object.assign(process.env, env, { MP_ACCESS_TOKEN: 'TEST-simulado', URL: 'http://localhost:8767' });

const pagos = {};
let siguiente = 5000;
globalThis.fetch = async (url, op = {}) => {
  if (op.method === 'POST' && String(url).endsWith('/v1/orders')) {
    const p = JSON.parse(op.body);
    const id = ++siguiente;
    pagos[id] = { status: 'approved', currency_id: 'ARS', external_reference: p.external_reference };
    return Response.json({ checkout_url: `${process.env.URL}/escuela.html?payment_id=${id}&external_reference=${p.external_reference}` });
  }
  const pago = pagos[String(url).split('/').pop()];
  return pago ? Response.json(pago) : new Response('{}', { status: 404 });
};

const funciones = {
  '/api/pago': (await import('../netlify/functions/pago.mjs')).default,
  '/api/acceso': (await import('../netlify/functions/acceso.mjs')).default,
  '/api/descarga': (await import('../netlify/functions/descarga.mjs')).default,
};
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  const url = new URL(req.url, process.env.URL);
  if (funciones[url.pathname]) {
    const trozos = [];
    for await (const t of req) trozos.push(t);
    const r = await funciones[url.pathname](new Request(url, {
      method: req.method, headers: req.headers, body: trozos.length ? Buffer.concat(trozos) : undefined,
    }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  const ruta = path.join('dist', path.normalize(url.pathname === '/' ? 'index.html' : url.pathname));
  try {
    const archivo = readFileSync(ruta);
    res.writeHead(200, { 'content-type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
    res.end(archivo);
  } catch {
    res.writeHead(404).end('No encontrado');
  }
}).listen(8767, () => console.log('http://localhost:8767/escuela.html'));
