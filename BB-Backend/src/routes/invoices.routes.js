const express = require("express");
const router = express.Router();
const { pool, query } = require("../db");
const auth = require("../middleware/authMiddleware");

// Auth para todo
router.use(auth);

/*
POST /invoices
body:
{
  cliente, direccion, dui, nit, condiciones,
  productos: [{ nombre, cantidad, precio_unit, producto_id? }],
  resumen: { ventaTotal, ... },
  payload: {...} // opcional (guarda el formulario original)
}
*/
router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      cliente,
      direccion,
      dui,
      nit,
      condiciones,
      productos = [],
      resumen = {},
      payload = {},
    } = req.body;

    const insCab = `
      INSERT INTO facturas (cliente, direccion, dui, nit, condiciones, usuario_id, total, payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`;
    const valsCab = [
      cliente,
      direccion,
      dui,
      nit,
      condiciones,
      req.user.id,
      resumen.ventaTotal || 0,
      payload,
    ];
    const { rows: rf } = await client.query(insCab, valsCab);
    const factura = rf[0];

    for (const it of productos) {
      await client.query(
        `INSERT INTO factura_items (factura_id, producto_id, nombre, cantidad, precio_unit)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          factura.id,
          it.producto_id || null,
          it.nombre,
          it.cantidad,
          it.precio_unit,
        ]
      );
    }

    // Si no tienes trigger de recálculo, descomenta:
    // await client.query('SELECT fn_recalcular_factura($1)', [factura.id])

    await client.query("COMMIT");
    res.status(201).json({ id: factura.id });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// GET /invoices  (cabeceras)
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, cliente, fecha_emision AS fecha, direccion, total
       FROM facturas
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /invoices/:id  (detalle + items)
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const cab = await query("SELECT * FROM facturas WHERE id=$1", [id]);
    if (!cab.rows[0])
      return res.status(404).json({ error: "Factura no encontrada" });
    const items = await query(
      "SELECT * FROM factura_items WHERE factura_id=$1",
      [id]
    );
    res.json({ ...cab.rows[0], items: items.rows });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
