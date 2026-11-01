// Prueba el flujo de cobro con un Mercado Pago simulado. No usa dinero ni la cuenta real.
// Uso: node scripts/probar-pagos.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
Object.assign(process.env, env, { MP_ACCESS_TOKEN: 'TEST-simulado', URL: 'https://ejemplo.netlify.app' });

const { crearReferencia } = await import('../netlify/lib/escuela.mjs');
const ref = crearReferencia('ana@ejemplo.com');
const pagos = {
  1001: { status: 'approved', currency_id: 'ARS', external_reference: ref },
  1002: { status: 'pending', currency_id: 'ARS', external_reference: ref },
  1003: { status: 'refunded', currency_id: 'ARS', external_reference: ref },
  1004: { status: 'approved', currency_id: 'ARS', external_reference: 'otra-venta' },
  1005: { status: 'approved', currency_id: 'USD', external_reference: ref },
};
const ordenes = {
  ORDTST0000000000000001: { status: 'processed', status_detail: 'accredited', currency: 'ARS', external_reference: ref },
  ORDTST0000000000000002: { status: 'created', status_detail: 'created', currency: 'ARS', external_reference: ref },
  ORDTST0000000000000003: { status: 'processed', status_detail: 'refunded', currency: 'ARS', external_reference: ref },
};
let orden;
globalThis.fetch = async (url, op = {}) => {
  if (op.method === 'POST' && String(url).endsWith('/v1/orders')) {
    orden = { cuerpo: JSON.parse(op.body), encabezados: op.headers };
    return Response.json({ id: 'ORDTST0000000000000001', checkout_url: 'https://pago.simulado' });
  }
  const id = String(url).split('/').pop();
  const dato = pagos[id] ?? ordenes[id];
  return dato ? Response.json(dato) : new Response('{}', { status: 404 });
};

const pago = (await import('../netlify/functions/pago.mjs')).default;
const acceso = (await import('../netlify/functions/acceso.mjs')).default;
const descarga = (await import('../netlify/functions/descarga.mjs')).default;
const post = (cuerpo, ruta = 'acceso') => new Request(`https://x/api/${ruta}`, { method: 'POST', body: JSON.stringify(cuerpo) });
const get = (ruta, cookie) => new Request(`https://x${ruta}`, { headers: cookie ? { cookie } : {} });
const prueba = async (nombre, fn) => { await fn(); console.log('ok  ', nombre); };
const sinAcceso = async (cuerpo) => assert.equal((await (await acceso(post(cuerpo))).json()).acceso, false);

await prueba('rechaza email invalido', async () => assert.equal((await pago(post({ email: 'nada' }, 'pago'))).status, 400));
await prueba('crea la order con precio y datos del servidor', async () => {
  const r = await pago(post({ email: 'Ana@Ejemplo.com ', precio: 1, total_amount: '1.00' }, 'pago'));
  assert.equal((await r.json()).url, 'https://pago.simulado');
  const c = orden.cuerpo;
  assert.equal(c.type, 'online');
  assert.equal(c.processing_mode, 'manual');
  assert.equal(c.total_amount, '84900.00');
  assert.equal(c.items[0].unit_price, '84900.00');
  assert.deepEqual(c.config.payment_method.not_allowed_types, ['ticket']);
  assert.equal(c.config.online.auto_return, 'approved');
  assert.ok(c.external_reference.length <= 64);
  assert.ok(!c.external_reference.includes('ana'));
  assert.ok(c.external_reference.startsWith(ref.slice(0, 22)));
  assert.match(orden.encabezados['x-idempotency-key'], /^[0-9a-f-]{36}$/);
});
await prueba('sin cookie no hay contenido', async () => assert.equal((await (await acceso(get('/api/acceso'))).json()).acceso, false));
await prueba('pago aprobado con referencia correcta abre el curso', async () => {
  const r = await acceso(post({ pago: '1001', ref }));
  const d = await r.json();
  assert.equal(d.acceso, true);
  assert.equal(d.modulos.length, 6);
  assert.ok(d.modulos[3].lecciones[1].length > 200);
  const cookie = r.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
  const par = cookie.split(';')[0];
  assert.equal((await (await acceso(get('/api/acceso', par))).json()).acceso, true);
  const pdf = await descarga(get('/api/descarga?archivo=m4', par));
  assert.equal(pdf.status, 200);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
  assert.equal((await descarga(get('/api/descarga?archivo=../.env', par))).status, 404);
  const falsa = par.replace(/.$/, (c) => (c === '0' ? '1' : '0'));
  assert.equal((await (await acceso(get('/api/acceso', falsa))).json()).acceso, false);
  pagos[1001].status = 'refunded';
  assert.equal((await (await acceso(get('/api/acceso', par))).json()).acceso, false);
  assert.equal((await descarga(get('/api/descarga?archivo=m4', par))).status, 403);
  pagos[1001].status = 'approved';
});
await prueba('order acreditada abre el curso', async () => {
  const r = await acceso(post({ pago: 'ORDTST0000000000000001', ref }));
  assert.equal((await r.json()).acceso, true);
  const par = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await (await acceso(get('/api/acceso', par))).json()).acceso, true);
});
await prueba('order sin pagar queda pendiente', async () => assert.equal((await (await acceso(post({ pago: 'ORDTST0000000000000002', ref }))).json()).estado, 'pendiente'));
await prueba('order devuelta no abre', async () => sinAcceso({ pago: 'ORDTST0000000000000003', ref }));
await prueba('referencia ajena no abre el curso', async () => sinAcceso({ pago: '1001', ref: 'mala' }));
await prueba('pago pendiente espera', async () => assert.equal((await (await acceso(post({ pago: '1002', ref }))).json()).estado, 'pendiente'));
await prueba('pago devuelto no abre', async () => sinAcceso({ pago: '1003', ref }));
await prueba('otro cobro de la cuenta no abre', async () => sinAcceso({ pago: '1004', ref: 'otra-venta' }));
await prueba('otra moneda no abre', async () => sinAcceso({ pago: '1005', ref }));
await prueba('recupera con operacion y email', async () => assert.equal((await (await acceso(post({ operacion: '1001', email: ' ANA@ejemplo.com' }))).json()).acceso, true));
await prueba('no recupera con otro email', async () => sinAcceso({ operacion: '1001', email: 'otra@ejemplo.com' }));
await prueba('id invalido no consulta nada', async () => sinAcceso({ pago: '../x', ref: 'a' }));
await prueba('descarga sin acceso rechazada', async () => assert.equal((await descarga(get('/api/descarga?archivo=m1'))).status, 403));
console.log('Todas las pruebas pasaron');
