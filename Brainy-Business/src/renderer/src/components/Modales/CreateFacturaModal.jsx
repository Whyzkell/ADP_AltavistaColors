// src/renderer/src/components/Modales/CreateFacturaModal.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import ModalFactura from './ModalFactura.jsx'
import { createInvoice } from '../../api'
import Swal from 'sweetalert2'

// <--- URL para cargar las fotos
const API_BASE = 'http://localhost:3001'

// Agregamos lote_id y es_servicio al objeto vacío
const emptyProd = {
  pid: null,
  cant: 0,
  nombre: '',
  precio: 0,
  maxStock: null,
  lote_id: null,
  es_servicio: false
}
const PAGE_SIZE = 6

export default function CreateInvoiceModal({ open, onClose, onCreate }) {
  /* ---------- Datos de factura ---------- */
  const [f, setF] = useState({
    cliente: '',
    direccion: '',
    ventaCuentaDe: '',
    dui: '',
    condiciones: '',
    nit: '',
    tipo_de_pago: 'Efectivo'
  })
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))

  /* ---------- Productos de la factura ---------- */
  const [prods, setProds] = useState([{ ...emptyProd }])

  const setProd = (i, k, v) => {
    setProds((arr) =>
      arr.map((p, idx) => {
        if (idx !== i) return p

        if (k === 'cant') {
          let val = Number.isNaN(Number(v)) ? 0 : Number(v)

          // VALIDACIÓN DE STOCK:
          // Solo validamos si maxStock TIENE un valor numérico.
          // Si es un servicio (es_servicio=true), maxStock es null, así que no entra aquí.
          if (p.maxStock !== null && p.maxStock !== undefined) {
            if (val > p.maxStock) {
              Swal.fire({
                icon: 'warning',
                title: 'Stock Alcanzado',
                text: `Solo hay ${p.maxStock} unidades disponibles de "${p.nombre}".`,
                confirmButtonColor: '#11A5A3'
              })
              val = p.maxStock
            }
          }
          return { ...p, cant: val }
        }

        return { ...p, [k]: k === 'nombre' ? v : Number.isNaN(Number(v)) ? v : Number(v) }
      })
    )
  }

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

        // 1. Obtenemos el token para autenticarnos
        const token = localStorage.getItem('token')

        // 2. Hacemos el fetch DIRECTO enviando scope=billing
        const response = await fetch(`${API_BASE}/api/products?q=${text}&scope=billing`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 401) throw new Error('Sesión expirada')
          throw new Error('Error buscando productos')
        }

        const rows = await response.json()

        console.log('--- [DEBUG 2] FRONTEND RECIBE SEARCH ---')
        if (rows.length > 0) {
          console.log('Item crudo desde API:', rows[0])
        }

        // 3. Mapeamos la respuesta
        const mapped = rows.map((r) => ({
          pid: r.id_producto || r.id, // Aseguramos tomar el ID correcto
          nombre: r.nombre,
          precio: Number(r.precio ?? r.precio_unit ?? 0),
          codigo: r.codigo,
          categoria: r.categoria,

          // --- AQUÍ RECIBIMOS LA ETIQUETA VIRTUAL DEL BACKEND ---
          es_servicio: r.es_servicio === true || String(r.es_servicio) === 'true',

          lotes: r.lotes || [],
          // Si es servicio, stock infinito visual (999999). Si es producto, su stock real.
          existencias:
            r.es_servicio === true || String(r.es_servicio) === 'true'
              ? 999999
              : Number(r.existencias ?? r.stock ?? 0),
          imagen: r.imagen
        }))

        // Filtro local adicional por seguridad visual
        const needle = text.toLowerCase()
        const local = mapped.filter((r) => {
          const n = (r.nombre || '').toLowerCase()
          const c = (r.categoria || '').toLowerCase()
          const cod = String(r.codigo || '')
          return n.includes(needle) || c.includes(needle) || cod.includes(text)
        })

        if (alive) setResults(local.slice(0, 50))
      } catch (e) {
        console.error('Buscador error:', e)
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

  /* ------------------------------------------------------------------
     LÓGICA PRINCIPAL DE AGREGAR PRODUCTO (Servicios + Lotes)
     ------------------------------------------------------------------ */
  const agregarProductoAlEstado = (item, maxStockDisp, loteId = null, nombreDisplay = '') => {
    setProds((arr) => {
      // Buscamos coincidencia exacta: mismo ID, mismo lote y mismo tipo (servicio/producto)
      const idx = arr.findIndex(
        (p) => p.pid === item.pid && p.lote_id == loteId && p.es_servicio === item.es_servicio
      )

      if (idx !== -1) {
        // YA EXISTE: Sumamos 1
        const copy = [...arr]
        const currentCant = Number(copy[idx].cant || 0)

        // Solo validamos stock si NO es servicio
        if (!item.es_servicio && currentCant + 1 > maxStockDisp) {
          Swal.fire({
            icon: 'warning',
            title: 'Límite de Stock',
            text: `No puedes agregar más. Solo hay ${maxStockDisp} disponibles.`,
            confirmButtonColor: '#11A5A3'
          })
          return copy
        }

        copy[idx] = {
          ...copy[idx],
          cant: currentCant + 1,
          maxStock: item.es_servicio ? null : maxStockDisp
        }
        return copy
      }

      // NO EXISTE: Agregamos nuevo
      return [
        ...arr,
        {
          pid: item.pid,
          lote_id: loteId,
          cant: 1,
          nombre: item.nombre + nombreDisplay,
          precio: item.precio,
          es_servicio: item.es_servicio, // <--- GUARDAMOS LA ETIQUETA IMPORTANTE
          maxStock: item.es_servicio ? null : maxStockDisp
        }
      ]
    })

    setQ('')
    setResults([])
    setTimeout(() => goTo(pages.length), 0)
  }

  const addFromSearch = async (item) => {
    // CASO A: Es un producto con LOTES
    if (!item.es_servicio && item.lotes && item.lotes.length > 0) {
      const inputOptions = {}

      // Filtramos solo lotes con cantidad > 0
      item.lotes.forEach((l) => {
        if (Number(l.cantidad) > 0) {
          inputOptions[l.id] =
            `Lote: ${l.lote} (Vence: ${l.vencimiento || '—'}) - Disp: ${l.cantidad}`
        }
      })

      // Si todos los lotes están vacíos
      if (Object.keys(inputOptions).length === 0) {
        return Swal.fire({
          icon: 'error',
          title: 'Lotes Agotados',
          text: 'Este producto tiene lotes registrados, pero todos están en 0.',
          confirmButtonColor: '#ef4444'
        })
      }

      // Popup para seleccionar lote
      const { value: loteId } = await Swal.fire({
        title: 'Selecciona el Lote',
        text: `El producto "${item.nombre}" maneja lotes.`,
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Selecciona un lote',
        showCancelButton: true,
        confirmButtonColor: '#11A5A3',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          return !value && 'Debes seleccionar un lote'
        }
      })

      if (!loteId) return

      const loteSeleccionado = item.lotes.find((l) => String(l.id) === String(loteId))

      agregarProductoAlEstado(
        item,
        loteSeleccionado.cantidad,
        loteId,
        ` (${loteSeleccionado.lote})`
      )
      return
    }

    // CASO B: Producto sin lotes sin stock
    if (!item.es_servicio && item.existencias <= 0) {
      return Swal.fire({
        icon: 'error',
        title: '¡Agotado!',
        text: 'Este producto no tiene existencias disponibles.',
        confirmButtonColor: '#ef4444'
      })
    }

    // CASO C: Servicio o Producto con stock
    agregarProductoAlEstado(item, item.existencias, null, '')
  }

  /* ---------- Submit ---------- */
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!f.cliente.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Ingresa el nombre del cliente',
        confirmButtonColor: '#11A5A3'
      })
    }

    if (prods.length === 0 || resumen.total <= 0) {
      return Swal.fire({
        icon: 'warning',
        title: 'Factura Vacía',
        text: 'Agrega al menos 1 producto con monto válido',
        confirmButtonColor: '#11A5A3'
      })
    }

    console.log('--- [DEBUG 3] FRONTEND ENVIA ---')
    console.log(
      'Lista de productos a enviar:',
      prods.map((p) => ({
        nombre: p.nombre,
        es_servicio: p.es_servicio,
        tipo_dato: typeof p.es_servicio
      }))
    )

    try {
      setSubmitting(true)
      const saved = await createInvoice({
        cliente: f.cliente.trim(),
        direccion: f.direccion.trim(),
        dui: f.dui.trim(),
        nit: f.nit.trim(),
        condiciones: f.condiciones.trim(),
        ventaCuentaDe: f.ventaCuentaDe?.trim() || null,
        tipo_de_pago: f.tipo_de_pago,
        productos: prods // Enviamos los productos con la etiqueta es_servicio
      })

      onCreate?.(saved)

      // Limpieza post-guardado
      setF({
        cliente: '',
        direccion: '',
        ventaCuentaDe: '',
        dui: '',
        condiciones: '',
        nit: '',
        tipo_de_pago: 'Efectivo'
      })
      setProds([{ ...emptyProd }])
      setQ('')
      setResults([])
      onClose?.()
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'Ocurrió un error al crear la factura',
        confirmButtonColor: '#11A5A3'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalFactura open={open} onClose={onClose} title="Crear Factura">
      <form onSubmit={handleSubmit} className="space-y-8">
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
                      key={`${r.pid}-${r.es_servicio ? 's' : 'p'}`}
                      type="button"
                      onClick={() => addFromSearch(r)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* IMAGEN EN EL BUSCADOR */}
                        <div className="h-9 w-9 rounded bg-neutral-100 flex-shrink-0 overflow-hidden border border-neutral-200">
                          {r.imagen ? (
                            <img
                              src={`${API_BASE}/uploads/${r.imagen}`}
                              className="h-full w-full object-cover"
                              alt=""
                              onError={(e) => (e.target.style.display = 'none')}
                            />
                          ) : (
                            <span className="grid place-items-center h-full w-full text-[10px] text-neutral-400">
                              📷
                            </span>
                          )}
                        </div>

                        <span className="truncate">
                          <span className="font-medium">{r.nombre}</span>
                          {r.categoria ? (
                            <span className="text-neutral-400"> • {r.categoria}</span>
                          ) : null}

                          {/* ETIQUETAS VISUALES EN BUSCADOR */}
                          {r.es_servicio ? (
                            <span className="text-xs text-purple-600 ml-2 font-bold bg-purple-50 px-1 rounded">
                              (Servicio)
                            </span>
                          ) : (
                            <span className="text-xs text-blue-600 ml-2 font-bold">
                              (Stock: {r.existencias})
                              {r.lotes && r.lotes.length > 0 && (
                                <span className="text-amber-600 ml-1">[Lotes]</span>
                              )}
                            </span>
                          )}
                        </span>
                      </div>

                      <span className="ml-3 text-neutral-700 font-medium">
                        ${Number(r.precio).toFixed(2)}
                      </span>
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
                        // Si es servicio, input sin límite (999999). Si es producto, su stock.
                        max={p.maxStock || 999999}
                        value={p.cant}
                        onChange={(e) => setProd(globalIndex, 'cant', e.target.value)}
                        placeholder="Cant."
                        className="col-span-2"
                        title={
                          p.maxStock ? `Máximo disponible: ${p.maxStock}` : 'Servicio / Ilimitado'
                        }
                      />

                      <div className="col-span-4 sm:col-span-5 relative">
                        <InputGreen
                          value={p.nombre}
                          onChange={(e) => setProd(globalIndex, 'nombre', e.target.value)}
                          placeholder="Brocha"
                          className="w-full"
                        />
                        {/* Etiqueta flotante de stock o servicio */}
                        {p.maxStock !== null && !p.es_servicio && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 bg-white px-1 border border-neutral-100 rounded">
                            Max: {p.maxStock}
                          </span>
                        )}
                        {p.es_servicio && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-purple-600 bg-purple-50 px-1 font-bold border border-purple-100 rounded">
                            SERV
                          </span>
                        )}
                      </div>

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

          <section className="snap-start mt-8 pb-2">
            <LabelSection>Tipo de pago</LabelSection>
            <div className="mb-3"></div>
            <Field>
              <SelectGreen
                value={f.tipo_de_pago}
                onChange={(e) => up('tipo_de_pago', e.target.value)}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta de credito">Tarjeta de Crédito</option>
              </SelectGreen>
            </Field>
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
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-[#11A5A3] shadow-sm disabled:opacity-60"
          >
            {submitting ? 'Creando…' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-[#Da2864] shadow-sm"
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

function SelectGreen({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={
        'h-11 w-full rounded-xl px-3 ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 outline-none appearance-none mt-4' +
        className
      }
    >
      {children}
    </select>
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
