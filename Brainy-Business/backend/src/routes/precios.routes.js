// backend/src/routes/precios.routes.js
const express = require('express')
const router = express.Router()
const preciosController = require('../controllers/preciosController')

// Ruta para crear o actualizar precios
// POST http://localhost:3001/api/precios
router.post('/', preciosController.upsert)

module.exports = router
