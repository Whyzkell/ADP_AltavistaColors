// src/renderer/src/components/Paginas/CreditoFiscal.jsx
import React, { useEffect, useMemo, useState } from 'react'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import VerCreditoFiscalModal from '../Modales/VerCreditoFiscalModal.jsx'
import {
  listFiscalCredits,
  getFiscalCredit,
  deleteFiscalCredit
  // createFiscalCredit, <-- No se usa aquí directamente
  // fetchProducts <-- No se usa aquí
} from '../../api'
import Swal from 'sweetalert2' // <--- IMPORTAMOS SWAL

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

// --- MENÚ INLINE (Igual que en Facturas e Inventario) ---
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

export default function CreditoFiscal() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [openCrear, setOpenCrear] = useState(false)
  const [detalle, setDetalle] = useState(null)

  // Estado simple para controlar qué menú está abierto
  const [openMenuId, setOpenMenuId] = useState(null)

  // 1. LÓGICA DE FETCH
  const fetchLista = async () => {
    try {
      setLoading(true)
      const rows = await listFiscalCredits()
      setItems(rows.map(mapRow))
    } catch (e) {
      console.error(e)
      // Alerta de error con Swal
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'Error cargando créditos fiscales',
        confirmButtonColor: '#11A5A3'
      })
    } finally {
      setLoading(false)
    }
  }

  // 2. USEEFFECT
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

  const verDetalles = async (row) => {
    setOpenMenuId(null) // Cerramos menú

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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo cargar el crédito fiscal',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  const eliminar = async (row) => {
    setOpenMenuId(null) // Cerramos menú

    // a. Confirmación con Swal
    const result = await Swal.fire({
      title: `¿Eliminar crédito ${row.numero}?`,
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
      // b. Eliminar
      await deleteFiscalCredit(row.id)
      setItems((arr) => arr.filter((x) => x.id !== row.id))

      // c. Mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El crédito fiscal ha sido eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo eliminar el crédito',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-black">Crédito Fiscal</h1>
          <p className="text-sm text-neutral-500">Créditos Fiscales emitidos</p>
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
            Agregar crédito
          </button>
        </div>

        <div className="mt-4 bg-white rounded-xl ring-1 ring-neutral-200 mb-8 overflow-visible">
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
                  <tr key={r.id} className="relative group hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-mono text-neutral-600">{r.numero}</td>
                    <td className="px-4 py-3">{r.cliente}</td>
                    <td className="px-4 py-3">{r.fecha}</td>
                    <td className="px-4 py-3">{r.direccion}</td>
                    <td className="px-4 py-3">
                      <PillMoney value={r.total} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Menú Inline Corregido */}
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
        onClose={() => {
          setOpenCrear(false)
          fetchLista() // Refresca lista al cerrar (si se creó algo)
        }}
      />

      {/* Ver detalles */}
      <VerCreditoFiscalModal open={!!detalle} onClose={() => setDetalle(null)} data={detalle} />
    </main>
  )
}
