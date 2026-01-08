// src/api.js
import axios from 'axios'

const API_PORT = 3001
const BASE = `http://localhost:${API_PORT}`

export const api = axios.create({
  baseURL: BASE
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

// --- MODIFICADO: Soporte para FormData (Imágenes) ---
export async function createProduct(data) {
  const headers = authHeaders()

  if (data instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${BASE}/api/products`, {
    method: 'POST',
    headers: headers,
    body: data instanceof FormData ? data : JSON.stringify(data)
  })

  const txt = await res.text()
  if (!res.ok) throw new Error(tryJson(txt)?.error || txt || `HTTP ${res.status}`)
  return tryJson(txt)
}

// --- MODIFICADO: Soporte para FormData (Imágenes) ---
export async function updateProduct(id, data) {
  const headers = authHeaders()

  if (data instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: headers,
    body: data instanceof FormData ? data : JSON.stringify(data)
  })

  // Leemos texto primero para evitar fallos si el back no devuelve JSON
  const txt = await res.text()
  if (!res.ok) throw new Error(tryJson(txt)?.error || txt || `HTTP ${res.status}`)
  return tryJson(txt)
}

// --- FUNCIÓN CORREGIDA (Aquí estaba el error) ---
async function handle(res) {
  // 1. Leemos la respuesta como texto plano primero
  const txt = await res.text()

  // 2. Si hay error HTTP
  if (!res.ok) {
    const json = tryJson(txt)
    throw new Error(json?.error || txt || `HTTP ${res.status}`)
  }

  // 3. Si es éxito, intentamos parsear. Si 'txt' está vacío (común en DELETE), devuelve null sin error.
  return tryJson(txt)
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
  const items = (payload.productos || [])
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

    // --- NUEVO: Agregamos el tipo de pago aquí ---
    tipo_de_pago: payload.tipo_de_pago,
    // --------------------------------------------

    items,
    meta: { ventaCuentaDe: payload.ventaCuentaDe || null }
  }

  try {
    const { data } = await api.post('/api/invoices', body)
    return data
  } catch (err) {
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
  return data
}

export async function getInvoice(id) {
  const { data } = await api.get(`/api/invoices/${id}`)
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

export async function createCreditoFiscal(payload) {
  // Helper para normalizar valores nulos
  const n = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : v)

  // Procesamiento de items
  const items = (payload.productos || [])
    .filter((p) => Number(p.cant) > 0 && Number(p.precio) >= 0)
    .map((p) => ({
      producto_id: p.pid ?? null,
      nombre: String(p.nombre || '').trim(),
      cantidad: Number(p.cant || 0),
      precio_unit: Number(p.precio || 0),
      total: Number((Number(p.cant || 0) * Number(p.precio || 0)).toFixed(2))
    }))

  // Construcción del cuerpo de la petición
  const body = {
    cliente: n(payload.cliente),
    direccion: n(payload.direccion),
    municipio: n(payload.municipio),
    nrc: n(payload.nrc),
    departamento: n(payload.departamento),
    nit: n(payload.nit),
    condiciones_op: n(payload.condiciones),
    nota_remision_ant: n(payload.notaAnterior),
    fecha_remision_ant: n(payload.fechaNotaAnterior),
    venta_cuenta_de: n(payload.ventaCuentaDe),

    // 👇 ¡AQUÍ ES DONDE FALTABA! 👇
    tipo_de_pago: payload.tipo_de_pago,
    // ☝️ SIN ESTO, EL BACKEND SIEMPRE RECIBE NULL Y PONE EL DEFAULT

    subtotal: Number(payload?.resumen?.sumas ?? payload?.resumen?.subTotal ?? 0),
    iva_13: Number(payload?.resumen?.iva13 ?? 0),
    iva_retenido: Number(payload?.resumen?.ivaRetenido ?? 0),
    total: Number(payload?.resumen?.ventaTotal ?? 0),
    items,
    payload: {
      entregadoPor: n(payload.entregadoPor),
      recibidoPor: n(payload.recibidoPor),
      duiEntregado: n(payload.duiEntregado),
      duiRecibido: n(payload.duiRecibido)
    }
  }

  try {
    const { data } = await api.post('/api/creditos', body)
    return data
  } catch (e) {
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
    return data
  } catch (e) {
    console.error('API Error getTopProducts:', e.response?.data || e)
    const msg = e.response?.data?.error || e.message || 'Error cargando estadísticas'
    throw new Error(msg)
  }
}

export async function getGraphData(params) {
  try {
    // 1. LIMPIEZA: Creamos un objeto solo con los valores válidos
    const cleanParams = {}
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        cleanParams[key] = params[key]
      }
    })

    // 2. Ahora sí usamos URLSearchParams con los datos limpios
    const query = new URLSearchParams(cleanParams).toString()

    const { data } = await api.get(`/api/stats/timeseries?${query}`)
    return data
  } catch (e) {
    console.error('API Error getGraphData:', e.response?.data || e)
    const msg = e.response?.data?.error || e.message || 'Error cargando datos del gráfico'
    throw new Error(msg)
  }
}

// En src/api.js del frontend
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')

        // Esta es la alerta que el cliente verá
        const Swal = (await import('sweetalert2')).default
        await Swal.fire({
          icon: 'warning',
          title: 'Sesión Caducada',
          text: 'Tu sesión ha expirado. Por favor ingresa nuevamente.',
          confirmButtonText: 'Ir al Login',
          confirmButtonColor: '#11A5A3',
          allowOutsideClick: false
        })

        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export async function getLowStockProducts() {
  try {
    // Asegúrate de haber creado la ruta '/api/stats/low-stock' en tu backend
    const { data } = await api.get('/api/stats/low-stock')
    return data
  } catch (e) {
    console.error('API Error getLowStockProducts:', e.response?.data || e)
    const msg = e.response?.data?.error || e.message || 'Error cargando productos con bajo stock'
    throw new Error(msg)
  }
}
