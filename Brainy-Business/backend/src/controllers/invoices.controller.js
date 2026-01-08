// src/controllers/invoicesController.js
const db = require('../db/index')
const { pool } = require('../db')

exports.list = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, numero, cliente, direccion, fecha_emision, total, tipo_de_pago
       FROM facturas ORDER BY id DESC`
    )
    res.json(rows)
  } catch (e) {
    console.error('invoices.list', e)
    res.status(500).json({ error: e.message || 'Error interno' })
  }
}

exports.getOne = async (req, res) => {
  const id = Number(req.params.id)
  try {
    const { rows } = await pool.query(`SELECT * FROM facturas WHERE id = $1`, [id])
    if (!rows[0]) return res.status(404).json({ error: 'No encontrada' })

    // Recuperamos los items. La columna 'total' ya viene calculada por la BD.
    const items = await pool.query(
      `SELECT id, factura_id, producto_id, servicio_id, lote_id, nombre, cantidad, precio_unit, total
       FROM factura_items WHERE factura_id = $1 ORDER BY id`,
      [id]
    )
    res.json({ ...rows[0], items: items.rows })
  } catch (e) {
    console.error('invoices.getOne', e)
    res.status(500).json({ error: e.message || 'Error interno' })
  }
}

exports.create = async (req, res) => {
  // --- AGREGA ESTO AL PURO INICIO ---
  console.log('--- [DEBUG 4] BACKEND RECIBE ---')
  const incomingItems = req.body.items || req.body.productos || []
  if (incomingItems.length > 0) {
    console.log('Primer item recibido:', {
      nombre: incomingItems[0].nombre,
      es_servicio: incomingItems[0].es_servicio,
      tipo: typeof incomingItems[0].es_servicio
    })
  } else {
    console.log('No llegaron items o array vacío')
  }
  // ----------------------------------

  const {
    cliente = '',
    direccion = '',
    dui = '',
    nit = '',
    condiciones = '',
    items: itemsRaw = [],
    productos: productosRaw = [],
    meta = {},
    tipo_de_pago
  } = req.body

  if (!cliente.trim()) return res.status(400).json({ error: 'Cliente requerido' })

  const src = Array.isArray(itemsRaw) && itemsRaw.length ? itemsRaw : productosRaw

  // 1. Mapeo y limpieza de datos
  const items = (src || [])
    .map((it) => ({
      pid: it.pid || it.producto_id || null,
      nombre: String(it.nombre || '').trim(),
      cantidad: Number(it.cantidad ?? it.cant ?? 0),
      precio: Number(it.precio ?? it.precio_unit ?? 0),
      lote_id: it.lote_id || null,
      // Convertimos es_servicio a booleano real
      es_servicio: it.es_servicio === true || String(it.es_servicio) === 'true'
    }))
    .filter(
      (it) =>
        it.nombre && Number.isFinite(it.cantidad) && it.cantidad > 0 && Number.isFinite(it.precio)
    )

  if (items.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un item' })
  }

  const userId = req.user.id
  const client = await pool.connect()

  try {
    // LOG DE SEGURIDAD: Verifica en tu terminal si es_servicio llega como true
    console.log('Procesando Factura Items:', JSON.stringify(items, null, 2))

    await client.query('BEGIN')

    // 2. Crear Cabecera de Factura
    const {
      rows: [fact]
    } = await client.query(
      `INSERT INTO facturas
          (numero, cliente, direccion, dui, nit, condiciones, usuario_id, fecha_emision, total, payload, tipo_de_pago)
        VALUES (NULL, $1, $2, $3, $4, $5, $6, CURRENT_DATE, 0, $7, $8)
        RETURNING id, numero`,
      [cliente, direccion, dui, nit, condiciones || null, userId, meta, tipo_de_pago || 'Efectivo']
    )

    // 3. Procesar Items (Separación Producto vs Servicio)
    for (const it of items) {
      let prodId = null
      let servId = null

      if (it.es_servicio) {
        // ES SERVICIO: Guardamos ID en servicio_id, dejamos producto_id NULL
        servId = it.pid
        prodId = null
      } else {
        // ES PRODUCTO: Guardamos ID en producto_id, dejamos servicio_id NULL
        prodId = it.pid
        servId = null
      }

      // Insertar Ítem
      // OJO: No enviamos 'total' (la BD lo calcula). Sí enviamos 'lote_id'.
      await client.query(
        `INSERT INTO factura_items 
          (factura_id, producto_id, servicio_id, lote_id, nombre, cantidad, precio_unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          fact.id,
          prodId, // Puede ser NULL
          servId, // Puede ser NULL
          it.lote_id,
          it.nombre,
          it.cantidad,
          it.precio
        ]
      )

      // 4. Descontar Stock (SOLO SI ES PRODUCTO FÍSICO)
      if (!it.es_servicio && prodId) {
        // A. Inventario General
        await client.query(
          `UPDATE productos SET existencias = GREATEST(existencias - $1, 0) WHERE id = $2`,
          [it.cantidad, prodId]
        )

        // B. Inventario de Lotes
        if (it.lote_id) {
          await client.query(
            `UPDATE lotes SET cantidad_actual = GREATEST(cantidad_actual - $1, 0) WHERE id = $2`,
            [it.cantidad, it.lote_id]
          )
        }
      }
    }

    // 5. Actualizar Total Global (Sumando lo que la BD calculó)
    const {
      rows: [resSum]
    } = await client.query(
      `SELECT COALESCE(SUM(total), 0) as grand_total FROM factura_items WHERE factura_id = $1`,
      [fact.id]
    )

    await client.query(`UPDATE facturas SET total = $1 WHERE id = $2`, [
      resSum.grand_total,
      fact.id
    ])

    await client.query('COMMIT')
    return res.json({ id: fact.id, numero: fact.numero, total: resSum.grand_total })
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('create invoice error:', e)

    // Manejo de error de Llave Foránea (FK)
    if (e.code === '23503') {
      return res.status(400).json({
        error: `Error de integridad: Estás intentando guardar un ID que no existe en la tabla de Productos o Servicios.`
      })
    }
    return res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
}

exports.remove = async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' })

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: items } = await client.query(
      'SELECT producto_id, lote_id, cantidad FROM factura_items WHERE factura_id=$1',
      [id]
    )

    await client.query('DELETE FROM factura_items WHERE factura_id=$1', [id])

    for (const it of items) {
      // Solo devolvemos stock si era un producto (producto_id no es null)
      if (it.producto_id) {
        await client.query('UPDATE productos SET existencias = existencias + $1 WHERE id=$2', [
          it.cantidad,
          it.producto_id
        ])

        if (it.lote_id) {
          await client.query(
            'UPDATE lotes SET cantidad_actual = cantidad_actual + $1 WHERE id=$2',
            [it.cantidad, it.lote_id]
          )
        }
      }
    }

    const del = await client.query('DELETE FROM facturas WHERE id=$1', [id])
    if (del.rowCount === 0) throw new Error('No encontrada')

    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('invoices.remove', e)
    res.status(500).json({ error: e.message || 'Error interno' })
  } finally {
    client.release()
  }
}
