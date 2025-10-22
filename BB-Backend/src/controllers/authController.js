// src/controllers/authController.js
const db = require("../db/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_jwt";

// Opcional: si algún día quieres registrar desde backend con esta nueva tabla
exports.register = async (req, res) => {
  const { nombre_usuario, contra_usuario, email_usuario } = req.body;
  try {
    const existing = await db.query("SELECT 1 FROM usuarios WHERE email = $1", [
      email_usuario,
    ]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    const hash = await bcrypt.hash(contra_usuario, 10);
    const result = await db.query(
      `INSERT INTO usuarios (email, hash_password, nombre)
       VALUES ($1, $2, $3)
       RETURNING id, email, nombre, creado_en`,
      [email_usuario, hash, nombre_usuario || "Usuario"]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre,
        email_usuario: user.email,
      },
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
};

exports.login = async (req, res) => {
  const { email_usuario, contra_usuario } = req.body;

  try {
    // ⚠️ Tabla y columnas reales: usuarios / email / hash_password
    const result = await db.query(
      "SELECT id, email, hash_password, nombre FROM usuarios WHERE email = $1",
      [email_usuario]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    // Comparar contra hash_password
    const ok = await bcrypt.compare(contra_usuario, user.hash_password);
    if (!ok) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre,
        email_usuario: user.email,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const q = await db.query(
      "SELECT id, nombre AS nombre_usuario, email AS email_usuario FROM usuarios WHERE id = $1",
      [req.user.id]
    );
    if (q.rowCount === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(q.rows[0]);
  } catch (err) {
    console.error("me error:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};
