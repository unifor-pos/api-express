const { Router } = require('express');

function createPedidoRoutes({ pedidoController }) {
  const router = Router();

  router.get('/', pedidoController.list);
  router.post('/', pedidoController.create);
  router.get('/:id', pedidoController.getById);

  return router;
}

module.exports = createPedidoRoutes;
