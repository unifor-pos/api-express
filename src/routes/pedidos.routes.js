/**
 * Rotas HTTP de pedidos.
 *
 * Recebe o controller e devolve um express.Router pronto para ser
 * montado no app. Mantém o mapeamento URL -> handler em um único lugar.
 */

const express = require('express');

function criarPedidosRouter({ pedidosController }) {
  const router = express.Router();

  router.get('/pedidos', pedidosController.listar);
  router.post('/pedidos', pedidosController.criar);
  router.get('/pedidos/:id', pedidosController.buscarPorId);

  return router;
}

module.exports = { criarPedidosRouter };
