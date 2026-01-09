// backend/src/controllers/preciosController.js
const db = require('../db/index')

exports.upsert = async (req, res) => {
  const { id_producto, precio_sin_iva, precio_con_iva, porcentaje_ganancia, precio_con_ganancia } =
    req.body

  try {
    // 1. Intentar actualizar si ya existe
    const { rowCount } = await db.query(
      `
      UPDATE precios 
      SET precio_sin_iva=$1, precio_con_iva=$2, porcentaje_ganancia=$3, precio_con_ganancia=$4 
      WHERE id_producto=$5`,
      [precio_sin_iva, precio_con_iva, porcentaje_ganancia, precio_con_ganancia, id_producto]
    )

    // 2. Si no actualizó nada (porque no existía), insertamos uno nuevo
    if (rowCount === 0) {
      await db.query(
        `
        INSERT INTO precios (id_producto, precio_sin_iva, precio_con_iva, porcentaje_ganancia, precio_con_ganancia)
        VALUES ($1, $2, $3, $4, $5)`,
        [id_producto, precio_sin_iva, precio_con_iva, porcentaje_ganancia, precio_con_ganancia]
      )
    }
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
