// src/main.jsx
import '../src/tailwind/index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import VentasPage from './VentasPage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../AuthContext' // 👈 ajusta esta ruta a donde tengas el archivo real

import App from './App'

import Login from './login'

import IventarioPage from './IventarioPage'

import FacturasPage from './FacturasPage'

import CreditoFiscalPage from './CreditoFiscalPage'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/app" element={<App />} />

          <Route path="/login" element={<Login />} />

          <Route path="/Inventario" element={<IventarioPage />} />

          <Route path="/Ventas" element={<VentasPage />} />

          <Route path="/Facturas" element={<FacturasPage />} />

          <Route path="/CreditoFiscal" element={<CreditoFiscalPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
)
