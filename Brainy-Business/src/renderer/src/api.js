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

export async function deleteProduct(id) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Error eliminando producto')
  return res.json()
}

async function handle(res) {
  if (!res.ok) {
    // lee texto para evitar “Unexpected token <”
    const txt = await res.text()
    // intenta parsear por si es JSON válido
    try {
      const data = JSON.parse(txt)
      throw new Error(data.error || `HTTP ${res.status}`)
    } catch {
      throw new Error(txt || `HTTP ${res.status}`)
    }
  }
  return res.json()
}

function tryJson(t) {
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}
