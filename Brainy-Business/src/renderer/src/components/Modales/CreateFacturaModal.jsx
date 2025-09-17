import React, { useMemo, useRef, useState } from 'react'
import ModalFactura from './ModalFactura.jsx'
import Button from '../Buttons/Button.jsx'

const emptyProd = { cant: 0, nombre: '', precio: 0 }
const PAGE_SIZE = 6

export default function CreateInvoiceModal({ open, onClose, onCreate }) {
  const [f, setF] = useState({
    cliente: '',
    direccion: '',
    ventaCuentaDe: '',
    dui: '',
    condiciones: '',
    nit: ''
  })
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const [prods, setProds] = useState([{ ...emptyProd }])

  const setProd = (i, k, v) =>
    setProds((arr) =>
      arr.map((p, idx) => (idx === i ? { ...p, [k]: k === 'nombre' ? v : Number(v || 0) } : p))
    )

  const addProd = () => setProds((p) => [...p, { ...emptyProd }])
  const removeProd = (i) => setProds((arr) => arr.filter((_, idx) => idx !== i))

  const totalFila = (p) => Number(p.cant || 0) * Number(p.precio || 0)

  const resumen = useMemo(() => {
    const cantidad = prods.reduce((a, b) => a + Number(b.cant || 0), 0)
    const total = prods.reduce((a, b) => a + totalFila(b), 0)
    return { cantidad, total }
  }, [prods])

  // ---- Carrusel vertical (snap) para productos ----
  const pages = chunk(prods, PAGE_SIZE) // [[fila,fila,...], [fila...], ...]
  const [pageIdx, setPageIdx] = useState(0)
  const scrollRef = useRef(null)
  const pageRefs = useRef([])

  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(idx, pages.length - 1))
    setPageIdx(clamped)
    pageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validación mínima
    if (!f.cliente.trim()) return alert('Ingresa el nombre del cliente')
    if (prods.length === 0 || resumen.total <= 0)
      return alert('Agrega al menos 1 producto con monto válido')

    // Simulación de creación (frontend)
    const factura = {
      id: `#${Math.floor(100000 + Math.random() * 900000)}`,
      fecha: new Date().toLocaleDateString('es-SV'),
      ...f,
      productos: prods,
      total: resumen.total,
      cantidadProductos: resumen.cantidad
    }

    onCreate?.(factura) // deja que el contenedor la maneje (ej: push a lista)
    // Reset
    setF({ cliente: '', direccion: '', ventaCuentaDe: '', dui: '', condiciones: '', nit: '' })
    setProds([{ ...emptyProd }])
    onClose?.()
  }

  return (
    <ModalFactura open={open} onClose={onClose} title="Crear Factura">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* WRAPPER SCROLLABLE (carrusel) */}
        <div ref={scrollRef} className="max-h-[55vh] overflow-y-auto snap-y snap-mandatory pr-1">
          {/* Slide 1: Título */}
          <section className="snap-start"></section>

          {/* Slide 2: Datos de cliente */}
          <section className="snap-start mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Field label="Cliente">
                <InputGreen
                  value={f.cliente}
                  onChange={(e) => up('cliente', e.target.value)}
                  placeholder="Cliente a facturar"
                />
              </Field>
              <Field label="Dirección">
                <InputGreen
                  value={f.direccion}
                  onChange={(e) => up('direccion', e.target.value)}
                  placeholder="Dirección"
                />
              </Field>
              <Field label="Venta a cuenta de">
                <InputGreen
                  value={f.ventaCuentaDe}
                  onChange={(e) => up('ventaCuentaDe', e.target.value)}
                  placeholder="—"
                />
              </Field>
              <Field label="DUI">
                <InputGreen
                  value={f.dui}
                  onChange={(e) => up('dui', e.target.value)}
                  placeholder="XXXXXXXXX-X"
                />
              </Field>
              <Field label="Condiciones de pago">
                <InputGreen
                  value={f.condiciones}
                  onChange={(e) => up('condiciones', e.target.value)}
                  placeholder="Condiciones de pago"
                />
              </Field>
              <Field label="NIT">
                <InputGreen
                  value={f.nit}
                  onChange={(e) => up('nit', e.target.value)}
                  placeholder="XXXXXXXXX-X"
                />
              </Field>
            </div>
          </section>

          {/* Slide(s) 3..N: Productos paginados (vertical snap) */}
          <section className="snap-start mt-8">
            <LabelSection>Productos</LabelSection>

            {/* Buscador tipo “pill” */}
            <div className="flex items-center gap-2 mt-3">
              <input
                placeholder="Buscar"
                className="h-9 w-full rounded-full px-4 text-sm ring-1 ring-neutral-200 bg-white outline-none"
              />
              <button
                type="button"
                className="h-9 w-9 rounded-full grid place-items-center bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              </button>
            </div>

            {/* Header de columnas */}
            <div className="grid grid-cols-12 gap-3 text-sm text-neutral-600 mt-3">
              <div className="col-span-2">Cantidad</div>
              <div className="col-span-4 sm:col-span-5">Nombre</div>
              <div className="col-span-3 sm:col-span-2">Precio unitario</div>
              <div className="col-span-3 sm:col-span-3">Total</div>
            </div>
          </section>

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
                    <div key={globalIndex} className=" grid grid-cols-12 gap-2">
                      <InputGreen
                        type="number"
                        min="0"
                        value={p.cant}
                        onChange={(e) => setProd(globalIndex, 'cant', e.target.value)}
                        placeholder="Cant."
                        className="col-span-2"
                      />
                      <InputGreen
                        value={p.nombre}
                        onChange={(e) => setProd(globalIndex, 'nombre', e.target.value)}
                        placeholder="Brocha"
                        className="col-span-4 sm:col-span-5"
                      />
                      <InputGreen
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.precio}
                        onChange={(e) => setProd(globalIndex, 'precio', e.target.value)}
                        placeholder="$0.00"
                        className="col-span-3 sm:col-span-2"
                      />
                      <InputGreen
                        readOnly
                        value={`$${(totalFila(p) || 0).toFixed(2)}`}
                        className="col-span-3 sm:col-span-3"
                      />
                    </div>
                  )
                })}
              </div>
              {/* Controles de navegación entre páginas (arriba/abajo) */}
              {pages.length > 1 && (
                <div className="flex items-center justify-between mt-3">
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

          {/* Botón degradado: Agregar producto */}
          <section className="snap-start mt-4">
            <button
              type="button"
              onClick={() => {
                addProd()
                // salta a la última página si se creó una nueva
                setTimeout(() => goTo(pages.length), 0)
              }}
              className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-400 via-fuchsia-500 to-purple-500 shadow-sm"
            >
              Agregar Producto
            </button>
          </section>

          {/* Slide final: Resumen */}
          <section className="snap-start mt-8 pb-2">
            <LabelSection>Resumen</LabelSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-3">
              <Field small label="Cantidad de productos">
                <InputGreen readOnly value={resumen.cantidad || ''} placeholder="Cant." />
              </Field>
              <Field small label="Total final">
                <InputGreen readOnly value={`$${resumen.total.toFixed(2)}`} placeholder="$0.00" />
              </Field>
            </div>
          </section>
        </div>

        {/* Botones pie fuera del área scrolleable (siempre visibles) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            type="submit"
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600 shadow-sm"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500 shadow-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </ModalFactura>
  )
}

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

function InputGreen({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={
        'h-11 w-full rounded-xl px-3 ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 placeholder-neutral-400 outline-none ' +
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

/* Utilidad para dividir en páginas */
function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out.length ? out : [[]]
}
