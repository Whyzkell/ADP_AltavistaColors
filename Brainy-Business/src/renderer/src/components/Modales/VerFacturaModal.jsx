// src/renderer/src/Modales/VerFacturaModal.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import ModalFactura from './ModalFactura.jsx'

const PAGE_SIZE = 6

/* ===========================================
 * DISEÑO DEL TICKET (Solo visible al imprimir)
 * =========================================== */
const TicketDesign = ({ data }) => {
  if (!data) return null
  const items = data.items || []
  
  // Calcular total si no viene
  const totalCalculado = items.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precio_unit)), 0)
  const totalFinal = Number(data.total || totalCalculado)

  return (
    <div className="text-black font-mono text-[12px] leading-tight">
      {/* CORRECCIÓN IMPORTANTE DE ESTILOS:
          Usamos 'visibility' y 'position: absolute' para sacar el ticket 
          del flujo normal y asegurarnos de que sea lo único que se ve.
      */}
      <style>
        {`
          @media print {
            @page { margin: 0; size: auto; }
            
            /* 1. Ocultamos visualmente TODO el contenido del body */
            body {
              visibility: hidden;
            }
            
            /* 2. Hacemos visible EXPLICITAMENTE el contenedor del ticket */
            .print-container {
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 72mm !important; /* Ajustado para margen seguro en papel de 80mm */
              margin: 0 !important;
              padding: 2mm !important;
              background: white;
            }
            
            /* 3. Aseguramos que todo lo de adentro del ticket sea visible */
            .print-container * {
              visibility: visible !important;
            }
          }
        `}
      </style>

      <div className="text-center mb-4">
        <div className="flex items-center justify-center">
          <img src="resources/Logo.png" className="w-[220px]" alt="Logo" />
        </div>
        <p>--------------------------------</p>
        <p className="font-bold">FACTURA #: {data.numero || data.id}</p>
        <p>{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
      </div>

      <div className="mb-2">
        <p><strong>Cliente:</strong> {data.cliente}</p>
        {data.dui && <p><strong>DUI:</strong> {data.dui}</p>}
        {data.nit && <p><strong>NIT:</strong> {data.nit}</p>}
        <p><strong>Pago:</strong> {data.tipo_de_pago || 'Efectivo'}</p>
      </div>

      <p className="mb-1">--------------------------------</p>
      
      {/* Encabezados Tabla Ticket */}
      <div className="flex font-bold mb-1">
        <span className="w-8">Cant</span>
        <span className="flex-1">Desc</span>
        <span className="w-12 text-right">Total</span>
      </div>
      
      <p className="mb-1">--------------------------------</p>

      {/* Items */}
      <div className="space-y-2 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start">
            <span className="w-8 text-center">{item.cantidad}</span>
            <div className="flex-1 pr-1">
              <p>{item.nombre}</p>
              <p className="text-[10px] text-gray-600">@ ${Number(item.precio_unit).toFixed(2)}</p>
            </div>
            <span className="w-12 text-right">
              ${(Number(item.cantidad) * Number(item.precio_unit)).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <p className="mb-2">--------------------------------</p>

      <div className="flex justify-between text-lg font-bold">
        <span>TOTAL:</span>
        <span>${totalFinal.toFixed(2)}</span>
      </div>

      <div className="mt-6 text-center text-[10px] space-y-1">
        <p>¡Gracias por su compra!</p>
        
        <p className="pt-2">.</p> {/* Punto final para asegurar margen inferior */}
      </div>
    </div>
  )
}

/* ===========================================
 * Helpers de UI (Vista Pantalla)
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

function InputReadOnly({ className = '', ...props }) {
  return (
    <input
      {...props}
      readOnly
      className={'h-11 w-full rounded-xl px-3 ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 outline-none ' + className}
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
        />
      ))}
    </div>
  )
}

function chunk(arr, size) {
  if (!arr) return [[]]
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

  const resumen = useMemo(() => {
    const cantidad = items.reduce((a, b) => a + Number(b.cantidad || 0), 0)
    const total = Number(data?.total || 0)
    return { cantidad, total }
  }, [items, data?.total])

  /* ---------- Paginación ---------- */
  const pages = chunk(items, PAGE_SIZE)
  const [pageIdx, setPageIdx] = useState(0)
  const pageRefs = useRef([])

  const goTo = (idx) => {
    setPageIdx(Math.max(0, Math.min(idx, pages.length - 1)))
    pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (open) setPageIdx(0)
  }, [open, data?.id])

  return (
    <>
      {/* 1. COMPONENTE MODAL (Visible en pantalla, oculto al imprimir) */}
      <div className="print:hidden">
        <ModalFactura open={open} onClose={onClose} title={`Factura No. ${f.numero || f.id || ''}`}>
          <div className="space-y-8">
            <div className="max-h-[55vh] overflow-y-auto snap-y snap-mandatory pr-1">
              
              {/* Datos del cliente */}
              <section className="snap-start mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Field label="Cliente"><InputReadOnly value={f.cliente || ''} /></Field>
                  <Field label="Dirección"><InputReadOnly value={f.direccion || ''} /></Field>
                  <Field label="Venta a cuenta de"><InputReadOnly value={f.payload?.ventaCuentaDe || ''} /></Field>
                  <Field label="DUI"><InputReadOnly value={f.dui || ''} /></Field>
                  <Field label="Condiciones de pago"><InputReadOnly value={f.condiciones || ''} /></Field>
                  <Field label="NIT"><InputReadOnly value={f.nit || ''} /></Field>
                </div>
              </section>

              {/* Productos */}
              <section className="snap-start mt-8">
                <LabelSection>Productos</LabelSection>
                <div className="grid grid-cols-12 gap-3 text-sm text-neutral-600 mt-4">
                  <div className="col-span-2">Cantidad</div>
                  <div className="col-span-5">Nombre</div>
                  <div className="col-span-2">Precio unitario</div>
                  <div className="col-span-3">Total</div>
                </div>
              </section>

              {/* Filas paginadas */}
              {pages.map((rows, idx) => (
                <section key={idx} ref={(el) => (pageRefs.current[idx] = el)} className="snap-start mt-2">
                  <div className="space-y-3 w-full">
                    {rows.map((p, i) => (
                      <div key={p.id || i} className="grid grid-cols-12 gap-2 items-center">
                        <InputReadOnly value={p.cantidad} className="col-span-2" />
                        <InputReadOnly value={p.nombre} className="col-span-5" />
                        <InputReadOnly value={`$${Number(p.precio_unit).toFixed(2)}`} className="col-span-2" />
                        <InputReadOnly value={`$${(Number(p.cantidad) * Number(p.precio_unit)).toFixed(2)}`} className="col-span-3" />
                      </div>
                    ))}
                  </div>
                  {pages.length > 1 && (
                    <div className="flex items-center justify-between mt-3">
                      <button type="button" onClick={() => goTo(pageIdx - 1)} className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-neutral-300 hover:bg-neutral-50">▲</button>
                      <Dots total={pages.length} active={pageIdx} onClick={goTo} />
                      <button type="button" onClick={() => goTo(pageIdx + 1)} className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-neutral-300 hover:bg-neutral-50">▼</button>
                    </div>
                  )}
                </section>
              ))}

              {/* Resumen */}
              <section className="snap-start mt-8 pb-2">
                <LabelSection>Resumen</LabelSection>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-3">
                  <Field small label="Cantidad de productos"><InputReadOnly value={resumen.cantidad || ''} /></Field>
                  <Field small label="Total final"><InputReadOnly value={`$${resumen.total.toFixed(2)}`} /></Field>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-[#11A5A3] shadow-sm flex items-center justify-center gap-2"
              >
                Imprimir Ticket
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
      </div>

      {/* 2. COMPONENTE TICKET (Oculto en pantalla, Visible al imprimir) */}
      {/* Usamos la clase 'print-container' para que el CSS de arriba la detecte */}
      <div className="print-container hidden print:block">
        <TicketDesign data={data} />
      </div>
    </>
  )
}