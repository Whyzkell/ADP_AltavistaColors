// src/renderer/src/components/Modales/VerCreditoFiscalModal.jsx
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

            {/* El div de scroll ya está corregido, ¡perfecto! */}
            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              {children}
            </div>
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
    className="w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 outline-none print:bg-white print:ring-1 print:ring-neutral-300 print:h-9"
  />
)
const Field = ({ label, value }) => (
  <div className="space-y-1">
    <label className="text-sm text-neutral-600">{label}</label>
    <Input value={value} />
  </div>
)

function fmtFecha(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('es-SV', { timeZone: 'UTC' })
  } catch {
    return String(d)
  }
}

export default function VerCreditoFiscalModal({ open, onClose, data }) {
  const payload = data?.payload || {}
  const productos = data?.items || []
  const sumas = data?.subtotal ?? 0
  const iva13 = data?.iva_13 ?? 0
  const ivaRet = data?.iva_retenido ?? 0
  const ventaTotal = data?.total ?? 0

  return (
    <Shell
      open={open}
      onClose={onClose}
      title={`Credito Fiscal No. ${data?.numero || data?.id || ''}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4">
        <Field label="Cliente" value={data?.cliente || payload?.form?.cliente || ''} />
        <Field label="Dirección" value={data?.direccion || payload?.form?.direccion || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4">
        <Field label="Municipio" value={data?.municipio || payload?.form?.municipio || ''} />
        <Field label="NRC" value={data?.nrc || payload?.form?.nrc || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4">
        <Field
          label="Departamento"
          value={data?.departamento || payload?.form?.departamento || ''}
        />
        <Field label="NIT" value={data?.nit || payload?.form?.nit || ''} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4">
        <Field
          label="Condiciones de operación"
          value={data?.condiciones_op || payload?.form?.condiciones || ''}
        />
        <Field
          label="No. Nota Remisión anterior"
          value={data?.nota_remision_ant || payload?.form?.notaAnterior || ''}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4">
        <Field
          label="Venta a cuenta de"
          value={data?.venta_cuenta_de || payload?.form?.ventaCuentaDe || ''}
        />
        <Field
          label="Fecha Nota Remisión anterior"
          value={
            data?.fecha_remision_ant
              ? fmtFecha(data.fecha_remision_ant)
              : payload?.form?.fechaNotaAnterior || ''
          }
        />
      </div>

      <p className="mt-6 text-sm font-semibold">Productos</p>
      <div className="mt-2 grid grid-cols-12 gap-3 print:grid print:grid-cols-12 print:gap-3">
        <div className="col-span-2 text-xs text-neutral-500 print:col-span-2">Cantidad</div>
        <div className="col-span-5 text-xs text-neutral-500 print:col-span-5">Nombre</div>
        <div className="col-span-2 text-xs text-neutral-500 print:col-span-2">Precio unitario</div>
        <div className="col-span-3 text-xs text-neutral-500 print:col-span-3">Total</div>
      </div>
      {(productos.length ? productos : []).map((it, i) => (
        <div
          key={it.id || i}
          className="mt-2 grid grid-cols-12 gap-3 print:grid print:grid-cols-12 print:gap-2"
        >
          <Input value={it.cant} />
          <div className="col-span-5 print:col-span-5">
            <Input value={it.nombre} />
          </div>
          <div className="col-span-2 print:col-span-2">
            <Input value={it.precio} />
          </div>
          <div className="col-span-3 print:col-span-3">
            <Input value={it.total} />
          </div>
        </div>
      ))}
      {productos.length === 0 && (
        <div className="mt-2 text-center text-neutral-400 text-sm">No se encontraron productos</div>
      )}

      <p className="mt-6 text-sm font-semibold">Resumen</p>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-4 print:grid print:grid-cols-5 print:gap-4">
        <Field label="Sumas" value={Number(sumas).toFixed(2)} />
        <Field label="13% IVA" value={Number(iva13).toFixed(2)} />
        <Field label="Sub- Total" value={Number(sumas).toFixed(2)} />
        <Field label="(-) IVA Retenido" value={Number(ivaRet).toFixed(2)} />
        <Field label="Venta total" value={Number(ventaTotal).toFixed(2)} />
      </div>

      <p className="mt-4 text-[13px] text-neutral-600">
        Llenar si la operación es superior a <b>$11,428.58</b>
      </p>

      {/* --- INICIO DE CORRECCIÓN DE LAYOUT --- */}
      {/*
        Se reestructura este DIV para agrupar lógicamente
        "Entregado" con su "DUI" y "Recibido" con el suyo.
        Esto ayuda al navegador a saber dónde hacer el salto de página.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 print:grid print:grid-cols-2 print:gap-4">
        <div className="space-y-4">
          <Field label="Entregado por" value={payload?.entregadoPor || ''} />
          <Field label="DUI o NIT" value={payload?.duiEntregado || ''} />
        </div>
        <div className="space-y-4">
          <Field label="Recibido por" value={payload?.recibidoPor || ''} />
          <Field label="DUI o NIT" value={payload?.duiRecibido || ''} />
        </div>
      </div>
      {/* --- FIN DE CORRECCIÓN DE LAYOUT --- */}

      {/* Los botones ya están ocultos al imprimir, ¡perfecto! */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 print:hidden">
        <button
          onClick={() => window.print()}
          className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600"
        >
          Imprimir
        </button>
        <button
          onClick={onClose}
          className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500"
        >
          Cancelar
        </button>
      </div>
    </Shell>
  )
}
