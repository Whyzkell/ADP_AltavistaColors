const getAllTareyas = async (req, res) => {
  res.send("Agarrando unas tareyas");
};

const getTareya = (req, res) => {
  res.send("Agarrando una tareya");
};

const crearTareya = (req, res) => {
  res.send("Creando tareyas");
};

const eliminarTareya = (req, res) => {
  res.send("eliminando chamba");
};

const actuaTareya = (req, res) => {
  res.send("actualizando tareya");
};
module.exports = {
  getAllTareyas,
  getTareya,
  crearTareya,
  eliminarTareya,
  actuaTareya,
};
