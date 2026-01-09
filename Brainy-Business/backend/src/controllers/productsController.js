// src/controllers/productsController.js
const db = require('../db/index')

// GET /api/products
exports.list = async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase()
    const isBilling = req.query.scope === 'billing'

    const params = []
    let whereProductos = ''
    let whereServicios = ''

    if (q) {
      params.push(`%${q}%`)
      whereProductos = `
        WHERE (lower(p.nombre) LIKE $1
            OR lower(p.categoria) LIKE $1
            OR CAST(p.codigo AS TEXT) LIKE $1)
      `
      whereServicios = `
        WHERE lower(s.nombre) LIKE $1
            OR lower(s.descripcion) LIKE $1
      `
    }

    // --- QUERY 1: PRODUCTOS (Inventario + Precios) ---
    const sqlProductos = `
      SELECT 
          p.id AS id_producto,
          p.nombre,
          p.categoria,
          p.precio_unit AS precio, -- Precio Final (Venta)
          p.codigo,
          p.existencias,
          p.imagen,
          false AS es_servicio,
          p.creado_en,
          
          -- DATOS DE LA TABLA PRECIOS (JOIN)
          COALESCE(pr.precio_sin_iva, 0) as precio_sin_iva,
          COALESCE(pr.precio_con_iva, 0) as precio_con_iva,
          COALESCE(pr.porcentaje_ganancia, 30) as porcentaje_ganancia,
          COALESCE(pr.precio_con_ganancia, 0) as precio_con_ganancia,

          -- SUBQUERY DE LOTES (Corregido: Sin puntos suspensivos)
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', l.id,
                  'lote', l.codigo_lote,
                  'vencimiento', TO_CHAR(l.fecha_vencimiento, 'DD/MM/YYYY'),
                  'cantidad', l.cantidad_actual
                )
              )
              FROM lotes l
              WHERE l.producto_id = p.id 
                AND l.cantidad_actual > 0
            ), 
            '[]'::json
          ) AS lotes

        FROM productos p
        LEFT JOIN precios pr ON p.id = pr.id_producto
        ${whereProductos}
        ORDER BY p.id DESC
        LIMIT 1000
    `

    // --- QUERY 2: SERVICIOS ---
    const sqlServicios = `
      SELECT 
        s.id AS id_producto,
        s.nombre,
        'Servicio' as categoria,
        s.precio_sugerido AS precio,
        'SERV' as codigo,
        999999 as existencias,
        null as imagen,
        true AS es_servicio,
        s.creado_en,
        
        -- Datos Dummy de precios para Servicios
        0 as precio_sin_iva,
        0 as precio_con_iva,
        0 as porcentaje_ganancia,
        0 as precio_con_ganancia,

        '[]'::json as lotes
      FROM servicios s
      ${whereServicios}
      ORDER BY s.id DESC
      LIMIT 1000
    `

    let resultados = []

    if (isBilling) {
      const [resProductos, resServicios] = await Promise.all([
        db.query(sqlProductos, params),
        db.query(sqlServicios, params)
      ])
      resultados = [...resServicios.rows, ...resProductos.rows]
    } else {
      const { rows } = await db.query(sqlProductos, params)
      resultados = rows
    }

    res.json(resultados)
  } catch (err) {
    console.error('[products:list]', err)
    res.status(500).json({ error: err.message || 'Error al listar' })
  }
}

// POST /api/products (Crear)
exports.create = async (req, res) => {
  try {
    const { nombre, categoria, precio, codigo, existencias } = req.body
    const imagen = req.file ? req.file.filename : null

    const { rows } = await db.query(
      `INSERT INTO productos (nombre, categoria, precio_unit, codigo, existencias, imagen)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id AS id_producto, nombre, categoria, precio_unit AS precio, codigo, existencias, imagen`,
      [nombre, categoria, Number(precio), Number(codigo), Number(existencias), imagen]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[products:create]', err)
    res.status(500).json({ error: err.message || 'Error al crear producto' })
  }
}

// PUT /api/products/:id (Actualizar)
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, categoria, precio, codigo, existencias } = req.body
    const nuevaImagen = req.file ? req.file.filename : null

    let query = ''
    let params = []

    if (nuevaImagen) {
      query = `UPDATE productos
               SET nombre=$1, categoria=$2, precio_unit=$3, codigo=$4, existencias=$5, imagen=$6
               WHERE id=$7
               RETURNING id AS id_producto, nombre, categoria, precio_unit AS precio, codigo, existencias, imagen`
      params = [
        nombre,
        categoria,
        Number(precio),
        Number(codigo),
        Number(existencias),
        nuevaImagen,
        id
      ]
    } else {
      query = `UPDATE productos
               SET nombre=$1, categoria=$2, precio_unit=$3, codigo=$4, existencias=$5
               WHERE id=$6
               RETURNING id AS id_producto, nombre, categoria, precio_unit AS precio, codigo, existencias, imagen`
      params = [nombre, categoria, Number(precio), Number(codigo), Number(existencias), id]
    }

    const { rows } = await db.query(query, params)

    if (!rows.length) return res.status(404).json({ error: 'No encontrado' })
    res.json(rows[0])
  } catch (err) {
    console.error('[products:update]', err)
    res.status(500).json({ error: err.message || 'Error al actualizar producto' })
  }
}

// DELETE /api/products/:id (Eliminar)
exports.remove = async (req, res) => {
  try {
    const { id } = req.params
    const { rowCount } = await db.query('DELETE FROM productos WHERE id=$1', [id])
    if (!rowCount) return res.status(404).json({ error: 'No encontrado' })
    res.status(204).send()
  } catch (err) {
    console.error('[products:remove]', err)
    res.status(500).json({ error: err.message || 'Error al eliminar producto' })
  }
}
