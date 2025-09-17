import React from 'react'

function Shell({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-10 px-4 sm:px-6">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-bold">{title}</h3>
            <div className="mt-2 h-1 w-20 bg-neutral-900 rounded" />
            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Input = ({ value }) => (
  <input
    readOnly
    value={value ?? ''}
    className="w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 outline-none"
  />
)
const Field = ({ label, value }) => (
  <div className="space-y-1">
    <label className="text-sm text-neutral-600">{label}</label>
    <Input value={value} />
  </div>
)

export default function VerCreditoFiscalModal({ open, onClose, data }) {
  const p = data?.payload || {}
  const productos = p.productos || []
  const sumas = p?.resumen?.subTotal ?? 0
  const iva13 = p?.resumen?.iva13 ?? (Number(sumas) * 0.13)
  const ivaRet = p?.resumen?.ivaRetenido ?? 0
  const ventaTotal = p?.resumen?.ventaTotal ?? data?.monto ?? 0

  return (
    <Shell open={open} onClose={onClose} title={`Credito Fiscal No. ${data?.id?.replace('#', '') || ''}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cliente" value={p.cliente || data?.cliente || ''} />
        <Field label="Dirección" value={p.direccion || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Municipio" value={p.municipio || ''} />
        <Field label="NRC" value={p.nrc || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Departamento" value={p.departamento || ''} />
        <Field label="NIT" value={p.nit || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Condiciones de operación" value={p.condiciones || ''} />
        <Field label="No. Nota Remisión anterior" value={p.notaAnterior || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Venta a cuenta de" value={p.ventaCuentaDe || ''} />
        <Field label="Fecha Nota Remisión anterior" value={p.fechaNotaAnterior || ''} />
      </div>

      <p className="mt-6 text-sm font-semibold">Productos</p>
      <div className="mt-2 grid grid-cols-12 gap-3">
        <div className="col-span-2 text-xs text-neutral-500">Cantidad</div>
        <div className="col-span-5 text-xs text-neutral-500">Nombre</div>
        <div className="col-span-2 text-xs text-neutral-500">Precio unitario</div>
        <div className="col-span-3 text-xs text-neutral-500">Total</div>
      </div>
      {(productos.length ? productos : [{ cantidad: '', nombre: '', precioUnitario: '', total: '' }]).map(
        (it, i) => (
          <div key={i} className="mt-2 grid grid-cols-12 gap-3">
            <Input value={it.cantidad} />
            <div className="col-span-5">
              <Input value={it.nombre} />
            </div>
            <div className="col-span-2">
              <Input value={it.precioUnitario} />
            </div>
            <div className="col-span-3">
              <Input value={it.total} />
            </div>
          </div>
        )
      )}

      <p className="mt-6 text-sm font-semibold">Resumen</p>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Field label="Sumas" value={Number(sumas).toFixed(2)} />
        <Field label="13% IVA" value={Number(iva13).toFixed(2)} />
        <Field label="Sub- Total" value={Number(sumas).toFixed(2)} />
        <Field label="(-) IVA Retenido" value={Number(ivaRet).toFixed(2)} />
        <Field label="Venta total" value={Number(ventaTotal).toFixed(2)} />
      </div>

      <p className="mt-4 text-[13px] text-neutral-600">
        Llenar si la operación es superior a <b>$11,428.58</b>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
        <Field label="Entregado por" value={p.entregadoPor || ''} />
        <Field label="Recibido por" value={p.recibidoPor || ''} />
        <Field label="DUI o NIT" value={p.duiEntregado || ''} />
        <Field label="DUI o NIT" value={p.duiRecibido || ''} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
        <button onClick={() => window.print()} className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600">
          Imprimir
        </button>
        <button onClick={onClose} className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500">
          Cancelar
        </button>
      </div>
    </Shell>
  )
}
