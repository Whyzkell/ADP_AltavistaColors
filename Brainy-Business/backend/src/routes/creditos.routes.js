// src/routes/creditos.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// ⬇️ Ajusta esta import a tu archivo de conexión.
// Ej: const { pool } = require("../db");
const { pool } = require("../db");

// Helper: normaliza fechas "DD/MM/AAAA" o deja "YYYY-MM-DD"
function toISODate(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

router.use(auth);

/* =========================
    LISTAR CREDITOS (resumen)
    ========================= */
router.get("/creditos", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, numero, cliente, direccion, fecha_emision, total
          FROM creditos_fiscales
          ORDER BY id DESC
          LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /creditos error:", err);
    res.status(500).json({ error: "Error listando créditos fiscales" });
  }
});

/* =========================
    OBTENER UNO (detalle)
    ========================= */
router.get("/creditos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "id inválido" });

  try {
    const { rows } = await pool.query(
      `SELECT *
          FROM creditos_fiscales
        WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "No existe" });

    const credito = rows[0];

    const items = await pool.query(
      `SELECT id,
                producto_id AS pid,
                nombre,
                cantidad AS cant,
                precio_unit AS precio,
                total
          FROM credito_items
          WHERE credito_id = $1
          ORDER BY id`,
      [id]
    );

    credito.items = items.rows;
    res.json(credito);
  } catch (err) {
    console.error("GET /creditos/:id error:", err);
    res.status(500).json({ error: "Error obteniendo crédito fiscal" });
  }
});

/* =========================
    CREAR CREDITO
    ========================= */
router.post("/creditos", async (req, res) => {
  const b = req.body;

  // 1) Normaliza el array de items: acepta productos | items | prods
  const rawItems = Array.isArray(b.productos)
    ? b.productos
    : Array.isArray(b.items)
    ? b.items
    : Array.isArray(b.prods)
    ? b.prods
    : [];

  // 2) Mapea nombres comunes → {pid, nombre, cant, precio}
  const normItems = rawItems
    .map((it) => ({
      pid: it.pid ?? it.producto_id ?? null,
      nombre: (it.nombre ?? it.producto ?? "").trim(),
      cant: Number(it.cant ?? it.cantidad ?? 0),
      precio: Number(it.precio ?? it.precio_unit ?? it.precioUnitario ?? 0),
    }))
    .filter(
      (x) =>
        x.nombre &&
        Number.isFinite(x.cant) &&
        x.cant > 0 &&
        Number.isFinite(x.precio) &&
        x.precio >= 0
    );

  // 3) Validaciones mínimas del formulario
  if (!b?.cliente || !b?.nit) {
    return res.status(400).json({ error: "cliente y nit son obligatorios" });
  }
  if (normItems.length === 0) {
    return res.status(400).json({ error: "Agrega al menos un producto" });
  }

  // 4) Totales (acepta subTotal|sumas, iva13, ivaRetenido, ventaTotal)
  const sumas = Number(b?.resumen?.subTotal ?? b?.resumen?.sumas ?? 0);
  const iva13 = Number(b?.resumen?.iva13 ?? 0);
  const ivaRet = Number(b?.resumen?.ivaRetenido ?? 0);
  // Se calcula 'ventaTotal' aquí pero NO se inserta en la DB si es generada
  const ventaTotal = Number(b?.resumen?.ventaTotal ?? sumas + iva13 - ivaRet);

  const fechaRemisionAnt = toISODate(b.fechaNotaAnterior);
  const usuarioId = req.user?.id ?? null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertCredito = `
      INSERT INTO creditos_fiscales
        (cliente, direccion, municipio, nrc, departamento, nit,
        condiciones_op, nota_remision_ant, venta_cuenta_de, fecha_remision_ant,
        usuario_id, fecha_emision, subtotal, iva_13, iva_retenido, payload, creado_en)
      VALUES
        ($1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11, CURRENT_DATE, $12,$13,$14, $15, NOW())
      RETURNING id, numero, total
    `;

    const payload = {
      form: {
        cliente: b.cliente,
        direccion: b.direccion,
        municipio: b.municipio,
        nrc: b.nrc,
        departamento: b.departamento,
        nit: b.nit,
        condiciones: b.condiciones,
        notaAnterior: b.notaAnterior,
        ventaCuentaDe: b.ventaCuentaDe,
        fechaNotaAnterior: b.fechaNotaAnterior,
      },
      productos: normItems,
      resumen: { subTotal: sumas, iva13, ivaRetenido: ivaRet, ventaTotal },
    };

    const { rows } = await client.query(insertCredito, [
      b.cliente ?? null,
      b.direccion ?? null,
      b.municipio ?? null,
      b.nrc ?? null,
      b.departamento ?? null,
      b.nit ?? null,
      b.condiciones ?? null, // condiciones_op
      b.notaAnterior ?? null, // nota_remision_ant
      b.ventaCuentaDe ?? null, // venta_cuenta_de
      fechaRemisionAnt, // fecha_remision_ant (date)
      usuarioId,
      sumas,
      iva13,
      ivaRet,
      payload, // jsonb (ahora es $15)
    ]);

    const credito = rows[0];

    const insertItem = `
      INSERT INTO credito_items
        (credito_id, producto_id, nombre, cantidad, precio_unit)
      VALUES ($1,$2,$3,$4,$5)
    `;

    for (const it of normItems) {
      await client.query(insertItem, [
        credito.id,
        it.pid ?? null,
        it.nombre,
        it.cant,
        it.precio,
      ]);

      // Si el producto tiene un ID (pid), actualizamos el stock
      if (it.pid) {
        await client.query(
          `UPDATE productos SET existencias = GREATEST(existencias - $1, 0) WHERE id = $2`,
          [it.cant, it.pid]
        );
      }
    }

    // Aquí podrías (opcionalmente) insertar en la tabla 'ventas'
    // await client.query(
    //   `INSERT INTO ventas (tipo, cliente, fecha, monto, credito_id)
    //    VALUES ('CREDITO_FISCAL', $1, CURRENT_DATE, $2, $3)`,
    //   [b.cliente, ventaTotal, credito.id]
    // );

    await client.query("COMMIT");
    return res.status(201).json(credito); // { id, numero, total }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /creditos error:", err);
    return res.status(500).json({
      error: err?.detail || err?.message || "Error creando crédito fiscal",
    });
  } finally {
    client.release();
  }
});

/* =========================
    ELIMINAR CREDITO
    ========================= */
router.delete("/creditos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "id inválido" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Recupera items para regresar existencias
    const { rows: items } = await client.query(
      "SELECT producto_id, cantidad FROM credito_items WHERE credito_id=$1",
      [id]
    );

    // 2. Borra items (tabla hija)
    await client.query("DELETE FROM credito_items WHERE credito_id=$1", [id]);

    // 3. <-- ¡ESTA ES LA LÍNEA QUE FALTABA!
    // Borra de la tabla 'ventas' (otra tabla hija)
    await client.query("DELETE FROM ventas WHERE credito_id = $1", [id]);

    // 4. Regresa stock sólo si hay producto_id
    for (const it of items) {
      if (it.producto_id) {
        await client.query(
          "UPDATE productos SET existencias = existencias + $1 WHERE id=$2",
          [it.cantidad, it.producto_id]
        );
      }
    }

    // 5. Ahora sí borra el crédito (tabla padre)
    const { rowCount } = await client.query(
      `DELETE FROM creditos_fiscales WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    if (rowCount === 0) return res.status(404).json({ error: "No existe" });
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DELETE /creditos/:id error:", err);
    res.status(500).json({ error: "Error eliminando crédito fiscal" });
  } finally {
    client.release();
  }
});

module.exports = router;
