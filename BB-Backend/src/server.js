// src/server.js
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const productsRoutes = require("./routes/products.routes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

// Auth
app.use("/auth", authRoutes);

// Productos (si quieres proteger TODO):
app.use("/api/products", productsRoutes);
// o si quieres GET público:
// app.get('/api/products', productsRoutes);
// app.use('/api/products', authMiddleware, productsRoutesProtegidas);
const invoicesRoutes = require("./routes/invoices.routes");
app.use("/api", invoicesRoutes);

app.use("/api", require("./routes/creditos.routes"));

// Middleware de errores JSON
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: err.message || "Error interno" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Error interno" });
});
