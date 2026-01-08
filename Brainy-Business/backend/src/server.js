// src/server.js (o backend/src/server.js)
const express = require('express')
const cors = require('cors')
const path = require('path') // <--- NUEVO
const fs = require('fs') // <--- NUEVO

const authRoutes = require('./routes/authRoutes')
const productsRoutes = require('./routes/products.routes')
// const authMiddleware = require("./middleware/authMiddleware");

const app = express()

// 1. CORS para Electron
app.use(cors())

app.use(express.json())

// --- CONFIGURACIÓN DE IMÁGENES (NUEVO) ---
// Definimos la carpeta donde se guardarán las fotos.
// process.cwd() apunta a la raíz donde se ejecuta el programa (.exe o proyecto)
const uploadDir = path.join(process.cwd(), 'uploads')

// Si la carpeta no existe, la creamos automáticamente
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
  console.log('Carpeta uploads creada en:', uploadDir)
}

// Hacemos pública la carpeta para que React pueda acceder a las fotos
// Ejemplo: <img src="http://localhost:3001/uploads/mi-foto.jpg" />
app.use('/uploads', express.static(uploadDir))

// --- RUTAS ---
app.use('/auth', authRoutes)

// Productos
app.use('/api/products', productsRoutes)

// Facturas
const invoicesRoutes = require('./routes/invoices.routes')
app.use('/api', invoicesRoutes)

// Créditos y Estadísticas
app.use('/api', require('./routes/creditos.routes'))
app.use('/api/stats', require('./routes/stats.routes'))

// --- MANEJO DE ERRORES ---
app.use((err, _req, res, _next) => {
  console.error('[Backend Error]', err)
  res.status(500).json({ error: err.message || 'Error interno del servidor' })
})

// --- RUTAS NUEVAS ---
app.use('/api/servicios', require('./routes/servicios.routes'))
app.use('/api/lotes', require('./routes/lotes.routes'))

// 2. INICIO DEL SERVIDOR
const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`Backend local corriendo en puerto ${PORT}`)
  console.log(`Directorio de imágenes: ${uploadDir}`) // Para que sepas dónde caen

  if (process.send) {
    process.send('server-ready')
  }
})

module.exports = app
