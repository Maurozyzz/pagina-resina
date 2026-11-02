// Servidor local con Mercado Pago simulado, para probar la compra sin dinero real.
// Uso: node scripts/servidor-prueba.mjs   y abrir http://localhost:8767/escuela.html
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
Object.assign(process.env, env, { MP_ACCESS_TOKEN: 'TEST-simulado', URL: 'http://localhost:8767' });

const pagos = {};
let siguiente = Date.now() % 1000000000;
globalThis.fetch = async (url, op = {}) => {
  if (op.method === 'POST' && String(url).endsWith('/v1/orders')) {
    const p = JSON.parse(op.body);
    const id = ++siguiente;
    pagos[id] = { status: 'approved', currency_id: 'ARS', external_reference: p.external_reference };
    return Response.json({ checkout_url: `${process.env.URL}/simular/pago?id=${id}` });
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
  const simulado = pagos[url.searchParams.get('id')];
  if (url.pathname === '/simular/pago' && simulado) {
    const vuelta = `/escuela.html?payment_id=${url.searchParams.get('id')}&external_reference=${simulado.external_reference}`;
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><meta charset="utf-8"><title>Pago simulado</title>
      <body style="font-family:Arial;background:#ffe600;margin:0;display:grid;place-items:center;min-height:100vh">
      <main style="background:#fff;padding:32px;border-radius:8px;max-width:420px">
      <h1>Mercado Pago simulado</h1><p>Sin dinero real. Curso completo: <b>$84.900</b></p>
      <a id="aprobar" href="${vuelta}" style="display:block;background:#2968c8;color:#fff;padding:14px;text-align:center;border-radius:6px;text-decoration:none">Aprobar pago simulado</a>
      </main></body>`);
  }
  if (url.pathname === '/simular/devolver') {
    Object.values(pagos).forEach((p) => { p.status = 'refunded'; });
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><meta charset="utf-8"><title>Devolución simulada</title><h1 style="font-family:Arial">Devolución simulada hecha</h1><p style="font-family:Arial"><a href="/escuela.html#m4">Volver a la escuela</a></p>');
  }
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
