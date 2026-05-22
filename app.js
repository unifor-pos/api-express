const express = require('express');

const UsuarioRepositoryInMemory = require('./src/infrastructure/repositories/UsuarioRepositoryInMemory');
const PedidoRepositoryInMemory = require('./src/infrastructure/repositories/PedidoRepositoryInMemory');
const CepService = require('./src/infrastructure/services/CepService');
const FreteCalculator = require('./src/domain/services/FreteCalculator');
const CriarPedidoUseCase = require('./src/application/usecases/CriarPedidoUseCase');
const ListarPedidosUseCase = require('./src/application/usecases/ListarPedidosUseCase');
const BuscarPedidoUseCase = require('./src/application/usecases/BuscarPedidoUseCase');
const PedidosController = require('./src/presentation/controllers/PedidosController');
const pedidosRoutes = require('./src/presentation/routes/pedidosRoutes');

const app = express();
app.use(express.json());

const usuarioRepository = new UsuarioRepositoryInMemory();
const pedidoRepository = new PedidoRepositoryInMemory();
const cepService = new CepService();
const freteCalculator = new FreteCalculator();

const criarPedidoUseCase = new CriarPedidoUseCase({ usuarioRepository, pedidoRepository, cepService, freteCalculator });
const listarPedidosUseCase = new ListarPedidosUseCase({ pedidoRepository });
const buscarPedidoUseCase = new BuscarPedidoUseCase({ pedidoRepository, usuarioRepository });

const pedidosController = new PedidosController({ listarPedidosUseCase, buscarPedidoUseCase, criarPedidoUseCase });

app.use('/pedidos', pedidosRoutes(pedidosController));

module.exports = app;
