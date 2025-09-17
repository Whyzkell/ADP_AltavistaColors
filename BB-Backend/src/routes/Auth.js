//const router = require("express").Router();
//const pool = require("../db");
//const bcrypt = require("bcrypt");
//const jwtGenerator = require("../utils/jwtGenerator");
//const validInfo = require("../middleware/validinfo");
//const autorizacion = require("../middleware/autorizacion");

//el registro
//router.post("/register", validInfo, async (req, res) => {
//try {
//const { name, email, password } = req.body;

//const user = await pool.query(
//'SELECT * FROM public."usuarios" WHERE email_usuario = $1',
//[email]
//);

//if (user.rows.length !== 0) {
//return res.status(401).send("Ya existe el usuario");
//}

//const saltRound = 10;
//const salt = await bcrypt.genSalt(saltRound);

//const bcryptPassword = await bcrypt.hash(password, salt);

//const newUser = await pool.query(
//'INSERT INTO public."Usuarios" (nombre_usuario, contra_usuario, email_usuario) VALUES ($1, $2, $3) RETURNING *',
//[name, bcryptPassword, email]
//);

//const token = jwtGenerator(newUser.rows[0].id_usuario);

//res.json({ token });
//} catch (err) {
//console.error(err.message);
//res.status(500).send("te trono el server master");
//}
//});

//router.post("/login", validInfo, async (req, res) => {
//try {
//const { email, password } = req.body;

//const user = await pool.query(
//'SELECT * FROM public."Usuarios" WHERE email_usuario = $1',
//[email]
//);

//if (user.rows.length === 0) {
//return res.status(401).json("Contra o correo incorrecto");
//}

//const validPassword = await bcrypt.compare(
//password,
//user.rows[0].contra_usuario
//);

//if (!validPassword) {
//return res.status(401).json("Contra o correo incorrecto");
// }

//const token = jwtGenerator(user.rows[0].id_usuario);

//res.json({ token });
//} catch (err) {
//console.error(err.message);
//res.status(500).send("te trono master");
//}
//});

//router.get("/is-verify", autorizacion, async (req, res) => {
//try {
//res.json(true);
//} catch (err) {
//console.error(err.message);
//res.status(500).send("te trono master");
//}
//});

//module.exports = router;
