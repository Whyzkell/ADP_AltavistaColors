import React from 'react'
import Card from '../Cards/Card.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../Buttons/Button.jsx'

export default function InventoryPreview({ items = [] }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Inventario</h2>
          <p className="text-sm text-neutral-500">Inventario de productos</p>
        </div>
        <Button variant="soft">Ver</Button>
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
        {items.slice(0, 6).map((r, i) => (
          <Card key={i} className="px-4 py-3">
            <div className="grid grid-cols-2 lg:grid-cols-12 items-center gap-3">
              <div className="col-span-1 lg:col-span-2 text-sm font-mono text-neutral-700">
                {r.id}
              </div>
              <div className="col-span-1 lg:col-span-2 text-sm text-neutral-900">{r.nombre}</div>
              <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-600">
                {r.categoria}
              </div>
              <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-900">
                {r.precio}
              </div>
              <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-600">
                {r.codigo}
              </div>
              <div className="col-span-1 lg:col-span-2">
                <Pill intent={r.stock <= 8 ? 'warn' : 'success'}>{r.stock}</Pill>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
