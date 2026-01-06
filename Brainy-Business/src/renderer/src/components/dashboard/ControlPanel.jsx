import React from 'react'
// Eliminé imports de Card y Button que no se usaban
import FacturaIcon from '../../../../../resources/Factura.png'
import CreditoIcon from '../../../../../resources/CreditoFiscal.png'

// Eliminé el componente 'Stat' que no se usaba

export default function ControlPanel({
  onCobrar,
  onCredito,
  salesCount = 0,
  salesTotal = 0,
  currentMonthName = 'Mes Actual'
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* TARJETA DE ESTADÍSTICAS */}
      <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
        <p className="text-sm font-semibold text-black">Ventas</p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Número de ventas</p>
            <p className="text-lg text-black font-semibold">{salesCount}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Mes</p>
            {/* Muestra el mes dinámico (ej: Enero) */}
            <p className="text-lg text-black font-semibold">{currentMonthName}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Ventas</p>
            {/* Muestra el total con formato de moneda */}
            <p className="text-lg text-black font-semibold">${Number(salesTotal).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* TARJETA DE ACCIONES (BOTONES) */}
      <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
        <p className="text-sm font-semibold text-black">Cobrar</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={onCobrar}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#11A5A3] hover:bg-[#Da2864] text-white text-sm font-semibold transition-colors"
          >
            {/* Usamos la variable importada aquí */}
            <img src={FacturaIcon} className="w-5 h-5" alt="Factura" />
            Factura
          </button>

          <button
            onClick={onCredito}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#11A5A3] hover:bg-[#Da2864] text-white text-sm font-semibold transition-colors"
          >
            {/* Usamos la variable importada aquí */}
            <img src={CreditoIcon} className="w-5 h-5" alt="Crédito Fiscal" />
            Crédito fiscal
          </button>
        </div>
      </div>
    </div>
  )
}
