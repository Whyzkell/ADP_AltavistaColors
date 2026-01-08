// src/renderer/src/components/Dashboard/LotesProximosAVencer.jsx
import React, { useEffect, useState } from 'react'
import { getExpiringBatches } from '../../api'

const API_BASE = 'http://localhost:3001' // Ajusta si tu puerto es diferente

export default function LotesProximosAVencer() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await getExpiringBatches()
        setLotes(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // Helper para calcular días restantes y formato
  const getInfoVencimiento = (fechaStr) => {
    const vencimiento = new Date(fechaStr)
    const hoy = new Date()
    // Diferencia en milisegundos
    const diffTime = vencimiento - hoy
    // Diferencia en días (redondeado hacia arriba)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const fechaFmt = vencimiento.toLocaleDateString('es-SV', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    if (diffDays < 0) {
      return {
        texto: `Venció hace ${Math.abs(diffDays)} días`,
        color: 'bg-rose-100 text-rose-700 border-rose-200',
        fecha: fechaFmt
      }
    } else if (diffDays === 0) {
      return {
        texto: '¡Vence hoy!',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        fecha: fechaFmt
      }
    } else {
      return {
        texto: `Vence en ${diffDays} días`,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        fecha: fechaFmt
      }
    }
  }

  if (loading) return <div className="p-4 text-gray-500 text-sm">Cargando vencimientos...</div>

  if (lotes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full">
        <span className="text-4xl mb-2">📅</span>
        <h3 className="text-lg font-semibold text-gray-700">Sin riesgos</h3>
        <p className="text-sm text-gray-500">No hay lotes próximos a vencer.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col mt-5">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        Próximos Vencimientos
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {lotes.map((l) => {
          const info = getInfoVencimiento(l.fecha_vencimiento)

          return (
            <div
              key={l.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${info.color}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Imagen pequeña */}
                <div className="w-10 h-10 bg-white/60 rounded-lg border border-gray-200/50 flex-shrink-0 overflow-hidden backdrop-blur-sm">
                  {l.imagen ? (
                    <img
                      src={`${API_BASE}/uploads/${l.imagen}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-gray-400">
                      📦
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-bold truncate text-sm" title={l.producto_nombre}>
                    {l.producto_nombre}
                  </p>
                  <p className="text-xs opacity-80 font-medium">
                    Lote: {l.codigo_lote} • <span className="underline">{info.fecha}</span>
                  </p>
                </div>
              </div>

              <div className="text-right pl-2 min-w-[70px]">
                <span className="block text-xs font-bold uppercase tracking-tight">
                  {info.texto}
                </span>
                <span className="text-[10px] font-medium opacity-75">
                  Stock: {l.cantidad_actual}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
