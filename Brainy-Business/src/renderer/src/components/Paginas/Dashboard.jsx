import React, { useState } from 'react'
import ControlPanel from '../dashboard/ControlPanel.jsx'
import InventoryPreview from '../dashboard/InvetoryPreview.jsx'
import CreateInvoiceModal from '../Modales/CreateFacturaModal.jsx'

export default function Dashboard() {
  const [openCrear, setOpenCrear] = useState(false)
  const [facturas, setFacturas] = useState([])
  const previewInventory = [
    {
      id: '#10001',
      nombre: 'Pintura',
      categoria: 'Herramientas',
      precio: '$10',
      codigo: '5001',
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
      categoria: 'Accesorios',
      precio: '$7',
      codigo: '5003',
      stock: 8
    }
  ]

  const handleCreate = (factura) => {
    // Aquí podrías llamar a tu backend. Por ahora guardamos en estado.
    setFacturas((arr) => [factura, ...arr])
    console.log('Factura creada:', factura)
  }

  return (
    <main className="flex-1 min-w-0">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div>
          <h1 className="text-xl font-semibold">Panel de control</h1>
          <p className="text-sm text-neutral-500 max-w-xl">
            Este apartado es para visualizar todo con una vista previa
          </p>
        </div>

        <div className="mt-4">
          <ControlPanel onCobrar={() => setOpenCrear(true)} />
        </div>

        <InventoryPreview items={previewInventory} />
      </div>
      <CreateInvoiceModal
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        onCreate={handleCreate}
      />
    </main>
  )
}
