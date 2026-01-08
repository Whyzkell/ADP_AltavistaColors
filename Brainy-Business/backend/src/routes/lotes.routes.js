const router = require('express').Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/lotes.controller')

router.use(auth)

// Obtener lotes de un producto (ej: /api/lotes/producto/5)
router.get('/producto/:productId', ctrl.getByProduct)

// Crear un lote nuevo
router.post('/', ctrl.create)

router.get('/', ctrl.listAll)

router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.delete)

module.exports = router
