// src/controllers/descuentosController.js
const db = require('../db/index')

// Listar todos los descuentos (Activos e Inactivos para gestión)
exports.list = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM descuentos ORDER BY id ASC')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al listar descuentos' })
  }
}

// Crear nuevo descuento
exports.create = async (req, res) => {
  const { nombre, descri, tipo, cantidad } = req.body
  try {
    const { rows } = await db.query(
      `INSERT INTO descuentos (nombre, descri, tipo, cantidad)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre, descri, tipo, Number(cantidad)]
    )
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear descuento' })
  }
}

// Editar descuento (Activar/Desactivar o cambiar valores)
exports.update = async (req, res) => {
  const { id } = req.params
  const { nombre, descri, tipo, cantidad, activo } = req.body
  try {
    const { rows } = await db.query(
      `UPDATE descuentos
       SET nombre=$1, descri=$2, tipo=$3, cantidad=$4, activo=$5
       WHERE id=$6
       RETURNING *`,
      [nombre, descri, tipo, Number(cantidad), activo, id]
    )
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar descuento' })
  }
}

// Eliminar descuento
exports.remove = async (req, res) => {
  const { id } = req.params
  try {
    await db.query('DELETE FROM descuentos WHERE id=$1', [id])
    res.json({ message: 'Eliminado correctamente' })
  } catch (error) {
    console.error(error)
    // Si falla porque ya se usó en una factura (Foreign Key constraint), avisamos
    if (error.code === '23503') {
      return res
        .status(400)
        .json({
          error: 'No se puede eliminar: Este descuento ya se usó en facturas. Mejor desactívalo.'
        })
    }
    res.status(500).json({ error: 'Error al eliminar' })
  }
}
