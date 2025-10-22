const express = require("express");
const router = express.Router();
const { pool, query } = require("../db");
const auth = require("../middleware/authMiddleware");

router.use(auth);

/*
POST /creditos
body:
{
  cliente, direccion, municipio, nrc, departamento, nit,
  notaRemisionAnterior, fechaNotaRemisionAnterior,
  condicionesOperacion, ventaCuentaDe,
  productos: [{ nombre, cantidad, precio_unit, producto_id? }],
  resumen: { subTotal, iva13, ivaRetenido, ventaTotal },
  payload: {...}
}
*/
router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      cliente,
      direccion,
      municipio,
      nrc,
      departamento,
      nit,
      notaRemisionAnterior,
      fechaNotaRemisionAnterior,
      condicionesOperacion,
      ventaCuentaDe,
      productos = [],
      resumen = {},
      payload = {},
    } = req.body;

    const insCab = `
      INSERT INTO creditos_fiscales
      (cliente, direccion, municipio, nrc, departamento, nit,
       nota_remision_ant, fecha_remision_ant, condiciones_op, venta_cuenta_de,
       usuario_id, subtotal, iva_13, iva_retenido, total, payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`;
    const valsCab = [
      cliente,
      direccion,
      municipio,
      nrc,
      departamento,
      nit,
      notaRemisionAnterior,
      fechaNotaRemisionAnterior,
      condicionesOperacion,
      ventaCuentaDe,
      req.user.id,
      resumen.subTotal || 0,
      resumen.iva13 || 0,
      resumen.ivaRetenido || 0,
      resumen.ventaTotal || 0,
      payload,
    ];
    const { rows: rc } = await client.query(insCab, valsCab);
    const credito = rc[0];

    for (const it of productos) {
      await client.query(
        `INSERT INTO credito_items (credito_id, producto_id, nombre, cantidad, precio_unit)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          credito.id,
          it.producto_id || null,
          it.nombre,
          it.cantidad,
          it.precio_unit,
        ]
      );
    }

    // Si no tienes trigger:
    // await client.query('SELECT fn_recalcular_credito($1)', [credito.id])

    await client.query("COMMIT");
    res.status(201).json({ id: credito.id });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// GET /creditos
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, cliente, fecha_emision AS fecha, direccion, total
       FROM creditos_fiscales
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /creditos/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const cab = await query("SELECT * FROM creditos_fiscales WHERE id=$1", [
      id,
    ]);
    if (!cab.rows[0])
      return res.status(404).json({ error: "Crédito fiscal no encontrado" });
    const items = await query(
      "SELECT * FROM credito_items WHERE credito_id=$1",
      [id]
    );
    res.json({ ...cab.rows[0], items: items.rows });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
