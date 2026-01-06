const db = require("../db/index");
const { pool } = require("../db");

exports.list = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, numero, cliente, direccion, fecha_emision, total
       FROM facturas ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("invoices.list", e);
    res.status(500).json({ error: e.message || "Error interno" });
  }
};

exports.getOne = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { rows } = await pool.query(`SELECT * FROM facturas WHERE id = $1`, [
      id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "No encontrada" });
    const items = await pool.query(
      `SELECT id, factura_id, producto_id, nombre, cantidad, precio_unit, total
       FROM factura_items WHERE factura_id = $1 ORDER BY id`,
      [id]
    );
    res.json({ ...rows[0], items: items.rows });
  } catch (e) {
    console.error("invoices.getOne", e);
    res.status(500).json({ error: e.message || "Error interno" });
  }
};

exports.create = async (req, res) => {
  const {
    cliente = "",
    direccion = "",
    dui = "",
    nit = "",
    condiciones = "",
    items: itemsRaw = [],
    productos: productosRaw = [],
    meta = {},
  } = req.body;

  if (!cliente.trim())
    return res.status(400).json({ error: "Cliente requerido" });

  // Acepta ambos formatos: items [{nombre,cantidad,precio}] o productos idem
  const src =
    Array.isArray(itemsRaw) && itemsRaw.length ? itemsRaw : productosRaw;

  const items = (src || [])
    .map((it) => ({
      pid: it.producto_id ?? it.pid ?? null,
      nombre: String(it.nombre || "").trim(),
      cantidad: Number(it.cantidad ?? it.cant ?? 0),
      precio: Number(it.precio ?? it.precio_unit ?? 0),
    }))
    .filter(
      (it) =>
        it.nombre &&
        Number.isFinite(it.cantidad) &&
        it.cantidad > 0 &&
        Number.isFinite(it.precio)
    );

  if (items.length === 0) {
    return res.status(400).json({ error: "Debe enviar al menos un item" });
  }

  const userId = req.user.id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      rows: [fact],
    } = await client.query(
      `INSERT INTO facturas
         (numero, cliente, direccion, dui, nit, condiciones, usuario_id, fecha_emision, total, payload)
       VALUES (NULL,$1,$2,$3,$4,$5,$6,CURRENT_DATE,0,$7)
       RETURNING id, numero`,
      [cliente, direccion, dui, nit, condiciones || null, userId, meta]
    );

    for (const it of items) {
      await client.query(
        `INSERT INTO factura_items (factura_id, producto_id, nombre, cantidad, precio_unit)
         VALUES ($1,$2,$3,$4,$5)`,
        [fact.id, it.pid, it.nombre, it.cantidad, it.precio]
      );
      if (it.pid) {
        await client.query(
          `UPDATE productos SET existencias = GREATEST(existencias - $1, 0) WHERE id = $2`,
          [it.cantidad, it.pid]
        );
      }
    }

    const {
      rows: [s],
    } = await client.query(
      `SELECT COALESCE(SUM(cantidad * precio_unit), 0) AS total
       FROM factura_items WHERE factura_id = $1`,
      [fact.id]
    );
    await client.query(`UPDATE facturas SET total = $1 WHERE id = $2`, [
      s.total,
      fact.id,
    ]);

    await client.query("COMMIT");
    return res.json({ id: fact.id, numero: fact.numero, total: s.total });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("create invoice error:", e);
    return res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "id inválido" });

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Recupera items para regresar existencias
    const { rows: items } = await client.query(
      "SELECT producto_id, cantidad FROM factura_items WHERE factura_id=$1",
      [id]
    );

    // Borra items primero
    await client.query("DELETE FROM factura_items WHERE factura_id=$1", [id]);

    // Regresa stock sólo si hay producto_id
    for (const it of items) {
      if (it.producto_id) {
        await client.query(
          "UPDATE productos SET existencias = existencias + $1 WHERE id=$2",
          [it.cantidad, it.producto_id]
        );
      }
    }

    // Ahora sí borra la factura
    const del = await client.query("DELETE FROM facturas WHERE id=$1", [id]);
    if (del.rowCount === 0) throw new Error("No encontrada");

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("invoices.remove", e);
    res.status(500).json({ error: e.message || "Error interno" });
  } finally {
    client.release();
  }
};
