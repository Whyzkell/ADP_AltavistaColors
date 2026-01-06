// src/routes/stats.routes.js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/stats.controller");

// Protegemos la ruta
router.use(auth);

// Ruta para obtener los productos top
router.get("/top-products", ctrl.getTopProducts);
router.get("/timeseries", ctrl.getTimeSeries);

module.exports = router;
