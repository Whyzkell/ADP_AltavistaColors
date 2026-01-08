import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getLotesByProduct, // <--- NUEVO IMPORT
  updateLote // <--- NUEVO IMPORT
} from '../../api'
import TopProducts from './TopProducts.jsx'
import Swal from 'sweetalert2'

// URL del backend para cargar las imágenes
const API_BASE = 'http://localhost:3001'

/* ========= Helpers ========= */
const mapRow = (r) => {
  const realId = r.id || r.id_producto
  return {
    idStr: `#${String(realId).padStart(5, '0')}`,
    id: realId,
    nombre: r.nombre,
    categoria: r.categoria,
    precio: Number(r.precio ?? r.precio_unit),
    codigo: r.codigo,
    existencias: Number(r.existencias || 0),
    imagenUrl: r.imagen ? `${API_BASE}/uploads/${r.imagen}` : null
  }
}

const Pill = ({ value }) => {
  const num = Number(value)
  const intent =
    num === 0
      ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
      : num < 10
        ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200'
        : 'bg-green-50 text-green-700 ring-1 ring-green-200'

  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${intent}`}>{value}</span>
}

const ProductImage = ({ src, alt }) => {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className="h-10 w-10 rounded-lg bg-neutral-100 ring-1 ring-neutral-200 flex items-center justify-center text-neutral-400">
        <span className="text-xs">📷</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 rounded-lg object-cover ring-1 ring-neutral-200 bg-white"
      onError={() => setError(true)}
    />
  )
}

// Menú Inline
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

function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-10 px-4 sm:px-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200 max-h-[90vh] overflow-y-auto">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-black">{title}</h3>
            <div className="mt-2 h-1 w-20 bg-neutral-900 rounded" />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function InputGreen({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={
        'w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 placeholder-neutral-400 outline-none disabled:bg-neutral-100 disabled:text-neutral-500 ' +
        className
      }
    />
  )
}

// --- SUB-COMPONENTE: Editor de Lote Individual ---
const BatchEditor = ({ lote, onUpdate }) => {
  const [data, setData] = useState({
    codigo_lote: lote.codigo_lote || '',
    fecha_vencimiento: lote.fecha_vencimiento ? lote.fecha_vencimiento.split('T')[0] : '',
    cantidad_actual: lote.cantidad_actual
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value })

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateLote(lote.id, data)
      Swal.fire({
        icon: 'success',
        title: 'Lote actualizado',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500
      })
      onUpdate() // Recargar datos padre
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-sm">
      <div className="col-span-3">
        <input
          name="codigo_lote"
          value={data.codigo_lote}
          onChange={handleChange}
          placeholder="Cód."
          className="w-full bg-white border border-neutral-300 rounded px-2 py-1"
        />
      </div>
      <div className="col-span-4">
        <input
          type="date"
          name="fecha_vencimiento"
          value={data.fecha_vencimiento}
          onChange={handleChange}
          className="w-full bg-white border border-neutral-300 rounded px-2 py-1"
        />
      </div>
      <div className="col-span-3">
        <input
          type="number"
          name="cantidad_actual"
          value={data.cantidad_actual}
          onChange={handleChange}
          className="w-full bg-white border border-neutral-300 rounded px-2 py-1 font-bold text-center"
        />
      </div>
      <div className="col-span-2 text-right">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs"
        >
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default function Iventario() {
  const [query, setQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState([])

  // Función para cargar productos
  const loadProducts = async () => {
    try {
      setLoading(true)
      const rows = await fetchProducts()
      setProductos(rows.map(mapRow))
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudieron cargar los productos',
        confirmButtonColor: '#11A5A3'
      })
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

  /* ======= Form Agregar ======= */
  const [nuevo, setNuevo] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    codigo: '',
    existencias: ''
  })
  const [nuevoFile, setNuevoFile] = useState(null)

  const onChangeNew = (e) => setNuevo((s) => ({ ...s, [e.target.id]: e.target.value }))

  const resetFormNew = () => {
    setNuevo({ nombre: '', categoria: '', precio: '', codigo: '', existencias: '' })
    setNuevoFile(null)
  }

  const agregarProducto = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('nombre', nuevo.nombre.trim())
    formData.append('categoria', nuevo.categoria.trim())
    formData.append('precio', nuevo.precio)
    formData.append('codigo', nuevo.codigo || '0000')
    formData.append('existencias', nuevo.existencias || 0)
    if (nuevoFile) formData.append('imagen', nuevoFile)

    try {
      const saved = await createProduct(formData)
      setProductos((arr) => [mapRow(saved), ...arr])
      setOpenAdd(false)
      resetFormNew()

      Swal.fire({
        icon: 'success',
        title: 'Producto Agregado',
        text: `"${saved.nombre}" se añadió al inventario.`,
        timer: 1500,
        showConfirmButton: false
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: err.message || 'No se pudo crear el producto',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  /* ======= Form Editar ======= */
  const [editForm, setEditForm] = useState({
    id: '',
    idStr: '',
    nombre: '',
    categoria: '',
    precio: '',
    codigo: '',
    existencias: '',
    imagenUrl: null
  })
  const [editFile, setEditFile] = useState(null)
  const [editBatches, setEditBatches] = useState([]) // Estado para los lotes del producto

  const onEditRow = async (row) => {
    setOpenMenuId(null)

    // 1. Cargamos datos básicos
    setEditForm({
      id: row.id,
      idStr: row.idStr,
      nombre: row.nombre,
      categoria: row.categoria,
      precio: row.precio,
      codigo: row.codigo,
      existencias: row.existencias,
      imagenUrl: row.imagenUrl
    })
    setEditFile(null)
    setEditBatches([]) // Limpiar lotes previos

    // 2. Abrimos modal
    setOpenEdit(true)

    // 3. Consultamos si tiene lotes
    try {
      const batches = await getLotesByProduct(row.id)
      setEditBatches(batches)
    } catch (e) {
      console.error('Error cargando lotes', e)
    }
  }

  // Callback para cuando se actualiza un lote (recargar todo para sincronizar stock)
  const handleBatchUpdate = async () => {
    // 1. Recargar lotes del modal
    const batches = await getLotesByProduct(editForm.id)
    setEditBatches(batches)

    // 2. Recargar lista principal de productos (para actualizar stock total en la tabla de fondo)
    loadProducts()

    // 3. Recalcular stock total para el input visual (aunque esté disabled)
    const newTotal = batches.reduce((acc, b) => acc + Number(b.cantidad_actual), 0)
    setEditForm((prev) => ({ ...prev, existencias: newTotal }))
  }

  const onChangeEdit = (e) => setEditForm((s) => ({ ...s, [e.target.id]: e.target.value }))

  const guardarEdicion = async (e) => {
    e.preventDefault()
    if (!editForm.id) return

    try {
      const formData = new FormData()
      formData.append('nombre', editForm.nombre.trim())
      formData.append('categoria', editForm.categoria.trim())
      formData.append('precio', editForm.precio)
      formData.append('codigo', editForm.codigo)

      // Si NO tiene lotes, mandamos la existencia del input.
      // Si TIENE lotes, mandamos la misma que ya tiene (el backend ignora si no cambió,
      // o usamos la calculada). Por seguridad, mandamos la del estado.
      formData.append('existencias', editForm.existencias)

      if (editFile) formData.append('imagen', editFile)

      const saved = await updateProduct(editForm.id, formData)
      setProductos((arr) => arr.map((p) => (p.id === editForm.id ? mapRow(saved) : p)))
      setOpenEdit(false)

      Swal.fire({
        icon: 'success',
        title: 'Producto Actualizado',
        text: 'Los cambios se guardaron correctamente.',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: err.message || 'No se pudo actualizar el producto',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  const eliminarProducto = async (row) => {
    setOpenMenuId(null)
    let warningText = 'Esta acción no se puede deshacer.'
    if (row.existencias > 0) {
      warningText = `⚠️ ¡CUIDADO! Este producto tiene ${row.existencias} unidades en stock (y posibles lotes). Si lo borras, se perderá todo ese registro.`
    }

    const result = await Swal.fire({
      title: `¿Eliminar "${row.nombre}"?`,
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      cancelButtonColor: '#11A5A3',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      await deleteProduct(row.id)
      setProductos((arr) => arr.filter((x) => x.id !== row.id))
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false })
    } catch (err) {
      console.error(err)
      const errorMsg = err.message || ''
      if (errorMsg.includes('foreign key') || errorMsg.includes('factura_items')) {
        Swal.fire({
          icon: 'error',
          title: 'No se puede eliminar',
          text: 'Este producto ya ha sido vendido. No puedes borrar el historial.',
          confirmButtonColor: '#11A5A3'
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'Ocurrió un problema.',
          confirmButtonColor: '#11A5A3'
        })
      }
    }
  }

  return (
    <main className="flex-1 p-4">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-black">Inventario</h1>
          <p className="text-sm text-neutral-500">Gestión de productos con imágenes</p>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              className="outline-none text-sm bg-transparent w-full"
            />
            <span className="text-neutral-400">🔍</span>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="bg-[#11A5A3] hover:bg-[#Da2864] text-white px-4 py-2 rounded-xl text-sm font-semibold"
            disabled={loading}
          >
            Agregar producto
          </button>
        </div>

        {!query.trim() && <TopProducts />}

        <div className="mt-6 bg-white rounded-xl ring-1 ring-neutral-200 overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 w-16">Imagen</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Existencias</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((p) => (
                <tr key={p.id} className="relative group hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <ProductImage src={p.imagenUrl} alt={p.nombre} />
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600">{p.idStr}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{p.nombre}</td>
                  <td className="px-4 py-3">{p.categoria}</td>
                  <td className="px-4 py-3">${Number(p.precio).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Pill value={p.existencias} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                        className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                      >
                        ⋮
                      </button>
                      {openMenuId === p.id && (
                        <Menu onEdit={() => onEditRow(p)} onDelete={() => eliminarProducto(p)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-neutral-400">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar */}
      <Modal
        open={openAdd}
        onClose={() => {
          setOpenAdd(false)
          resetFormNew()
        }}
        title="Agregar producto"
      >
        <form onSubmit={agregarProducto} className="space-y-5">
          {/* ... (Formulario de agregar se mantiene igual, asumiendo productos nuevos sin lotes al inicio) ... */}
          <div className="p-4 rounded-xl bg-neutral-50 ring-1 ring-neutral-200 flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-lg bg-white ring-1 ring-neutral-200 flex items-center justify-center overflow-hidden">
              {nuevoFile ? (
                <img src={URL.createObjectURL(nuevoFile)} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl text-neutral-300">📷</span>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="text-sm font-semibold text-[#11A5A3] hover:underline">
                Subir Foto
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setNuevoFile(e.target.files[0])}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre">
              <InputGreen id="nombre" value={nuevo.nombre} onChange={onChangeNew} required />
            </Field>
            <Field label="Categoría">
              <InputGreen id="categoria" value={nuevo.categoria} onChange={onChangeNew} required />
            </Field>
            <Field label="Precio">
              <InputGreen
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={nuevo.precio}
                onChange={onChangeNew}
                required
              />
            </Field>
            <Field label="Existencias">
              <InputGreen
                id="existencias"
                type="number"
                min="0"
                step="1"
                value={nuevo.existencias}
                onChange={onChangeNew}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-[#11A5A3]"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenAdd(false)
                resetFormNew()
              }}
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-[#Da2864]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar producto">
        <form onSubmit={guardarEdicion} className="space-y-5">
          <div className="p-4 rounded-xl bg-neutral-50 ring-1 ring-neutral-200 flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-lg bg-white ring-1 ring-neutral-200 flex items-center justify-center overflow-hidden">
              {editFile ? (
                <img src={URL.createObjectURL(editFile)} className="h-full w-full object-cover" />
              ) : editForm.imagenUrl ? (
                <img src={editForm.imagenUrl} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl text-neutral-300">📷</span>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="text-sm font-semibold text-[#11A5A3] hover:underline">
                Cambiar Foto
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setEditFile(e.target.files[0])}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ID">
              <InputGreen value={editForm.idStr} readOnly />
            </Field>
            <Field label="Nombre">
              <InputGreen id="nombre" value={editForm.nombre} onChange={onChangeEdit} required />
            </Field>
            <Field label="Categoría">
              <InputGreen
                id="categoria"
                value={editForm.categoria}
                onChange={onChangeEdit}
                required
              />
            </Field>
            <Field label="Precio">
              <InputGreen
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={editForm.precio}
                onChange={onChangeEdit}
                required
              />
            </Field>

            {/* LÓGICA CONDICIONAL DE STOCK */}
            <div className="col-span-1 sm:col-span-2">
              <Field label="Existencias">
                {editBatches.length > 0 ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      ⚠️ Este producto tiene lotes. Edita las cantidades aquí:
                    </div>
                    {/* Lista de lotes editables */}
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      <div className="grid grid-cols-12 text-xs font-semibold text-neutral-500 px-2">
                        <div className="col-span-3">Cód</div>
                        <div className="col-span-4">Vencimiento</div>
                        <div className="col-span-3 text-center">Cant.</div>
                        <div className="col-span-2"></div>
                      </div>
                      {editBatches.map((lote) => (
                        <BatchEditor key={lote.id} lote={lote} onUpdate={handleBatchUpdate} />
                      ))}
                    </div>
                    <div className="text-right text-sm font-bold text-neutral-700 mt-2">
                      Total Calculado: {editForm.existencias}
                    </div>
                  </div>
                ) : (
                  <InputGreen
                    id="existencias"
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.existencias}
                    onChange={onChangeEdit}
                    required
                  />
                )}
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-[#11A5A3]"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-[#Da2864]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </main>
  )
}
