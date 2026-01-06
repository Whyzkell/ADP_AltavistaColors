import React from 'react'
import Card from '../Cards/Card.jsx'
import Pill from '../ui/Pill.jsx'
import Button from '../Buttons/Button.jsx'
import { NavLink } from 'react-router-dom'

export default function InventoryPreview({ items = [] }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">Inventario</h2>
          <p className="text-sm text-neutral-500">Inventario de productos</p>
        </div>
        <NavLink to="/Inventario">
          <Button variant="soft">Ver</Button>
        </NavLink>
      </div>

      {/* Grid ajustado sin Código */}
      <div className="mt-4 hidden lg:grid grid-cols-12 text-xs text-neutral-500 px-2">
        <div className="col-span-2">ID</div>
        <div className="col-span-4">Nombre</div> {/* Nombre ahora ocupa 4 espacios */}
        <div className="col-span-2">Categoría</div>
        <div className="col-span-2">Precio</div>
        {/* Código eliminado */}
        <div className="col-span-2">Existencias</div>
      </div>

      <div className="mt-3 space-y-3">
        {items.slice(0, 6).map((r, i) => {
          const realId = r.id || r.id_producto
          const idStr = `#${String(realId || 0).padStart(5, '0')}`

          return (
            <Card key={realId || i} className="px-4 py-3">
              <div className="grid grid-cols-2 lg:grid-cols-12 items-center gap-3">
                {/* ID */}
                <div className="col-span-1 lg:col-span-2 text-sm font-mono text-neutral-700">
                  {idStr}
                </div>

                {/* Nombre - Ahora ocupa 4 columnas */}
                <div className="col-span-1 lg:col-span-4 text-sm font-medium text-neutral-900 truncate">
                  {r.nombre}
                </div>

                {/* Categoría */}
                <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-600 truncate">
                  {r.categoria}
                </div>

                {/* Precio */}
                <div className="hidden lg:block lg:col-span-2 text-sm text-neutral-900">
                  ${Number(r.precio || 0).toFixed(2)}
                </div>

                {/* Código eliminado */}

                {/* Existencias */}
                <div className="col-span-1 lg:col-span-2">
                  <Pill intent={r.existencias <= 8 ? 'warn' : 'success'}>{r.existencias}</Pill>
                </div>
              </div>
            </Card>
          )
        })}

        {items.length === 0 && (
          <Card className="px-4 py-4 text-center text-neutral-500">
            Cargando inventario o no hay productos...
          </Card>
        )}
      </div>
    </div>
  )
}
