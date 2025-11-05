// src/EstadisticasPage.jsx
import { useAuth } from '../AuthContext'
import React from 'react'
import Topbar from '../src/components/layout/Topbar.jsx'
import Sidebar from '../src/components/layout/Sidebar.jsx'
import Estadisticas from './components/Paginas/Estadisticas.jsx' // La página que ya creamos

function EstadisticasPage() {
  const { user, loading } = useAuth()

  if (loading && !localStorage.getItem('token')) {
    return <div>Cargando...</div>
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* --- CORRECCIÓN DE IMPRESIÓN --- */}
        <Topbar title="Estadísticas" className="print:hidden" />
        <div className="mx-auto flex">
          <Sidebar className="print:hidden" />
          {/*
            Añadimos print:ml-0 y print:p-0 para que el contenido
            ocupe toda la página al imprimir.
          */}
          <main className="flex-1 ml-64 p-6 print:ml-0 print:p-0">
            <Estadisticas />
          </main>
        </div>
        <div className="mt-8 h-10 bg-neutral-100/60 print:hidden" />
      </div>
    </>
  )
}

export default EstadisticasPage
