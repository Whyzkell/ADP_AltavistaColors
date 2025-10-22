// src/renderer/src/components/Paginas/Facturas.jsx
import React, { useEffect, useMemo, useState } from 'react'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import VerFacturaModal from '../Modales/VerFacturaModal.jsx'
import { listInvoices, getInvoice, deleteInvoice } from '../../api'
import { createPortal } from 'react-dom'

/* ---------- UI helpers ---------- */
const PillMoney = ({ value }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
    ${Number(value || 0).toFixed(2)}
  </span>
)

function fmtFecha(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-SV')
  } catch {
    return String(d)
  }
}

function mapRow(r) {
  return {
    // id real (para peticiones) y un id mostrado (numero o id con padding)
    id: r.id,
    numero: r.numero ?? `#${String(r.id).padStart(5, '0')}`,
    cliente: r.cliente,
    fecha: fmtFecha(r.fecha_emision || r.fecha),
    direccion: r.direccion || '—',
    total: Number(r.total || 0)
  }
}

/* =====================================================
   Página: Facturas
   ===================================================== */
export default function Facturas() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const [openCrear, setOpenCrear] = useState(false)
  const [detalle, setDetalle] = useState(null)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const [menu, setMenu] = useState({ rect: null, row: null })

  // cierra el menú si hay scroll/resize
  useEffect(() => {
    const close = () => setMenu({ rect: null, row: null })
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [])

  // Cargar listado desde backend
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const rows = await listInvoices()
        setItems(rows.map(mapRow))
      } catch (e) {
        console.error(e)
        alert(e.message || 'Error cargando facturas')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) =>
      [r.numero, r.cliente, r.direccion].join(' ').toLowerCase().includes(q)
    )
  }, [items, query])

  // Después de crear una factura en el modal
  const handleCreate = async (saved) => {
    // CreateFacturaModal te retorna { id, numero, total }
    try {
      const full = await getInvoice(saved.id)
      const row = mapRow(full)
      setItems((arr) => [row, ...arr])
    } catch (e) {
      // Si por alguna razón falla el fetch del detalle,
      // al menos agrega una fila básica con lo que tenemos
      setItems((arr) => [
        mapRow({ id: saved.id, numero: saved.numero, cliente: '—', total: saved.total }),
        ...arr
      ])
    }
  }

  const verDetalles = async (row) => {
    try {
      const full = await getInvoice(row.id) // trae items y todos los campos
      // normaliza un poco para el modal
      setDetalle({
        ...full,
        numero: full.numero ?? `#${String(full.id).padStart(5, '0')}`,
        fecha: fmtFecha(full.fecha_emision || full.fecha),
        items: full.items || []
      })
    } catch (e) {
      console.error(e)
      alert(e.message || 'No se pudo cargar la factura')
    }
  }

  const eliminar = async (row) => {
    if (!confirm(`¿Eliminar la factura ${row.numero}?`)) return
    try {
      await deleteInvoice(row.id)
      setItems((arr) => arr.filter((x) => x.id !== row.id))
    } catch (e) {
      console.error(e)
      alert(e.message || 'No se pudo eliminar la factura')
    }
  }

  // componente helper (puede ir encima de Facturas)
  function FloatingMenu({ anchorRect, onView, onDelete, onClose }) {
    if (!anchorRect) return null
    if (typeof document === 'undefined') return null // por si acaso

    const WIDTH = 176
    const top = anchorRect.bottom + window.scrollY + 6
    let left = anchorRect.right + window.scrollX - WIDTH
    left = Math.max(8, Math.min(left, window.innerWidth - WIDTH - 8))

    return createPortal(
      <>
        {/* backdrop para cerrar al hacer click fuera */}
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className="fixed z-50 bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 py-2"
          style={{ top, left, width: WIDTH }}
        >
          <button
            onClick={onView}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
          >
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

  return (
    <main className="flex-1 p-6 ">
      <div className="max-w-7xl mx-auto mb-8">
        <div>
          <h1 className="text-xl font-semibold text-black">Facturas</h1>
          <p className="text-sm text-neutral-500">Facturas emitidas</p>
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
            Agregar factura
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
                filtered.map((r, idx) => (
                  <tr key={r.id} className="relative">
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
                          const rect = e.currentTarget?.getBoundingClientRect?.()
                          if (!rect) return
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
                    No se encontraron facturas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crear */}
      <CreateInvoiceModal
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreate={async (saved) => {
          await handleCreate(saved)
          setOpenCrear(false)
        }}
      />

      {/* Ver detalles */}
      <VerFacturaModal open={!!detalle} onClose={() => setDetalle(null)} data={detalle} />

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
