// src/routes/products.routes.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/productsController");
const authMiddleware = require("../middleware/authMiddleware");

// Todas requieren auth
router.use(auth);

// GET /api/products?q=texto
// (Esta es la única ruta GET / que necesitas, ya que maneja la búsqueda)
router.get("/", auth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim().toLowerCase();
    const params = [];
    let where = "";

    if (q) {
      params.push(`%${q}%`);
      where = `
        WHERE lower(nombre)    LIKE $1
           OR lower(categoria) LIKE $1
           OR CAST(codigo AS TEXT) LIKE $1
      `;
    }

    const { rows } = await db.query(
      `
        SELECT
          id,
          nombre,
          categoria,
          precio_unit AS precio,   -- normalizamos el nombre
          codigo,
          existencias
        FROM public.productos
        ${where}
        ORDER BY id DESC
      `,
      params
    );

    res.json(rows); // <-- Solo se envía UNA respuesta
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// --- CORRECCIÓN ---
// Se eliminó la ruta duplicada GET "/" que tenías aquí
// --- FIN DE CORRECCIÓN ---

// POST /api/products
router.post("/", async (req, res, next) => {
  try {
    const { nombre, categoria, precio, codigo, existencias } = req.body;

    const p = Number(precio ?? precio_unit); // acepta cualquiera
    const { rows } = await db.query(
      `
  INSERT INTO productos (nombre, categoria, precio_unit, codigo, existencias)
  VALUES ($1,$2,$3,$4,$5)
  RETURNING id, nombre, categoria, precio_unit AS precio, codigo, existencias
`,
      [nombre, categoria, p, Number(codigo), Number(existencias)]
    );

    // --- CORRECCIÓN ---
    // Se elimina la primera respuesta. Solo dejamos la que tiene el código 201.
    // res.json(rows[0]); // <-- ESTA LÍNEA SE BORRA
    res.status(201).json(rows[0]); // <-- Esta es la única respuesta
    // --- FIN DE CORRECCIÓN ---
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

    // --- CORRECCIÓN ---
    // Se reordena la lógica.
    // 1. Primero verificamos si el producto existe.
    if (!rows[0]) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // 2. Si existe, enviamos la respuesta (solo una vez).
    res.json(rows[0]);
    // --- FIN DE CORRECCIÓN ---
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rows } = await db.query(
      "DELETE FROM public.productos WHERE id = $1 RETURNING id",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    return res.json({ ok: true, id: rows[0].id }); // <-- Esta ruta estaba bien
  } catch (err) {
    console.error("DELETE /api/products/:id ->", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;
