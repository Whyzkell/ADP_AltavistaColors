// src/renderer/src/components/Paginas/Facturas.jsx
import React, { useEffect, useMemo, useState } from 'react'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import VerFacturaModal from '../Modales/VerFacturaModal.jsx'
import { listInvoices, getInvoice, deleteInvoice } from '../../api'
import Swal from 'sweetalert2'

/* ---------- UI helpers ---------- */
const PillMoney = ({ value }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
    ${Number(value || 0).toFixed(2)}
  </span>
)

// --- NUEVO COMPONENTE PARA EL TIPO DE PAGO ---
const PillPago = ({ value }) => {
  const tipo = (value || 'Efectivo').toLowerCase()

  let styles = 'bg-emerald-50 text-emerald-700 ring-emerald-200' // Efectivo (Default)
  let label = value || 'Efectivo'

  if (tipo.includes('tarjeta')) {
    styles = 'bg-purple-50 text-purple-700 ring-purple-200'
    label = 'Tarjeta'
  } else if (tipo.includes('transferencia')) {
    styles = 'bg-blue-50 text-blue-700 ring-blue-200'
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ring-1 ${styles}`}>{label}</span>
  )
}

function fmtFecha(d) {
  if (!d) return '—'
  try {
    // Usamos UTC para evitar problemas de zona horaria si la BD lo guarda así
    return new Date(d).toLocaleDateString('es-SV', { timeZone: 'UTC' })
  } catch {
    return String(d)
  }
}

function mapRow(r) {
  return {
    id: r.id,
    numero: r.numero ?? `#${String(r.id).padStart(5, '0')}`,
    cliente: r.cliente,
    fecha: fmtFecha(r.fecha_emision || r.fecha),
    direccion: r.direccion || '—',
    total: Number(r.total || 0),
    tipo_de_pago: r.tipo_de_pago // <--- AGREGAMOS EL CAMPO AL MAPEO
  }
}

const Menu = ({ onView, onDelete }) => (
  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 py-2 z-20">
    <button
      onClick={onView}
      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
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
)

/* =====================================================
   Página: Facturas
   ===================================================== */
export default function Facturas() {
  const [query, setQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [openCrear, setOpenCrear] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Cargar listado desde backend
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const rows = await listInvoices()
        setItems(rows.map(mapRow))
      } catch (e) {
        console.error(e)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: e.message || 'Error cargando facturas',
          confirmButtonColor: '#11A5A3'
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) =>
      [r.numero, r.cliente, r.direccion, r.tipo_de_pago].join(' ').toLowerCase().includes(q)
    )
  }, [items, query])

  const handleCreate = async (saved) => {
    try {
      const full = await getInvoice(saved.id)
      const row = mapRow(full)
      setItems((arr) => [row, ...arr])

      Swal.fire({
        icon: 'success',
        title: 'Factura creada',
        text: `La factura ${row.numero} se ha guardado correctamente.`,
        timer: 2000,
        showConfirmButton: false
      })
    } catch (e) {
      // Fallback si falla el getInvoice
      setItems((arr) => [
        mapRow({
          id: saved.id,
          numero: saved.numero,
          cliente: '—',
          total: saved.total,
          tipo_de_pago: saved.tipo_de_pago
        }),
        ...arr
      ])
    }
  }

  const verDetalles = async (row) => {
    setOpenMenuId(null)
    try {
      const full = await getInvoice(row.id)
      setDetalle({
        ...full,
        numero: full.numero ?? `#${String(full.id).padStart(5, '0')}`,
        fecha: fmtFecha(full.fecha_emision || full.fecha),
        items: full.items || []
      })
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo cargar la factura',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  const eliminar = async (row) => {
    setOpenMenuId(null)

    const result = await Swal.fire({
      title: `¿Eliminar factura ${row.numero}?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      cancelButtonColor: '#11A5A3',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      await deleteInvoice(row.id)
      setItems((arr) => arr.filter((x) => x.id !== row.id))

      Swal.fire({
        icon: 'success',
        title: 'Eliminada',
        text: 'La factura ha sido eliminada correctamente.',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo eliminar la factura',
        confirmButtonColor: '#11A5A3'
      })
    }
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
            className="bg-[#11A5A3] hover:bg-[#Da2864] text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Agregar factura
          </button>
        </div>

        <div className="mt-4 bg-white rounded-xl ring-1 ring-neutral-200 mb-8 overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                {/* Nueva Columna */}
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Venta dólares</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-neutral-400">
                    Cargando…
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((r) => (
                  <tr key={r.id} className="relative group hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-mono text-neutral-600">{r.numero}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{r.cliente}</td>
                    <td className="px-4 py-3">{r.fecha}</td>

                    {/* Nueva Celda con el Pill */}
                    <td className="px-4 py-3">
                      <PillPago value={r.tipo_de_pago} />
                    </td>

                    <td
                      className="px-4 py-3 text-neutral-500 max-w-xs truncate"
                      title={r.direccion}
                    >
                      {r.direccion}
                    </td>
                    <td className="px-4 py-3">
                      <PillMoney value={r.total} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                          className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                        >
                          ⋮
                        </button>

                        {openMenuId === r.id && (
                          <Menu onView={() => verDetalles(r)} onDelete={() => eliminar(r)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-neutral-400">
                    No se encontraron facturas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateInvoiceModal
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreate={async (saved) => {
          await handleCreate(saved)
          setOpenCrear(false)
        }}
      />

      <VerFacturaModal open={!!detalle} onClose={() => setDetalle(null)} data={detalle} />
    </main>
  )
}
