const express = require('express');

const viacepClient = require('./src/clients/viacep.client');
const precificacao = require('./src/services/precificacao.service');
const { createUsuariosRepository } = require('./src/repositories/usuarios.repository');
const { createPedidosRepository } = require('./src/repositories/pedidos.repository');
const { criarPedidosService } = require('./src/services/pedidos.service');
const { criarPedidosController } = require('./src/controllers/pedidos.controller');
const { criarPedidosRouter } = require('./src/routes/pedidos.routes');
const { errorHandler } = require('./src/middlewares/errorHandler');

const app = express();
app.use(express.json());

// Composição (poor-man's DI container)
const usuariosRepo = createUsuariosRepository();
const pedidosRepo = createPedidosRepository();
const pedidosService = criarPedidosService({
  usuariosRepo,
  pedidosRepo,
  viacepClient,
  precificacao
});
const pedidosController = criarPedidosController({ pedidosService });
const pedidosRouter = criarPedidosRouter({ pedidosController });

app.use(pedidosRouter);
app.use(errorHandler);

module.exports = app;
