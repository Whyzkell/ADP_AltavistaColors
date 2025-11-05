import React, { useEffect, useMemo, useState } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../api'
import TopProducts from './TopProducts.jsx'

/* ========= Helpers ========= */
const mapRow = (r) => ({
  idStr: `#${String(r.id).padStart(5, '0')}`, // Texto para la tabla
  id: r.id, // ID real de BD
  nombre: r.nombre,
  categoria: r.categoria,
  precio: Number(r.precio ?? r.precio_unit),
  codigo: r.codigo,
  existencias: r.existencias
})

const Pill = ({ value }) => {
  const intent =
    value < 10
      ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200'
      : 'bg-green-50 text-green-700 ring-1 ring-green-200'
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${intent}`}>{value}</span>
}

const Menu = ({ onEdit, onDelete }) => (
  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg ring-1 ring-neutral-200 py-2 z-20">
    <button onClick={onEdit} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50">
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

/* ========= Modal ligero ========= */
function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center pt-24 px-4 sm:px-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
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

/* ========= Inputs + Field ========= */
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
        'w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 placeholder-neutral-400 outline-none ' +
        className
      }
    />
  )
}

/* ========= Página ========= */
export default function Iventario() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null) // guarda el id del producto abierto
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState([])

  // Cargar desde API
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const rows = await fetchProducts()
        setProductos(rows.map(mapRow))
      } catch (e) {
        console.error(e)
        alert(e.message || 'No se pudieron cargar los productos')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(
    () =>
      productos.filter((p) =>
        [p.nombre, p.categoria, String(p.codigo)]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
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
  const onChangeNew = (e) => setNuevo((s) => ({ ...s, [e.target.id]: e.target.value }))
  const resetFormNew = () =>
    setNuevo({ nombre: '', categoria: '', precio: '', codigo: '', existencias: '' })

  const agregarProducto = async (e) => {
    e.preventDefault()
    const cuerpo = {
      nombre: nuevo.nombre.trim(),
      categoria: nuevo.categoria.trim(),
      precio: Number(nuevo.precio),
      codigo: Number(nuevo.codigo),
      existencias: Number(nuevo.existencias || 0)
    }
    try {
      const saved = await createProduct(cuerpo) // backend retorna {id, ..., precio}
      setProductos((arr) => [mapRow(saved), ...arr])
      setOpenAdd(false)
      resetFormNew()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error creando producto')
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
    existencias: ''
  })

  const onEditRow = (row) => {
    setEditForm({
      id: row.id,
      idStr: row.idStr,
      nombre: row.nombre,
      categoria: row.categoria,
      precio: row.precio,
      codigo: row.codigo,
      existencias: row.existencias
    })
    setOpenMenu(null)
    setOpenEdit(true)
  }

  const onChangeEdit = (e) => setEditForm((s) => ({ ...s, [e.target.id]: e.target.value }))

  const guardarEdicion = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        nombre: editForm.nombre.trim(),
        categoria: editForm.categoria.trim(),
        precio: Number(editForm.precio),
        codigo: Number(editForm.codigo),
        existencias: Number(editForm.existencias)
      }
      const saved = await updateProduct(editForm.id, payload)
      setProductos((arr) => arr.map((p) => (p.id === editForm.id ? mapRow(saved) : p)))
      setOpenEdit(false)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error actualizando producto')
    }
  }

  const eliminarProducto = async (row) => {
    if (!confirm(`¿Eliminar ${row.nombre}?`)) return
    try {
      await deleteProduct(row.id)
      setProductos((arr) => arr.filter((x) => x.id !== row.id))
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error eliminando producto')
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-black">Inventario</h1>
          <p className="text-sm text-neutral-500">Inventario de productos</p>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="outline-none text-sm bg-transparent w-full"
            />
            <button className="grid place-items-center h-7 w-7 rounded-full hover:bg-neutral-100">
              🔍
            </button>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            disabled={loading}
          >
            Agregar producto
          </button>
        </div>
        <TopProducts />
        <div className="mt-6 bg-white rounded-xl ring-1 ring-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Existencias</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((p) => (
                <tr key={p.id} className="relative">
                  <td className="px-4 py-3 font-mono text-neutral-600">{p.idStr}</td>
                  <td className="px-4 py-3">{p.nombre}</td>
                  <td className="px-4 py-3">{p.categoria}</td>
                  <td className="px-4 py-3">${Number(p.precio).toFixed(2)}</td>
                  <td className="px-4 py-3">{p.codigo}</td>
                  <td className="px-4 py-3">
                    <Pill value={p.existencias} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                      >
                        ⋮
                      </button>
                      {openMenu === p.id && (
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
              {loading && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-neutral-400">
                    Cargando…
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
            <Field label="Código">
              <InputGreen
                id="codigo"
                type="number"
                min="1"
                step="1"
                value={nuevo.codigo}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenAdd(false)
                resetFormNew()
              }}
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar producto">
        <form onSubmit={guardarEdicion} className="space-y-5">
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
            <Field label="Código">
              <InputGreen
                id="codigo"
                type="number"
                min="1"
                step="1"
                value={editForm.codigo}
                onChange={onChangeEdit}
                required
              />
            </Field>
            <Field label="Existencias">
              <InputGreen
                id="existencias"
                type="number"
                min="0"
                step="1"
                value={editForm.existencias}
                onChange={onChangeEdit}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-300 to-emerald-600"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-300 to-rose-500"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </main>
  )
}
