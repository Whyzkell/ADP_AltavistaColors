// src/renderer/src/components/Paginas/ProductosProxVencer.jsx
import React, { useState, useEffect } from 'react'
import { getLowStockProducts } from '../../api'

// URL del backend para cargar las imágenes
const API_BASE = 'http://localhost:3001'

export default function ProductosProxAgotar() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estado para controlar cuántos productos mostramos
  const [visibleCount, setVisibleCount] = useState(5)

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        setLoading(true)
        const data = await getLowStockProducts()
        setProducts(data)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchLowStock()
  }, [])

  // Función para cargar 5 más
  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5)
  }

  // Cortamos el array según el contador visible
  const visibleProducts = products.slice(0, visibleCount)

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-rose-600 flex items-center gap-2">
        Productos próximos a agotarse
      </h2>
      <p className="text-sm text-neutral-500">
        Listado de productos con <b>3 o menos</b> unidades en inventario.
      </p>

      {/* Encabezados */}
      <div className="mt-4 hidden lg:grid grid-cols-12 text-xs font-semibold text-neutral-600 px-4 py-2 bg-neutral-100 rounded-lg gap-2">
        <div className="col-span-1">#</div>
        <div className="col-span-1">Imagen</div>
        <div className="col-span-6">Nombre</div>
        <div className="col-span-2">ID</div> {/* Cambiado de Código a ID */}
        <div className="col-span-2 text-right">Existencias</div>
      </div>

      {/* Contenido */}
      <div className="mt-2 space-y-2">
        {loading && <div className="text-center p-4">Cargando alertas...</div>}
        {error && <div className="text-center p-4 text-red-600">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className="text-center p-6 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-100">
            ✅ ¡Excelente! No tienes productos con bajo stock.
          </div>
        )}

        {!loading &&
          !error &&
          visibleProducts.map((p, index) => (
            <div
              key={p.id || index}
              className="grid grid-cols-2 lg:grid-cols-12 gap-2 p-3 bg-white rounded-xl ring-1 ring-neutral-200 items-center hover:bg-rose-50 transition-colors"
            >
              {/* Índice */}
              <div className="lg:col-span-1 text-sm font-semibold text-neutral-400 pl-2">
                {index + 1}
              </div>

              {/* Imagen */}
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

              {/* Nombre */}
              <div
                className="col-span-2 lg:col-span-6 text-sm font-medium text-black truncate"
                title={p.nombre}
              >
                {p.nombre}
              </div>

              {/* ID del Producto */}
              <div className="hidden lg:block lg:col-span-2 text-xs text-neutral-500 font-mono">
                {p.id ? `#${String(p.id).padStart(4, '0')}` : '—'}{' '}
                {/* Muestra ID con formato #0001 */}
              </div>

              {/* Existencias (Destacado) */}
              <div className="col-span-2 lg:col-span-2 text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    p.existencias === 0
                      ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' // Agotado
                      : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' // Pocas
                  }`}
                >
                  {p.existencias === 0 ? 'AGOTADO' : `${p.existencias} unid.`}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Botón Ver Más */}
      {!loading && !error && visibleCount < products.length && (
        <div className="mt-4 text-center">
          <button
            onClick={handleShowMore}
            className="text-sm font-medium text-neutral-600 hover:text-black hover:underline transition-all"
          >
            Ver 5 más ({products.length - visibleCount} restantes) ▼
          </button>
        </div>
      )}
    </div>
  )
}
