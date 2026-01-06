const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");

router.use(auth);

// GET /sales
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, tipo, cliente, fecha, monto
       FROM ventas
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
