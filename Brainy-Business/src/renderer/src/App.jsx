import { useAuth } from '../AuthContext'
import React from 'react'
import Topbar from '../src/components/layout/Topbar.jsx'
import Sidebar from '../src/components/layout/Sidebar.jsx'
import Dashboard from './components/Paginas/Dashboard.jsx'

function App() {
  const { user, loading, fetchUserData } = useAuth()

  if (loading && !localStorage.getItem('token')) {
    return <div>Cargando...</div>
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        <Topbar title="Inicio" />
        <div className=" mx-auto flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-6">
            <Dashboard />
          </main>
        </div>
        <div className="mt-8 h-10 bg-neutral-100/60" />
      </div>
    </>
  )
}

export default App
