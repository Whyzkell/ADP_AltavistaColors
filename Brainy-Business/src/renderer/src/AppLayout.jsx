// src/AppLayout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from './components/layout/Topbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white">
      {/* --- CORRECCIÓN DE IMPRESIÓN --- */}
      <Topbar title="Brainy-Business" className="print:hidden" />
      <div className="mx-auto flex">
        <Sidebar className="print:hidden" />
        {/*
          Añadimos print:ml-0 y print:p-0 para que el contenido
          ocupe toda la página al imprimir.
        */}
        <main className="flex-1 ml-64 p-6 print:ml-0 print:p-0">
          <Outlet />
        </main>
      </div>
      <div className="mt-8 h-10 bg-neutral-100/60 print:hidden" />
    </div>
  )
}

export default AppLayout
