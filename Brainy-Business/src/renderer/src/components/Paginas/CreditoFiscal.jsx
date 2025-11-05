// src/renderer/src/components/Paginas/CreditoFiscal.jsx
import React, { useEffect, useMemo, useState } from 'react'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import VerCreditoFiscalModal from '../Modales/VerCreditoFiscalModal.jsx'
import {
  listFiscalCredits,
  getFiscalCredit,
  deleteFiscalCredit,
  createFiscalCredit, // <-- Esta ya no se usa aquí, pero la dejamos
  fetchProducts
} from '../../api'
import { createPortal } from 'react-dom'

const PillMoney = ({ value }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
    ${Number(value || 0).toFixed(2)}
  </span>
)

function fmtFecha(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-SV', { timeZone: 'UTC' })
  } catch {
    return String(d)
  }
}
function mapRow(r) {
  return {
    id: r.id,
    numero: r.numero ?? `CF-${String(r.id).padStart(5, '0')}`,
    cliente: r.cliente,
    fecha: fmtFecha(r.fecha_emision || r.fecha),
    direccion: r.direccion || '—',
    total: Number(r.total || 0)
  }
}

// Menú flotante (igual que Facturas)
function FloatingMenu({ anchorRect, onView, onDelete, onClose }) {
  if (!anchorRect || typeof document === 'undefined') return null
  const WIDTH = 176
  const top = anchorRect.bottom + window.scrollY + 6
  let left = anchorRect.right + window.scrollX - WIDTH
  left = Math.max(8, Math.min(left, window.innerWidth - WIDTH - 8))
  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 py-2"
        style={{ top, left, width: WIDTH }}
      >
        <button onClick={onView} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50">
          Ver detalles
        </button>
        <div className="h-px bg-neutral-200 mx-2" />
        <button
          onClick={onDelete}
          className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
        >
          Eliminar
        </button>
      </div>
    </>,
    document.body
  )
}

export default function CreditoFiscal() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [openCrear, setOpenCrear] = useState(false)
  const [detalle, setDetalle] = useState(null)

  // menú flotante
  const [menu, setMenu] = useState({ rect: null, row: null })
  useEffect(() => {
    const close = () => setMenu({ rect: null, row: null })
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [])

  // 1. LÓGICA DE FETCH MOVIDA A SU PROPIA FUNCIÓN
  const fetchLista = async () => {
    try {
      setLoading(true)
      const rows = await listFiscalCredits()
      setItems(rows.map(mapRow))
    } catch (e) {
      console.error(e)
      alert(e.message || 'Error cargando créditos')
    } finally {
      setLoading(false)
    }
  }

  // 2. USEEFFECT AHORA LLAMA A LA NUEVA FUNCIÓN
  useEffect(() => {
    fetchLista()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) =>
      [r.numero, r.cliente, r.direccion].join(' ').toLowerCase().includes(q)
    )
  }, [items, query])

  // 3. LA FUNCIÓN 'handleCreate' YA NO ES NECESARIA Y SE ELIMINA
  // const handleCreate = async (payload) => { ... }

  const verDetalles = async (row) => {
    try {
      const full = await getFiscalCredit(row.id)
      setDetalle({
        ...full,
        numero: full.numero ?? `CF-${String(full.id).padStart(5, '0')}`,
        fecha: fmtFecha(full.fecha_emision || full.fecha),
        items: full.items || []
      })
    } catch (e) {
      console.error(e)
      alert(e.message || 'No se pudo cargar el crédito fiscal')
    }
  }

  const eliminar = async (row) => {
    if (!confirm(`¿Eliminar el crédito ${row.numero}?`)) return
    try {
      await deleteFiscalCredit(row.id)
      setItems((arr) => arr.filter((x) => x.id !== row.id))
    } catch (e) {
      console.error(e)
      alert(e.message || 'No se pudo eliminar')
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-black">Crédito Fiscal</h1>
          <p className="text-sm text-neutral-500">Créditos Fiscales</p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="outline-none text-sm bg-transparent w-full"
            />
            <button className="grid place-items-center h-7 w-7 rounded-full hover:bg-neutral-100">
              🔍
            </button>
          </div>
          <button
            onClick={() => setOpenCrear(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Agregar crédito
          </button>
        </div>

        <div className="mt-4 bg-white rounded-xl ring-1 ring-neutral-200 mb-8 overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Venta dólares</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-neutral-400">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono text-neutral-600">{r.numero}</td>
                    <td className="px-4 py-3">{r.cliente}</td>
                    <td className="px-4 py-3">{r.fecha}</td>
                    <td className="px-4 py-3">{r.direccion}</td>
                    <td className="px-4 py-3">
                      <PillMoney value={r.total} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenu((m) =>
                            m.row?.id === r.id ? { rect: null, row: null } : { rect, row: r }
                          )
                        }}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                        aria-label="acciones"
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-neutral-400">
                    No se encontraron créditos fiscales
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crear */}
      <CreateCreditoFiscalModal
        open={openCrear}
        // 4. ONCLOSE AHORA HACE DOS COSAS:
        onClose={() => {
          setOpenCrear(false) // a) Cierra el modal
          fetchLista() // b) Refresca la lista de créditos
        }}
        // 5. 'onCreate' YA NO SE NECESITA
      />

      {/* Ver detalles */}
      <VerCreditoFiscalModal open={!!detalle} onClose={() => setDetalle(null)} data={detalle} />

      <FloatingMenu
        anchorRect={menu.rect}
        onView={() => {
          verDetalles(menu.row)
          setMenu({ rect: null, row: null })
        }}
        onDelete={() => {
          eliminar(menu.row)
          setMenu({ rect: null, row: null })
        }}
        onClose={() => setMenu({ rect: null, row: null })}
      />
    </main>
  )
}
