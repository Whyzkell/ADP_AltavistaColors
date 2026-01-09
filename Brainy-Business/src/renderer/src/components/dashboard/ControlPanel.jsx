import React from 'react'
import FacturaIcon from '../../../../../resources/Factura.png'
import CreditoIcon from '../../../../../resources/CreditoFiscal.png'

export default function ControlPanel({
  onCobrar,
  onCredito,
  salesCount = 0,
  salesTotal = 0,
  salesTotalReal = 0, // <--- NUEVA PROP
  currentMonthName = 'Mes Actual'
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* TARJETA DE ESTADÍSTICAS */}
      <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-4">
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold text-black">Resumen {currentMonthName}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-8">
          {/* Ventas Totales (Bruto) */}
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Ventas Totales</p>
            <p className="text-lg text-black font-semibold">${Number(salesTotal).toFixed(2)}</p>
          </div>

          {/* Venta Real (Neto) - NUEVO */}
          <div>
            <p className="text-[11px] uppercase text-emerald-600 font-bold">
              Venta Real (Sin Com.)
            </p>
            <p
              className="text-lg text-emerald-600 font-bold"
              title="Dinero recibido tras comisiones"
            >
              ${Number(salesTotalReal).toFixed(2)}
            </p>
          </div>

          {/* Conteo */}
          <div>
            <p className="text-[11px] uppercase text-neutral-500">Transacciones</p>
            <p className="text-lg text-black font-semibold">{salesCount}</p>
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
            <img src={FacturaIcon} className="w-5 h-5" alt="Factura" />
            Factura
          </button>

          <button
            onClick={onCredito}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#11A5A3] hover:bg-[#Da2864] text-white text-sm font-semibold transition-colors"
          >
            <img src={CreditoIcon} className="w-5 h-5" alt="Crédito Fiscal" />
            Crédito fiscal
          </button>
        </div>
      </div>
    </div>
  )
}
