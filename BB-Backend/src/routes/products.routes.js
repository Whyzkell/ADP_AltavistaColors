const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/productsController");

// Todas requieren auth
router.use(auth);

// GET /api/products
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await db.query(`
  SELECT id,
         nombre,
         categoria,
         precio_unit AS precio,
         codigo,
         existencias
  FROM productos
  ORDER BY id DESC
`);
    res.json(rows);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post("/", async (req, res, next) => {
  try {
    const { nombre, categoria, precio, codigo, existencias } = req.body;

    // Tipos seguros (evita 22P02 en PG)
    const precioN = Number(precio);
    const codigoN = Number(codigo);
    const existN = Number(existencias);

    const p = Number(precio ?? precio_unit); // acepta cualquiera
    const { rows } = await db.query(
      `
  INSERT INTO productos (nombre, categoria, precio_unit, codigo, existencias)
  VALUES ($1,$2,$3,$4,$5)
  RETURNING id, nombre, categoria, precio_unit AS precio, codigo, existencias
`,
      [nombre, categoria, p, Number(codigo), Number(existencias)]
    );
    res.json(rows[0]);

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { nombre, categoria, precio, codigo, existencias } = req.body;
    const id = Number(req.params.id);

    const { rows } = await db.query(
      `
  UPDATE productos
     SET nombre=$1, categoria=$2, precio_unit=$3, codigo=$4, existencias=$5
   WHERE id=$6
RETURNING id, nombre, categoria, precio_unit AS precio, codigo, existencias
`,
      [
        nombre,
        categoria,
        Number(precio ?? precio_unit),
        Number(codigo),
        Number(existencias),
        id,
      ]
    );
    res.json(rows[0]);

    if (!rows[0])
      return res.status(404).json({ error: "Producto no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.query("DELETE FROM productos WHERE id=$1", [id]);

    if (!rowCount)
      return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
