// src/api.js
import axios from 'axios'

const BASE = 'http://localhost:3000'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function authHeaders() {
  const t = localStorage.getItem('token')
  return t
    ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export async function fetchProducts(q = '') {
  const res = await fetch(`${BASE}/api/products${q ? `?q=${encodeURIComponent(q)}` : ''}`, {
    headers: authHeaders()
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(tryJson(txt)?.error || txt || `HTTP ${res.status}`)
  return tryJson(txt)
}

export async function createProduct(data) {
  const res = await fetch(`${BASE}/api/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(tryJson(txt)?.error || txt || `HTTP ${res.status}`)
  return tryJson(txt)
}

export async function updateProduct(id, data) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Error actualizando producto')
  return res.json()
}

async function handle(res) {
  if (!res.ok) {
    const txt = await res.text()
    try {
      const data = JSON.parse(txt)
      throw new Error(data.error || `HTTP ${res.status}`)
    } catch {
      throw new Error(txt || `HTTP ${res.status}`)
    }
  }
  return res.json()
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  return handle(res)
}

function tryJson(t) {
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

export async function createInvoice(payload) {
  // payload: { cliente, direccion, dui, nit, condiciones, productos[], ventaCuentaDe? }

  const items = (payload.productos || [])
    // quita filas vacías o con cantidad 0
    .filter(
      (p) =>
        p && String(p.nombre || '').trim().length > 0 && Number(p.cant) > 0 && Number(p.precio) >= 0
    )
    .map((p) => ({
      producto_id: p.pid ?? null,
      nombre: String(p.nombre).trim(),
      cantidad: Number(p.cant),
      precio: Number(p.precio)
    }))

  if (items.length === 0) {
    throw new Error('Agrega al menos 1 producto con cantidad > 0')
  }

  const body = {
    cliente: payload.cliente?.trim(),
    direccion: payload.direccion?.trim(),
    dui: payload.dui?.trim(),
    nit: payload.nit?.trim(),
    condiciones: payload.condiciones?.trim() || null,
    items,
    meta: { ventaCuentaDe: payload.ventaCuentaDe || null }
  }

  try {
    const { data } = await api.post('/api/invoices', body)
    return data
  } catch (err) {
    // mensajes claros
    const msg =
      err.response?.data?.error ||
      (err.code === 'ERR_NETWORK'
        ? 'No puedo conectar con el backend en http://localhost:3000'
        : 'Error creando factura')
    throw new Error(msg)
  }
}

// --- FACTURAS ---
export async function listInvoices() {
  const { data } = await api.get('/api/invoices')
  // data: [{id, numero, cliente, direccion, fecha_emision, total}]
  return data
}

export async function getInvoice(id) {
  const { data } = await api.get(`/api/invoices/${id}`)
  // data: {id, numero, cliente, direccion, fecha_emision, total, items:[...] }
  return data
}

export async function deleteInvoice(id) {
  const { data } = await api.delete(`/api/invoices/${id}`)
  return data
}

// --------- Créditos Fiscales ---------
export async function listFiscalCredits() {
  const { data } = await api.get('/api/creditos')
  return data
}

export async function getFiscalCredit(id) {
  const { data } = await api.get(`/api/creditos/${id}`)
  return data
}

export async function deleteFiscalCredit(id) {
  const { data } = await api.delete(`/api/creditos/${id}`)
  return data
}

export async function createFiscalCredit(payload) {
  // payload.sale de CreateCreditoFiscalModal
  const items = (payload.productos || []).map((p) => ({
    producto_id: p.pid ?? p.producto_id ?? null,
    nombre: p.nombre,
    cantidad: Number(p.cantidad ?? p.cant ?? 0),
    precio: Number(p.precioUnitario ?? p.precio ?? 0)
  }))

  const body = {
    cliente: payload.cliente,
    direccion: payload.direccion,
    municipio: payload.municipio,
    departamento: payload.departamento,
    nrc: payload.nrc,
    nit: payload.nit,
    condiciones: payload.condiciones,
    items,
    // guardo TODO lo demás en meta/payload (para ver-detalle o imprimir)
    meta: {
      ventaCuentaDe: payload.ventaCuentaDe,
      notaAnterior: payload.notaAnterior,
      fechaNotaAnterior: payload.fechaNotaAnterior,
      entregadoPor: payload.entregadoPor,
      recibidoPor: payload.recibidoPor,
      duiEntregado: payload.duiEntregado,
      duiRecibido: payload.duiRecibido,
      resumen: payload.resumen,
      creadoEn: payload.creadoEn
    }
  }

  const { data } = await api.post('/api/creditos', body)
  return data // {id, numero, total}
}

export async function createCreditoFiscal(payload) {
  // helper para mandar null y no '' a columnas text/date
  const n = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : v)

  // mapea productos -> credito_items (usa precio_unit como en la tabla)
  const items = (payload.productos || [])
    .filter((p) => Number(p.cant) > 0 && Number(p.precio) >= 0)
    .map((p) => ({
      producto_id: p.pid ?? null,
      nombre: String(p.nombre || '').trim(),
      cantidad: Number(p.cant || 0),
      precio_unit: Number(p.precio || 0),
      total: Number((Number(p.cant || 0) * Number(p.precio || 0)).toFixed(2))
    }))

  const body = {
    // columnas cabecera (según tu tabla creditos)
    cliente: n(payload.cliente),
    direccion: n(payload.direccion),
    municipio: n(payload.municipio),
    nrc: n(payload.nrc),
    departamento: n(payload.departamento),
    nit: n(payload.nit),

    condiciones_op: n(payload.condiciones),
    nota_remision_ant: n(payload.notaAnterior),
    // si viene vacío, va null (no ''), para no romper la columna date
    fecha_remision_ant: n(payload.fechaNotaAnterior),
    venta_cuenta_de: n(payload.ventaCuentaDe),

    // totales
    subtotal: Number(payload?.resumen?.sumas ?? payload?.resumen?.subTotal ?? 0),
    iva_13: Number(payload?.resumen?.iva13 ?? 0),
    iva_retenido: Number(payload?.resumen?.ivaRetenido ?? 0),
    total: Number(payload?.resumen?.ventaTotal ?? 0),

    // detalle
    items,

    // extra lo metemos en jsonb payload
    payload: {
      entregadoPor: n(payload.entregadoPor),
      recibidoPor: n(payload.recibidoPor),
      duiEntregado: n(payload.duiEntregado),
      duiRecibido: n(payload.duiRecibido)
    }
  }

  try {
    const { data } = await api.post('/api/creditos', body)
    return data // { id, numero, total }
  } catch (e) {
    // muestra por consola el error real del backend (si viene)
    console.error('POST /api/creditos error:', e.response?.data || e)
    const msg =
      e.response?.data?.error ||
      e.response?.data?.message ||
      e.message ||
      'Error creando crédito fiscal'
    throw new Error(msg)
  }
}

// --------- Estadísticas ---------
export async function getTopProducts() {
  try {
    const { data } = await api.get('/api/stats/top-products')
    return data // Devuelve el array de productos top
  } catch (e) {
    console.error('API Error getTopProducts:', e.response?.data || e)
    const msg = e.response?.data?.error || e.message || 'Error cargando estadísticas'
    throw new Error(msg)
  }
}

export async function getGraphData(params) {
  // params = { observe, measure, timeframe, productId }
  try {
    // URLSearchParams limpia los parámetros indefinidos
    const query = new URLSearchParams(params).toString()
    const { data } = await api.get(`/api/stats/timeseries?${query}`)
    return data // Devuelve el array de datos para el gráfico
  } catch (e) {
    console.error('API Error getGraphData:', e.response?.data || e)
    const msg = e.response?.data?.error || e.message || 'Error cargando datos del gráfico'
    throw new Error(msg)
  }
}
