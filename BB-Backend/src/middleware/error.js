// src/middleware/error.js
module.exports = function apiErrorHandler(err, req, res, _next) {
  console.error("[API ERROR]", err);

  // Errores típicos de Postgres (ej. numeric/text)
  if (err.code === "22P02") {
    return res
      .status(400)
      .json({ error: "Formato numérico inválido en algún campo" });
  }

  res.status(500).json({ error: err.message || "Error interno del servidor" });
};
