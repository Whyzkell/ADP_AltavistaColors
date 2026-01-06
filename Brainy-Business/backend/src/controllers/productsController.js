// src/controllers/productsController.js
const db = require('../db/index')

// GET /api/products
exports.list = async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase()
    const params = []
    let where = ''

    // Lógica de búsqueda (copiada de lo que hicimos antes)
    if (q) {
      params.push(`%${q}%`)
      where = `
        WHERE lower(nombre)    LIKE $1
           OR lower(categoria) LIKE $1
           OR CAST(codigo AS TEXT) LIKE $1
      `
    }

    const { rows } = await db.query(
      `SELECT 
          id AS id_producto,
          nombre,
          categoria,
          precio_unit AS precio,
          codigo,
          existencias,
          imagen,   -- <--- NUEVO: Seleccionamos la imagen
          creado_en
        FROM productos
        ${where}
        ORDER BY id DESC`, // Orden descendente suele ser mejor para ver lo nuevo
      params
    )
    res.json(rows)
  } catch (err) {
    console.error('[products:list]', err)
    res.status(500).json({ error: err.message || 'Error al listar productos' })
  }
}

// POST /api/products
exports.create = async (req, res) => {
  try {
    const { nombre, categoria, precio, codigo, existencias } = req.body

    // Capturamos el nombre del archivo si Multer lo procesó
    const imagen = req.file ? req.file.filename : null // <--- NUEVO

    const { rows } = await db.query(
      `INSERT INTO productos (nombre, categoria, precio_unit, codigo, existencias, imagen)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id AS id_producto, nombre, categoria, precio_unit AS precio, codigo, existencias, imagen`,
      [nombre, categoria, Number(precio), Number(codigo), Number(existencias), imagen]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[products:create]', err)
    res.status(500).json({ error: err.message || 'Error al crear producto' })
  }
}

// PUT /api/products/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, categoria, precio, codigo, existencias } = req.body
    const nuevaImagen = req.file ? req.file.filename : null // <--- NUEVO

    let query = ''
    let params = []

    // Lógica inteligente: Solo actualizamos la imagen si el usuario subió una nueva
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

// DELETE /api/products/:id
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
