const express = require('express');
const viacepClient = require('./src/clients/viacep.client');
const precificacao = require('./src/services/precificacao.service');
const { createUsuariosRepository } = require('./src/repositories/usuarios.repository');
const { createPedidosRepository } = require('./src/repositories/pedidos.repository');
const { criarPedidosService } = require('./src/services/pedidos.service');

const app = express();
app.use(express.json());

const usuariosRepo = createUsuariosRepository();
const pedidosRepo = createPedidosRepository();
const pedidosService = criarPedidosService({
  usuariosRepo,
  pedidosRepo,
  viacepClient,
  precificacao
});

app.get('/pedidos', (req, res) => {
  res.send(pedidosService.listar());
});

app.post('/pedidos', async (req, res) => {
  const resultado = await pedidosService.criar(req.body);

  if (!resultado.ok) {
    return res.status(resultado.statusCode).json({ erro: resultado.erro });
  }
  return res.status(resultado.statusCode).json(resultado.pedido);
});

app.get('/pedidos/:id', (req, res) => {
  const dados = pedidosService.buscarPorIdComCliente(req.params.id);
  res.json(dados);
});

module.exports = app;
