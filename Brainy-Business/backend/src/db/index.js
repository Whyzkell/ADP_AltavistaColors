// db/index.js
const { Pool } = require("pg");

// Usa variables de entorno si las tienes
const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "AC",
  password: process.env.PGPASSWORD || "dp17042006",
  port: Number(process.env.PGPORT || 5432),
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // <--- exportamos el pool para poder hacer client = await pool.connect()
};
