import {
  consultarPago, cookieAcceso, descifrar, emailValido, json, leerCuerpo, pagoDeCookie, referenciaDeEmail,
} from '../lib/escuela.mjs';

export const config = { path: '/api/acceso' };

const contenido = async () => JSON.parse((await descifrar('lecciones.enc')).toString('utf8'));

export default async (req) => {
  try {
    if (req.method === 'GET') {
      const id = pagoDeCookie(req);
      if (!id) return json({ acceso: false });
      const { estado } = await consultarPago(id);
      return estado === 'aprobado' ? json({ acceso: true, ...(await contenido()) }) : json({ acceso: false, estado });
    }
    if (req.method !== 'POST') return json({ error: 'metodo' }, 405);

    const cuerpo = await leerCuerpo(req);
    const id = String(cuerpo?.pago ?? cuerpo?.operacion ?? '').trim();
    const { estado, referencia } = await consultarPago(id);
    if (estado === 'invalido') return json({ acceso: false, estado: 'invalido' });

    // Vuelta desde Mercado Pago: la referencia prueba que el pago es de esta compra.
    // Recuperacion: el numero de operacion mas el email de compra cumplen esa funcion.
    const email = String(cuerpo.email || '').trim().toLowerCase();
    const propio = cuerpo.pago ? referencia === cuerpo.ref : emailValido(email) && referenciaDeEmail(referencia, email);
    if (!propio) return json({ acceso: false, estado: 'invalido' });
    if (estado !== 'aprobado') return json({ acceso: false, estado });

    return json({ acceso: true, ...(await contenido()) }, 200, { 'set-cookie': cookieAcceso(id) });
  } catch (e) {
    console.error('Fallo al verificar el acceso', e.message);
    return json({ error: 'temporal' }, 503);
  }
};
