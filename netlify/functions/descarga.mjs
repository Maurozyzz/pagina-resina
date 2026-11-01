import { DESCARGAS } from '../lib/descargas.mjs';
import { consultarPago, descifrar, json, pagoDeCookie } from '../lib/escuela.mjs';

export const config = { path: '/api/descarga' };

export default async (req) => {
  const clave = new URL(req.url).searchParams.get('archivo');
  const archivo = Object.hasOwn(DESCARGAS, clave ?? '') ? DESCARGAS[clave] : null;
  if (!archivo) return json({ error: 'archivo' }, 404);
  try {
    const id = pagoDeCookie(req);
    const estado = id ? (await consultarPago(id)).estado : 'sin_acceso';
    if (estado !== 'aprobado') return json({ error: 'sin_acceso' }, 403);
    return new Response(await descifrar(`${clave}.enc`), {
      headers: {
        'content-type': archivo.tipo,
        'content-disposition': `attachment; filename="${archivo.nombre}"`,
        'cache-control': 'private, no-store',
      },
    });
  } catch (e) {
    console.error('Fallo la descarga', e.message);
    return json({ error: 'temporal' }, 503);
  }
};
