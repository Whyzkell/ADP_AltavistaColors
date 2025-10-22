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
