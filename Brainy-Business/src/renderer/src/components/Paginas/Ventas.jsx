import React, { useState, useEffect, useMemo } from 'react'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import VerFacturaModal from '../Modales/VerFacturaModal.jsx'
import VerCreditoFiscalModal from '../Modales/VerCreditoFiscalModal.jsx'
import FacturaIcon from '../../../../../resources/Factura.png'
import CreditoIcon from '../../../../../resources/CreditoFiscal.png'
import Swal from 'sweetalert2'
import {
  listInvoices,
  listFiscalCredits,
  getInvoice,
  getFiscalCredit,
  deleteInvoice,
  deleteFiscalCredit
} from '../../api'

/* ---------- UI Helpers ---------- */

const PillMoney = ({ value }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
    ${Number(value || 0).toFixed(2)}
  </span>
)

// --- NUEVO COMPONENTE PILLPAGO ---
const PillPago = ({ value }) => {
  const tipo = (value || 'Efectivo').toLowerCase()

  let styles = 'bg-emerald-50 text-emerald-700 ring-emerald-200'
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
    return new Date(d).toLocaleDateString('es-SV', { timeZone: 'UTC' })
  } catch {
    return String(d)
  }
}

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
   Página: Ventas
   ===================================================== */
export default function Ventas() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [openFactura, setOpenFactura] = useState(false)
  const [openCredito, setOpenCredito] = useState(false)
  const [detalleFactura, setDetalleFactura] = useState(null)
  const [detalleCredito, setDetalleCredito] = useState(null)
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchVentas = async () => {
    try {
      setLoading(true)
      const [facturas, creditos] = await Promise.all([listInvoices(), listFiscalCredits()])

      const mappedFacturas = facturas.map((f) => ({
        api_id: f.id,
        id: f.numero || `F-${f.id}`,
        cliente: f.cliente,
        fecha: f.fecha_emision || f.fecha,
        tipo: 'Factura',
        monto: f.total || f.monto,
        tipo_de_pago: f.tipo_de_pago // <--- AGREGADO: Leemos el tipo de pago
      }))

      const mappedCreditos = creditos.map((c) => ({
        api_id: c.id,
        id: c.numero || `CF-${c.id}`,
        cliente: c.cliente,
        fecha: c.fecha_emision || c.fecha,
        tipo: 'Crédito Fiscal',
        monto: c.total || c.monto,
        tipo_de_pago: c.tipo_de_pago // <--- AGREGADO: Leemos el tipo de pago
      }))

      const allVentas = [...mappedFacturas, ...mappedCreditos]
      allVentas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      setVentas(allVentas)
    } catch (e) {
      console.error('Error cargando ventas:', e)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudieron cargar las ventas',
        confirmButtonColor: '#11A5A3'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVentas()
  }, [])

  const handleCreateFactura = async () => {
    await fetchVentas()
    setOpenFactura(false)
    Swal.fire({
      icon: 'success',
      title: 'Factura Creada',
      text: 'La factura se ha guardado correctamente.',
      timer: 2000,
      showConfirmButton: false
    })
  }

  // --- LÓGICA DE ESTADÍSTICAS DEL MES ACTUAL ---
  const monthStats = useMemo(() => {
    const now = new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth()

    // 1. Filtramos las ventas de este mes
    const thisMonthSales = ventas.filter((v) => {
      if (!v.fecha) return false
      const d = new Date(v.fecha)
      return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth
    })

    // 2. Inicializamos contadores
    let totalGeneral = 0
    let totalEfectivo = 0
    let totalTransferencia = 0
    let totalTarjeta = 0

    // 3. Recorremos y sumamos según el tipo de pago
    thisMonthSales.forEach((v) => {
      const monto = Number(v.monto || 0)
      const tipoPago = (v.tipo_de_pago || 'Efectivo').toLowerCase()

      totalGeneral += monto

      if (tipoPago.includes('tarjeta')) {
        totalTarjeta += monto
      } else if (tipoPago.includes('transferencia')) {
        totalTransferencia += monto
      } else {
        // Por defecto todo lo demás (o 'Efectivo') va a efectivo
        totalEfectivo += monto
      }
    })

    const monthName = now.toLocaleString('es-ES', { month: 'long' })
    const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return {
      count: thisMonthSales.length,
      total: totalGeneral,
      efectivo: totalEfectivo,
      transferencia: totalTransferencia,
      tarjeta: totalTarjeta,
      name: capitalized
    }
  }, [ventas])

  const filtered = useMemo(
    () =>
      ventas.filter((v) =>
        [v.id, v.cliente, v.tipo, v.tipo_de_pago]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [ventas, query]
  )

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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al cargar el detalle: ${e.message}`,
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  const onDelete = async (row) => {
    const { tipo, api_id, id: numero } = row

    const result = await Swal.fire({
      title: `¿Eliminar ${tipo} ${numero}?`,
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
      if (tipo === 'Factura') {
        await deleteInvoice(api_id)
      } else {
        await deleteFiscalCredit(api_id)
      }
      setVentas((arr) => arr.filter((x) => !(x.api_id === api_id && x.tipo === tipo)))

      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El registro ha sido eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: e.message || 'No se pudo eliminar el registro',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TARJETAS SUPERIORES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
            <p className="text-sm font-semibold text-black">Ventas del Mes</p>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Número de ventas</p>
                <p className="text-lg font-semibold text-black">{monthStats.count}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Mes</p>
                <p className="text-lg font-semibold text-black">{monthStats.name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Ventas Totales</p>
                <p className="text-lg font-semibold text-black">${monthStats.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
            <p className="text-sm font-semibold text-black">Cobrar</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                onClick={() => setOpenFactura(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#11A5A3] hover:bg-[#Da2864] text-white text-sm font-semibold"
              >
                <img src={FacturaIcon} className="w-5 h-5" alt="" />
                Factura
              </button>
              <button
                onClick={() => setOpenCredito(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#11A5A3] hover:bg-[#Da2864] text-white text-sm font-semibold"
              >
                <img src={CreditoIcon} className="w-5 h-5" alt="" />
                Crédito fiscal
              </button>
            </div>
          </div>
        </div>

        {/* --- TARJETAS DE TIPOS DE PAGO --- */}
        <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
          <p className="text-sm font-semibold text-black">Desglose por Tipo de Pago</p>
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <p className="text-[11px] uppercase text-neutral-500">Efectivo</p>
              <p className="text-lg font-semibold text-emerald-600">
                ${monthStats.efectivo.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-500">Transferencia</p>
              <p className="text-lg font-semibold text-blue-600">
                ${monthStats.transferencia.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-500">Tarjeta de Crédito</p>
              <p className="text-lg font-semibold text-purple-600">
                ${monthStats.tarjeta.toFixed(2)}
              </p>
            </div>
            <div>
                <p className="text-[11px] uppercase text-neutral-500">Tarjeta de Crédito - Comisión</p>
                <p className="text-lg font-semibold text-purple-600">
                  ${(monthStats.tarjeta.toFixed(2) - (monthStats.tarjeta * .04).toFixed(2)).toFixed(2)}
                </p>
              </div>
          </div>
          
        </div>

        {/* TABLA DE VENTAS */}
        <div>
          <p className="text-sm font-semibold text-black">Todas las ventas (Historial)</p>
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
                  <th className="px-4 py-3 text-left">Pago</th> {/* <--- NUEVA COLUMNA */}
                  <th className="px-4 py-3 text-left">Venta dólares</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center text-neutral-400">
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

                      {/* NUEVA CELDA CON EL COMPONENTE */}
                      <td className="px-4 py-3">
                        <PillPago value={v.tipo_de_pago} />
                      </td>

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
                                onDelete(v)
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
                    <td colSpan="7" className="px-4 py-6 text-center text-neutral-400">
                      No se encontraron ventas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FACTURA: Usamos onCreate para lanzar la alerta */}
      <CreateInvoiceModal
        open={openFactura}
        onClose={() => setOpenFactura(false)}
        onCreate={handleCreateFactura}
      />

      {/* MODAL CRÉDITO: El modal ya tiene la alerta interna, solo recargamos */}
      <CreateCreditoFiscalModal
        open={openCredito}
        onClose={() => {
          setOpenCredito(false)
          fetchVentas()
        }}
      />

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
