const { Router } = require("express");
const pool = require("../db");
const {
  getAllTareyas,
  getTareya,
  crearTareya,
  eliminarTareya,
  actuaTareya,
} = require("../controllers/tasks.controller");

const router = Router();

router.get("/tareya", getAllTareyas);

router.get("/tareya/10", getTareya);

router.post("/tareya", crearTareya);

router.delete("/tareya", eliminarTareya);

router.put("/tareya", actuaTareya);

module.exports = router;
