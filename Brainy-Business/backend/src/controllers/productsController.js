// src/controllers/productsController.js
const db = require('../db/index')

// GET /api/products
exports.list = async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase()

    // DETECTAR SI ES PARA FACTURACIÓN (scope=billing)
    // Si es billing, buscamos en Productos Y Servicios. Si no, solo Productos.
    const isBilling = req.query.scope === 'billing'

    const params = []
    let whereProductos = ''
    let whereServicios = ''

    if (q) {
      params.push(`%${q}%`)
      // Búsqueda en Productos
      whereProductos = `
        WHERE (lower(p.nombre) LIKE $1
           OR lower(p.categoria) LIKE $1
           OR CAST(p.codigo AS TEXT) LIKE $1)
      `
      // Búsqueda en Servicios
      whereServicios = `
        WHERE lower(s.nombre) LIKE $1
           OR lower(s.descripcion) LIKE $1
      `
    }

    // --- QUERY 1: PRODUCTOS (Inventario real) ---
    // Agregamos 'false AS es_servicio' virtualmente
    const sqlProductos = `
      SELECT 
          p.id AS id_producto,
          p.nombre,
          p.categoria,
          p.precio_unit AS precio,
          p.codigo,
          p.existencias,
          p.imagen,
          false AS es_servicio,   -- <--- ETIQUETA VIRTUAL FALSE (Es un producto físico)
          p.creado_en,
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
        ${whereProductos}
        ORDER BY p.id DESC
        LIMIT 30
    `

    // --- QUERY 2: SERVICIOS (Solo si es facturación) ---
    // Agregamos 'true AS es_servicio' virtualmente y simulamos campos de producto
    const sqlServicios = `
      SELECT 
        s.id AS id_producto,
        s.nombre,
        'Servicio' as categoria,
        s.precio_sugerido AS precio,
        'SERV' as codigo,
        999999 as existencias,    -- Stock virtual ilimitado
        null as imagen,
        true AS es_servicio,      -- <--- ETIQUETA VIRTUAL TRUE (Es un servicio)
        s.creado_en,
        '[]'::json as lotes
      FROM servicios s
      ${whereServicios}
      ORDER BY s.id DESC
      LIMIT 30
    `

    let resultados = []

    if (isBilling) {
      // MODO FACTURA: Ejecutamos ambas consultas y unimos los resultados
      const [resProductos, resServicios] = await Promise.all([
        db.query(sqlProductos, params),
        db.query(sqlServicios, params)
      ])
      // Ponemos servicios primero o después según prefieras, aquí los mezclamos
      resultados = [...resServicios.rows, ...resProductos.rows]
    } else {
      // MODO NORMAL (Inventario): Solo buscamos productos
      const { rows } = await db.query(sqlProductos, params)
      resultados = rows
    }

    // --- AGREGA ESTO ---
    console.log('--- [DEBUG 1] BACKEND BUSQUEDA ---')
    if (resultados.length > 0) {
      // Imprimimos el primer resultado para ver si lleva la etiqueta
      console.log('Ejemplo de item encontrado:', {
        nombre: resultados[0].nombre,
        es_servicio: resultados[0].es_servicio,
        tipo: typeof resultados[0].es_servicio
      })
    }
    // -------------------

    res.json(resultados)
  } catch (err) {
    console.error('[products:list]', err)
    res.status(500).json({ error: err.message || 'Error al listar' })
  }
}

// POST /api/products (Crear solo Producto)
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

// PUT /api/products/:id (Actualizar solo Producto)
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

// DELETE /api/products/:id (Eliminar solo Producto)
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
