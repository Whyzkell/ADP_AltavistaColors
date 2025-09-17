import React from 'react'
import Card from '../Cards/Card.jsx'
import Button from '../Buttons/Button.jsx'
import FacturaIcon from '../../../../../resources/Factura.png'
import CreditoIcon from '../../../../../resources/CreditoFiscal.png'

const Stat = ({ label, value }) => (
  <div className="flex-1 min-w-[140px]">
    <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-neutral-900">{value}</p>
  </div>
)

export default function ControlPanel({ onCobrar, onCredito }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
        <p className="text-sm font-semibold text-black">Ventas</p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Número de ventas</p>
            <p className="text-lg text-black font-semibold">400</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Mes</p>
            <p className="text-lg text-black font-semibold">Septiembre</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Ventas</p>
            <p className="text-lg text-black font-semibold">$5698</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
        <p className="text-sm font-semibold text-black">Cobrar</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={onCobrar}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
          >
            <img src={FacturaIcon} className="w-5 h-5" />
            Factura
          </button>
          <button
            onClick={onCredito}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
          >
            <img src={CreditoIcon} className="w-5 h-5" />
            Crédito fiscal
          </button>
        </div>
      </div>
    </div>
  )
}
