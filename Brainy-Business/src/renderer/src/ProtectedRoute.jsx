// src/ProtectedRoute.jsx
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext' // Asegúrate que la ruta a AuthContext sea correcta

const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    // Muestra un 'Cargando...' en pantalla completa mientras se verifica el token
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  if (!user) {
    // Si no hay usuario (y ya no está cargando), redirige a /login
    return <Navigate to="/login" replace />
  }

  // Si hay usuario, muestra el contenido de la ruta (que será tu Layout)
  return <Outlet />
}

export default ProtectedRoute
