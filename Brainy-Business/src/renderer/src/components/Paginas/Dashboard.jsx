import React, { useState, useEffect, useMemo } from 'react'
import ControlPanel from '../dashboard/ControlPanel.jsx'
import InventoryPreview from '../dashboard/InvetoryPreview.jsx'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'
import { fetchProducts, listInvoices, listFiscalCredits } from '../../api' // <-- IMPORTAMOS LA API
import TopProducts from './TopProducts.jsx'

export default function Dashboard() {
  const [openCrearFactura, setOpenCrearFactura] = useState(false)
  const [openCrearCredito, setOpenCrearCredito] = useState(false)

  // Estados para los datos reales
  const [inventory, setInventory] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  // Función para cargar TODOS los datos del dashboard
  const fetchData = async () => {
    try {
      setLoading(true)
      const [products, invoices, credits] = await Promise.all([
        fetchProducts(),
        listInvoices(),
        listFiscalCredits()
      ])

      setInventory(products || [])

      // Unimos facturas y créditos en una sola lista de "ventas"
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

  // Cargar los datos al montar el componente
  useEffect(() => {
    fetchData()
  }, [])

  // Calcular estadísticas de ventas usando useMemo
  const salesStats = useMemo(() => {
    const totalAmount = sales.reduce((acc, venta) => acc + Number(venta.total || 0), 0)
    return {
      salesCount: sales.length,
      salesTotal: totalAmount
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

        {/* Panel de acciones (ahora con datos reales) */}
        <div className="mt-4">
          <ControlPanel
            salesCount={salesStats.salesCount}
            salesTotal={salesStats.salesTotal}
            onCobrar={() => setOpenCrearFactura(true)}
            onCredito={() => setOpenCrearCredito(true)}
          />
        </div>

        <TopProducts />

        {/* Vista previa de inventario (ahora con datos reales) */}
        <InventoryPreview items={inventory} />
      </div>

      {/* Modales (ahora recargan los datos al cerrarse) */}
      <CreateInvoiceModal
        open={openCrearFactura}
        onClose={() => {
          setOpenCrearFactura(false)
          fetchData() // Recarga todo el dashboard
        }}
        // 'onCreate' ya no es necesario
      />

      <CreateCreditoFiscalModal
        open={openCrearCredito}
        onClose={() => {
          setOpenCrearCredito(false)
          fetchData() // Recarga todo el dashboard
        }}
        // 'onCreate' ya no es necesario
      />
    </main>
  )
}
