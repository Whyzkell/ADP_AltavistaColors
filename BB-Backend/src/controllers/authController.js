// src/controllers/authController.js
const db = require("../db/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_jwt";

exports.register = async (req, res) => {
  const { nombre_usuario, contra_usuario, email_usuario } = req.body;
  try {
    const existingUser = await db.query(
      'SELECT * FROM "Usuarios" WHERE email_usuario = $1',
      [email_usuario]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "El correo electrónico ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(contra_usuario, 10);

    const result = await db.query(
      'INSERT INTO "Usuarios" (nombre_usuario, contra_usuario, email_usuario, verificado) VALUES ($1, $2, $3, TRUE) RETURNING *',
      [nombre_usuario, hashedPassword, email_usuario]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      token,
      user: {
        id: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        email_usuario: user.email_usuario,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email_usuario, contra_usuario } = req.body;
  try {
    const result = await db.query(
      'SELECT * FROM "Usuarios" WHERE email_usuario = $1',
      [email_usuario]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(
      contra_usuario,
      user.contra_usuario
    );
    if (!validPassword)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.json({
      token,
      user: {
        id: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        email_usuario: user.email_usuario,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id_usuario, nombre_usuario, email_usuario FROM "Usuarios" WHERE id_usuario = $1',
      [req.user.id] // 👈 asegurarse que el middleware setea req.user.id
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
};
