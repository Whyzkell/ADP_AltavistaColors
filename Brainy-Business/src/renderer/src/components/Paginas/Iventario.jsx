import React, { useState, useEffect } from 'react'

/* ======= UI helpers ======= */
const Pill = ({ value }) => {
  const intent =
    value < 10
      ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200'
      : 'bg-green-50 text-green-700 ring-1 ring-green-200'
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${intent}`}>{value}</span>
}

const Menu = ({ onEdit, onDelete }) => {
  return (
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
}

/* ======= Modal embebido ======= */
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

/* ===== Inputs y Field para estilo consistente ===== */
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

/* ======= Página ======= */
export default function Iventario() {
  const [query, setQuery] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [openAdd, setOpenAdd] = useState(false)

  // productos ahora en estado para poder agregar/editar
  const [productos, setProductos] = useState([
    {
      id: '#23456',
      nombre: 'Pintura Blanca',
      categoria: 'Pinturas',
      precio: 1200,
      codigo: 3000,
      existencias: 50
    },
    {
      id: '#56489',
      nombre: 'Rodillo',
      categoria: 'Herramientas',
      precio: 7000,
      codigo: 5050,
      existencias: 5
    },
    {
      id: '#98380',
      nombre: 'Aerosol Negro',
      categoria: 'Aeorosoles',
      precio: 7000,
      codigo: 5000,
      existencias: 65
    }
  ])

  const filtered = productos.filter((p) =>
    [p.nombre, p.categoria, String(p.codigo)].join(' ').toLowerCase().includes(query.toLowerCase())
  )

  /* ======= Estado del form del modal (AGREGAR) ======= */
  const [nuevo, setNuevo] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    codigo: '',
    existencias: ''
  })

  const onChangeNew = (e) => {
    const { id, value } = e.target
    setNuevo((s) => ({ ...s, [id]: value }))
  }

  const resetFormNew = () =>
    setNuevo({ nombre: '', categoria: '', precio: '', codigo: '', existencias: '' })

  const agregarProducto = (e) => {
    e.preventDefault()
    // validaciones mínimas
    if (!nuevo.nombre.trim()) return alert('Ingresa el nombre')
    if (!nuevo.categoria.trim()) return alert('Ingresa la categoría')

    const precio = Number(nuevo.precio)
    const codigo = Number(nuevo.codigo)
    const existencias = Number(nuevo.existencias)

    if (!isFinite(precio) || precio < 0) return alert('Precio inválido')
    if (!Number.isInteger(codigo) || codigo <= 0) return alert('Código inválido')
    if (!Number.isInteger(existencias) || existencias < 0) return alert('Existencias inválidas')

    const id = `#${Math.floor(10000 + Math.random() * 90000)}`
    const prod = {
      id,
      nombre: nuevo.nombre.trim(),
      categoria: nuevo.categoria.trim(),
      precio,
      codigo,
      existencias
    }

    setProductos((arr) => [prod, ...arr])
    setOpenAdd(false)
    resetFormNew()
  }

  /* ======= Estado del modal (EDITAR) ======= */
  const [openEdit, setOpenEdit] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [editForm, setEditForm] = useState({
    id: '',
    nombre: '',
    categoria: '',
    precio: '',
    codigo: '',
    existencias: ''
  })

  // abrir modal de editar con prefill
  const onEditRow = (idx) => {
    const p = filtered[idx] // idx es del array filtrado; necesitamos su índice real
    // Mapear idx filtrado al índice real en productos:
    const realIdx = productos.findIndex((x) => x.id === p.id)
    if (realIdx === -1) return
    setEditIdx(realIdx)
    setEditForm({
      id: productos[realIdx].id,
      nombre: productos[realIdx].nombre,
      categoria: productos[realIdx].categoria,
      precio: productos[realIdx].precio,
      codigo: productos[realIdx].codigo,
      existencias: productos[realIdx].existencias
    })
    setOpenMenu(null)
    setOpenEdit(true)
  }

  const onChangeEdit = (e) => {
    const { id, value } = e.target
    setEditForm((s) => ({ ...s, [id]: value }))
  }

  const guardarEdicion = (e) => {
    e.preventDefault()
    if (!editForm.nombre.trim()) return alert('Ingresa el nombre')
    if (!editForm.categoria.trim()) return alert('Ingresa la categoría')

    const precio = Number(editForm.precio)
    const codigo = Number(editForm.codigo)
    const existencias = Number(editForm.existencias)

    if (!isFinite(precio) || precio < 0) return alert('Precio inválido')
    if (!Number.isInteger(codigo) || codigo <= 0) return alert('Código inválido')
    if (!Number.isInteger(existencias) || existencias < 0) return alert('Existencias inválidas')

    setProductos((arr) =>
      arr.map((p, i) =>
        i === editIdx
          ? {
              ...p,
              nombre: editForm.nombre.trim(),
              categoria: editForm.categoria.trim(),
              precio,
              codigo,
              existencias
            }
          : p
      )
    )
    setOpenEdit(false)
    setEditIdx(null)
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-black">Inventario</h1>
          <p className="text-sm text-neutral-500">Inventario de productos</p>
        </div>

        {/* Search + Add */}
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
          >
            Agregar producto
          </button>
        </div>

        {/* Tabla */}
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
              {filtered.map((p, idx) => (
                <tr key={p.id} className="relative">
                  <td className="px-4 py-3 font-mono text-neutral-600">{p.id}</td>
                  <td className="px-4 py-3">{p.nombre}</td>
                  <td className="px-4 py-3">{p.categoria}</td>
                  <td className="px-4 py-3">${p.precio}</td>
                  <td className="px-4 py-3">{p.codigo}</td>
                  <td className="px-4 py-3">
                    <Pill value={p.existencias} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenMenu(openMenu === idx ? null : idx)}
                        className="p-2 rounded-lg hover:bg-neutral-100"
                      >
                        ⋮
                      </button>
                      {openMenu === idx && (
                        <Menu
                          onEdit={() => onEditRow(idx)}
                          onDelete={() => alert(`Eliminar ${p.nombre}`)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
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

      {/* ===== Modal Agregar Producto ===== */}
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
              <InputGreen
                id="nombre"
                value={nuevo.nombre}
                onChange={onChangeNew}
                placeholder="Ej. Brocha de 2 pulgadas"
                required
              />
            </Field>
            <Field label="Categoría">
              <InputGreen
                id="categoria"
                value={nuevo.categoria}
                onChange={onChangeNew}
                placeholder="Ej. Herramientas"
                required
              />
            </Field>
            <Field label="Precio">
              <InputGreen
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={nuevo.precio}
                onChange={onChangeNew}
                placeholder="0.00"
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
                placeholder="Ej. 5001"
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
                placeholder="0"
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

      {/* ===== Modal Editar Producto ===== */}
      <Modal
        open={openEdit}
        onClose={() => {
          setOpenEdit(false)
          setEditIdx(null)
        }}
        title="Editar producto"
      >
        <form onSubmit={guardarEdicion} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ID">
              <InputGreen value={editForm.id} readOnly />
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
              onClick={() => {
                setOpenEdit(false)
                setEditIdx(null)
              }}
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
