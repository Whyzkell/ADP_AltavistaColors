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
  const {
    cliente = '',
    direccion = '',
    dui = '',
    nit = '',
    condiciones = '',
    items: itemsRaw = [],
    productos: productosRaw = [],
    meta = {},
    tipo_de_pago,
    // Datos del descuento
    descuento_id = null,
    valor_descuento = 0
  } = req.body

  // --- DEBUG LOGS (Mira esto en tu terminal negra) ---
  console.log('--- NUEVA FACTURA ---')
  console.log('Cliente:', cliente)
  console.log('Descuento recibido ($):', valor_descuento)
  // ---------------------------------------------------

  if (!cliente.trim()) return res.status(400).json({ error: 'Cliente requerido' })

  // 1. Limpieza de items
  const src = Array.isArray(itemsRaw) && itemsRaw.length ? itemsRaw : productosRaw
  const items = (src || [])
    .map((it) => ({
      pid: it.pid || it.producto_id || null,
      nombre: String(it.nombre || '').trim(),
      cantidad: Number(it.cantidad ?? it.cant ?? 0),
      precio: Number(it.precio ?? it.precio_unit ?? 0),
      lote_id: it.lote_id || null,
      es_servicio: it.es_servicio === true || String(it.es_servicio) === 'true'
    }))
    .filter((it) => it.cantidad > 0 && it.precio >= 0)

  if (items.length === 0) return res.status(400).json({ error: 'Sin items' })

  const userId = req.user.id
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 2. Insertar Factura (Total inicia en 0)
    const {
      rows: [fact]
    } = await client.query(
      `INSERT INTO facturas
          (numero, cliente, direccion, dui, nit, condiciones, usuario_id, fecha_emision, total, payload, tipo_de_pago, descuento_id, valor_descuento)
        VALUES (NULL, $1, $2, $3, $4, $5, $6, CURRENT_DATE, 0, $7, $8, $9, $10)
        RETURNING id, numero`,
      [
        cliente,
        direccion,
        dui,
        nit,
        condiciones || null,
        userId,
        meta,
        tipo_de_pago || 'Efectivo',
        descuento_id || null, // $9
        Number(valor_descuento || 0) // $10
      ]
    )

    // 3. Insertar Items
    for (const it of items) {
      let prodId = it.es_servicio ? null : it.pid
      let servId = it.es_servicio ? it.pid : null

      await client.query(
        `INSERT INTO factura_items (factura_id, producto_id, servicio_id, lote_id, nombre, cantidad, precio_unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [fact.id, prodId, servId, it.lote_id, it.nombre, it.cantidad, it.precio]
      )

      // Descontar inventario
      if (!it.es_servicio && prodId) {
        await client.query(
          `UPDATE productos SET existencias = GREATEST(existencias - $1, 0) WHERE id = $2`,
          [it.cantidad, prodId]
        )
        if (it.lote_id) {
          await client.query(
            `UPDATE lotes SET cantidad_actual = GREATEST(cantidad_actual - $1, 0) WHERE id = $2`,
            [it.cantidad, it.lote_id]
          )
        }
      }
    }

    // 4. CALCULAR TOTAL FINAL
    // Obtenemos la suma bruta de los items (Subtotal)
    const {
      rows: [resSum]
    } = await client.query(
      `SELECT COALESCE(SUM(total), 0) as grand_total FROM factura_items WHERE factura_id = $1`,
      [fact.id]
    )

    const subtotal = Number(resSum.grand_total)
    const descuento = Number(valor_descuento || 0)
    const totalFinal = Math.max(0, subtotal - descuento)

    console.log(
      `Cálculo: Subtotal (${subtotal}) - Descuento (${descuento}) = Total Final (${totalFinal})`
    )

    // 5. ACTUALIZAR FACTURA CON EL TOTAL RESTADO
    await client.query(`UPDATE facturas SET total = $1 WHERE id = $2`, [totalFinal, fact.id])

    await client.query('COMMIT')

    return res.json({ id: fact.id, numero: fact.numero, total: totalFinal })
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Error creando factura:', e)
    res.status(500).json({ error: e.message })
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
