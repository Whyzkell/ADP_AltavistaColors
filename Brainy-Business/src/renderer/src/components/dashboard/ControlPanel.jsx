import React from 'react'
import Card from '../Cards/Card.jsx'
import Button from '../Buttons/Button.jsx'

const Stat = ({ label, value }) => (
  <div className="flex-1 min-w-[140px]">
    <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-neutral-900">{value}</p>
  </div>
)

export default function ControlPanel({ onCobrar }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Ventas</p>
          <Button className="px-3 py-1.5" variant="soft">
            Ver
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <Stat label="Número de ventas" value="400" />
          <Stat label="Mes" value="Septiembre" />
          <Stat label="Ventas" value="$5698" />
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold">Cobrar</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button variant="soft" className="min-w-[120px]" onClick={onCobrar}>
            <span className="inline-flex h-5 w-5 rounded-sm bg-neutral-200" />
            Factura
          </Button>
          <Button variant="soft" className="min-w-[140px]" onClick={onCobrar}>
            <span className="inline-flex h-5 w-5 rounded-sm bg-neutral-200" />
            Crédito fiscal
          </Button>
        </div>
      </Card>
    </div>
  )
}
