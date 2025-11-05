// src/controllers/stats.controller.js
const { pool } = require("../db");

exports.getTopProducts = async (req, res) => {
  try {
    /*
     * Esta consulta hace lo siguiente:
     * 1. Usa UNION ALL para juntar todos los items de facturas y créditos en una tabla temporal.
     * 2. Se une con la tabla 'productos' para obtener el nombre.
     * 3. Agrupa por producto_id y nombre.
     * 4. Suma la 'cantidad' total vendida y el 'valor' total (cantidad * precio).
     * 5. Ordena de mayor a menor por unidades vendidas.
     * 6. Devuelve los 10 primeros.
     */
    const query = `
        SELECT
            p.id AS producto_id,
            p.nombre,
            p.codigo,
            SUM(t.cantidad) AS total_unidades_vendidas,
            SUM(t.cantidad * t.precio_unit) AS total_valor_vendido
        FROM (
            SELECT producto_id, cantidad, precio_unit FROM factura_items
            UNION ALL
            SELECT producto_id, cantidad, precio_unit FROM credito_items
        ) AS t
        JOIN productos p ON t.producto_id = p.id
        WHERE t.producto_id IS NOT NULL
        GROUP BY p.id, p.nombre, p.codigo
        ORDER BY total_unidades_vendidas DESC
        LIMIT 10;
    `;

    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (e) {
    console.error("Error en getTopProducts:", e);
    res.status(500).json({ error: e.message || "Error interno del servidor" });
  }
};

// NUEVA FUNCIÓN PARA EL GRÁFICO (ACTUALIZADA)
exports.getTimeSeries = async (req, res) => {
  try {
    const {
      observe = "general", // 'general', 'invoices', 'credits', 'product'
      measure = "cantidad", // 'cantidad', 'efectivo'
      timeframe = "monthly", // 'weekly', 'monthly', 'yearly', 'all'
      productId = null,
    } = req.query;

    const params = [];
    let paramIndex = 1;

    // --- 1. Definir Origen de Datos (Filtro) ---
    // AHORA INCLUYE 'doc_id' (el id de la factura/credito)
    let sourceQuery = `
      (
        SELECT 'invoice' as tipo, f.id as doc_id, fecha_emision, producto_id, cantidad, precio_unit
        FROM facturas f JOIN factura_items fi ON f.id = fi.factura_id
      ) UNION ALL (
        SELECT 'credit' as tipo, cf.id as doc_id, fecha_emision, producto_id, cantidad, precio_unit
        FROM creditos_fiscales cf JOIN credito_items ci ON cf.id = ci.credito_id
      )
    `;

    // --- 2. Definir Medida (Eje Y) ---
    // ¡ESTA ES LA LÓGICA CORREGIDA!
    let measureSelect;
    if (measure === "efectivo") {
      // Para "Efectivo", siempre sumamos el valor
      measureSelect = "SUM(t.cantidad * t.precio_unit)";
    } else {
      // measure === 'cantidad'
      // Si es "Cantidad", depende de qué observamos
      if (
        observe === "general" ||
        observe === "invoices" ||
        observe === "credits"
      ) {
        // Contar # de documentos únicos (transacciones)
        measureSelect = "COUNT(DISTINCT t.doc_id)";
      } else {
        // Contar # de productos (para 'product')
        measureSelect = "SUM(t.cantidad)";
      }
    }

    // --- 3. Definir Lapso de Tiempo (Eje X) ---
    let dateWhere = "";
    let grouping = `DATE_TRUNC('day', t.fecha_emision)`; // Por defecto, agrupar por día

    if (timeframe === "weekly") {
      dateWhere = `WHERE t.fecha_emision >= NOW() - INTERVAL '7 days'`;
    } else if (timeframe === "monthly") {
      dateWhere = `WHERE t.fecha_emision >= NOW() - INTERVAL '30 days'`;
    } else if (timeframe === "yearly") {
      dateWhere = `WHERE t.fecha_emision >= NOW() - INTERVAL '12 months'`;
      grouping = `DATE_TRUNC('month', t.fecha_emision)`; // Agrupar por mes para 'anual'
    } else {
      // 'all' - no hay filtro de fecha
      grouping = `DATE_TRUNC('month', t.fecha_emision)`; // Agrupar por mes para 'all'
    }

    // --- 4. Añadir Filtros de Observación ---
    if (observe === "invoices") {
      dateWhere += (dateWhere ? " AND" : "WHERE") + ` t.tipo = 'invoice'`;
    } else if (observe === "credits") {
      dateWhere += (dateWhere ? " AND" : "WHERE") + ` t.tipo = 'credit'`;
    } else if (observe === "product" && productId) {
      dateWhere +=
        (dateWhere ? " AND" : "WHERE") + ` t.producto_id = $${paramIndex}`;
      params.push(productId);
      paramIndex++;
    }

    // --- 5. Construir Consulta Final ---
    const query = `
      SELECT
        ${grouping} AS fecha,
        ${measureSelect} AS valor
      FROM (
        ${sourceQuery}
      ) AS t
      ${dateWhere}
      GROUP BY fecha
      ORDER BY fecha ASC;
    `;

    const { rows } = await pool.query(query, params);

    // Formatear para el gráfico (ej. '2025-10-20')
    const formattedRows = rows.map((r) => ({
      fecha: new Date(r.fecha).toISOString().split("T")[0],
      valor: Number(r.valor),
    }));

    res.json(formattedRows);
  } catch (e) {
    console.error("Error en getTimeSeries:", e);
    res.status(500).json({ error: e.message || "Error interno del servidor" });
  }
};
