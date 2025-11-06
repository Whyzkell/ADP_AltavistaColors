import React, { useState, useEffect, useMemo } from 'react'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import VerFacturaModal from '../Modales/VerFacturaModal.jsx'
import VerCreditoFiscalModal from '../Modales/VerCreditoFiscalModal.jsx'
import FacturaIcon from '../../../../../resources/Factura.png'
import CreditoIcon from '../../../../../resources/CreditoFiscal.png'
import {
  listInvoices,
  listFiscalCredits,
  getInvoice,
  getFiscalCredit,
  deleteInvoice,
  deleteFiscalCredit
} from '../../api' // <-- Importamos todas las funciones de la API

// Helper para formatear dinero
const PillMoney = ({ value }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
    ${Number(value || 0).toFixed(2)}
  </span>
)

// Helper para formatear fechas
function fmtFecha(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-SV', { timeZone: 'UTC' })
  } catch {
    return String(d)
  }
}

// Menú de acciones
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

export default function Ventas() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  const [openFactura, setOpenFactura] = useState(false)
  const [openCredito, setOpenCredito] = useState(false)

  // detalle
  const [detalleFactura, setDetalleFactura] = useState(null)
  const [detalleCredito, setDetalleCredito] = useState(null)

  // Estado para la lista de ventas y carga
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)

  // Función para cargar AMBOS tipos de ventas
  const fetchVentas = async () => {
    try {
      setLoading(true)
      // 1. Pedimos facturas y créditos en paralelo
      const [facturas, creditos] = await Promise.all([listInvoices(), listFiscalCredits()])

      // 2. Normalizamos los datos para la tabla
      const mappedFacturas = facturas.map((f) => ({
        api_id: f.id, // ID real de la DB
        id: f.numero || `F-${f.id}`, // ID para mostrar
        cliente: f.cliente,
        fecha: f.fecha_emision,
        tipo: 'Factura',
        monto: f.total
      }))

      const mappedCreditos = creditos.map((c) => ({
        api_id: c.id, // ID real de la DB
        id: c.numero || `CF-${c.id}`, // ID para mostrar
        cliente: c.cliente,
        fecha: c.fecha_emision,
        tipo: 'Crédito Fiscal',
        monto: c.total
      }))

      // 3. Unimos y ordenamos por fecha, más nuevas primero
      const allVentas = [...mappedFacturas, ...mappedCreditos]
      allVentas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      setVentas(allVentas)
    } catch (e) {
      console.error('Error cargando ventas:', e)
      alert(e.message || 'No se pudieron cargar las ventas')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchVentas()
  }, [])

  // Filtrado local de la lista
  const filtered = useMemo(
    () =>
      ventas.filter((v) =>
        [v.id, v.cliente, v.tipo].join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [ventas, query]
  )

  // Ver detalles (ahora llama a la API por el ID real)
  const onView = async (row) => {
    try {
      if (row.tipo === 'Factura') {
        const fullFactura = await getInvoice(row.api_id)
        setDetalleFactura(fullFactura)
      } else {
        const fullCredito = await getFiscalCredit(row.api_id)
        setDetalleCredito(fullCredito)
      }
    } catch (e) {
      alert(`Error al cargar el detalle: ${e.message}`)
    }
  }

  // Eliminar (ahora llama a la API)
  const onDelete = async (row) => {
    const { tipo, api_id, id: numero } = row
    if (!confirm(`¿Estás seguro de eliminar ${tipo} ${numero}?`)) return

    try {
      if (tipo === 'Factura') {
        await deleteInvoice(api_id)
      } else {
        await deleteFiscalCredit(api_id)
      }
      // Si se borra con éxito, lo quitamos del estado local
      setVentas((arr) => arr.filter((x) => !(x.api_id === api_id && x.tipo === tipo)))
    } catch (e) {
      alert(`Error al eliminar: ${e.message}`)
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Panel superior (dejamos las estadísticas estáticas por ahora) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
            <p className="text-sm font-semibold text-black">Ventas</p>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Número de ventas</p>
                <p className="text-lg font-semibold text-black">{ventas.length}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Mes</p>
                <p className="text-lg font-semibold text-black">Noviembre</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Ventas</p>
                <p className="text-lg font-semibold text-black">
                  {/*
                    LÍNEA CORREGIDA:
                    Se añadió 'Number(v.monto || 0)' para forzar la suma numérica.
                  */}
                  ${ventas.reduce((acc, v) => acc + Number(v.monto || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
            <p className="text-sm font-semibold text-black">Cobrar</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                onClick={() => setOpenFactura(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
              >
                <img src="resources/Factura.png" className="w-5 h-5" />
                Factura
              </button>
              <button
                onClick={() => setOpenCredito(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
              >
                <img src="resources/CreditoFiscal.png" className="w-5 h-5" />
                Crédito fiscal
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div>
          <p className="text-sm font-semibold text-black">Todas las ventas</p>
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
                {loading && (
                  <tr>
                    <td colSpan="6" className="px-4 py-6 text-center text-neutral-400">
                      Cargando ventas...
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((v, idx) => (
                    <tr key={`${v.tipo}-${v.api_id}`}>
                      <td className="px-4 py-3 font-mono text-neutral-600">{v.id}</td>
                      <td className="px-4 py-3">{v.cliente}</td>
                      <td className="px-4 py-3">{fmtFecha(v.fecha)}</td>
                      <td className="px-4 py-3">{v.tipo}</td>
                      <td className="px-4 py-3">
                        <PillMoney value={v.monto} />
                      </td>
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
                                onDelete(v) // <-- Llamamos la nueva función de borrado
                                setOpenMenu(null)
                              }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && filtered.length === 0 && (
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

      {/* Modales de creación - Ahora recargan la lista al cerrarse */}
      <CreateInvoiceModal
        open={openFactura}
        onClose={() => {
          setOpenFactura(false)
          fetchVentas() // Recarga la lista
        }}
        // 'onCreate' ya no se necesita
      />
      <CreateCreditoFiscalModal
        open={openCredito}
        onClose={() => {
          setOpenCredito(false)
          fetchVentas() // Recarga la lista
        }}
        // 'onCreate' ya no se necesita
      />

      {/* Modales de detalle (estos no cambian) */}
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
