import React, { useState, useEffect, useMemo } from 'react'
import ControlPanel from '../dashboard/ControlPanel.jsx'
import InventoryPreview from '../dashboard/InvetoryPreview.jsx'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import { fetchProducts, listInvoices, listFiscalCredits } from '../../api'
import TopProducts from './TopProducts.jsx'
import ProductosProxAgotar from './ProductosProxAgotar.jsx'
import Swal from 'sweetalert2'

export default function Dashboard() {
  const [openCrearFactura, setOpenCrearFactura] = useState(false)
  const [openCrearCredito, setOpenCrearCredito] = useState(false)

  // Estados para los datos
  const [inventory, setInventory] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [products, invoices, credits] = await Promise.all([
        fetchProducts(),
        listInvoices(),
        listFiscalCredits()
      ])

      setInventory(products || [])

      const mappedInvoices = (invoices || []).map((f) => ({
        ...f,
        tipo: 'Factura',
        fecha: f.fecha_emision || f.fecha,
        monto: f.total || f.monto,
        tipo_de_pago: f.tipo_de_pago // <--- AGREGADO
      }))

      const mappedCredits = (credits || []).map((c) => ({
        ...c,
        tipo: 'Crédito Fiscal',
        fecha: c.fecha_emision || c.fecha,
        monto: c.total || c.monto,
        tipo_de_pago: c.tipo_de_pago // <--- AGREGADO
      }))

      const allSales = [...mappedInvoices, ...mappedCredits]
      setSales(allSales)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el dashboard. Revisa la conexión con la API.',
        confirmButtonColor: '#11A5A3'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateFactura = async () => {
    await fetchData()
    setOpenCrearFactura(false)
    Swal.fire({
      icon: 'success',
      title: 'Factura Creada',
      text: 'La factura se ha registrado correctamente.',
      timer: 2000,
      showConfirmButton: false
    })
  }

  // --- LÓGICA DE FILTRADO Y CÁLCULO ---
  const dashboardStats = useMemo(() => {
    const now = new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth()

    const salesThisMonth = sales.filter((venta) => {
      if (!venta.fecha) return false
      const ventaDate = new Date(venta.fecha)
      return ventaDate.getUTCFullYear() === currentYear && ventaDate.getUTCMonth() === currentMonth
    })

    // Inicializamos contadores
    let totalAmount = 0
    let totalEfectivo = 0
    let totalTransferencia = 0
    let totalTarjeta = 0

    // Sumar montos
    salesThisMonth.forEach((venta) => {
      const monto = Number(venta.monto || 0)
      const tipoPago = (venta.tipo_de_pago || 'Efectivo').toLowerCase()

      totalAmount += monto

      if (tipoPago.includes('tarjeta')) {
        totalTarjeta += monto
      } else if (tipoPago.includes('transferencia')) {
        totalTransferencia += monto
      } else {
        totalEfectivo += monto
      }
    })

    const monthName = now.toLocaleString('es-ES', { month: 'long' })
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return {
      salesCount: salesThisMonth.length,
      salesTotal: totalAmount,
      efectivo: totalEfectivo,
      transferencia: totalTransferencia,
      tarjeta: totalTarjeta,
      currentMonthName: capitalizedMonth
    }
  }, [sales])

  return (
    <main className="flex-1 min-w-0">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div>
          <h1 className="text-xl text-black font-semibold">Panel de control</h1>
          <p className="text-sm text-neutral-500 max-w-xl">
            Este apartado es para visualizar todo con una vista previa
          </p>
        </div>

        <div className="mt-4 space-y-6">
          <ControlPanel
            salesCount={dashboardStats.salesCount}
            salesTotal={dashboardStats.salesTotal}
            currentMonthName={dashboardStats.currentMonthName}
            onCobrar={() => setOpenCrearFactura(true)}
            onCredito={() => setOpenCrearCredito(true)}
          />

          {/* --- NUEVA TARJETA DE TIPOS DE PAGO --- */}
          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
            <p className="text-sm font-semibold text-black">Desglose por Tipo de Pago</p>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Efectivo</p>
                <p className="text-lg font-semibold text-emerald-600">
                  ${dashboardStats.efectivo.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Transferencia</p>
                <p className="text-lg font-semibold text-blue-600">
                  ${dashboardStats.transferencia.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Tarjeta de Crédito</p>
                <p className="text-lg font-semibold text-purple-600">
                  ${dashboardStats.tarjeta.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-neutral-500">Tarjeta de Crédito - Comisión</p>
                <p className="text-lg font-semibold text-purple-600">
                  ${(dashboardStats.tarjeta.toFixed(2) - (dashboardStats.tarjeta * .04).toFixed(2)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ProductosProxAgotar />
        <TopProducts />
        <InventoryPreview items={inventory} />
      </div>

      <CreateInvoiceModal
        open={openCrearFactura}
        onClose={() => setOpenCrearFactura(false)}
        onCreate={handleCreateFactura}
      />

      <CreateCreditoFiscalModal
        open={openCrearCredito}
        onClose={() => {
          setOpenCrearCredito(false)
          fetchData()
        }}
      />
    </main>
  )
}
