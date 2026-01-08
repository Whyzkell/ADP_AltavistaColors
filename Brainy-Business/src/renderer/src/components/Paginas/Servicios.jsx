import React, { useEffect, useMemo, useState } from 'react'
import { listServicios, createServicio, updateServicio, deleteServicio } from '../../api'
import Swal from 'sweetalert2'

/* ========= Helpers ========= */
const mapRow = (r) => ({
  id: r.id,
  idStr: `#${String(r.id).padStart(3, '0')}`,
  nombre: r.nombre,
  descripcion: r.descripcion || '—',
  precio: Number(r.precio_sugerido || 0)
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

export default function Servicios() {
  const [query, setQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false) // Nuevo estado para editar

  const [loading, setLoading] = useState(false)
  const [servicios, setServicios] = useState([])

  // Cargar datos
  const recargar = async () => {
    try {
      setLoading(true)
      const rows = await listServicios()
      setServicios(rows.map(mapRow))
    } catch (e) {
      console.error(e)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudieron cargar los servicios',
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
      servicios.filter((s) =>
        [s.nombre, s.descripcion].join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [servicios, query]
  )

  /* ======= Form Agregar ======= */
  const [nuevo, setNuevo] = useState({ nombre: '', descripcion: '', precio: '' })
  const onChangeNew = (e) => setNuevo((s) => ({ ...s, [e.target.id]: e.target.value }))
  const resetFormNew = () => setNuevo({ nombre: '', descripcion: '', precio: '' })

  const agregarServicio = async (e) => {
    e.preventDefault()
    if (!nuevo.nombre.trim())
      return Swal.fire({ icon: 'warning', text: 'El nombre es obligatorio' })

    try {
      const payload = {
        nombre: nuevo.nombre.trim(),
        descripcion: nuevo.descripcion.trim(),
        precio: Number(nuevo.precio)
      }
      const saved = await createServicio(payload)
      setServicios((arr) => [mapRow(saved), ...arr])
      setOpenAdd(false)
      resetFormNew()
      Swal.fire({
        icon: 'success',
        title: 'Servicio Creado',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#11A5A3' })
    }
  }

  /* ======= Form Editar (NUEVO) ======= */
  const [editForm, setEditForm] = useState({ id: '', nombre: '', descripcion: '', precio: '' })

  const onEditRow = (row) => {
    setOpenMenuId(null)
    setEditForm({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion === '—' ? '' : row.descripcion,
      precio: row.precio
    })
    setOpenEdit(true)
  }

  const onChangeEdit = (e) => setEditForm((s) => ({ ...s, [e.target.id]: e.target.value }))

  const guardarEdicion = async (e) => {
    e.preventDefault()
    if (!editForm.nombre.trim())
      return Swal.fire({ icon: 'warning', text: 'El nombre es obligatorio' })

    try {
      const payload = {
        nombre: editForm.nombre.trim(),
        descripcion: editForm.descripcion.trim(),
        precio: Number(editForm.precio)
      }
      const saved = await updateServicio(editForm.id, payload)

      // Actualizar lista
      setServicios((arr) => arr.map((s) => (s.id === editForm.id ? mapRow(saved) : s)))

      setOpenEdit(false)
      Swal.fire({
        icon: 'success',
        title: 'Servicio Actualizado',
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
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      cancelButtonColor: '#11A5A3',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      await deleteServicio(row.id)
      setServicios((arr) => arr.filter((x) => x.id !== row.id))
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: 'No se puede eliminar. Quizás ya está en uso.',
        confirmButtonColor: '#11A5A3'
      })
    }
  }

  return (
    <main className="flex-1 p-4">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-black">Gestión de Servicios</h1>
          <p className="text-sm text-neutral-500">Mano de obra, transporte y otros intangibles.</p>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 px-3 h-10 rounded-full ring-1 ring-neutral-300 bg-white w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar servicio..."
              className="outline-none text-sm bg-transparent w-full"
            />
            <span className="text-neutral-400">🔍</span>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="bg-[#11A5A3] hover:bg-[#Da2864] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
            disabled={loading}
          >
            Nuevo Servicio
          </button>
        </div>

        <div className="mt-6 bg-white rounded-xl ring-1 ring-neutral-200 overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 w-20">ID</th>
                <th className="px-4 py-3">Nombre del Servicio</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-right">Precio Sugerido</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-neutral-400">
                    Cargando servicios...
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((s) => (
                  <tr key={s.id} className="relative group hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-mono text-neutral-500">{s.idStr}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.nombre}</td>
                    <td
                      className="px-4 py-3 text-neutral-500 max-w-xs truncate"
                      title={s.descripcion}
                    >
                      {s.descripcion}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      ${s.precio.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                          className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
                        >
                          ⋮
                        </button>
                        {openMenuId === s.id && (
                          <Menu onEdit={() => onEditRow(s)} onDelete={() => eliminar(s)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-neutral-400">
                    No se encontraron servicios.
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
        title="Nuevo Servicio"
      >
        <form onSubmit={agregarServicio} className="space-y-5">
          <Field label="Nombre del Servicio">
            <InputGreen
              id="nombre"
              value={nuevo.nombre}
              onChange={onChangeNew}
              placeholder="Ej. Mano de Obra"
              required
            />
          </Field>
          <Field label="Descripción (Opcional)">
            <InputGreen
              id="descripcion"
              value={nuevo.descripcion}
              onChange={onChangeNew}
              placeholder="Detalles breves..."
            />
          </Field>
          <Field label="Precio Sugerido ($)">
            <InputGreen
              id="precio"
              type="number"
              min="0"
              step="0.01"
              value={nuevo.precio}
              onChange={onChangeNew}
              placeholder="0.00"
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

      {/* Modal Editar (NUEVO) */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar Servicio">
        <form onSubmit={guardarEdicion} className="space-y-5">
          <Field label="Nombre del Servicio">
            <InputGreen id="nombre" value={editForm.nombre} onChange={onChangeEdit} required />
          </Field>
          <Field label="Descripción (Opcional)">
            <InputGreen id="descripcion" value={editForm.descripcion} onChange={onChangeEdit} />
          </Field>
          <Field label="Precio Sugerido ($)">
            <InputGreen
              id="precio"
              type="number"
              min="0"
              step="0.01"
              value={editForm.precio}
              onChange={onChangeEdit}
            />
          </Field>
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
