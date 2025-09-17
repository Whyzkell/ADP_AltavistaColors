import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const SidebarLink = ({ label, to }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm cursor-pointer
      ${isActive ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'}`
    }
  >
    <span className="h-5 w-5 rounded-md bg-neutral-300" />
    {label}
  </NavLink>
)

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // 🔴 Aquí limpias la sesión
    localStorage.removeItem('token') // si guardas token
    localStorage.removeItem('user') // si guardas usuario
    // Si usas un AuthContext también llamas logout()

    // Redirigir al login
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 flex-col gap-4 border-r bg-white shadow-sm">
      {/* Logo */}
      <div className="px-5 py-6 border-b">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-purple-400" />
          <div className="leading-tight">
            <p className="text-xs text-neutral-500">ALTAVISTA</p>
            <p className="text-base font-bold">COLOR</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="px-4 flex-1 flex flex-col gap-1">
        <SidebarLink label="Inicio" to="/" />
        <SidebarLink label="Inventario" to="/Inventario" />
        <SidebarLink label="Ventas" to="/Ventas" />
        <div className="h-px my-3 bg-neutral-200" />
        <SidebarLink label="Factura" to="/Facturas" />
        <SidebarLink label="Crédito Fiscal" to="/CreditoFiscal" />
        <div className="h-px my-3 bg-neutral-200" />
        <SidebarLink label="Cuenta" to="/Cuenta" />

        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="text-left flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <span className="h-5 w-5 rounded-md bg-neutral-300" />
          Cerrar Sesión
        </button>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 text-xs text-neutral-400">© 2025</div>
    </aside>
  )
}
