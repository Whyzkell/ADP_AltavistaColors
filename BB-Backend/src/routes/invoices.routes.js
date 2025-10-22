const router = require("express").Router();
const { pool, query } = require("../db");
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/invoices.controller");

// Auth para todo
router.use(auth);

router.get("/invoices", ctrl.list);
router.get("/invoices/:id", ctrl.getOne);
router.post("/invoices", ctrl.create);
router.delete("/invoices/:id", ctrl.remove);
module.exports = router;
