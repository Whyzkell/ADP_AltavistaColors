// src/renderer/src/Modales/VerFacturaModal.jsx
import React, { useEffect, useState } from 'react'
import ModalFactura from './ModalFactura.jsx'
import { getInvoice } from '../../api' // asegúrate de tener esta función en api.js

function fmtId(d) {
  if (!d) return '#—'
  if (typeof d.id === 'string') return d.id
  if (d.numero) return `#${d.numero}`
  if (typeof d.id === 'number') return `#${String(d.id).padStart(6, '0')}`
  return '#—'
}

export default function VerFacturaModal({ open, onClose, data }) {
  const [detalle, setDetalle] = useState(data || null)
  const [loading, setLoading] = useState(false)
  const idNum = typeof data?.id === 'number' ? data.id : null

  useEffect(() => {
    let alive = true
    // si abren el modal con solo el id numérico, pide el detalle
    if (open && idNum && !data?.items) {
      ;(async () => {
        try {
          setLoading(true)
          const full = await getInvoice(idNum)
          if (alive) setDetalle(full)
        } catch (e) {
          console.error('getInvoice error', e)
        } finally {
          if (alive) setLoading(false)
        }
      })()
    } else {
      setDetalle(data || null)
    }
    return () => {
      alive = false
    }
  }, [open, idNum, data])

  if (!open) return null

  const head = detalle || data
  const items = head?.items || []
  const titleId = fmtId(head)

  return (
    <ModalFactura open={open} onClose={onClose} title={`Factura ${titleId}`}>
      {loading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : !head ? (
        <p className="text-sm text-neutral-500">Sin datos</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p>
              <span className="font-medium">Cliente:</span> {head.cliente || '—'}
            </p>
            <p>
              <span className="font-medium">Fecha:</span> {head.fecha_emision || head.fecha || '—'}
            </p>
            <p>
              <span className="font-medium">Dirección:</span> {head.direccion || '—'}
            </p>
            <p>
              <span className="font-medium">Total:</span> ${Number(head.total || 0).toFixed(2)}
            </p>
          </div>

          <div className="mt-2 bg-white rounded-xl ring-1 ring-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-2">Cant.</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">P. unit</th>
                  <th className="px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {items.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-neutral-400">
                      Sin items
                    </td>
                  </tr>
                )}
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2">{it.cantidad}</td>
                    <td className="px-4 py-2">{it.nombre}</td>
                    <td className="px-4 py-2">${Number(it.precio_unit).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      ${Number(it.total ?? it.cantidad * it.precio_unit).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-white font-semibold bg-neutral-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </ModalFactura>
  )
}
