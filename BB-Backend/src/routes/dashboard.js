//const router = require("express").Router();
//const { json } = require("express");
//const pool = require("../db");
//const autorizacion = require("../middleware/autorizacion");

//router.get("/", autorizacion, async (req, res) => {
//try {
//const user = await pool.query(
//'SELECT * FROM public."Usuarios" WHERE id_usuario = $1',
//[req.user]
//);

//res.json(user.rows[0]);
//} catch (err) {
//console.error(err.message);
//res.status(500).send("te trono master");
//}
//});

//module.exports = router;
