import React from 'react'

function Shell({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-10 px-4 sm:px-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
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

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <label className="text-sm text-neutral-600">{label}</label>
    <input
      value={value ?? ''}
      readOnly
      className="w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 outline-none"
    />
  </div>
)

export default function VerFacturaModal({ open, onClose, data }) {
  // data.payload viene del CreateInvoiceModal si la venta se creó desde ahí
  const p = data?.payload || {}
  const productos = p.productos || []

  const totalFinal = p?.resumen?.ventaTotal ?? data?.monto ?? 0
  const cantidadProductos =
    productos.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0) || 0

  return (
    <Shell open={open} onClose={onClose} title={`Factura No. ${data?.id?.replace('#', '') || ''}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cliente" value={p.cliente || data?.cliente || ''} />
        <Field label="Dirección" value={p.direccion || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Venta a cuenta de" value={p.ventaCuentaDe || ''} />
        <Field label="DUI" value={p.dui || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Condiciones de pago" value={p.condiciones || ''} />
        <Field label="NIT" value={p.nit || ''} />
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
            <input readOnly value={it.cantidad || ''} className="col-span-2 h-10 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 px-3" />
            <input readOnly value={it.nombre || ''} className="col-span-5 h-10 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 px-3" />
            <input readOnly value={it.precioUnitario ?? ''} className="col-span-2 h-10 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 px-3" />
            <input readOnly value={it.total ?? ''} className="col-span-3 h-10 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 px-3" />
          </div>
        )
      )}

      <p className="mt-6 text-sm font-semibold">Resumen</p>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cantidad de productos" value={String(cantidadProductos)} />
        <Field label="Total final" value={`$${Number(totalFinal).toFixed(2)}`} />
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
