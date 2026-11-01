import { randomUUID } from 'node:crypto';
import { crearReferencia, emailValido, json, leerCuerpo, mercadoPago, PRODUCTO } from '../lib/escuela.mjs';

export const config = { path: '/api/pago' };

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
  const cuerpo = await leerCuerpo(req);
  const email = String(cuerpo?.email || '').trim().toLowerCase();
  if (!emailValido(email)) return json({ error: 'email' }, 400);

  const sitio = process.env.URL;
  const monto = PRODUCTO.precio.toFixed(2);
  const respuesta = await mercadoPago('/v1/orders', {
    method: 'POST',
    headers: { 'x-idempotency-key': randomUUID() },
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'manual',
      capture_mode: 'automatic_async',
      total_amount: monto,
      external_reference: crearReferencia(email),
      description: PRODUCTO.titulo,
      payer: { email },
      items: [{
        external_code: PRODUCTO.id,
        title: PRODUCTO.titulo,
        quantity: 1,
        unit_price: monto,
      }],
      config: {
        statement_descriptor: 'EPOLAX',
        online: {
          success_url: `${sitio}/escuela.html`,
          pending_url: `${sitio}/escuela.html`,
          failure_url: `${sitio}/escuela.html?pago=rechazado`,
          auto_return: 'approved',
        },
        // Sin pagos en efectivo: el acceso debe liberarse en el momento.
        payment_method: { not_allowed_types: ['ticket'] },
      },
    }),
  }).catch(() => null);

  if (!respuesta?.ok) {
    // El tipo de credencial alcanza para diagnosticar: nunca registrar el token ni el email.
    const token = process.env.MP_ACCESS_TOKEN ?? '';
    const credencial = token.startsWith('TEST-') ? 'TEST' : token.startsWith('APP_USR-') ? 'APP_USR' : token ? 'otro' : 'vacio';
    const detalle = respuesta ? (await respuesta.text()).slice(0, 300) : 'sin respuesta';
    console.error('No se pudo crear la order', respuesta?.status, credencial, detalle);
    return json({ error: 'mercado_pago' }, 502);
  }
  const orden = await respuesta.json();
  return json({ url: orden.checkout_url });
};
