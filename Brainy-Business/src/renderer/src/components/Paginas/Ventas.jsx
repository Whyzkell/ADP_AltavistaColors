import React, { useState } from 'react'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import VerFacturaModal from '../Modales/VerFacturaModal.jsx'
import VerCreditoFiscalModal from '../Modales/VerCreditoFiscalModal.jsx'

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
    <button onClick={onDelete} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
      Eliminar
    </button>
  </div>
)

export default function Ventas() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const [openFactura, setOpenFactura] = useState(false)
  const [openCredito, setOpenCredito] = useState(false)

  // detalle
  const [detalleFactura, setDetalleFactura] = useState(null)
  const [detalleCredito, setDetalleCredito] = useState(null)

  const [ventas, setVentas] = useState([
    { id: '#23456', cliente: 'Juan', fecha: '17/06/2025', tipo: 'Crédito Fiscal', monto: 57 },
    { id: '#23457', cliente: 'Juan', fecha: '17/06/2025', tipo: 'Factura', monto: 57 },
    { id: '#23458', cliente: 'Juan', fecha: '17/06/2025', tipo: 'Factura', monto: 57 },
    { id: '#23459', cliente: 'Juan', fecha: '17/06/2025', tipo: 'Crédito Fiscal', monto: 57 }
  ])

  const makeId = () => `#V${Math.floor(10000 + Math.random() * 90000)}`

  const handleCreateFactura = (payload) => {
    const total = payload?.resumen?.ventaTotal ?? payload?.total ?? 0
    const cliente = payload?.cliente ?? payload?.clienteFactura ?? 'Cliente'
    const fecha = new Date().toLocaleDateString('es-SV')
    setVentas((arr) => [
      { id: makeId(), cliente, fecha, tipo: 'Factura', monto: Number(total) || 0, payload },
      ...arr
    ])
  }

  const handleCreateCredito = (payload) => {
    const total = payload?.resumen?.ventaTotal ?? payload?.ventaTotal ?? 0
    const cliente = payload?.cliente ?? 'Cliente'
    const fecha = new Date().toLocaleDateString('es-SV')
    setVentas((arr) => [
      { id: makeId(), cliente, fecha, tipo: 'Crédito Fiscal', monto: Number(total) || 0, payload },
      ...arr
    ])
  }

  const filtered = ventas.filter((v) =>
    [v.id, v.cliente, v.tipo].join(' ').toLowerCase().includes(query.toLowerCase())
  )

  const onView = (row) => {
    if (row.tipo === 'Factura') {
      setDetalleFactura(row)
    } else {
      setDetalleCredito(row)
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Panel superior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
            <p className="text-sm font-semibold">Ventas</p>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Número de ventas</p>
                <p className="text-lg font-semibold">400</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Mes</p>
                <p className="text-lg font-semibold">Septiembre</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Ventas</p>
                <p className="text-lg font-semibold">$5698</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
            <p className="text-sm font-semibold">Cobrar</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                onClick={() => setOpenFactura(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
              >
                <span className="inline-flex h-5 w-5 rounded-sm bg-white/30" />
                Factura
              </button>
              <button
                onClick={() => setOpenCredito(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
              >
                <span className="inline-flex h-5 w-5 rounded-sm bg-white/30" />
                Crédito fiscal
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div>
          <p className="text-sm font-semibold">Todas las ventas</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-neutral-500">Ventas</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-9 rounded-full ring-1 ring-neutral-300 bg-white">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar"
                  className="outline-none text-sm bg-transparent w-44"
                />
                <button className="grid place-items-center h-7 w-7 rounded-full hover:bg-neutral-100">
                  🔍
                </button>
              </div>
            </div>
          </div>

        <div className="mt-4 bg-white rounded-xl ring-1 ring-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Venta dólares</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((v, idx) => (
                <tr key={v.id} className="relative">
                  <td className="px-4 py-3 font-mono text-neutral-600">{v.id}</td>
                  <td className="px-4 py-3">{v.cliente}</td>
                  <td className="px-4 py-3">{v.fecha}</td>
                  <td className="px-4 py-3">{v.tipo}</td>
                  <td className="px-4 py-3"><PillMoney value={v.monto} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenu(openMenu === idx ? null : idx)}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                      >
                        ⋮
                      </button>
                      {openMenu === idx && (
                        <Menu
                          onView={() => {
                            onView(v)
                            setOpenMenu(null)
                          }}
                          onDelete={() => {
                            setVentas((arr) => arr.filter((x) => x.id !== v.id))
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
                    No se encontraron ventas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Modales de creación */}
      <CreateInvoiceModal
        open={openFactura}
        onClose={() => setOpenFactura(false)}
        onCreate={(payload) => {
          handleCreateFactura(payload)
          setOpenFactura(false)
        }}
      />
      <CreateCreditoFiscalModal
        open={openCredito}
        onClose={() => setOpenCredito(false)}
        onCreate={(payload) => {
          handleCreateCredito(payload)
          setOpenCredito(false)
        }}
      />

      {/* Modales de detalle */}
      <VerFacturaModal
        open={!!detalleFactura}
        onClose={() => setDetalleFactura(null)}
        data={detalleFactura}
      />
      <VerCreditoFiscalModal
        open={!!detalleCredito}
        onClose={() => setDetalleCredito(null)}
        data={detalleCredito}
      />
    </main>
  )
}
