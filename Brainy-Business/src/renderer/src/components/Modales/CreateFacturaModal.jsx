// src/renderer/src/components/Modales/CreateFacturaModal.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import ModalFactura from './ModalFactura.jsx'
import { createInvoice, listDescuentos } from '../../api'
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

          // VALIDACIÓN DE STOCK
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

  // Subtotal de productos (Antes de descuentos)
  const subtotalProductos = useMemo(() => {
    return prods.reduce((a, b) => a + totalFila(b), 0)
  }, [prods])

  const cantidadProductos = useMemo(() => {
    return prods.reduce((a, b) => a + Number(b.cant || 0), 0)
  }, [prods])

  /* ---------- LÓGICA DE DESCUENTOS ---------- */
  const [dbDescuentos, setDbDescuentos] = useState([]) // Lista cargada de la BD
  const [appliedDescuentos, setAppliedDescuentos] = useState([]) // Descuentos aplicados a esta factura
  const [qDesc, setQDesc] = useState('') // Buscador descuentos
  const [showManualDesc, setShowManualDesc] = useState(false) // Toggle form manual
  const [manualDesc, setManualDesc] = useState({ tipo: 'Porcentual', cantidad: '' })

  // Cargar descuentos al abrir
  useEffect(() => {
    if (open) {
      listDescuentos()
        .then((data) => setDbDescuentos(data.filter((d) => d.activo)))
        .catch((err) => console.error('Error cargando descuentos:', err))
    }
  }, [open])

  // Filtrar descuentos para el buscador
  const filteredDescuentos = useMemo(() => {
    if (!qDesc.trim()) return []
    return dbDescuentos.filter((d) => d.nombre.toLowerCase().includes(qDesc.toLowerCase()))
  }, [qDesc, dbDescuentos])

  // Agregar descuento (DB o Manual)
  const addDiscount = (desc) => {
    setAppliedDescuentos((prev) => [...prev, desc])
    setQDesc('')
    setManualDesc({ tipo: 'Porcentual', cantidad: '' })
    setShowManualDesc(false)
  }

  // Eliminar descuento aplicado
  const removeDiscount = (idx) => {
    setAppliedDescuentos((prev) => prev.filter((_, i) => i !== idx))
  }

  // CALCULO DEL TOTAL FINAL Y VALOR DESCONTADO
  const { valorDescuentoTotal, totalFinal } = useMemo(() => {
    let totalDesc = 0

    appliedDescuentos.forEach((d) => {
      let val = 0
      const amount = Number(d.cantidad)
      if (d.tipo === 'Porcentual') {
        // Porcentaje sobre el subtotal de productos
        val = subtotalProductos * (amount / 100)
      } else {
        // Monto fijo
        val = amount
      }
      totalDesc += val
    })

    // Validar que no sea negativo
    // Si el descuento es mayor al subtotal, el descuento real es igual al subtotal (Total = 0)
    const realDiscount = Math.min(totalDesc, subtotalProductos)
    const final = subtotalProductos - realDiscount

    return {
      valorDescuentoTotal: realDiscount,
      totalFinal: Math.max(0, final)
    }
  }, [subtotalProductos, appliedDescuentos])

  /* ---------- Paginación vertical (snap) ---------- */
  const pages = chunk(prods, PAGE_SIZE)
  const [pageIdx, setPageIdx] = useState(0)
  const pageRefs = useRef([])
  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(idx, pages.length - 1))
    setPageIdx(clamped)
    pageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* ---------- Buscador Productos ---------- */
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
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/api/products?q=${text}&scope=billing`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) throw new Error('Error buscando productos')
        const rows = await response.json()

        const mapped = rows.map((r) => ({
          pid: r.id_producto || r.id,
          nombre: r.nombre,
          precio: Number(r.precio ?? r.precio_unit ?? 0),
          codigo: r.codigo,
          categoria: r.categoria,
          es_servicio: r.es_servicio === true || String(r.es_servicio) === 'true',
          lotes: r.lotes || [],
          existencias:
            r.es_servicio === true || String(r.es_servicio) === 'true'
              ? 999999
              : Number(r.existencias ?? r.stock ?? 0),
          imagen: r.imagen
        }))

        const needle = text.toLowerCase()
        const local = mapped.filter((r) => {
          const n = (r.nombre || '').toLowerCase()
          const c = (r.categoria || '').toLowerCase()
          const cod = String(r.codigo || '')
          return n.includes(needle) || c.includes(needle) || cod.includes(text)
        })

        if (alive) setResults(local.slice(0, 50))
      } catch (e) {
        console.error(e)
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

  const agregarProductoAlEstado = (item, maxStockDisp, loteId = null, nombreDisplay = '') => {
    setProds((arr) => {
      const idx = arr.findIndex(
        (p) => p.pid === item.pid && p.lote_id == loteId && p.es_servicio === item.es_servicio
      )

      if (idx !== -1) {
        const copy = [...arr]
        const currentCant = Number(copy[idx].cant || 0)
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

      return [
        ...arr,
        {
          pid: item.pid,
          lote_id: loteId,
          cant: 1,
          nombre: item.nombre + nombreDisplay,
          precio: item.precio,
          es_servicio: item.es_servicio,
          maxStock: item.es_servicio ? null : maxStockDisp
        }
      ]
    })
    setQ('')
    setResults([])
    setTimeout(() => goTo(pages.length), 0)
  }

  const addFromSearch = async (item) => {
    if (!item.es_servicio && item.lotes && item.lotes.length > 0) {
      const inputOptions = {}
      item.lotes.forEach((l) => {
        if (Number(l.cantidad) > 0) {
          inputOptions[l.id] =
            `Lote: ${l.lote} (Vence: ${l.vencimiento || '—'}) - Disp: ${l.cantidad}`
        }
      })

      if (Object.keys(inputOptions).length === 0) {
        return Swal.fire({
          icon: 'error',
          title: 'Lotes Agotados',
          text: 'Este producto tiene lotes registrados, pero todos están en 0.',
          confirmButtonColor: '#ef4444'
        })
      }

      const { value: loteId } = await Swal.fire({
        title: 'Selecciona el Lote',
        text: `El producto "${item.nombre}" maneja lotes.`,
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Selecciona un lote',
        showCancelButton: true,
        confirmButtonColor: '#11A5A3',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => !value && 'Debes seleccionar un lote'
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

    if (!item.es_servicio && item.existencias <= 0) {
      return Swal.fire({
        icon: 'error',
        title: '¡Agotado!',
        text: 'Este producto no tiene existencias disponibles.',
        confirmButtonColor: '#ef4444'
      })
    }

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

    if (prods.length === 0 || totalFinal < 0) {
      // Permitimos 0 si es 100% descuento
      return Swal.fire({
        icon: 'warning',
        title: 'Factura Inválida',
        text: 'Verifica los productos y descuentos.',
        confirmButtonColor: '#11A5A3'
      })
    }

    try {
      setSubmitting(true)

      // Decidimos qué ID de descuento enviar:
      // Si hay SOLO UN descuento aplicado y viene de la BD (tiene ID), lo mandamos.
      // Si son varios, o son manuales, mandamos null (pero el valor_descuento siempre va).
      const singleDbDiscount =
        appliedDescuentos.length === 1 && appliedDescuentos[0].id ? appliedDescuentos[0].id : null

      const saved = await createInvoice({
        cliente: f.cliente.trim(),
        direccion: f.direccion.trim(),
        dui: f.dui.trim(),
        nit: f.nit.trim(),
        condiciones: f.condiciones.trim(),
        ventaCuentaDe: f.ventaCuentaDe?.trim() || null,
        tipo_de_pago: f.tipo_de_pago,
        productos: prods,

        // DATOS DE DESCUENTO
        descuento_id: singleDbDiscount,
        valor_descuento: valorDescuentoTotal
      })

      onCreate?.(saved)

      // Limpieza
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
      setAppliedDescuentos([]) // Limpiar descuentos
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
        <div className="max-h-[60vh] overflow-y-auto snap-y snap-mandatory pr-2 pb-10">
          {/* 1. Datos Cliente */}
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
              <Field label="Condiciones">
                <InputGreen
                  value={f.condiciones}
                  onChange={(e) => up('condiciones', e.target.value)}
                  placeholder="Pago inmediato..."
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

          {/* 2. Productos */}
          <section className="snap-start mt-8">
            <LabelSection>Productos</LabelSection>

            {/* Buscador Productos */}
            <div className="relative mt-3 z-20">
              <div className="flex items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar producto..."
                  className="h-9 w-full rounded-full px-4 text-sm ring-1 ring-neutral-200 bg-white outline-none focus:ring-emerald-500"
                />
                <div className="h-9 w-9 rounded-full grid place-items-center bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  {busy ? '…' : '🔍'}
                </div>
              </div>
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-56 overflow-auto bg-white rounded-xl ring-1 ring-neutral-200 shadow-xl">
                  {results.map((r) => (
                    <button
                      key={`${r.pid}-${r.es_servicio ? 's' : 'p'}`}
                      type="button"
                      onClick={() => addFromSearch(r)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex justify-between items-center border-b border-neutral-50 last:border-0"
                    >
                      <span className="font-medium text-gray-800">{r.nombre}</span>
                      <div className="flex items-center gap-2">
                        {r.es_servicio ? (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                            SERV
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Stock: {r.existencias}</span>
                        )}
                        <span className="font-bold text-emerald-600 ml-2">
                          ${Number(r.precio).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla Productos */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-12 gap-3 text-xs font-bold text-gray-500 uppercase px-2">
                <div className="col-span-2">Cant</div>
                <div className="col-span-5">Descripción</div>
                <div className="col-span-2">Precio</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1"></div>
              </div>

              {pages.map((rows, idx) => (
                <div key={idx} ref={(el) => (pageRefs.current[idx] = el)} className="space-y-2">
                  {rows.map((p, i) => {
                    const globalIndex = idx * PAGE_SIZE + i
                    return (
                      <div
                        key={globalIndex}
                        className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100"
                      >
                        <InputGreen
                          type="number"
                          min="0"
                          max={p.maxStock || 999999}
                          value={p.cant}
                          onChange={(e) => setProd(globalIndex, 'cant', e.target.value)}
                          className="col-span-2 bg-white text-center font-bold"
                        />
                        <div className="col-span-5 relative">
                          <InputGreen
                            value={p.nombre}
                            onChange={(e) => setProd(globalIndex, 'nombre', e.target.value)}
                            className="w-full bg-white"
                          />
                          {p.es_servicio && (
                            <span className="absolute right-2 top-2 text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-bold">
                              SERV
                            </span>
                          )}
                        </div>
                        <InputGreen
                          type="number"
                          step="0.01"
                          value={p.precio}
                          onChange={(e) => setProd(globalIndex, 'precio', e.target.value)}
                          className="col-span-2 bg-white text-right"
                        />
                        <div className="col-span-2 text-right font-medium text-gray-700 pt-2">
                          ${(totalFila(p) || 0).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(globalIndex)}
                          className="col-span-1 flex justify-center text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  addEmptyRow()
                  setTimeout(() => goTo(pages.length), 0)
                }}
                className="w-full py-2 mt-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-emerald-400 hover:text-emerald-500 transition-colors text-sm font-medium"
              >
                + Agregar fila vacía
              </button>
            </div>
          </section>

          {/* 3. DESCUENTOS (NUEVA SECCIÓN) */}
          <section className="snap-start mt-8">
            <div className="flex justify-between items-center mb-2">
              <LabelSection>Descuentos</LabelSection>
              <button
                type="button"
                onClick={() => setShowManualDesc(!showManualDesc)}
                className="text-sm text-emerald-600 font-medium hover:underline"
              >
                {showManualDesc ? 'Ocultar Manual' : '+ Agregar Manual'}
              </button>
            </div>

            {/* Buscador de Descuentos */}
            {!showManualDesc && (
              <div className="relative mb-3 z-10">
                <input
                  value={qDesc}
                  onChange={(e) => setQDesc(e.target.value)}
                  placeholder="Buscar descuento guardado..."
                  className="h-9 w-full rounded-full px-4 text-sm ring-1 ring-neutral-200 bg-white outline-none focus:ring-emerald-500"
                />
                {filteredDescuentos.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-40 overflow-auto bg-white rounded-xl ring-1 ring-neutral-200 shadow-xl">
                    {filteredDescuentos.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => addDiscount(d)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex justify-between"
                      >
                        <span>{d.nombre}</span>
                        <span className="font-bold text-blue-600">
                          {d.tipo === 'Porcentual'
                            ? `${d.cantidad}%`
                            : `$${Number(d.cantidad).toFixed(2)}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Formulario Manual */}
            {showManualDesc && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-3 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold text-blue-800 ml-1">Tipo</label>
                  <select
                    value={manualDesc.tipo}
                    onChange={(e) => setManualDesc({ ...manualDesc, tipo: e.target.value })}
                    className="w-full h-9 rounded-lg border-blue-200 text-sm px-2 outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="Porcentual">Porcentual (%)</option>
                    <option value="Monetario">Monetario ($)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-blue-800 ml-1">Cantidad</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualDesc.cantidad}
                    onChange={(e) => setManualDesc({ ...manualDesc, cantidad: e.target.value })}
                    className="w-full h-9 rounded-lg border border-blue-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (Number(manualDesc.cantidad) > 0) {
                      addDiscount({
                        nombre: 'Descuento Manual',
                        tipo: manualDesc.tipo,
                        cantidad: Number(manualDesc.cantidad),
                        isManual: true
                      })
                    }
                  }}
                  className="h-9 px-4 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                >
                  Agregar
                </button>
              </div>
            )}

            {/* Lista de Descuentos Aplicados */}
            <div className="space-y-2">
              {appliedDescuentos.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-white p-2 rounded-lg border border-neutral-200 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">↓</span>
                    <span className="font-medium text-gray-700">{d.nombre}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-bold ${d.tipo === 'Porcentual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {d.tipo === 'Porcentual'
                        ? `${d.cantidad}%`
                        : `$${Number(d.cantidad).toFixed(2)}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDiscount(i)}
                    className="text-neutral-400 hover:text-red-500 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {appliedDescuentos.length === 0 && (
                <p className="text-center text-xs text-gray-400 italic py-2">
                  No hay descuentos aplicados
                </p>
              )}
            </div>
          </section>

          {/* 4. Resumen Final */}
          <section className="snap-start mt-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <LabelSection>Resumen Financiero</LabelSection>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Productos ({cantidadProductos}):</span>
                <span>${subtotalProductos.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-red-600 font-medium">
                <span>Descuento Total:</span>
                <span>- ${valorDescuentoTotal.toFixed(2)}</span>
              </div>

              <div className="h-px bg-gray-300 my-2"></div>

              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total a Pagar:</span>
                <span className="text-emerald-600">${totalFinal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Método de Pago
              </label>
              <SelectGreen
                value={f.tipo_de_pago}
                onChange={(e) => up('tipo_de_pago', e.target.value)}
                className="bg-white border border-gray-300 mt-0 h-10"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta de credito">Tarjeta de Crédito</option>
              </SelectGreen>
            </div>
          </section>
        </div>

        {/* Footer Botones */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-12 rounded-xl text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Procesando...' : `Cobrar $${totalFinal.toFixed(2)}`}
          </button>
        </div>
      </form>
    </ModalFactura>
  )
}

/* ---------- UI helpers ---------- */
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function LabelSection({ children }) {
  return (
    <div>
      <p className="font-bold text-gray-800 text-base">{children}</p>
      <div className="mt-1 h-1 w-12 bg-emerald-500 rounded-full" />
    </div>
  )
}

function InputGreen({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-lg px-3 border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 ${className}`}
    />
  )
}

function SelectGreen({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-lg px-3 border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer ${className}`}
    >
      {children}
    </select>
  )
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out.length ? out : [[]]
}
