// src/routes/products.routes.js (VERSIÓN LIMPIA CON CONTROLADOR)
const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/productsController') // Importamos el controlador
const multer = require('multer')
const path = require('path')

// Configuración Multer (IGUAL QUE ANTES)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

// Rutas
router.use(auth)

// Usamos las funciones del controlador (ctrl.list, ctrl.create, etc)
router.get('/', ctrl.list)
router.post('/', upload.single('imagen'), ctrl.create)
router.put('/:id', upload.single('imagen'), ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
