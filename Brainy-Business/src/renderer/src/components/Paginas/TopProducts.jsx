// src/components/Paginas/TopProducts.jsx
import React, { useState, useEffect } from 'react'
import { getTopProducts } from '../../api'

// Helper para formatear dinero
const formatMoney = (val) => `$${Number(val || 0).toFixed(2)}`

export default function TopProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true)
        const data = await getTopProducts()
        setProducts(data)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTopProducts()
  }, [])

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-black">Productos Más Vendidos</h2>
      <p className="text-sm text-neutral-500">
        Top 10 productos por unidades vendidas (incluye Facturas y Créditos Fiscales)
      </p>

      {/* Encabezados */}
      <div className="mt-4 hidden lg:grid grid-cols-12 text-xs font-semibold text-neutral-600 px-4 py-2 bg-neutral-100 rounded-lg">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Nombre</div>
        <div className="col-span-2">Código</div>
        <div className="col-span-3 text-right">Unidades Vendidas</div>
        <div className="col-span-2 text-right">Valor Total</div>
      </div>

      {/* Contenido */}
      <div className="mt-2 space-y-2">
        {loading && <div className="text-center p-4">Cargando estadísticas...</div>}
        {error && <div className="text-center p-4 text-red-600">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className="text-center p-4 text-neutral-500">No hay datos de ventas.</div>
        )}

        {!loading &&
          !error &&
          products.map((p, index) => (
            <div
              key={p.producto_id}
              className="grid grid-cols-2 lg:grid-cols-12 gap-2 p-4 bg-white rounded-xl ring-1 ring-neutral-200"
            >
              <div className="lg:col-span-1 text-sm font-semibold text-emerald-600">
                {index + 1}
              </div>
              <div className="lg:col-span-4 text-sm font-medium text-black">{p.nombre}</div>
              <div className="lg:col-span-2 text-sm font-mono text-neutral-500">{p.codigo}</div>
              <div className="lg:col-span-3 text-sm lg:text-right font-semibold text-black">
                {p.total_unidades_vendidas} <span className="text-neutral-500">unidades</span>
              </div>
              <div className="lg:col-span-2 text-sm lg:text-right font-semibold text-emerald-700">
                {formatMoney(p.total_valor_vendido)}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
