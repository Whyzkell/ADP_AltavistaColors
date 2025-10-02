import React, { useState } from 'react'
import ControlPanel from '../dashboard/ControlPanel.jsx'
import InventoryPreview from '../dashboard/InvetoryPreview.jsx'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'
import CreateCreditoFiscalModal from '../Modales/CreateCreditoFiscalModal.jsx'

export default function Dashboard() {
  const [openCrearFactura, setOpenCrearFactura] = useState(false)
  const [openCrearCredito, setOpenCrearCredito] = useState(false)

  const [facturas, setFacturas] = useState([])
  const [creditos, setCreditos] = useState([])

  const previewInventory = [
    {
      id: '#10001',
      nombre: 'Pintura Blanca',
      categoria: 'Pinturas',
      precio: '$10',
      codigo: '3000',
      stock: 20
    },
    {
      id: '#10002',
      nombre: 'Brocha',
      categoria: 'Herramientas',
      precio: '$5',
      codigo: '5002',
      stock: 15
    },
    {
      id: '#10003',
      nombre: 'Rodillo',
      categoria: 'Herramientas',
      precio: '$7',
      codigo: '5003',
      stock: 8
    }
  ]

  const handleCreateFactura = (factura) => {
    setFacturas((arr) => [factura, ...arr])
    console.log('Factura creada:', factura)
  }

  const handleCreateCredito = (credito) => {
    setCreditos((arr) => [credito, ...arr])
    console.log('Crédito Fiscal creado:', credito)
  }

  return (
    <main className="flex-1 min-w-0">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div>
          <h1 className="text-xl text-black font-semibold">Panel de control</h1>
          <p className="text-sm text-neutral-500 max-w-xl">
            Este apartado es para visualizar todo con una vista previa
          </p>
        </div>

        {/* Panel de acciones */}
        <div className="mt-4">
          <ControlPanel
            onCobrar={() => setOpenCrearFactura(true)}
            onCredito={() => setOpenCrearCredito(true)}
          />
        </div>

        {/* Vista previa de inventario */}
        <InventoryPreview items={previewInventory} />
      </div>

      {/* Modales */}
      <CreateInvoiceModal
        open={openCrearFactura}
        onClose={() => setOpenCrearFactura(false)}
        onCreate={handleCreateFactura}
      />

      <CreateCreditoFiscalModal
        open={openCrearCredito}
        onClose={() => setOpenCrearCredito(false)}
        onCreate={handleCreateCredito}
      />
    </main>
  )
}
