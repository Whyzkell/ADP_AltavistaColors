import React from 'react'
import Card from '../Cards/Card.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../Buttons/Button.jsx'

export default function InventoryPreview({ items = [] }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">Inventario</h2>
          <p className="text-sm text-neutral-500">Inventario de productos</p>
        </div>
        <a href="/Inventario">
          <Button variant="soft">Ver</Button>
        </a>
      </div>

      <div className="mt-4 hidden lg:grid grid-cols-12 text-xs text-neutral-500 px-2">
        <div className="col-span-2">ID</div>
        <div className="col-span-2">Nombre</div>
        <div className="col-span-2">Categoría</div>
        <div className="col-span-2">Precio</div>
        <div className="col-span-2">Código</div>
        <div className="col-span-2">Existencias</div>
      </div>

      <div className="mt-3 space-y-3">
        {/* Usamos 'slice' para mostrar solo los primeros 6 items */}
        {items.slice(0, 6).map((r, i) => (
          <Card key={r.id || i} className="px-4 py-3">
            <div className="grid grid-cols-2 lg:grid-cols-12 items-center gap-3">
              <div className="col-span-1 lg:col-span-2 text-sm font-mono text-neutral-700">
                {/* Mostramos el ID real de la API */}
                {r.id}
              </div>
              <div className="col-span-1 lg:col-span-2 text-sm text-neutral-900">{r.nombre}</div>
              <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-600">
                {r.categoria}
              </div>
              <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-900">
                {/* Formateamos el precio */}${Number(r.precio || 0).toFixed(2)}
              </div>
              <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-600">
                {r.codigo}
              </div>
              <div className="col-span-1 lg:col-span-2">
                {/* Usamos 'existencias' de la API en lugar de 'stock' */}
                <Pill intent={r.existencias <= 8 ? 'warn' : 'success'}>{r.existencias}</Pill>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <Card className="px-4 py-4 text-center text-neutral-500">Cargando inventario...</Card>
        )}
      </div>
    </div>
  )
}
