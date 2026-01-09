import React, { useEffect, useMemo, useState } from 'react'
import { listDescuentos, createDescuento, updateDescuento, deleteDescuento } from '../../api'
import Swal from 'sweetalert2'

/* ========= Helpers ========= */
const mapRow = (r) => ({
  id: r.id,
  idStr: `#${String(r.id).padStart(3, '0')}`,
  nombre: r.nombre,
  descri: r.descri || '—',
  tipo: r.tipo,
  cantidad: Number(r.cantidad || 0),
  activo: r.activo
})

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
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-neutral-200">
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
        'w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 placeholder-neutral-400 outline-none ' +
        className
      }
    />
  )
}

function SelectGreen({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={
        'w-full h-11 px-3 rounded-xl ring-1 ring-neutral-200 bg-emerald-50/40 text-neutral-800 outline-none cursor-pointer ' +
        className
      }
    >
      {children}
    </select>
  )
}

export default function Descuentos() {
  const [query, setQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)

  const [loading, setLoading] = useState(false)
  const [descuentos, setDescuentos] = useState([])

  // Cargar datos
  const recargar = async () => {
    try {
      setLoading(true)
      const rows = await listDescuentos()
      setDescuentos(rows.map(mapRow))
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudieron cargar los descuentos',
        confirmButtonColor: '#11A5A3'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    recargar()
  }, [])

  const filtered = useMemo(
    () =>
      descuentos.filter((d) =>
        [d.nombre, d.descri].join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [descuentos, query]
  )

  /* ======= Form Agregar ======= */
  const [nuevo, setNuevo] = useState({ nombre: '', descri: '', tipo: 'Porcentual', cantidad: '' })

  const onChangeNew = (e) => setNuevo((s) => ({ ...s, [e.target.id]: e.target.value }))

  const resetFormNew = () => setNuevo({ nombre: '', descri: '', tipo: 'Porcentual', cantidad: '' })

  const agregarDescuento = async (e) => {
    e.preventDefault()
    if (!nuevo.nombre.trim())
      return Swal.fire({ icon: 'warning', text: 'El nombre es obligatorio' })
    if (Number(nuevo.cantidad) <= 0)
      return Swal.fire({ icon: 'warning', text: 'La cantidad debe ser mayor a 0' })

    try {
      const payload = {
        nombre: nuevo.nombre.trim(),
        descri: nuevo.descri.trim(),
        tipo: nuevo.tipo,
        cantidad: Number(nuevo.cantidad)
      }
      const saved = await createDescuento(payload)
      setDescuentos((arr) => [mapRow(saved), ...arr])
      setOpenAdd(false)
      resetFormNew()
      Swal.fire({
        icon: 'success',
        title: 'Descuento Creado',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#11A5A3' })
    }
  }

  /* ======= Form Editar ======= */
  const [editForm, setEditForm] = useState({
    id: '',
    nombre: '',
    descri: '',
    tipo: '',
    cantidad: '',
    activo: true
  })

  const onEditRow = (row) => {
    setOpenMenuId(null)
    setEditForm({
      id: row.id,
      nombre: row.nombre,
      descri: row.descri === '—' ? '' : row.descri,
      tipo: row.tipo,
      cantidad: row.cantidad,
      activo: row.activo
    })
    setOpenEdit(true)
  }

  const onChangeEdit = (e) => setEditForm((s) => ({ ...s, [e.target.id]: e.target.value }))

  const guardarEdicion = async (e) => {
    e.preventDefault()
    if (!editForm.nombre.trim())
      return Swal.fire({ icon: 'warning', text: 'El nombre es obligatorio' })
    if (Number(editForm.cantidad) <= 0)
      return Swal.fire({ icon: 'warning', text: 'La cantidad debe ser mayor a 0' })

    try {
      const payload = {
        nombre: editForm.nombre.trim(),
        descri: editForm.descri.trim(),
        tipo: editForm.tipo,
        cantidad: Number(editForm.cantidad),
        activo: editForm.activo // Se mantiene el estado activo/inactivo
      }
      const saved = await updateDescuento(editForm.id, payload)

      setDescuentos((arr) => arr.map((d) => (d.id === editForm.id ? mapRow(saved) : d)))
      setOpenEdit(false)
      Swal.fire({
        icon: 'success',
        title: 'Descuento Actualizado',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#11A5A3' })
    }
  }

  /* ======= Eliminar ======= */
  const eliminar = async (row) => {
    setOpenMenuId(null)
    const result = await Swal.fire({
      title: `¿Eliminar "${row.nombre}"?`,
      text: 'Si este descuento ya se usó en facturas, no se podrá borrar (solo desactivar).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      cancelButtonColor: '#11A5A3',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      await deleteDescuento(row.id)
      setDescuentos((arr) => arr.filter((x) => x.id !== row.id))
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: err.response?.data?.error || 'No se puede eliminar. Intenta desactivarlo mejor.',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  return (
    <main className="flex-1 p-4">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-black">Gestión de Descuentos</h1>
          <p className="text-sm text-neutral-500">Configura cupones o rebajas fijas.</p>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar descuento..."
              className="outline-none text-sm bg-transparent w-full"
            />
            <span className="text-neutral-400">🔍</span>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="bg-[#11A5A3] hover:bg-[#Da2864] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
            disabled={loading}
          >
            Nuevo Descuento
          </button>
        </div>

        <div className="mt-6 bg-white rounded-xl ring-1 ring-neutral-200 overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 w-20">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-neutral-400">
                    Cargando descuentos...
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((d) => (
                  <tr key={d.id} className="relative group hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-mono text-neutral-500">{d.idStr}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{d.nombre}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${d.tipo === 'Porcentual' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}
                      >
                        {d.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {d.tipo === 'Porcentual' ? `${d.cantidad}%` : `$${d.cantidad.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${d.activo ? 'bg-green-500' : 'bg-red-300'}`}
                        title={d.activo ? 'Activo' : 'Inactivo'}
                      ></span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)}
                          className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                        >
                          ⋮
                        </button>
                        {openMenuId === d.id && (
                          <Menu onEdit={() => onEditRow(d)} onDelete={() => eliminar(d)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-neutral-400">
                    No se encontraron descuentos.
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
        title="Nuevo Descuento"
      >
        <form onSubmit={agregarDescuento} className="space-y-5">
          <Field label="Nombre del Descuento">
            <InputGreen
              id="nombre"
              value={nuevo.nombre}
              onChange={onChangeNew}
              placeholder="Ej. Promo Verano"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de Descuento">
              <SelectGreen id="tipo" value={nuevo.tipo} onChange={onChangeNew}>
                <option value="Porcentual">Porcentual (%)</option>
                <option value="Monetario">Monetario ($)</option>
              </SelectGreen>
            </Field>

            <Field label={nuevo.tipo === 'Porcentual' ? 'Porcentaje (%)' : 'Monto ($)'}>
              <InputGreen
                id="cantidad"
                type="number"
                min="0"
                step="0.01"
                value={nuevo.cantidad}
                onChange={onChangeNew}
                placeholder="0"
                required
              />
            </Field>
          </div>

          <Field label="Descripción (Opcional)">
            <InputGreen
              id="descri"
              value={nuevo.descri}
              onChange={onChangeNew}
              placeholder="Detalles breves..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              type="submit"
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenAdd(false)
                resetFormNew()
              }}
              className="h-11 rounded-xl text-neutral-600 font-semibold bg-neutral-100 hover:bg-neutral-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar Descuento">
        <form onSubmit={guardarEdicion} className="space-y-5">
          <Field label="Nombre del Descuento">
            <InputGreen id="nombre" value={editForm.nombre} onChange={onChangeEdit} required />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de Descuento">
              <SelectGreen id="tipo" value={editForm.tipo} onChange={onChangeEdit}>
                <option value="Porcentual">Porcentual (%)</option>
                <option value="Monetario">Monetario ($)</option>
              </SelectGreen>
            </Field>

            <Field label={editForm.tipo === 'Porcentual' ? 'Porcentaje (%)' : 'Monto ($)'}>
              <InputGreen
                id="cantidad"
                type="number"
                min="0"
                step="0.01"
                value={editForm.cantidad}
                onChange={onChangeEdit}
                required
              />
            </Field>
          </div>

          <Field label="Descripción (Opcional)">
            <InputGreen id="descri" value={editForm.descri} onChange={onChangeEdit} />
          </Field>

          {/* Switch de Activo/Inactivo */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="activo"
              checked={editForm.activo}
              onChange={(e) => setEditForm((s) => ({ ...s, activo: e.target.checked }))}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
              Descuento Activo
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              type="submit"
              className="h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm"
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="h-11 rounded-xl text-neutral-600 font-semibold bg-neutral-100 hover:bg-neutral-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </main>
  )
}
