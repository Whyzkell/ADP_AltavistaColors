// src/components/layout/Sidebar.jsx
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const SidebarLink = ({ label, to, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm cursor-pointer
      ${isActive ? 'bg-[#Da2864]/20 text-[#Da2864] font-semibold' : 'text-neutral-700 hover:bg-neutral-50'}`
    }
  >
    <img src={icon} className="w-5 h-5" alt="" />
    {label}
  </NavLink>
)

export default function Sidebar({ className = '' }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 h-screen w-64 flex-col gap-4 border-r bg-white shadow-sm ${className}`}
    >
      {/* Logo */}
      <div className="px-5 py-3 border-b">
        <div className="flex items-center justify-center">
          <img src="resources/Logo.png" className="w-[220px]" alt="Logo" />
        </div>
      </div>

      {/* Links */}
      <nav className="px-4 flex-1 flex flex-col gap-1">
        <SidebarLink label="Inicio" to="/" icon="resources/Dashboard.png" />
        <SidebarLink label="Inventario" to="/Inventario" icon="resources/Lista.png" />
        <SidebarLink label="Precios" to="/Precios" icon="resources/tags.png" />
        {/* --- NUEVAS PÁGINAS --- */}
        {/* Asegúrate de añadir Services.png y Calendar.png a tu carpeta resources */}
        <SidebarLink label="Servicios" to="/Servicios" icon="resources/Services.png" />
        <SidebarLink label="Vencimientos" to="/Vencimientos" icon="resources/Calendar.png" />
        {/* ---------------------- */}

        <SidebarLink label="Ventas" to="/Ventas" icon="resources/Venta.png" />
        <SidebarLink label="Estadisticas" to="/Estadisticas" icon="resources/Chart_Line.png" />

        <div className="h-px my-3 bg-neutral-200" />

        <SidebarLink label="Factura" to="/Facturas" icon="resources/Factura.png" />
        <SidebarLink
          label="Crédito Fiscal"
          to="/CreditoFiscal"
          icon="resources/CreditoFiscal.png"
        />

        <div className="h-px my-3 bg-neutral-200" />

        <button
          onClick={handleLogout}
          className="text-left flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <img src="resources/Salir.png" className="w-5 h-5" alt="" />
          Cerrar Sesión
        </button>
      </nav>

      <div className="px-6 py-4 text-xs text-neutral-400">© 2025</div>
    </aside>
  )
}
