// src/renderer/src/components/Modales/CreateCreditoFiscalModal.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { fetchProducts, createCreditoFiscal } from '../../api'
import Swal from 'sweetalert2' // <--- IMPORTAMOS SWAL

// <--- URL para cargar las fotos
const API_BASE = 'http://localhost:3001'

/* ---------- Modal genérico ---------- */
function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-10 px-4 sm:px-6">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-black">{title}</h3>
            <div className="mt-2 h-1 w-20 bg-neutral-900 rounded" />
            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Helpers de UI ---------- */
const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    {children}
  </div>
)

const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={
      'w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-purple-50/40 text-neutral-800 placeholder-neutral-400 outline-none ' +
      className
    }
  />
)

const emptyProd = { pid: null, cant: 0, nombre: '', precio: 0, maxStock: null }

/* =======================================================
   Modal COMPLETO de Crédito Fiscal
   ======================================================= */
export default function CreateCreditoFiscalModal({ open, onClose, onCreate }) {
  /* ------- Datos generales ------- */
  const [f, setF] = useState({
    cliente: '',
    direccion: '',
    municipio: '',
    nrc: '',
    departamento: '',
    nit: '',
    condiciones: '',
    notaAnterior: '',
    ventaCuentaDe: '',
    fechaNotaAnterior: '',
    entregadoPor: '',
    recibidoPor: '',
    duiEntregado: '',
    duiRecibido: ''
  })
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))

  /* ------- Productos estilo factura ------- */
  const [prods, setProds] = useState([{ ...emptyProd }])

  const setProd = (i, k, v) =>
    setProds((arr) =>
      arr.map((p, idx) => {
        if (idx !== i) return p

        if (k === 'cant') {
          let val = Number.isNaN(Number(v)) ? 0 : Number(v)

          if (p.maxStock !== null && p.maxStock !== undefined) {
            if (val > p.maxStock) {
              // REEMPLAZO 1: Alerta de stock manual
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

        return {
          ...p,
          [k]: k === 'nombre' ? v : Number.isNaN(Number(v)) ? 0 : Number(v)
        }
      })
    )

  const addEmptyRow = () => setProds((p) => [...p, { ...emptyProd }])
  const removeRow = (i) => setProds((arr) => arr.filter((_, idx) => idx !== i))
  const totalFila = (p) => Number(p.cant || 0) * Number(p.precio || 0)

  // Solo filas válidas
  const validProds = useMemo(
    () => prods.filter((p) => p?.nombre?.trim() && Number(p.cant) > 0 && Number(p.precio) >= 0),
    [prods]
  )

  /* ------- Buscador de productos con sugerencias ------- */
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
        const needle = text.toLowerCase()

        const mapped = (rows || [])
          .filter((r) => {
            const nombre = (r.nombre ?? '').toLowerCase()
            const cat = (r.categoria ?? '').toLowerCase()
            const codigo = String(r.codigo ?? '')
            return nombre.includes(needle) || cat.includes(needle) || codigo.includes(text)
          })
          .map((r) => ({
            pid: r.id ?? r.id_producto,
            nombre: r.nombre,
            precio: Number(r.precio ?? r.precio_unit ?? 0),
            codigo: r.codigo,
            categoria: r.categoria,
            existencias: Number(r.existencias ?? r.stock ?? r.cantidad ?? 999999),
            imagen: r.imagen
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
        const currentCant = Number(copy[idx].cant || 0)

        if (item.existencias !== undefined && currentCant + 1 > item.existencias) {
          // REEMPLAZO 2: Alerta de stock buscador
          Swal.fire({
            icon: 'warning',
            title: 'Límite de Stock',
            text: `No puedes agregar más. Solo hay ${item.existencias} en inventario.`,
            confirmButtonColor: '#11A5A3'
          })
          return copy
        }

        copy[idx] = {
          ...copy[idx],
          cant: currentCant + 1,
          maxStock: item.existencias
        }
        return copy
      }

      if (item.existencias <= 0) {
        // REEMPLAZO 3: Producto agotado
        Swal.fire({
          icon: 'error',
          title: '¡Agotado!',
          text: 'Este producto no tiene existencias disponibles.',
          confirmButtonColor: '#ef4444'
        })
        return arr
      }

      return [
        ...arr,
        {
          pid: item.pid,
          cant: 1,
          nombre: item.nombre,
          precio: Number(item.precio || 0),
          maxStock: item.existencias
        }
      ]
    })
    setQ('')
    setResults([])
  }

  /* ------- Resumen (cálculos) ------- */
  const sumas = useMemo(() => validProds.reduce((a, b) => a + totalFila(b), 0), [validProds])
  const iva13 = useMemo(() => +(sumas * 0.13).toFixed(2), [sumas])
  const [ivaRetenido, setIvaRetenido] = useState(0)
  const ventaTotal = useMemo(
    () => +(sumas + iva13 - Number(ivaRetenido || 0)).toFixed(2),
    [sumas, iva13, ivaRetenido]
  )

  /* ------- Submit ------- */
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // REEMPLAZO 4: Validaciones del formulario
    if (!f.cliente.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Ingresa el nombre del cliente',
        confirmButtonColor: '#11A5A3'
      })
    }
    if (!f.nit.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Ingresa el NIT del cliente',
        confirmButtonColor: '#11A5A3'
      })
    }

    const productos = validProds.map((p) => ({
      pid: p.pid ?? null,
      nombre: p.nombre.trim(),
      cant: Number(p.cant || 0),
      precio: Number(p.precio || 0)
    }))

    if (productos.length === 0 || sumas <= 0) {
      return Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Agrega al menos 1 producto válido',
        confirmButtonColor: '#11A5A3'
      })
    }

    const payload = {
      ...f,
      productos,
      resumen: {
        sumas: +sumas.toFixed(2),
        iva13,
        subTotal: +sumas.toFixed(2),
        ivaRetenido: Number(ivaRetenido || 0),
        ventaTotal
      }
    }

    try {
      setSubmitting(true)
      const saved = await createCreditoFiscal(payload)

      // Mensaje de éxito opcional (se muestra antes de cerrar)
      Swal.fire({
        icon: 'success',
        title: 'Crédito Fiscal Creado',
        text: 'El documento se ha guardado correctamente.',
        timer: 2000,
        showConfirmButton: false
      })

      // Limpieza
      setF({
        cliente: '',
        direccion: '',
        municipio: '',
        nrc: '',
        departamento: '',
        nit: '',
        condiciones: '',
        notaAnterior: '',
        ventaCuentaDe: '',
        fechaNotaAnterior: '',
        entregadoPor: '',
        recibidoPor: '',
        duiEntregado: '',
        duiRecibido: ''
      })
      setProds([{ ...emptyProd }])
      setQ('')
      setResults([])
      setIvaRetenido(0)
      onClose?.()
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: e.message || 'Ocurrió un error creando el crédito fiscal',
        confirmButtonColor: '#11A5A3'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Crear Crédito Fiscal">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ====== Fila 1 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <Input
              value={f.cliente}
              onChange={(e) => up('cliente', e.target.value)}
              placeholder="Cliente a facturar"
              required // HTML validation como backup
            />
          </Field>
          <Field label="Dirección">
            <Input
              value={f.direccion}
              onChange={(e) => up('direccion', e.target.value)}
              placeholder="Dirección"
            />
          </Field>
        </div>

        {/* ====== Fila 2 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Municipio">
            <Input
              value={f.municipio}
              onChange={(e) => up('municipio', e.target.value)}
              placeholder="Municipio"
            />
          </Field>
          <Field label="NRC">
            <Input
              value={f.nrc}
              onChange={(e) => up('nrc', e.target.value)}
              placeholder="XXXXXXXX-X"
            />
          </Field>
        </div>

        {/* ====== Fila 3 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Departamento">
            <Input
              value={f.departamento}
              onChange={(e) => up('departamento', e.target.value)}
              placeholder="Departamento"
            />
          </Field>
          <Field label="NIT">
            <Input
              value={f.nit}
              onChange={(e) => up('nit', e.target.value)}
              placeholder="XXXXXXXX-X"
              required
            />
          </Field>
        </div>

        {/* ====== Fila 4 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Condiciones de operación">
            <Input
              value={f.condiciones}
              onChange={(e) => up('condiciones', e.target.value)}
              placeholder="Condiciones de operación"
            />
          </Field>
          <Field label="No. Nota Remisión anterior">
            <Input
              value={f.notaAnterior}
              onChange={(e) => up('notaAnterior', e.target.value)}
              placeholder="Número de nota de remisión anterior"
            />
          </Field>
        </div>

        {/* ====== Fila 5 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Venta a cuenta de">
            <Input
              value={f.ventaCuentaDe}
              onChange={(e) => up('ventaCuentaDe', e.target.value)}
              placeholder="Venta a cuenta de"
            />
          </Field>
          <Field label="Fecha Nota Remisión anterior">
            <Input
              value={f.fechaNotaAnterior}
              onChange={(e) => up('fechaNotaAnterior', e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </Field>
        </div>

        {/* ====== Productos ====== */}
        <div>
          <p className="text-sm font-semibold text-black">Productos</p>

          {/* Buscador con sugerencias */}
          <div className="relative mt-2">
            <div className="flex items-center gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar producto por nombre / categoría / código"
              />
              <button
                type="button"
                className="h-11 w-11 rounded-xl ring-1 ring-neutral-300 grid place-items-center hover:bg-neutral-50"
              >
                {busy ? '…' : '🔍'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="absolute z-10 mt-2 w-full max-h-56 overflow-auto bg-white rounded-xl ring-1 ring-neutral-200 shadow-lg">
                {results.map((r) => (
                  <button
                    key={r.pid}
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
                        {r.codigo ? <span className="text-neutral-400"> • {r.codigo}</span> : null}
                        <span className="text-xs text-blue-600 ml-2 font-bold">
                          (Stock: {r.existencias})
                        </span>
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

          {/* Encabezados */}
          <div className="grid grid-cols-12 gap-3 text-sm text-neutral-600 mt-4">
            <div className="col-span-2">Cantidad</div>
            <div className="col-span-6">Nombre</div>
            <div className="col-span-2">Precio unitario</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-1 text-right">Acc.</div>
          </div>

          {/* Filas de productos */}
          <div className="mt-2 space-y-3">
            {prods.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  max={p.maxStock || 9999}
                  title={p.maxStock ? `Máximo disponible: ${p.maxStock}` : ''}
                  value={p.cant}
                  onChange={(e) => setProd(i, 'cant', e.target.value)}
                  placeholder="Cant."
                  className="col-span-2"
                />

                <div className="col-span-6 relative">
                  <Input
                    value={p.nombre}
                    onChange={(e) => setProd(i, 'nombre', e.target.value)}
                    placeholder="Producto"
                    className="w-full"
                  />
                  {p.maxStock !== null && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 bg-white px-1">
                      Max: {p.maxStock}
                    </span>
                  )}
                </div>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.precio}
                  onChange={(e) => setProd(i, 'precio', e.target.value)}
                  placeholder="$0.00"
                  className="col-span-2"
                />
                <Input
                  readOnly
                  value={`$${(totalFila(p) || 0).toFixed(2)}`}
                  className="col-span-1"
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="col-span-1 text-rose-600 hover:text-rose-700 text-right"
                  title="Eliminar fila"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addEmptyRow}
            className="mt-4 w-full h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-pink-500"
          >
            Agregar Producto
          </button>
        </div>

        {/* ====== Resumen ====== */}
        <div>
          <p className="text-sm font-semibold text-black">Resumen</p>
          <div className="mt-2 h-0.5 w-16 bg-neutral-900 rounded" />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-4">
            <Field label="Sumas">
              <Input value={sumas.toFixed(2)} readOnly />
            </Field>
            <Field label="13% IVA">
              <Input value={iva13.toFixed(2)} readOnly />
            </Field>
            <Field label="Sub- Total">
              <Input value={sumas.toFixed(2)} readOnly />
            </Field>
            <Field label="(-) IVA Retenido">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={ivaRetenido}
                onChange={(e) => setIvaRetenido(e.target.value)}
              />
            </Field>
            <Field label="Venta total">
              <Input value={ventaTotal.toFixed(2)} readOnly />
            </Field>
          </div>
        </div>

        {/* Nota */}
        <p className="text-[13px] text-neutral-600">
          Llenar si la operación es superior a <b>$11,428.58</b>
        </p>

        {/* Entregado / Recibido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Field label="Entregado por">
              <Input
                value={f.entregadoPor}
                onChange={(e) => up('entregadoPor', e.target.value)}
                placeholder="Nombre de la persona que entrega"
              />
            </Field>
            <Field label="DUI o NIT">
              <Input
                value={f.duiEntregado}
                onChange={(e) => up('duiEntregado', e.target.value)}
                placeholder="XXXXXXXX-X"
              />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Recibido por">
              <Input
                value={f.recibidoPor}
                onChange={(e) => up('recibidoPor', e.target.value)}
                placeholder="Nombre de la persona que recibe"
              />
            </Field>
            <Field label="DUI o NIT">
              <Input
                value={f.duiRecibido}
                onChange={(e) => up('duiRecibido', e.target.value)}
                placeholder="XXXXXXXX-X"
              />
            </Field>
          </div>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-[#11A5A3] disabled:opacity-60"
          >
            {submitting ? 'Creando…' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-[#Da2864]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
