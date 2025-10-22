// src/controllers/productsController.js
const db = require("../db/index");

// GET /api/products
exports.list = async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT 
         id AS id_producto,
         nombre,
         categoria,
         precio_unit AS precio,
         codigo,
         existencias,
         creado_en
       FROM productos
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("[products:list]", err);
    res.status(500).json({ error: err.message || "Error al listar productos" });
  }
};

// POST /api/products
exports.create = async (req, res) => {
  try {
    const { nombre, categoria, precio, codigo, existencias } = req.body;

    const { rows } = await db.query(
      `INSERT INTO productos (nombre, categoria, precio_unit, codigo, existencias)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING 
         id AS id_producto, nombre, categoria, precio_unit AS precio, codigo, existencias`,
      [nombre, categoria, precio, codigo, existencias]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[products:create]", err);
    res.status(500).json({ error: err.message || "Error al crear producto" });
  }
};

// PUT /api/products/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria, precio, codigo, existencias } = req.body;

    const { rows } = await db.query(
      `UPDATE productos
         SET nombre=$1, categoria=$2, precio_unit=$3, codigo=$4, existencias=$5
       WHERE id=$6
       RETURNING 
         id AS id_producto, nombre, categoria, precio_unit AS precio, codigo, existencias`,
      [nombre, categoria, precio, codigo, existencias, id]
    );

    if (!rows.length) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[products:update]", err);
    res
      .status(500)
      .json({ error: err.message || "Error al actualizar producto" });
  }
};

// DELETE /api/products/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query("DELETE FROM productos WHERE id=$1", [
      id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "No encontrado" });
    res.status(204).send();
  } catch (err) {
    console.error("[products:remove]", err);
    res
      .status(500)
      .json({ error: err.message || "Error al eliminar producto" });
  }
};
