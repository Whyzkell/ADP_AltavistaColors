import React, { useEffect, useMemo, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct, savePrecios } from '../../api'
import Swal from 'sweetalert2'

const API_BASE = 'http://localhost:3001'

/* ========= Helpers ========= */
const mapRow = (r) => ({
  id: r.id_producto || r.id,
  idStr: `#${String(r.id_producto || r.id).padStart(5, '0')}`,
  nombre: r.nombre,
  categoria: r.categoria,
  codigo: r.codigo,
  existencias: Number(r.existencias || 0),
  imagenUrl: r.imagen ? `${API_BASE}/uploads/${r.imagen}` : null,

  // Datos de Precios
  precio_final: Number(r.precio),
  precio_sin_iva: Number(r.precio_sin_iva || 0),
  precio_con_iva: Number(r.precio_con_iva || 0),
  porcentaje_ganancia: Number(r.porcentaje_ganancia || 30),
  precio_con_ganancia: Number(r.precio_con_ganancia || 0)
})

const ProductImage = ({ src, alt }) => {
  const [error, setError] = useState(false)
  if (!src || error)
    return (
      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
        📷
      </div>
    )
  return (
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 rounded object-cover border"
      onError={() => setError(true)}
    />
  )
}

// --- NUEVO COMPONENTE: MENÚ DESPLEGABLE ---
const Menu = ({ onEdit, onDelete }) => (
  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 py-2 z-20">
    <button
      onClick={onEdit}
      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 text-neutral-700"
    >
      Editar
    </button>
    <div className="h-px bg-neutral-200 mx-2" />
    <button
      onClick={onDelete}
      className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
    >
      Eliminar
    </button>
  </div>
)

// Modal Genérico
function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Input({ label, className = '', ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className={`w-full h-10 px-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition
          ${props.readOnly ? 'bg-gray-100 text-gray-500' : 'bg-white'} 
          ${className}`}
      />
    </div>
  )
}

export default function Precios() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  // --- ESTADO PARA CONTROLAR EL MENÚ DE ACCIONES ---
  const [openMenuId, setOpenMenuId] = useState(null)

  // Estado del Formulario
  const [form, setForm] = useState({
    id: null,
    nombre: '',
    categoria: '',
    codigo: '',
    existencias: 0,
    // Precios
    precio_sin_iva: 0,
    precio_con_iva: 0,
    porcentaje_ganancia: 30, // Default 30%
    precio_con_ganancia: 0,
    precio_final: 0 // Este va a la tabla productos
  })
  const [file, setFile] = useState(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const rows = await fetchProducts()
      setProductos(rows.map(mapRow))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = useMemo(
    () =>
      productos.filter((p) =>
        [p.nombre, p.categoria].join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [productos, query]
  )

  // --- LÓGICA DE CÁLCULO DE PRECIOS ---
  const calculatePrices = (field, value) => {
    let newForm = { ...form, [field]: value }
    const val = Number(value)

    if (field === 'precio_sin_iva') {
      const conIva = val * 1.13
      newForm.precio_con_iva = parseFloat(conIva.toFixed(2))

      const ganancia = newForm.porcentaje_ganancia / 100
      const sugerido = conIva * (1 + ganancia)
      newForm.precio_con_ganancia = parseFloat(sugerido.toFixed(2))
    }

    if (field === 'porcentaje_ganancia') {
      const conIva = Number(newForm.precio_con_iva)
      const ganancia = val / 100
      const sugerido = conIva * (1 + ganancia)
      newForm.precio_con_ganancia = parseFloat(sugerido.toFixed(2))
    }

    setForm(newForm)
  }

  const handleEdit = (p) => {
    setOpenMenuId(null) // Cerrar menú al editar
    setForm({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      codigo: p.codigo,
      existencias: p.existencias,
      precio_sin_iva: p.precio_sin_iva,
      precio_con_iva: p.precio_con_iva,
      porcentaje_ganancia: p.porcentaje_ganancia,
      precio_con_ganancia: p.precio_con_ganancia,
      precio_final: p.precio_final
    })
    setFile(null)
    setIsEdit(true)
    setOpenModal(true)
  }

  const handleCreate = () => {
    setForm({
      id: null,
      nombre: '',
      categoria: '',
      codigo: '',
      existencias: 0,
      precio_sin_iva: 0,
      precio_con_iva: 0,
      porcentaje_ganancia: 30,
      precio_con_ganancia: 0,
      precio_final: 0
    })
    setFile(null)
    setIsEdit(false)
    setOpenModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('nombre', form.nombre)
      formData.append('categoria', form.categoria)
      formData.append('codigo', form.codigo)
      formData.append('existencias', form.existencias)
      formData.append('precio', form.precio_final)
      if (file) formData.append('imagen', file)

      let savedProduct
      if (isEdit) {
        savedProduct = await updateProduct(form.id, formData)
      } else {
        savedProduct = await createProduct(formData)
      }

      const preciosData = {
        id_producto: savedProduct.id || savedProduct.id_producto,
        precio_sin_iva: form.precio_sin_iva,
        precio_con_iva: form.precio_con_iva,
        porcentaje_ganancia: form.porcentaje_ganancia,
        precio_con_ganancia: form.precio_con_ganancia
      }

      await savePrecios(preciosData)

      Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false })
      setOpenModal(false)
      loadProducts()
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }

  const handleDelete = async (id) => {
    setOpenMenuId(null) // Cerrar menú al eliminar
    const res = await Swal.fire({
      title: '¿Eliminar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33'
    })
    if (res.isConfirmed) {
      await deleteProduct(id)
      loadProducts()
    }
  }

  return (
    <main className="p-6 flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Precios</h1>
            <p className="text-gray-500 text-sm">Calculadora de costos y precios finales</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            + Nuevo Producto
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Tabla Extendida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-right text-gray-400">Sin IVA</th>
                <th className="px-4 py-3 text-right text-gray-400">C/ IVA</th>
                <th className="px-4 py-3 text-center text-blue-500 font-bold">% Gan.</th>
                <th className="px-4 py-3 text-right text-blue-600 font-medium">Sugerido</th>
                <th className="px-4 py-3 text-right text-emerald-600 font-bold text-base bg-emerald-50">
                  Precio Final
                </th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage src={p.imagenUrl} />
                      <div>
                        <p className="font-medium text-gray-900">{p.nombre}</p>
                        <p className="text-xs text-gray-500">{p.categoria}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    ${p.precio_sin_iva.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    ${p.precio_con_iva.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{p.porcentaje_ganancia}%</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">
                    ${p.precio_con_ganancia.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 bg-emerald-50/30 text-base">
                    ${p.precio_final.toFixed(2)}
                  </td>

                  {/* COLUMNA ACCIONES CON MENÚ DE PUNTITOS */}
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                        className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                      >
                        ⋮
                      </button>
                      {openMenuId === p.id && (
                        <Menu onEdit={() => handleEdit(p)} onDelete={() => handleDelete(p.id)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN/CREACIÓN */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={isEdit ? 'Editar Precios' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-5">
            <h4 className="font-semibold text-gray-900 border-b pb-2">Datos del Producto</h4>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                {file ? (
                  <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                ) : form.imagenUrl ? (
                  <img src={form.imagenUrl} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-400">📷</span>
                )}
              </div>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />

            <Input
              label="Categoría"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              required
            />

            <Input
              label="Existencias"
              type="number"
              value={form.existencias}
              onChange={(e) => setForm({ ...form, existencias: e.target.value })}
            />
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 border-b pb-2">Estructura de Costos</h4>
            <Input
              label="Precio Base (Sin IVA)"
              type="number"
              step="0.01"
              value={form.precio_sin_iva}
              onChange={(e) => calculatePrices('precio_sin_iva', e.target.value)}
              placeholder="0.00"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio con IVA (13%)"
                value={form.precio_con_iva}
                readOnly
                className="font-mono font-medium"
              />
              <Input
                label="% Ganancia Deseada"
                type="number"
                value={form.porcentaje_ganancia}
                onChange={(e) => calculatePrices('porcentaje_ganancia', e.target.value)}
              />
            </div>
            <Input
              label="Precio Sugerido (Con Ganancia)"
              value={form.precio_con_ganancia}
              readOnly
              className="bg-blue-50 text-blue-700 font-bold border-blue-200"
            />
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-bold text-emerald-800 mb-1">
                PRECIO DE VENTA FINAL (Público)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.precio_final}
                onChange={(e) => setForm({ ...form, precio_final: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border-2 border-emerald-400 bg-white text-xl font-bold text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este es el precio que se usará en facturación.
              </p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium shadow-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 transform active:scale-95 transition-all"
            >
              {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  )
}
