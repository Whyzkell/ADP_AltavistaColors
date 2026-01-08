const router = require('express').Router()
const auth = require('../middleware/authMiddleware')
const ctrl = require('../controllers/servicios.controller')

router.use(auth)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.delete('/:id', ctrl.delete)
router.put('/:id', ctrl.update)

module.exports = router
