// src/components/Paginas/Estadisticas.jsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { getGraphData, fetchProducts } from '../../api'

// --- Componente de Select (UI) ---
const Select = ({ label, value, onChange, children }) => (
  <div className="flex-1 min-w-[200px]">
    <label className="block text-sm font-medium text-neutral-700">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="mt-1 block w-full h-11 px-3 rounded-xl ring-1 ring-neutral-300 bg-white outline-none"
    >
      {children}
    </select>
  </div>
)

// --- Componente Buscador de Producto (UI) ---
const ProductSearch = ({ onSelectProduct }) => {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (q.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const products = await fetchProducts(q)
        setResults(products.slice(0, 5))
      } catch (e) {
        console.error(e)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [q])

  const handleSelect = (product) => {
    setQ(product.nombre)
    setSelected(product)
    setResults([])
    onSelectProduct(product)
  }

  const handleClear = () => {
    setQ('')
    setSelected(null)
    setResults([])
    onSelectProduct(null)
  }

  return (
    <div className="flex-1 min-w-[200px] relative">
      <label className="block text-sm font-medium text-neutral-700">
        Buscar Producto (Opcional)
      </label>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Escribe nombre o código..."
        className="mt-1 w-full h-11 px-3 rounded-xl ring-1 ring-neutral-300 bg-white outline-none"
      />
      {selected && (
        <button onClick={handleClear} className="absolute right-2 top-7 text-red-500 p-1">
          ✕
        </button>
      )}
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white rounded-xl ring-1 ring-neutral-200 shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
            >
              {r.nombre} <span className="text-neutral-400">({r.codigo})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Componente Principal de la Página ---
export default function Estadisticas() {
  const [observe, setObserve] = useState('general')
  const [measure, setMeasure] = useState('efectivo')
  const [timeframe, setTimeframe] = useState('monthly')
  const [product, setProduct] = useState(null)

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = {
          observe: observe,
          measure: measure,
          timeframe: timeframe
        }

        if (observe === 'products') {
          if (product) {
            params.observe = 'product'
            params.productId = product.id_producto || product.id
          } else {
            params.observe = 'general'
          }
        }

        const result = await getGraphData(params)
        setData(result)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [observe, measure, timeframe, product])

  // Etiqueta dinámica para el Eje Y
  const dynamicLabel = useMemo(() => {
    if (measure === 'efectivo') return 'Venta ($)'
    // Ajustamos la etiqueta si estamos filtrando por pago
    if (['cash', 'transfer', 'card'].includes(observe)) return 'Transacciones (unid.)'
    if (observe === 'general' || observe === 'invoices' || observe === 'credits')
      return 'Transacciones (unid.)'
    return 'Cantidad (unid.)'
  }, [measure, observe])

  const yAxisFormatter = (value) => {
    if (measure === 'efectivo') return `$${value}`
    return Math.floor(value)
  }

  const xAxisFormatter = (dateString) => {
    try {
      const [year, month, day] = dateString.split('-')
      return `${Number(day)}/${Number(month)}/${year}`
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-black">Estadísticas</h1>
          <p className="text-sm text-neutral-500">Analiza tus ventas a lo largo del tiempo.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="h-9 px-4 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"
        >
          Imprimir
        </button>
      </div>

      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl ring-1 ring-neutral-200">
        <Select label="Observar" value={observe} onChange={(e) => setObserve(e.target.value)}>
          <option value="general">Ventas Generales</option>
          <option value="invoices">Solo Facturas</option>
          <option value="credits">Solo Créditos Fiscales</option>
          <option value="products">Por Producto</option>
          <hr />
          {/* NUEVAS OPCIONES DE FILTRO */}
          <option value="cash">Ventas en efectivo</option>
          <option value="transfer">Ventas en transferencia</option>
          <option value="card">Ventas por tarjeta de crédito</option>
        </Select>

        <Select label="Medir" value={measure} onChange={(e) => setMeasure(e.target.value)}>
          <option value="efectivo">Efectivo ($)</option>
          <option value="cantidad">Cantidad (unidades)</option>
        </Select>

        <Select
          label="Lapso de Tiempo"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="weekly">Semanal (7 días)</option>
          <option value="monthly">Mensual (30 días)</option>
          <option value="yearly">Anual (12 meses)</option>
          <option value="all">Todo el tiempo</option>
        </Select>

        {observe === 'products' && <ProductSearch onSelectProduct={setProduct} />}
      </div>

      <div className="p-4 bg-white rounded-xl ring-1 ring-neutral-200" style={{ height: '500px' }}>
        {loading && <div className="text-center p-10">Cargando gráfico...</div>}
        {error && <div className="text-center p-10 text-red-600">{error}</div>}

        {!loading && !error && data.length === 0 && (
          <div className="text-center p-10 text-neutral-500">
            No hay datos para mostrar con estos filtros.
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tickFormatter={xAxisFormatter} />
              <YAxis tickFormatter={yAxisFormatter} />
              <Tooltip
                labelFormatter={xAxisFormatter}
                formatter={(value) => [yAxisFormatter(value), dynamicLabel]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="valor"
                name={dynamicLabel}
                stroke="#10b981"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
