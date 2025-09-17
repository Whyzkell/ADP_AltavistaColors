// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_jwt";

module.exports = (req, res, next) => {
  // Acepta ambos: Authorization: Bearer <token> o x-auth-token: <token>
  const authHeader = req.headers.authorization || "";
  const tokenFromAuth = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const tokenFromXHeader = req.header("x-auth-token");
  const token = tokenFromAuth || tokenFromXHeader;

  if (!token) {
    return res.status(401).json({ error: "Token no enviado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Soporta ambos payloads: { id } o { user: { id } }
    const userId = decoded?.user?.id ?? decoded?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Token inválido (sin id de usuario)" });
    }

    req.user = { id: userId };
    return next();
  } catch (err) {
    console.log("Error al verificar token:", err.message);
    return res.status(401).json({ error: "Token no válido" });
  }
};
