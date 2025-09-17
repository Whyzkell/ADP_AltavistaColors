import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import InicioIcon from '../../../../../resources/Dashboard.png'
import ListaIcon from '../../../../../resources/Lista.png'
import VentaIcon from '../../../../../resources/Venta.png'
import FacturaIcon from '../../../../../resources/Factura.png'
import CreditoIcon from '../../../../../resources/CreditoFiscal.png'
import SalirIcon from '../../../../../resources/Salir.png'
import SoloLogo from '../../../../../resources/Logo.png'

const SidebarLink = ({ label, to, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm cursor-pointer
      ${isActive ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'}`
    }
  >
    <img src={icon} className="w-5 h-5" />
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
      <div className="px-5 py-3 border-b">
        <div className="flex items-center justify-center">
          <img src={SoloLogo} className=" w-[220px] " />
        </div>
      </div>

      {/* Links */}
      <nav className="px-4 flex-1 flex flex-col gap-1">
        <SidebarLink label="Inicio" to="/" icon={InicioIcon} />
        <SidebarLink label="Inventario" to="/Inventario" icon={ListaIcon} />
        <SidebarLink label="Ventas" to="/Ventas" icon={VentaIcon} />
        <div className="h-px my-3 bg-neutral-200" />
        <SidebarLink label="Factura" to="/Facturas" icon={FacturaIcon} />
        <SidebarLink label="Crédito Fiscal" to="/CreditoFiscal" icon={CreditoIcon} />
        <div className="h-px my-3 bg-neutral-200" />

        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="text-left flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <img src={SalirIcon} className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 text-xs text-neutral-400">© 2025</div>
    </aside>
  )
}
