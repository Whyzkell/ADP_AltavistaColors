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

  // ESTADO PARA LA COMISIÓN (4% por defecto o lo que esté guardado)
  const [commissionRate, setCommissionRate] = useState(() => {
    const saved = localStorage.getItem('tarjeta_comision')
    return saved ? Number(saved) : 0.04 // 0.04 es 4%
  })

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
        tipo_de_pago: f.tipo_de_pago
      }))

      const mappedCredits = (credits || []).map((c) => ({
        ...c,
        tipo: 'Crédito Fiscal',
        fecha: c.fecha_emision || c.fecha,
        monto: c.total || c.monto,
        tipo_de_pago: c.tipo_de_pago
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

  // --- FUNCIÓN PARA CAMBIAR COMISIÓN ---
  const handleChangeCommission = async () => {
    const { value: newRate } = await Swal.fire({
      title: 'Configurar Comisión',
      text: 'Ingresa el porcentaje que cobra el banco (ej: 4 para 4%)',
      input: 'number',
      inputValue: commissionRate * 100,
      inputAttributes: {
        min: 0,
        max: 100,
        step: 0.1
      },
      showCancelButton: true,
      confirmButtonColor: '#11A5A3',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar'
    })

    if (newRate !== null && newRate !== undefined) {
      const decimalRate = Number(newRate) / 100
      setCommissionRate(decimalRate)
      localStorage.setItem('tarjeta_comision', decimalRate)
      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: `La comisión ahora es del ${newRate}%`,
        timer: 1500,
        showConfirmButton: false
      })
    }
  }

  // --- LÓGICA DE FILTRADO Y CÁLCULO ---
  const dashboardStats = useMemo(() => {
    // Usamos fecha local para evitar problemas de zona horaria el día 31
    const now = new Date()
    const currentYear = now.getFullYear() // Usar getFullYear en vez de getUTCFullYear
    const currentMonth = now.getMonth()   // Usar getMonth en vez de getUTCMonth

    const salesThisMonth = sales.filter((venta) => {
      if (!venta.fecha) return false
      // Convertimos la fecha de venta asegurando que se interprete localmente
      // (Asumiendo que backend manda YYYY-MM-DD, al hacer new Date se puede ir al día anterior en UTC)
      // Truco: Agregar 'T00:00:00' o usar split para asegurar
      const parts = venta.fecha.split('T')[0].split('-')
      const ventaDate = new Date(parts[0], parts[1] - 1, parts[2]) // Año, Mes (0-idx), Día
      
      return ventaDate.getFullYear() === currentYear && ventaDate.getMonth() === currentMonth
    })

    let totalAmount = 0
    let totalEfectivo = 0
    let totalTransferencia = 0
    let totalTarjeta = 0

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

    // Calcular Neto Tarjeta (Total Tarjeta - Comisión)
    const comisionAmount = totalTarjeta * commissionRate
    const tarjetaNeto = totalTarjeta - comisionAmount
    
    // CALCULAR VENTA REAL TOTAL (Bruto - Comisión)
    const salesTotalReal = totalAmount - comisionAmount

    const monthName = now.toLocaleString('es-ES', { month: 'long' })
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    return {
      salesCount: salesThisMonth.length,
      salesTotal: totalAmount,
      salesTotalReal: salesTotalReal, 
      efectivo: totalEfectivo,
      transferencia: totalTransferencia,
      tarjetaBruto: totalTarjeta,
      tarjetaNeto: tarjetaNeto, 
      comisionTotal: comisionAmount,
      currentMonthName: capitalizedMonth
    }
  }, [sales, commissionRate])

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
            salesTotalReal={dashboardStats.salesTotalReal}
            currentMonthName={dashboardStats.currentMonthName}
            onCobrar={() => setOpenCrearFactura(true)}
            onCredito={() => setOpenCrearCredito(true)}
          />

          {/* --- TARJETA DE TIPOS DE PAGO MEJORADA --- */}
          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-neutral-100 pb-2">
              <p className="text-sm font-bold text-gray-800">Desglose Financiero (Mes Actual)</p>
              <button 
                onClick={handleChangeCommission}
                className="text-xs text-neutral-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                title="Cambiar porcentaje de comisión"
              >
                <span>⚙️ Configurar Comisión ({(commissionRate * 100).toFixed(1)}%)</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-8">
              {/* Efectivo */}
              <div className="min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Efectivo</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  ${dashboardStats.efectivo.toFixed(2)}
                </p>
              </div>

              {/* Transferencia */}
              <div className="min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Transferencia</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  ${dashboardStats.transferencia.toFixed(2)}
                </p>
              </div>

              {/* Tarjeta Bruto (Total cobrado) */}
              <div className="min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">T. Crédito (Total)</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  ${dashboardStats.tarjetaBruto.toFixed(2)}
                </p>
              </div>

              {/* Separador Vertical */}
              <div className="w-px bg-neutral-200 hidden sm:block"></div>

              {/* Tarjeta Neto (Lo que recibes) */}
              <div className="min-w-[140px] bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-600">🏦</span>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Recibido Real (Sin Com.)
                  </p>
                </div>
                <p className="text-xl font-bold text-emerald-700">
                  ${dashboardStats.tarjetaNeto.toFixed(2)}
                </p>
                <p className="text-[10px] text-emerald-600/70 mt-1">
                  - ${dashboardStats.comisionTotal.toFixed(2)} comisión
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