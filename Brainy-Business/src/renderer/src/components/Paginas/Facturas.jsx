import React, { useMemo, useState } from 'react'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import VerFacturaModal from '../Modales/VerFacturaModal.jsx'

/* ---------- UI helpers ---------- */
const PillMoney = ({ value }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
    ${Number(value || 0).toFixed(2)}
  </span>
)

const Menu = ({ onView, onDelete }) => (
  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 py-2 z-20">
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
)

/* =====================================================
   Página: Facturas
   ===================================================== */
export default function Facturas() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const [openCrear, setOpenCrear] = useState(false)
  const [detalle, setDetalle] = useState(null) // <- fila seleccionada para ver

  const [items, setItems] = useState(() => [
    { id: '#23456', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
    { id: '#23457', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
    { id: '#23458', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
    { id: '#23459', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
  ])

  const filtered = useMemo(
    () => items.filter((r) =>
      [r.id, r.cliente, r.direccion].join(' ').toLowerCase().includes(query.toLowerCase())
    ),
    [items, query]
  )

  const makeId = () => `#F${Math.floor(10000 + Math.random() * 90000)}`
  const handleCreate = (payload) => {
    const total = payload?.resumen?.ventaTotal ?? payload?.total ?? 0
    const cliente = payload?.cliente ?? payload?.clienteFactura ?? 'Cliente'
    const direccion = payload?.direccion ?? '—'
    const fecha = new Date().toLocaleDateString('es-SV')

    // guardamos el payload para que VerFacturaModal muestre todos los campos
    setItems((arr) => [
      { id: makeId(), cliente, fecha, direccion, total: Number(total) || 0, payload },
      ...arr
    ])
  }

  const verDetalles = (row) => setDetalle(row)
  const eliminar = (id) => setItems((arr) => arr.filter((x) => x.id !== id))

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold">Facturas</h1>
          <p className="text-sm text-neutral-500">Facturas</p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="outline-none text-sm bg-transparent w-full"
            />
            <button className="grid place-items-center h-7 w-7 rounded-full hover:bg-neutral-100">🔍</button>
          </div>
          <button
            onClick={() => setOpenCrear(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Agregar factura
          </button>
        </div>

        <div className="mt-4 bg-white rounded-xl ring-1 ring-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Venta dolares</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((r, idx) => (
                <tr key={r.id} className="relative">
                  <td className="px-4 py-3 font-mono text-neutral-600">{r.id}</td>
                  <td className="px-4 py-3">{r.cliente}</td>
                  <td className="px-4 py-3">{r.fecha}</td>
                  <td className="px-4 py-3">{r.direccion}</td>
                  <td className="px-4 py-3"><PillMoney value={r.total} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenu(openMenu === idx ? null : idx)}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                        aria-label="acciones"
                      >
                        ⋮
                      </button>
                      {openMenu === idx && (
                        <Menu
                          onView={() => { verDetalles(r); setOpenMenu(null) }}
                          onDelete={() => { eliminar(r.id); setOpenMenu(null) }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-neutral-400">No se encontraron facturas</td>
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
        onCreate={(payload) => { handleCreate(payload); setOpenCrear(false) }}
      />

      {/* Ver detalles (completo) */}
      <VerFacturaModal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        data={detalle}
      />
    </main>
  )
}
