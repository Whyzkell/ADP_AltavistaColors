import React, { useState, useEffect } from 'react'
import { getTopProducts } from '../../api'

// URL del backend para cargar las imágenes
const API_BASE = 'http://localhost:3001'

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
      <div className="mt-4 hidden lg:grid grid-cols-12 text-xs font-semibold text-neutral-600 px-4 py-2 bg-neutral-100 rounded-lg gap-2">
        <div className="col-span-1">#</div>
        <div className="col-span-1">Imagen</div> {/* Nueva columna */}
        <div className="col-span-3">Nombre</div>
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
              key={p.producto_id || index}
              className="grid grid-cols-2 lg:grid-cols-12 gap-2 p-3 bg-white rounded-xl ring-1 ring-neutral-200 items-center"
            >
              {/* Índice */}
              <div className="lg:col-span-1 text-sm font-semibold text-emerald-600 pl-2">
                {index + 1}
              </div>

              {/* Imagen (Oculta en móvil, visible en escritorio) */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="h-10 w-10 rounded-lg bg-neutral-50 ring-1 ring-neutral-100 flex items-center justify-center overflow-hidden">
                  {p.imagen ? (
                    <img
                      src={`${API_BASE}/uploads/${p.imagen}`}
                      alt={p.nombre}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  ) : (
                    <span className="text-xs text-neutral-300">📷</span>
                  )}
                </div>
              </div>

              {/* Nombre (En móvil ocupa ancho completo si es necesario) */}
              <div
                className="col-span-2 lg:col-span-3 text-sm font-medium text-black truncate"
                title={p.nombre}
              >
                {p.nombre}
              </div>

              {/* Código */}
              <div className="hidden lg:block lg:col-span-2 text-sm font-mono text-neutral-500">
                {p.codigo || '—'}
              </div>

              {/* Unidades */}
              <div className="col-span-1 lg:col-span-3 text-sm text-right font-semibold text-black">
                {p.total_unidades_vendidas}{' '}
                <span className="text-neutral-500 font-normal">unid.</span>
              </div>

              {/* Valor Total */}
              <div className="col-span-1 lg:col-span-2 text-sm text-right font-semibold text-emerald-700">
                {formatMoney(p.total_valor_vendido)}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
