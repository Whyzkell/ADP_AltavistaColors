// src/Modales/CreateCreditoFiscalModal.jsx
import React, { useMemo, useState } from 'react'

/* ---------- Modal genérico ---------- */
function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-10 px-4 sm:px-6">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-black">Crear Crédito Fiscal</h3>
            <div className="mt-2 h-1 w-20 bg-neutral-900 rounded" />
            {/* Contenedor con alto máximo + scroll vertical */}
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

/* =======================================================
   Modal COMPLETO de Crédito Fiscal (según diseño)
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

  const onChange = (e) => {
    const { id, value } = e.target
    setF((s) => ({ ...s, [id]: value }))
  }

  /* ------- Productos ------- */
  const [line, setLine] = useState({ cantidad: '', nombre: '', precioUnitario: '' })
  const [productos, setProductos] = useState([])

  const onChangeLine = (e) => {
    const { id, value } = e.target
    setLine((s) => ({ ...s, [id]: value }))
  }

  const addProducto = () => {
    const cantidad = Number(line.cantidad)
    const precioUnitario = Number(line.precioUnitario)
    if (!line.nombre.trim()) return alert('Ingresa el nombre del producto')
    if (!Number.isFinite(cantidad) || cantidad <= 0) return alert('Cantidad inválida')
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0)
      return alert('Precio unitario inválido')

    const total = +(cantidad * precioUnitario).toFixed(2)
    setProductos((arr) => [...arr, { cantidad, nombre: line.nombre.trim(), precioUnitario, total }])
    setLine({ cantidad: '', nombre: '', precioUnitario: '' })
  }

  /* ------- Resumen (cálculos) ------- */
  const subTotal = useMemo(() => productos.reduce((acc, p) => acc + p.total, 0), [productos])
  const iva13 = useMemo(() => +(subTotal * 0.13).toFixed(2), [subTotal])

  // Deja IVA retenido editable (algunos casos es 1% si aplica). Por defecto 0.
  const [ivaRetenido, setIvaRetenido] = useState(0)
  const ventaTotal = useMemo(
    () => +(subTotal + iva13 - Number(ivaRetenido || 0)).toFixed(2),
    [subTotal, iva13, ivaRetenido]
  )

  const submit = (e) => {
    e.preventDefault()
    if (!f.cliente.trim()) return alert('Ingresa el cliente')
    if (!f.nit.trim()) return alert('Ingresa el NIT')
    if (productos.length === 0) return alert('Agrega al menos un producto')

    const payload = {
      ...f,
      productos,
      resumen: {
        sumas: +subTotal.toFixed(2),
        iva13,
        subTotal: +subTotal.toFixed(2),
        ivaRetenido: Number(ivaRetenido || 0),
        ventaTotal
      },
      creadoEn: new Date().toISOString()
    }

    onCreate?.(payload)
    onClose?.()
    // reset
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
    setProductos([])
    setLine({ cantidad: '', nombre: '', precioUnitario: '' })
    setIvaRetenido(0)
  }

  return (
    <Modal open={open} onClose={onClose} title="Crear Crédito Fiscal">
      <form onSubmit={submit} className="space-y-6">
        {/* ====== Fila 1 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <Input
              id="cliente"
              value={f.cliente}
              onChange={onChange}
              placeholder="Cliente a facturar"
              required
            />
          </Field>
          <Field label="Dirección">
            <Input id="direccion" value={f.direccion} onChange={onChange} placeholder="Dirección" />
          </Field>
        </div>

        {/* ====== Fila 2 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Municipio">
            <Input id="municipio" value={f.municipio} onChange={onChange} placeholder="Municipio" />
          </Field>
          <Field label="NRC">
            <Input id="nrc" value={f.nrc} onChange={onChange} placeholder="XXXXXXXX- X" />
          </Field>
        </div>

        {/* ====== Fila 3 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Departamento">
            <Input
              id="departamento"
              value={f.departamento}
              onChange={onChange}
              placeholder="Departamento"
            />
          </Field>
          <Field label="NIT">
            <Input id="nit" value={f.nit} onChange={onChange} placeholder="XXXXXXXX- X" required />
          </Field>
        </div>

        {/* ====== Fila 4 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Condiciones de operación">
            <Input
              id="condiciones"
              value={f.condiciones}
              onChange={onChange}
              placeholder="Condiciones de operación"
            />
          </Field>
          <Field label="No. Nota Remisión anterior">
            <Input
              id="notaAnterior"
              value={f.notaAnterior}
              onChange={onChange}
              placeholder="Número de nota de remisión anterior"
            />
          </Field>
        </div>

        {/* ====== Fila 5 ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Venta a cuenta de">
            <Input
              id="ventaCuentaDe"
              value={f.ventaCuentaDe}
              onChange={onChange}
              placeholder="Venta a cuenta de"
            />
          </Field>
          <Field label="Fecha Nota Remisión anterior">
            <Input
              id="fechaNotaAnterior"
              value={f.fechaNotaAnterior}
              onChange={onChange}
              placeholder="DD/MM/AAAA"
            />
          </Field>
        </div>

        {/* ====== Productos ====== */}
        <div>
          <p className="text-sm font-semibold text-black">Productos</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <Input placeholder="Buscar" />
            </div>
            <button
              type="button"
              className="h-11 w-11 rounded-xl ring-1 ring-neutral-300 grid place-items-center hover:bg-neutral-50"
              title="Buscar"
            >
              🔍
            </button>
          </div>

          {/* Fila de entrada */}
          <div className="mt-3 grid grid-cols-12 gap-3">
            <div className="col-span-2">
              <Input
                id="cantidad"
                value={line.cantidad}
                onChange={onChangeLine}
                placeholder="Cant."
              />
            </div>
            <div className="col-span-5">
              <Input id="nombre" value={line.nombre} onChange={onChangeLine} placeholder="Nombre" />
            </div>
            <div className="col-span-2">
              <Input
                id="precioUnitario"
                value={line.precioUnitario}
                onChange={onChangeLine}
                placeholder="$0.00"
              />
            </div>
            <div className="col-span-3">
              <Input
                value={Number(line.cantidad || 0) * Number(line.precioUnitario || 0) || 0}
                readOnly
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addProducto}
            className="mt-4 w-full h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-pink-500"
          >
            Agregar Producto
          </button>

          {/* Tabla simple de productos agregados */}
          {productos.length > 0 && (
            <div className="mt-4 bg-white ring-1 ring-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-600">
                  <tr>
                    <th className="px-4 py-2">Cant.</th>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Precio unitario</th>
                    <th className="px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {productos.map((p, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{p.cantidad}</td>
                      <td className="px-4 py-2">{p.nombre}</td>
                      <td className="px-4 py-2">${p.precioUnitario}</td>
                      <td className="px-4 py-2">${p.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ====== Resumen ====== */}
        <div>
          <p className="text-sm font-semibold text-black">Resumen</p>
          <div className="mt-2 h-0.5 w-16 bg-neutral-900 rounded" />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-4">
            <Field label="Sumas">
              <Input value={subTotal.toFixed(2)} readOnly />
            </Field>
            <Field label="13% IVA">
              <Input value={iva13.toFixed(2)} readOnly />
            </Field>
            <Field label="Sub- Total">
              <Input value={subTotal.toFixed(2)} readOnly />
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
                id="entregadoPor"
                value={f.entregadoPor}
                onChange={onChange}
                placeholder="Nombre de la persona que entrega"
              />
            </Field>
            <Field label="DUI o NIT">
              <Input
                id="duiEntregado"
                value={f.duiEntregado}
                onChange={onChange}
                placeholder="XXXXXXXX- X"
              />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Recibido por">
              <Input
                id="recibidoPor"
                value={f.recibidoPor}
                onChange={onChange}
                placeholder="Nombre de la persona que recibe"
              />
            </Field>
            <Field label="DUI o NIT">
              <Input
                id="duiRecibido"
                value={f.duiRecibido}
                onChange={onChange}
                placeholder="XXXXXXXX- X"
              />
            </Field>
          </div>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
