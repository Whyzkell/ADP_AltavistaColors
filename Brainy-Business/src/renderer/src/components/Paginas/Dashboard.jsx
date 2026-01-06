import React, { useState, useEffect, useMemo } from 'react'
import ControlPanel from '../dashboard/ControlPanel.jsx'
import InventoryPreview from '../dashboard/InvetoryPreview.jsx'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import { fetchProducts, listInvoices, listFiscalCredits } from '../../api'
import TopProducts from './TopProducts.jsx'

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

      const allSales = [
        ...(invoices.map((f) => ({ ...f, tipo: 'Factura' })) || []),
        ...(credits.map((c) => ({ ...c, tipo: 'Crédito Fiscal' })) || [])
      ]
      setSales(allSales)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      alert('No se pudo cargar el dashboard. Revisa la conexión con la API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- LÓGICA CORREGIDA: COMPARACIÓN NUMÉRICA UTC ---
  const dashboardStats = useMemo(() => {
    // 1. Obtenemos mes y año actuales de tu computadora
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0 = Enero, 1 = Febrero...

    // console.log("Buscando ventas del mes:", currentMonth + 1, "del año:", currentYear)

    const salesThisMonth = sales.filter((venta) => {
      if (!venta.fecha) return false

      // Convertimos la fecha de la venta a objeto Date asegurándonos
      const fechaVenta = new Date(venta.fecha)

      // Verificamos que sea una fecha válida
      if (isNaN(fechaVenta.getTime())) return false

      // TRUCO MAESTRO: Usamos getUTCFullYear y getUTCMonth.
      // Esto lee la fecha "cruda" de la base de datos (2026-01-06)
      // sin restarle horas por la zona horaria de El Salvador.
      const ventaYear = fechaVenta.getUTCFullYear()
      const ventaMonth = fechaVenta.getUTCMonth()

      // Comparamos números: Año igual al actual Y Mes igual al actual
      return ventaYear === currentYear && ventaMonth === currentMonth
    })

    // 2. Sumamos los montos
    const totalAmount = salesThisMonth.reduce((acc, venta) => {
      // Postgres devuelve 'numeric' a veces como string, aseguramos con Number()
      const valorVenta = Number(venta.monto) || Number(venta.total) || 0
      return acc + valorVenta
    }, 0)

    // 3. Nombre del mes para mostrar en el panel
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

      <CreateInvoiceModal
        open={openCrearFactura}
        onClose={() => {
          setOpenCrearFactura(false)
          fetchData()
        }}
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
