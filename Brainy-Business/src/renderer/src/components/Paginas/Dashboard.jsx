import React, { useState, useEffect, useMemo } from 'react'
import ControlPanel from '../dashboard/ControlPanel.jsx'
import InventoryPreview from '../dashboard/InvetoryPreview.jsx'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import { fetchProducts, listInvoices, listFiscalCredits } from '../../api'
import TopProducts from './TopProducts.jsx'
import Swal from 'sweetalert2' // <--- 1. IMPORTAMOS SWAL

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
        monto: f.total || f.monto
      }))

      const mappedCredits = (credits || []).map((c) => ({
        ...c,
        tipo: 'Crédito Fiscal',
        fecha: c.fecha_emision || c.fecha,
        monto: c.total || c.monto
      }))

      const allSales = [...mappedInvoices, ...mappedCredits]
      setSales(allSales)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Reemplazamos el alert nativo por uno bonito si falla la carga inicial
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

  // 2. FUNCIÓN PARA MANEJAR EL ÉXITO DE FACTURA
  const handleCreateFactura = async () => {
    await fetchData() // Recargamos los datos del dashboard
    setOpenCrearFactura(false) // Cerramos el modal

    // Mostramos la alerta bonita
    Swal.fire({
      icon: 'success',
      title: 'Factura Creada',
      text: 'La factura se ha registrado correctamente.',
      timer: 2000,
      showConfirmButton: false
    })
  }

  // --- LÓGICA DE FILTRADO ---
  const dashboardStats = useMemo(() => {
    const now = new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth() // 0 = Enero

    const salesThisMonth = sales.filter((venta) => {
      if (!venta.fecha) return false
      const ventaDate = new Date(venta.fecha)
      // Filtramos usando UTC
      return ventaDate.getUTCFullYear() === currentYear && ventaDate.getUTCMonth() === currentMonth
    })

    const totalAmount = salesThisMonth.reduce((acc, venta) => {
      const valorVenta = Number(venta.monto || 0)
      return acc + valorVenta
    }, 0)

    const monthName = now.toLocaleString('es-ES', { month: 'long' })
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return {
      salesCount: salesThisMonth.length,
      salesTotal: totalAmount,
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

        <div className="mt-4">
          <ControlPanel
            salesCount={dashboardStats.salesCount}
            salesTotal={dashboardStats.salesTotal}
            currentMonthName={dashboardStats.currentMonthName}
            onCobrar={() => setOpenCrearFactura(true)}
            onCredito={() => setOpenCrearCredito(true)}
          />
        </div>

        <TopProducts />
        <InventoryPreview items={inventory} />
      </div>

      {/* MODAL FACTURA: Usamos onCreate para lanzar la alerta */}
      <CreateInvoiceModal
        open={openCrearFactura}
        onClose={() => setOpenCrearFactura(false)}
        onCreate={handleCreateFactura}
      />

      {/* MODAL CRÉDITO: El modal ya tiene la alerta interna, solo recargamos */}
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
