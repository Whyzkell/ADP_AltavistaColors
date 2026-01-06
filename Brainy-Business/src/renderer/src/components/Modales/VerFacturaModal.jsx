// src/renderer/src/Modales/VerFacturaModal.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import ModalFactura from './ModalFactura.jsx'
// NOTA: No necesitamos 'fetchProducts' o 'createInvoice' aquí.

const PAGE_SIZE = 6 // Mantenemos el mismo tamaño de página

/* ===========================================
 * Helpers de UI (Copiados de CreateFacturaModal)
 * =========================================== */

function Field({ label, children, small = false }) {
  return (
    <div className="space-y-1">
      <label className={`font-medium ${small ? 'text-sm' : 'text-[15px]'}`}>{label}</label>
      {children}
    </div>
  )
}

function LabelSection({ children }) {
  return (
    <div>
      <p className="font-semibold text-black">{children}</p>
      <div className="mt-1 h-[3px] w-16 bg-neutral-900 rounded" />
    </div>
  )
}

// Creamos una versión de "solo lectura" del InputGreen
function InputReadOnly({ className = '', ...props }) {
  return (
    <input
      {...props}
      readOnly
      className={
        // --- INICIO DE CORRECCIÓN DE IMPRESIÓN ---
        // Cambiamos 'print:ring-0' por 'print:ring-1 print:ring-neutral-300'
        'h-11 w-full rounded-xl px-3 ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 placeholder-neutral-400 outline-none print:bg-white print:ring-1 print:ring-neutral-300 print:h-9 ' +
        // --- FIN DE CORRECCIÓN DE IMPRESIÓN ---
        className
      }
    />
  )
}

function Dots({ total, active, onClick }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onClick(i)}
          className={`h-2.5 w-2.5 rounded-full transition ${
            i === active ? 'bg-neutral-800' : 'bg-neutral-300'
          }`}
          aria-label={`Ir a página ${i + 1}`}
        />
      ))}
    </div>
  )
}

function chunk(arr, size) {
  if (!arr) return [[]] // Protección contra 'data' nulo
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out.length ? out : [[]]
}

/* ===========================================
 * Modal Principal
 * =========================================== */
export default function VerFacturaModal({ open, onClose, data }) {
  const f = data || {}
  const items = data?.items || []

  // Re-calculamos el resumen basado en los datos
  const resumen = useMemo(() => {
    const cantidad = items.reduce((a, b) => a + Number(b.cantidad || 0), 0)
    const total = Number(data?.total || 0)
    return { cantidad, total }
  }, [items, data?.total])

  /* ---------- Paginación (solo UI) ---------- */
  const pages = chunk(items, PAGE_SIZE)
  const [pageIdx, setPageIdx] = useState(0)
  const pageRefs = useRef([])

  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(idx, pages.length - 1))
    setPageIdx(clamped)
    pageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Resetea la paginación si el modal se abre/cambia
  useEffect(() => {
    if (open) {
      setPageIdx(0)
    }
  }, [open, data?.id])

  return (
    <ModalFactura open={open} onClose={onClose} title={`Factura No. ${f.numero || f.id || ''}`}>
      <div className="space-y-8">
        {/*
          Añadimos 'print:max-h-none' y 'print:overflow-visible' 
          para que el contenido del scroll SÍ aparezca al imprimir.
        */}
        <div className="max-h-[55vh] overflow-y-auto snap-y snap-mandatory pr-1 print:max-h-none print:overflow-visible">
          {/* Datos del cliente */}
          <section className="snap-start mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid print:grid-cols-2 print:gap-4">
              <Field label="Cliente">
                <InputReadOnly value={f.cliente || ''} />
              </Field>
              <Field label="Dirección">
                <InputReadOnly value={f.direccion || ''} />
              </Field>
              <Field label="Venta a cuenta de">
                <InputReadOnly value={f.payload?.ventaCuentaDe || ''} />
              </Field>
              <Field label="DUI">
                <InputReadOnly value={f.dui || ''} />
              </Field>
              <Field label="Condiciones de pago">
                <InputReadOnly value={f.condiciones || ''} />
              </Field>
              <Field label="NIT">
                <InputReadOnly value={f.nit || ''} />
              </Field>
            </div>
          </section>

          {/* Productos */}
          <section className="snap-start mt-8">
            <LabelSection>Productos</LabelSection>

            {/* Header columnas */}
            <div className="grid grid-cols-12 gap-3 text-sm text-neutral-600 mt-4 print:grid print:grid-cols-12 print:gap-3">
              <div className="col-span-2 print:col-span-2">Cantidad</div>
              <div className="col-span-4 sm:col-span-5 print:col-span-5">Nombre</div>
              <div className="col-span-3 sm:col-span-2 print:col-span-2">Precio unitario</div>
              <div className="col-span-3 sm:col-span-3 print:col-span-3">Total</div>
            </div>
          </section>

          {/* Filas paginadas */}
          {pages.map((rows, idx) => (
            <section
              key={idx}
              ref={(el) => (pageRefs.current[idx] = el)}
              className="snap-start mt-2"
            >
              <div className="space-y-3 w-full">
                {rows.map((p, i) => {
                  const globalIndex = idx * PAGE_SIZE + i
                  return (
                    <div
                      key={p.id || globalIndex}
                      className="grid grid-cols-12 gap-2 items-center print:grid print:grid-cols-12 print:gap-2"
                    >
                      <InputReadOnly value={p.cantidad} className="col-span-2 print:col-span-2" />
                      <InputReadOnly
                        value={p.nombre}
                        className="col-span-4 sm:col-span-5 print:col-span-5"
                      />
                      <InputReadOnly
                        value={`$${Number(p.precio_unit).toFixed(2)}`}
                        className="col-span-3 sm:col-span-2 print:col-span-2"
                      />
                      <InputReadOnly
                        value={`$${(Number(p.cantidad) * Number(p.precio_unit)).toFixed(2)}`}
                        className="col-span-3 sm:col-span-3 print:col-span-3"
                      />
                    </div>
                  )
                })}
              </div>

              {/* Ocultamos la paginación al imprimir */}
              {pages.length > 1 && (
                <div className="flex items-center justify-between mt-3 print:hidden">
                  <button
                    type="button"
                    onClick={() => goTo(pageIdx - 1)}
                    className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-neutral-300 hover:bg-neutral-50"
                  >
                    ▲
                  </button>
                  <Dots total={pages.length} active={pageIdx} onClick={goTo} />
                  <button
                    type="button"
                    onClick={() => goTo(pageIdx + 1)}
                    className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-neutral-300 hover:bg-neutral-50"
                  >
                    ▼
                  </button>
                </div>
              )}
            </section>
          ))}

          {/* Resumen */}
          <section className="snap-start mt-8 pb-2">
            <LabelSection>Resumen</LabelSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-3 print:grid print:grid-cols-2 print:gap-4">
              <Field small label="Cantidad de productos">
                <InputReadOnly value={resumen.cantidad || ''} />
              </Field>
              <Field small label="Total final">
                <InputReadOnly value={`$${resumen.total.toFixed(2)}`} />
              </Field>
            </div>
          </section>
        </div>{' '}
        {/* Cierre del div de scroll */}
        {/* Ocultamos los botones al imprimir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-[#11A5A3] shadow-sm"
          >
            Imprimir
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-[#Da2864] shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </ModalFactura>
  )
}
