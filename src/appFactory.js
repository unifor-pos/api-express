const express = require('express');

const CepClient = require('./clients/CepClient');
const PedidoController = require('./controllers/PedidoController');
const createMockDatabase = require('./data/mockDatabase');
const errorHandler = require('./middlewares/errorHandler');
const PedidoRepository = require('./repositories/PedidoRepository');
const UsuarioRepository = require('./repositories/UsuarioRepository');
const createPedidoRoutes = require('./routes/pedidoRoutes');
const PedidoService = require('./services/PedidoService');

function createApp({ database = createMockDatabase(), cepClient } = {}) {
  const app = express();

  const resolvedCepClient = cepClient || new CepClient();
  const usuarioRepository = new UsuarioRepository(database);
  const pedidoRepository = new PedidoRepository(database);
  const pedidoService = new PedidoService({
    pedidoRepository,
    usuarioRepository,
    cepClient: resolvedCepClient
  });
  const pedidoController = new PedidoController({ pedidoService });

  app.use(express.json());
  app.use('/pedidos', createPedidoRoutes({ pedidoController }));
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
