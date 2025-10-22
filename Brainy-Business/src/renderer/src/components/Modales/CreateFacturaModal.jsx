// src/renderer/src/Modales/CreateFacturaModal.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import ModalFactura from './ModalFactura.jsx'
import { fetchProducts, createInvoice } from '../../api'

const emptyProd = { pid: null, cant: 0, nombre: '', precio: 0 }
const PAGE_SIZE = 6

export default function CreateInvoiceModal({ open, onClose, onCreate }) {
  /* ---------- Datos de factura ---------- */
  const [f, setF] = useState({
    cliente: '',
    direccion: '',
    ventaCuentaDe: '',
    dui: '',
    condiciones: '',
    nit: ''
  })
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))

  /* ---------- Productos de la factura ---------- */
  const [prods, setProds] = useState([{ ...emptyProd }])
  const setProd = (i, k, v) =>
    setProds((arr) =>
      arr.map((p, idx) =>
        idx === i ? { ...p, [k]: k === 'nombre' ? v : Number.isNaN(Number(v)) ? v : Number(v) } : p
      )
    )
  const addEmptyRow = () => setProds((p) => [...p, { ...emptyProd }])
  const removeRow = (i) => setProds((arr) => arr.filter((_, idx) => idx !== i))

  const totalFila = (p) => Number(p.cant || 0) * Number(p.precio || 0)

  const resumen = useMemo(() => {
    const cantidad = prods.reduce((a, b) => a + Number(b.cant || 0), 0)
    const total = prods.reduce((a, b) => a + totalFila(b), 0)
    return { cantidad, total }
  }, [prods])

  /* ---------- Paginación vertical (snap) ---------- */
  const pages = chunk(prods, PAGE_SIZE)
  const [pageIdx, setPageIdx] = useState(0)
  const pageRefs = useRef([])
  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(idx, pages.length - 1))
    setPageIdx(clamped)
    pageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* ---------- Buscador con autocompletado ---------- */
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState([])

  useEffect(() => {
    let alive = true
    const text = q.trim()
    if (text.length < 2) {
      setResults([])
      return
    }

    const t = setTimeout(async () => {
      try {
        setBusy(true)
        const rows = await fetchProducts(text)

        // Filtro local por si el backend no filtró
        const needle = text.toLowerCase()
        const local = rows.filter((r) => {
          const nombre = (r.nombre ?? '').toLowerCase()
          const cat = (r.categoria ?? '').toLowerCase()
          const codigo = String(r.codigo ?? '')
          return nombre.includes(needle) || cat.includes(needle) || codigo.includes(text)
        })

        const mapped = local.map((r) => ({
          pid: r.id ?? r.id_producto,
          nombre: r.nombre,
          precio: Number(r.precio ?? r.precio_unit ?? 0),
          codigo: r.codigo,
          categoria: r.categoria
        }))

        if (alive) setResults(mapped.slice(0, 50))
      } catch (e) {
        console.error('fetchProducts(q) error:', e)
        if (alive) setResults([])
      } finally {
        if (alive) setBusy(false)
      }
    }, 250)

    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q])

  const addFromSearch = (item) => {
    setProds((arr) => {
      const idx = arr.findIndex((p) => p.pid && p.pid === item.pid)
      if (idx !== -1) {
        const copy = [...arr]
        copy[idx] = { ...copy[idx], cant: Number(copy[idx].cant || 0) + 1 }
        return copy
      }
      return [...arr, { pid: item.pid, cant: 1, nombre: item.nombre, precio: item.precio }]
    })
    setQ('')
    setResults([])
    setTimeout(() => goTo(pages.length), 0)
  }

  /* ---------- Submit (crea en backend) ---------- */
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!f.cliente.trim()) return alert('Ingresa el nombre del cliente')
    if (prods.length === 0 || resumen.total <= 0)
      return alert('Agrega al menos 1 producto con monto válido')

    // Llama a la API
    const saved = await createInvoice({
      cliente: f.cliente.trim(),
      direccion: f.direccion.trim(),
      dui: f.dui.trim(),
      nit: f.nit.trim(),
      condiciones: f.condiciones.trim(),
      ventaCuentaDe: f.ventaCuentaDe?.trim() || null,
      productos: prods // los mismos del estado [{pid,cant,nombre,precio}]
    })

    // Si quieres reflejarlo en la UI del listado:
    onCreate?.(saved)

    // Reset
    setF({ cliente: '', direccion: '', ventaCuentaDe: '', dui: '', condiciones: '', nit: '' })
    setProds([{ ...emptyProd }])
    setQ('')
    setResults([])
    onClose?.()
  }

  return (
    <ModalFactura open={open} onClose={onClose} title="Crear Factura">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contenido scrolleable */}
        <div className="max-h-[55vh] overflow-y-auto snap-y snap-mandatory pr-1">
          {/* Datos del cliente */}
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
                  placeholder="XXXXXXXX-X"
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
                  placeholder="XXXXXXXX-X"
                />
              </Field>
            </div>
          </section>

          {/* Productos */}
          <section className="snap-start mt-8">
            <LabelSection>Productos</LabelSection>

            {/* Buscador con sugerencias */}
            <div className="relative mt-3">
              <div className="flex items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar producto por nombre / categoría / código"
                  className="h-9 w-full rounded-full px-4 text-sm ring-1 ring-neutral-200 bg-white outline-none"
                />
                <button
                  type="button"
                  className="h-9 w-9 rounded-full grid place-items-center bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  title="Buscar"
                >
                  {busy ? (
                    '…'
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3-3" />
                    </svg>
                  )}
                </button>
              </div>

              {results.length > 0 && (
                <div className="absolute z-10 mt-2 w-full max-h-56 overflow-auto bg-white rounded-xl ring-1 ring-neutral-200 shadow-lg">
                  {results.map((r) => (
                    <button
                      key={r.pid}
                      type="button"
                      onClick={() => addFromSearch(r)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center justify-between"
                    >
                      <span className="truncate">
                        <span className="font-medium">{r.nombre}</span>
                        {r.categoria ? (
                          <span className="text-neutral-400"> • {r.categoria}</span>
                        ) : null}
                        {r.codigo ? <span className="text-neutral-400"> • {r.codigo}</span> : null}
                      </span>
                      <span className="ml-3 text-neutral-700">${Number(r.precio).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header columnas */}
            <div className="grid grid-cols-12 gap-3 text-sm text-neutral-600 mt-4">
              <div className="col-span-2">Cantidad</div>
              <div className="col-span-4 sm:col-span-5">Nombre</div>
              <div className="col-span-3 sm:col-span-2">Precio unitario</div>
              <div className="col-span-3 sm:col-span-3">Total</div>
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
                    <div key={globalIndex} className="grid grid-cols-12 gap-2 items-center">
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
                        className="col-span-2 sm:col-span-2"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(globalIndex)}
                        className="col-span-1 text-rose-600 hover:text-rose-700"
                        title="Eliminar fila"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>

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

          {/* Agregar fila manualmente */}
          <section className="snap-start mt-4">
            <button
              type="button"
              onClick={() => {
                addEmptyRow()
                setTimeout(() => goTo(pages.length), 0)
              }}
              className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-400 via-fuchsia-500 to-purple-500 shadow-sm"
            >
              Agregar Producto
            </button>
          </section>

          {/* Resumen */}
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

        {/* Botonera inferior */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600 shadow-sm disabled:opacity-60"
          >
            {submitting ? 'Creando…' : 'Crear'}
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

/* ---------- UI helpers ---------- */
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

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out.length ? out : [[]]
}
