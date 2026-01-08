const { pool } = require('../db')

// Listar lotes de un producto específico
exports.getByProduct = async (req, res) => {
  const { productId } = req.params
  try {
    const { rows } = await pool.query(
      `SELECT * FROM lotes 
       WHERE producto_id = $1 
       AND cantidad_actual > 0 
       ORDER BY fecha_vencimiento ASC`,
      [productId]
    )
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al obtener lotes' })
  }
}

// Crear un lote (Registrar entrada de mercadería con vencimiento)
exports.create = async (req, res) => {
  const { producto_id, fecha_vencimiento, cantidad, codigo_lote } = req.body

  if (!producto_id || !fecha_vencimiento || !cantidad) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Insertar el lote en la tabla nueva
    const { rows } = await client.query(
      `INSERT INTO lotes (producto_id, codigo_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [producto_id, codigo_lote, fecha_vencimiento, cantidad, cantidad]
    )

    // 2. ACTUALIZAR EL STOCK GLOBAL DEL PRODUCTO
    // Esto es vital para mantener sincronizado tu sistema actual con el nuevo sistema de lotes
    await client.query(
      `UPDATE productos 
       SET existencias = existencias + $1 
       WHERE id = $2`,
      [cantidad, producto_id]
    )

    await client.query('COMMIT')
    res.json(rows[0])
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    res.status(500).json({ error: 'Error al registrar lote' })
  } finally {
    client.release()
  }
}

// Listar TODOS los lotes activos (con datos del producto)
exports.listAll = async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id,
        l.codigo_lote,
        l.fecha_vencimiento,
        l.cantidad_actual,
        l.cantidad_inicial,
        p.nombre as producto_nombre,
        p.imagen
      FROM lotes l
      JOIN productos p ON l.producto_id = p.id
      WHERE l.cantidad_actual > 0
      ORDER BY l.fecha_vencimiento ASC
    `
    const { rows } = await pool.query(query)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error listando lotes' })
  }
}

exports.update = async (req, res) => {
  const { id } = req.params // ID del lote
  const { codigo_lote, fecha_vencimiento, cantidad_actual } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Obtener el lote actual para saber la diferencia de cantidad
    const {
      rows: [oldLote]
    } = await client.query(`SELECT producto_id, cantidad_actual FROM lotes WHERE id = $1`, [id])

    if (!oldLote) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Lote no encontrado' })
    }

    // 2. Calcular diferencia si cambió la cantidad
    // Si antes había 50 y ahora pones 40, la diferencia es -10.
    const diff = Number(cantidad_actual) - Number(oldLote.cantidad_actual)

    // 3. Actualizar el lote
    const {
      rows: [newLote]
    } = await client.query(
      `UPDATE lotes 
       SET codigo_lote = $1, fecha_vencimiento = $2, cantidad_actual = $3
       WHERE id = $4
       RETURNING *`,
      [codigo_lote, fecha_vencimiento, cantidad_actual, id]
    )

    // 4. Si hubo cambio de cantidad, ajustar el stock global del producto
    if (diff !== 0) {
      await client.query(
        `UPDATE productos 
         SET existencias = existencias + $1 
         WHERE id = $2`,
        [diff, oldLote.producto_id]
      )
    }

    await client.query('COMMIT')
    res.json(newLote)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    res.status(500).json({ error: 'Error al actualizar lote' })
  } finally {
    client.release()
  }
}

// Eliminar lote (Opcional, pero útil)
exports.delete = async (req, res) => {
  const { id } = req.params
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Recuperar info antes de borrar para restar del stock
    const {
      rows: [lote]
    } = await client.query('SELECT producto_id, cantidad_actual FROM lotes WHERE id=$1', [id])

    if (lote) {
      // Restar del inventario global porque este lote "desaparece"
      await client.query('UPDATE productos SET existencias = existencias - $1 WHERE id=$2', [
        lote.cantidad_actual,
        lote.producto_id
      ])
      // Borrar lote
      await client.query('DELETE FROM lotes WHERE id=$1', [id])
    }

    await client.query('COMMIT')
    res.json({ message: 'Lote eliminado' })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
}
