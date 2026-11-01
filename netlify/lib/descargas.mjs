const PDF = 'application/pdf';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Unicos archivos que se pueden pedir. El pedido elige una clave, nunca una ruta.
export const DESCARGAS = {
  m1: { origen: 'cursos/M1_Fundamentos_y_seguridad.pdf', nombre: 'M1_Fundamentos_y_seguridad.pdf', tipo: PDF },
  m2: { origen: 'cursos/M2_Bijouterie.pdf', nombre: 'M2_Bijouterie.pdf', tipo: PDF },
  m3: { origen: 'cursos/M3_Objetos_de_decoracion.pdf', nombre: 'M3_Objetos_de_decoracion.pdf', tipo: PDF },
  m4: { origen: 'cursos/M4_Mesas_con_incrustaciones.pdf', nombre: 'M4_Mesas_con_incrustaciones.pdf', tipo: PDF },
  m5: { origen: 'cursos/M5_Mesadas_revestidas.pdf', nombre: 'M5_Mesadas_revestidas.pdf', tipo: PDF },
  m6: { origen: 'cursos/M6_Costos_precios_y_ventas.pdf', nombre: 'M6_Costos_precios_y_ventas.pdf', tipo: PDF },
  calculadora: { origen: 'cursos/Calculadora_Epolax.xlsx', nombre: 'Calculadora_Epolax.xlsx', tipo: XLSX },
};
