const { Router } = require('express');

module.exports = (controller) => {
  const router = Router();
  router.get('/', (req, res) => controller.listar(req, res));
  router.get('/:id', (req, res) => controller.buscar(req, res));
  router.post('/', (req, res) => controller.criar(req, res));
  return router;
};
