// src/Paginas/CreditoFiscal.jsx
import React, { useMemo, useState } from 'react'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'

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

/* ---------- Modal genérico (detalles) ---------- */
function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-10 px-4 sm:px-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-bold">{title}</h3>
            <div className="mt-2 h-1 w-20 bg-neutral-900 rounded" />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-3 text-sm">
    <p className="text-neutral-500 col-span-1">{label}</p>
    <p className="col-span-2">{value}</p>
  </div>
)

/* =====================================================
   Página: Crédito Fiscal
   ===================================================== */
export default function CreditoFiscal() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const [openCrear, setOpenCrear] = useState(false)
  const [openDetalle, setOpenDetalle] = useState(false)
  const [detalle, setDetalle] = useState(null)

  const [items, setItems] = useState(() => [
    { id: '#23456', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
    { id: '#23457', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
    { id: '#23458', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
    { id: '#23459', cliente: 'Juan', fecha: '17/06/2025', direccion: 'Colonia SAN BENITO', total: 57 },
  ])

  const filtered = useMemo(
    () =>
      items.filter((r) =>
        [r.id, r.cliente, r.direccion].join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [items, query]
  )

  const makeId = () => `#CF${Math.floor(10000 + Math.random() * 90000)}`
  const handleCreate = (payload) => {
    // del modal: payload.resumen.ventaTotal, payload.cliente, payload.direccion
    const total = payload?.resumen?.ventaTotal ?? payload?.ventaTotal ?? 0
    const cliente = payload?.cliente ?? 'Cliente'
    const direccion = payload?.direccion ?? '—'
    const fecha = new Date().toLocaleDateString('es-SV')

    setItems((arr) => [{ id: makeId(), cliente, fecha, direccion, total: Number(total) || 0 }, ...arr])
  }

  const verDetalles = (row) => {
    setDetalle(row)
    setOpenDetalle(true)
  }

  const eliminar = (id) => setItems((arr) => arr.filter((x) => x.id !== id))

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Credito Fiscal</h1>
          <p className="text-sm text-neutral-500">Creditos Fiscales</p>
        </div>

        {/* Search + Add */}
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
          {/* El texto del botón en tu maqueta dice “Agregar factura”. Lo respetamos. */}
          <button
            onClick={() => setOpenCrear(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Agregar factura
          </button>
        </div>

        {/* Tabla */}
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
                  <td className="px-4 py-3">
                    <PillMoney value={r.total} />
                  </td>
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
                          onView={() => {
                            verDetalles(r)
                            setOpenMenu(null)
                          }}
                          onDelete={() => {
                            eliminar(r.id)
                            setOpenMenu(null)
                          }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
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

      {/* Modal: Crear Crédito Fiscal */}
      <CreateCreditoFiscalModal
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreate={(payload) => {
          handleCreate(payload)
          setOpenCrear(false)
        }}
      />

      {/* Modal: Ver Detalles */}
      <Modal
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        title={detalle ? `Crédito Fiscal ${detalle.id}` : 'Crédito Fiscal'}
      >
        {detalle && (
          <div className="space-y-4">
            <Row label="Cliente" value={detalle.cliente} />
            <Row label="Fecha" value={detalle.fecha} />
            <Row label="Dirección" value={detalle.direccion} />
            <Row label="Total" value={`$${Number(detalle.total).toFixed(2)}`} />
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600"
                onClick={() => window.print()}
              >
                Imprimir
              </button>
              <button
                className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500"
                onClick={() => setOpenDetalle(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  )
}
