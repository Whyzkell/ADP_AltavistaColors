import React, { useEffect, useState, useMemo } from 'react'
import { fetchProducts, listLotes, createLote, updateLote, deleteLote } from '../../api'
import Swal from 'sweetalert2'
import LotesProximosAVencer from '../dashboard/LotesProximosAVencer'

// URL del backend para imágenes
const API_BASE = 'http://localhost:3001'

/* ========= Helpers ========= */
function formatDate(isoString) {
  if (!isoString) return '—'
  // Para mostrar en la tabla usamos UTC para evitar desfases
  const d = new Date(isoString)
  return d.toLocaleDateString('es-SV', { timeZone: 'UTC' })
}

// Helper para pre-llenar inputs de fecha (requiere YYYY-MM-DD)
function toInputDate(isoString) {
  if (!isoString) return ''
  return isoString.split('T')[0]
}

function getDaysRemaining(dateString) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateString)
  const diffTime = target - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function StatusPill({ days }) {
  if (days < 0) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 ring-1 ring-rose-200">
        VENCIDO ({Math.abs(days)} días)
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 ring-1 ring-amber-200">
        ⚠️ Vence en {days} días
      </span>
    )
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
      OK ({days} días)
    </span>
  )
}

/* ========= Componentes UI ========= */
const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={
      'w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 outline-none ' +
      className
    }
  />
)

// Menú Inline
const Menu = ({ onEdit, onDelete }) => (
  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 py-2 z-20">
    <button
      onClick={onEdit}
      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
    >
      Editar
    </button>
    <div className="h-px bg-neutral-200 mx-2" />
    <button
      onClick={onDelete}
      className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
    >
      Eliminar
    </button>
  </div>
)

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-10 px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200 p-6">
          <h3 className="text-xl font-bold text-black mb-1">{title}</h3>
          <div className="h-1 w-16 bg-neutral-800 rounded mb-6" />
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Vencimientos() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  const [openModal, setOpenModal] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)

  // Cargar datos
  const cargarLotes = async () => {
    try {
      setLoading(true)
      const data = await listLotes()
      setLotes(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarLotes()
  }, [])

  // Filtrado
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return lotes.filter(
      (l) =>
        l.producto_nombre.toLowerCase().includes(q) ||
        (l.codigo_lote && l.codigo_lote.toLowerCase().includes(q))
    )
  }, [lotes, query])

  /* --- Lógica Agregar --- */
  const [prodQuery, setProdQuery] = useState('')
  const [prodResults, setProdResults] = useState([])
  const [selectedProd, setSelectedProd] = useState(null)
  const [form, setForm] = useState({ codigo_lote: '', cantidad: '', fecha_vencimiento: '' })

  useEffect(() => {
    if (prodQuery.length < 2) {
      setProdResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetchProducts(prodQuery)
        setProdResults(res.slice(0, 5))
      } catch (e) {
        console.error(e)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [prodQuery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProd) return Swal.fire({ icon: 'warning', title: 'Selecciona un producto' })
    if (!form.cantidad || !form.fecha_vencimiento)
      return Swal.fire({ icon: 'warning', title: 'Faltan datos' })

    try {
      await createLote({
        producto_id: selectedProd.id || selectedProd.id_producto,
        codigo_lote: form.codigo_lote,
        cantidad: Number(form.cantidad),
        fecha_vencimiento: form.fecha_vencimiento
      })
      Swal.fire({
        icon: 'success',
        title: 'Lote Registrado',
        timer: 1500,
        showConfirmButton: false
      })
      setOpenModal(false)
      setForm({ codigo_lote: '', cantidad: '', fecha_vencimiento: '' })
      setSelectedProd(null)
      setProdQuery('')
      cargarLotes()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }

  /* --- Lógica Editar --- */
  const [editForm, setEditForm] = useState({
    id: '',
    codigo_lote: '',
    cantidad_actual: '',
    fecha_vencimiento: ''
  })

  const onEditRow = (lote) => {
    setOpenMenuId(null)
    setEditForm({
      id: lote.id,
      codigo_lote: lote.codigo_lote || '',
      cantidad_actual: lote.cantidad_actual,
      fecha_vencimiento: toInputDate(lote.fecha_vencimiento)
    })
    setOpenEdit(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateLote(editForm.id, {
        codigo_lote: editForm.codigo_lote,
        cantidad_actual: Number(editForm.cantidad_actual),
        fecha_vencimiento: editForm.fecha_vencimiento
      })
      Swal.fire({
        icon: 'success',
        title: 'Lote Actualizado',
        timer: 1500,
        showConfirmButton: false
      })
      setOpenEdit(false)
      cargarLotes()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }

  const eliminar = async (lote) => {
    setOpenMenuId(null)
    const result = await Swal.fire({
      title: `¿Eliminar lote?`,
      text: `Esto restará ${lote.cantidad_actual} unidades del inventario de "${lote.producto_nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      await deleteLote(lote.id)
      cargarLotes()
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }

  return (
    <main className="flex-1 p-4">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-black">Control de Vencimientos</h1>
          <p className="text-sm text-neutral-500">Administra los lotes y fechas de caducidad.</p>
        </div>

        {/* Barra superior */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lote o producto..."
              className="outline-none text-sm bg-transparent w-full"
            />
            <span className="text-neutral-400">🔍</span>
          </div>
          <button
            onClick={() => setOpenModal(true)}
            className="bg-[#11A5A3] hover:bg-[#Da2864] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            + Registrar Lote (Entrada)
          </button>
        </div>

        <LotesProximosAVencer />
        {/* Tabla */}
        <div className="mt-6 bg-white rounded-xl ring-1 ring-neutral-200 overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Código Lote</th>
                <th className="px-4 py-3">Vence el</th>
                <th className="px-4 py-3 text-right">Cant. Actual</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-neutral-400">
                    Cargando lotes...
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((l) => {
                  const days = getDaysRemaining(l.fecha_vencimiento)
                  return (
                    <tr key={l.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-neutral-100 overflow-hidden shrink-0">
                            {l.imagen ? (
                              <img
                                src={`${API_BASE}/uploads/${l.imagen}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="grid place-items-center h-full text-[10px]">📷</span>
                            )}
                          </div>
                          {l.producto_nombre}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-500">
                        {l.codigo_lote || '—'}
                      </td>
                      <td className="px-4 py-3">{formatDate(l.fecha_vencimiento)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {l.cantidad_actual}{' '}
                        <span className="text-neutral-400 font-normal">/ {l.cantidad_inicial}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusPill days={days} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === l.id ? null : l.id)}
                            className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                          >
                            ⋮
                          </button>
                          {openMenuId === l.id && (
                            <Menu onEdit={() => onEditRow(l)} onDelete={() => eliminar(l)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-neutral-400">
                    No hay lotes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Registrar Entrada de Lote">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="text-sm font-medium">Buscar Producto</label>
            {selectedProd ? (
              <div className="flex items-center justify-between p-2 ring-1 ring-emerald-200 bg-emerald-50 rounded-xl">
                <span className="font-medium text-emerald-800">{selectedProd.nombre}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProd(null)
                    setProdQuery('')
                  }}
                  className="text-emerald-600 font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ) : (
              <Input
                value={prodQuery}
                onChange={(e) => setProdQuery(e.target.value)}
                placeholder="Escribe para buscar..."
              />
            )}
            {prodResults.length > 0 && !selectedProd && (
              <div className="absolute z-10 w-full mt-1 bg-white ring-1 ring-neutral-200 rounded-xl shadow-lg max-h-40 overflow-auto">
                {prodResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProd(p)
                      setProdResults([])
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-sm flex justify-between"
                  >
                    <span>{p.nombre}</span>
                    <span className="text-neutral-400 text-xs">Stock: {p.existencias}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                min="1"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cód. Lote</label>
              <Input
                value={form.codigo_lote}
                onChange={(e) => setForm({ ...form, codigo_lote: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Vencimiento</label>
            <Input
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
              required
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-semibold shadow-sm"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="flex-1 h-11 rounded-xl bg-neutral-100 text-neutral-600 font-semibold hover:bg-neutral-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar Lote">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Código Lote</label>
            <Input
              value={editForm.codigo_lote}
              onChange={(e) => setEditForm({ ...editForm, codigo_lote: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Cantidad Actual</label>
            <Input
              type="number"
              min="0"
              value={editForm.cantidad_actual}
              onChange={(e) => setEditForm({ ...editForm, cantidad_actual: e.target.value })}
              required
            />
            <p className="text-xs text-neutral-500">
              * Cambiar esto ajustará el inventario global del producto.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Vencimiento</label>
            <Input
              type="date"
              value={editForm.fecha_vencimiento}
              onChange={(e) => setEditForm({ ...editForm, fecha_vencimiento: e.target.value })}
              required
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-semibold shadow-sm"
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="flex-1 h-11 rounded-xl bg-neutral-100 text-neutral-600 font-semibold hover:bg-neutral-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </main>
  )
}
