const { pool } = require('../db')

// Listar todos los servicios
exports.list = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM servicios ORDER BY nombre ASC`)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al listar servicios' })
  }
}

// Crear un nuevo servicio
exports.create = async (req, res) => {
  const { nombre, descripcion, precio } = req.body

  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO servicios (nombre, descripcion, precio_sugerido)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre, descripcion, precio || 0]
    )
    res.json(rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear servicio' })
  }
}

// Eliminar servicio
exports.delete = async (req, res) => {
  const { id } = req.params
  try {
    const { rowCount } = await pool.query('DELETE FROM servicios WHERE id = $1', [id])
    if (rowCount === 0) return res.status(404).json({ error: 'Servicio no encontrado' })
    res.json({ message: 'Servicio eliminado' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'No se puede eliminar (quizás ya está en una factura)' })
  }
}

// Actualizar servicio
exports.update = async (req, res) => {
  const { id } = req.params
  const { nombre, descripcion, precio } = req.body

  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' })

  try {
    const { rows } = await pool.query(
      `UPDATE servicios 
       SET nombre = $1, descripcion = $2, precio_sugerido = $3
       WHERE id = $4
       RETURNING *`,
      [nombre, descripcion, precio || 0, id]
    )

    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' })
    res.json(rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al actualizar servicio' })
  }
}
