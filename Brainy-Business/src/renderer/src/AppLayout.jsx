// src/AppLayout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from './components/layout/Topbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Puedes poner un título genérico o manejarlo con un Contexto */}
      <Topbar title="Brainy-Business" />
      <div className="mx-auto flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          {/* Aquí se renderizará la página (Dashboard, Ventas, etc.) */}
          <Outlet />
        </main>
      </div>
      <div className="mt-8 h-10 bg-neutral-100/60" />
    </div>
  )
}

export default AppLayout
