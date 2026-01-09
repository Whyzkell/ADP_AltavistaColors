// src/routes/descuentos.routes.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/descuentosController')

router.get('/', controller.list)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

module.exports = router
