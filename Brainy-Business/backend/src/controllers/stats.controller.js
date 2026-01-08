// src/controllers/stats.controller.js
const db = require('../db/index')

exports.getTopProducts = async (req, res) => {
  try {
    const query = `
        SELECT 
            p.id AS producto_id,
            p.nombre,
            p.codigo,
            p.imagen,
            SUM(t.cantidad) AS total_unidades_vendidas,
            SUM(t.cantidad * t.precio_unit) AS total_valor_vendido
        FROM (
            SELECT producto_id, cantidad, precio_unit FROM factura_items
            UNION ALL
            SELECT producto_id, cantidad, precio_unit FROM credito_items
        ) AS t
        JOIN productos p ON t.producto_id = p.id
        WHERE t.producto_id IS NOT NULL
        GROUP BY p.id, p.nombre, p.codigo, p.imagen
        ORDER BY total_unidades_vendidas DESC
        LIMIT 10;
    `
    const { rows } = await db.query(query)
    res.json(rows)
  } catch (e) {
    console.error('Error en getTopProducts:', e)
    res.status(500).json({ error: e.message || 'Error interno del servidor' })
  }
}

// NUEVA FUNCIÓN PARA EL GRÁFICO (ACTUALIZADA CON FILTROS DE PAGO)
exports.getTimeSeries = async (req, res) => {
  try {
    const {
      observe = 'general', // 'general', 'invoices', 'credits', 'product', 'cash', 'transfer', 'card'
      measure = 'cantidad', // 'cantidad', 'efectivo'
      timeframe = 'monthly', // 'weekly', 'monthly', 'yearly', 'all'
      productId = null
    } = req.query

    const params = []
    let paramIndex = 1

    /* --- 1. DEFINIR ORIGEN DE DATOS ---
       Modificamos la subconsulta para incluir 'tipo_de_pago' desde las tablas principales.
       Esto es necesario para poder filtrar luego.
    */
    let sourceQuery = `
      (
        SELECT 
          'invoice' as tipo, 
          f.id as doc_id, 
          f.fecha_emision, 
          f.tipo_de_pago, -- <--- NUEVO CAMPO NECESARIO
          fi.producto_id, 
          fi.cantidad, 
          fi.precio_unit
        FROM facturas f 
        JOIN factura_items fi ON f.id = fi.factura_id
      ) UNION ALL (
        SELECT 
          'credit' as tipo, 
          cf.id as doc_id, 
          cf.fecha_emision, 
          cf.tipo_de_pago, -- <--- NUEVO CAMPO NECESARIO
          ci.producto_id, 
          ci.cantidad, 
          ci.precio_unit
        FROM creditos_fiscales cf 
        JOIN credito_items ci ON cf.id = ci.credito_id
      )
    `

    /* --- 2. DEFINIR MEDIDA (Eje Y) --- */
    let measureSelect
    if (measure === 'efectivo') {
      // Suma monetaria
      measureSelect = 'SUM(t.cantidad * t.precio_unit)'
    } else {
      // Cantidad (unidades o transacciones)
      // Si observamos transacciones (general, facturas, créditos o POR PAGO)
      if (['general', 'invoices', 'credits', 'cash', 'transfer', 'card'].includes(observe)) {
        measureSelect = 'COUNT(DISTINCT t.doc_id)'
      } else {
        // Por producto (suma de unidades físicas)
        measureSelect = 'SUM(t.cantidad)'
      }
    }

    /* --- 3. DEFINIR LAPSO DE TIEMPO (Eje X) --- */
    let dateWhere = ''
    let grouping = `DATE_TRUNC('day', t.fecha_emision)`

    if (timeframe === 'weekly') {
      dateWhere = `WHERE t.fecha_emision >= NOW() - INTERVAL '7 days'`
    } else if (timeframe === 'monthly') {
      dateWhere = `WHERE t.fecha_emision >= NOW() - INTERVAL '30 days'`
    } else if (timeframe === 'yearly') {
      dateWhere = `WHERE t.fecha_emision >= NOW() - INTERVAL '12 months'`
      grouping = `DATE_TRUNC('month', t.fecha_emision)`
    } else {
      grouping = `DATE_TRUNC('month', t.fecha_emision)`
    }

    /* --- 4. AÑADIR FILTROS DE OBSERVACIÓN --- */
    // Helper para añadir condiciones al WHERE
    const addCondition = (cond) => {
      dateWhere += (dateWhere ? ' AND' : 'WHERE') + ` ${cond}`
    }

    if (observe === 'invoices') {
      addCondition(`t.tipo = 'invoice'`)
    } else if (observe === 'credits') {
      addCondition(`t.tipo = 'credit'`)
    } else if (observe === 'product' && productId) {
      addCondition(`t.producto_id = $${paramIndex}`)
      params.push(productId)
      paramIndex++
    }
    // --- NUEVOS FILTROS DE PAGO ---
    else if (observe === 'cash') {
      addCondition(`t.tipo_de_pago = 'Efectivo'`)
    } else if (observe === 'transfer') {
      addCondition(`t.tipo_de_pago = 'Transferencia'`)
    } else if (observe === 'card') {
      // Nota: Asegúrate que en DB sea exacto 'Tarjeta de credito'
      addCondition(`t.tipo_de_pago = 'Tarjeta de credito'`)
    }

    /* --- 5. CONSTRUIR CONSULTA FINAL --- */
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
    `

    const { rows } = await db.query(query, params)

    const formattedRows = rows.map((r) => ({
      fecha: new Date(r.fecha).toISOString().split('T')[0],
      valor: Number(r.valor)
    }))

    res.json(formattedRows)
  } catch (e) {
    console.error('Error en getTimeSeries:', e)
    res.status(500).json({ error: e.message || 'Error interno del servidor' })
  }
}

exports.getLowStock = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        nombre, 
        codigo, 
        existencias, 
        imagen 
      FROM productos 
      WHERE existencias <= 3 
      ORDER BY existencias ASC -- Muestra primero los que tienen 0
    `

    const { rows } = await db.query(query)
    res.json(rows)
  } catch (e) {
    console.error('Error en getLowStock:', e)
    res.status(500).json({ error: e.message || 'Error interno' })
  }
}

exports.getExpiringBatches = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        l.id,
        l.codigo_lote,
        l.fecha_vencimiento,
        l.cantidad_actual,
        p.nombre as producto_nombre,
        p.imagen
      FROM lotes l
      JOIN productos p ON l.producto_id = p.id
      WHERE l.cantidad_actual > 0
      ORDER BY l.fecha_vencimiento ASC
      LIMIT 5
    `)
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener vencimientos' })
  }
}
