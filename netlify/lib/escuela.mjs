import { createDecipheriv, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// El precio vive solo en el servidor: el navegador nunca lo decide.
export const PRODUCTO = {
  id: 'escuela-completa',
  titulo: 'Escuela Epolax Cristal: curso completo',
  precio: 84900,
  moneda: 'ARS',
};

const API = 'https://api.mercadopago.com';
const COOKIE = 'escuela_acceso';
const CINCO_ANIOS = 157680000;

export const json = (datos, estado = 200, encabezados = {}) => new Response(JSON.stringify(datos), {
  status: estado,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...encabezados },
});

export async function leerCuerpo(req, limite = 2000) {
  const texto = await req.text();
  if (texto.length > limite) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export const emailValido = (e) => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function mercadoPago(ruta, opciones = {}) {
  return fetch(`${API}${ruta}`, {
    ...opciones,
    signal: AbortSignal.timeout(8000),
    headers: {
      authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'content-type': 'application/json',
      ...opciones.headers,
    },
  });
}

const firma = (id) => createHmac('sha256', process.env.ACCESO_SECRETO).update(String(id)).digest('hex');

// La API de Orders no tiene metadata: la referencia identifica el producto y, sin exponerlo, el email.
const PREFIJO = 'esc1';
const marcaEmail = (email) => firma(`email:${email}`).slice(0, 16);
export const crearReferencia = (email) => `${PREFIJO}-${marcaEmail(email)}-${randomUUID()}`;
export const referenciaDeEmail = (referencia, email) => String(referencia).startsWith(`${PREFIJO}-${marcaEmail(email)}-`);

function clasificar(compra, referencia, estado) {
  if (!String(referencia).startsWith(`${PREFIJO}-`)) return { estado: 'invalido' };
  return { estado, referencia, compra };
}

// Mercado Pago es la unica fuente de verdad: cada acceso vuelve a consultar la compra,
// asi un reembolso o contracargo corta el acceso sin guardar nada de nuestro lado.
export async function consultarPago(id) {
  const texto = String(id);
  const esPago = /^\d{1,20}$/.test(texto);
  if (!esPago && !/^ORD[A-Z0-9]{10,40}$/.test(texto)) return { estado: 'invalido' };
  const r = await mercadoPago(esPago ? `/v1/payments/${texto}` : `/v1/orders/${texto}`);
  if (r.status === 404) return { estado: 'invalido' };
  if (!r.ok) throw new Error(`Mercado Pago respondio ${r.status}`);
  const dato = await r.json();

  if (esPago) {
    if (dato.currency_id !== PRODUCTO.moneda) return { estado: 'invalido' };
    const estado = dato.status === 'approved' ? 'aprobado'
      : ['pending', 'in_process', 'authorized'].includes(dato.status) ? 'pendiente' : 'rechazado';
    return clasificar(dato, dato.external_reference, estado);
  }
  if (dato.currency !== PRODUCTO.moneda) return { estado: 'invalido' };
  const estado = dato.status === 'processed' && dato.status_detail === 'accredited' ? 'aprobado'
    : dato.status === 'created' || dato.status === 'action_required' ? 'pendiente' : 'rechazado';
  return clasificar(dato, dato.external_reference, estado);
}

export const cookieAcceso = (id) => `${COOKIE}=${id}.${firma(id)}; Max-Age=${CINCO_ANIOS}; Path=/; HttpOnly; Secure; SameSite=Lax`;

export function pagoDeCookie(req) {
  const cruda = (req.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!cruda) return null;
  const [id, recibida] = cruda.slice(COOKIE.length + 1).split('.');
  if (!id || !recibida) return null;
  const a = Buffer.from(recibida);
  const b = Buffer.from(firma(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export async function descifrar(nombre) {
  const raiz = process.env.LAMBDA_TASK_ROOT || process.cwd();
  const datos = await readFile(path.join(raiz, 'privado', nombre));
  const d = createDecipheriv('aes-256-gcm', Buffer.from(process.env.ESCUELA_CLAVE, 'hex'), datos.subarray(0, 12));
  d.setAuthTag(datos.subarray(12, 28));
  return Buffer.concat([d.update(datos.subarray(28)), d.final()]);
}
