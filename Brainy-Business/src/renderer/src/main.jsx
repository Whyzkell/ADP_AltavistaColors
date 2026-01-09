// src/main.jsx
import '../src/tailwind/index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
// --- INICIO DE LA CORRECCIÓN ---
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
// --- FIN DE LA CORRECCIÓN ---
import { AuthProvider } from '../AuthContext'

// --- Nuestros nuevos componentes ---
import AppLayout from './AppLayout'
import ProtectedRoute from './ProtectedRoute'

// --- Página pública ---
import Login from './login'

// --- Páginas de contenido (las que van dentro del layout) ---
import Dashboard from './components/Paginas/Dashboard.jsx'
import Inventario from './components/Paginas/Iventario.jsx'
import Ventas from './components/Paginas/Ventas.jsx'
import Facturas from './components/Paginas/Facturas.jsx'
import CreditoFiscal from './components/Paginas/CreditoFiscal.jsx'
import Estadisticas from './components/Paginas/Estadisticas.jsx'
import Servicios from './components/Paginas/Servicios'
import Vencimientos from './components/Paginas/Vencimientos'
import Precios from './components/Paginas/Precios.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- RUTA PÚBLICA --- */}
          {/* El login no está protegido */}
          <Route path="/login" element={<Login />} />

          {/* --- RUTAS PROTEGIDAS --- */}
          {/* Todo lo que esté aquí adentro usará ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            {/* Todo lo que esté aquí adentro usará AppLayout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/app" element={<Dashboard />} />
              <Route path="/Inventario" element={<Inventario />} />
              <Route path="/Ventas" element={<Ventas />} />
              <Route path="/Facturas" element={<Facturas />} />
              <Route path="/CreditoFiscal" element={<CreditoFiscal />} />
              <Route path="/Estadisticas" element={<Estadisticas />} />
              <Route path="/Servicios" element={<Servicios />} />
              <Route path="/Vencimientos" element={<Vencimientos />} />
              <Route path="/Precios" element={<Precios />} />
            </Route>
          </Route>

          {/* Opcional: Redirige cualquier otra ruta al inicio */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
)
