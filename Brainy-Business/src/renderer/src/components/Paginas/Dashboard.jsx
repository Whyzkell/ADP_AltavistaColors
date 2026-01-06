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

      // --- AQUÍ ESTABA EL ERROR ---
      // En Ventas.jsx normalizamos los datos, aquí también debemos hacerlo
      // para asegurar que 'fecha' y 'monto' siempre existan.

      const mappedInvoices = (invoices || []).map((f) => ({
        ...f,
        tipo: 'Factura',
        // Si la API trae 'fecha_emision', lo guardamos como 'fecha'
        fecha: f.fecha_emision || f.fecha,
        // Si la API trae 'total', lo guardamos como 'monto'
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
      alert('No se pudo cargar el dashboard. Revisa la conexión con la API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- LÓGICA DE FILTRADO (Igual que en Ventas.jsx) ---
  const dashboardStats = useMemo(() => {
    const now = new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth() // 0 = Enero

    const salesThisMonth = sales.filter((venta) => {
      // Ahora 'venta.fecha' seguro existe gracias al mapeo de arriba
      if (!venta.fecha) return false

      const ventaDate = new Date(venta.fecha)

      // Filtramos usando UTC
      return ventaDate.getUTCFullYear() === currentYear && ventaDate.getUTCMonth() === currentMonth
    })

    const totalAmount = salesThisMonth.reduce((acc, venta) => {
      // Ahora 'venta.monto' seguro existe
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
