const express = require('express');
const viacepClient = require('./src/clients/viacep.client');
const precificacao = require('./src/services/precificacao.service');
const { createUsuariosRepository } = require('./src/repositories/usuarios.repository');
const { createPedidosRepository } = require('./src/repositories/pedidos.repository');
const app = express();
app.use(express.json());

const usuariosRepo = createUsuariosRepository();
const pedidosRepo = createPedidosRepository();

app.get('/pedidos', (req, res) => {
  res.send(pedidosRepo.listarTodos());
});

app.post('/pedidos', async (req, res) => {
  const { usuarioId, valorTotal, cepDestino } = req.body;

  if (!usuarioId || !valorTotal) {
    return res.status(400).json({ erro: "Dados inválidos" });
  }

  const usuario = usuariosRepo.buscarPorId(usuarioId);
  if (!usuario) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  let valorFinal = precificacao.aplicarDescontoVIP(valorTotal, usuario.tipo);

  try {
    const enderecoCep = await viacepClient.consultarCep(cepDestino);

    if (enderecoCep.erro) {
      return res.status(400).json({ erro: "CEP inválido" });
    }

    valorFinal += precificacao.calcularFrete(enderecoCep.uf);

  } catch (error) {
    return res.status(500).json({ erro: "Erro ao calcular frete externo" });
  }

  if (usuario.saldo < valorFinal) {
    return res.status(400).json({ erro: "Saldo insuficiente" });
  }

  usuariosRepo.debitarSaldo(usuario.id, valorFinal);

  const novoPedido = pedidosRepo.salvar({
    usuarioId,
    valorFinal,
    status: 'APROVADO'
  });

  return res.status(201).json(novoPedido);
});

app.get('/pedidos/:id', (req, res) => {
  const pedido = pedidosRepo.buscarPorId(req.params.id);
  const donoPedido = usuariosRepo.buscarPorId(pedido.usuarioId);

  res.json({
    pedido,
    cliente: donoPedido.nome
  });
});

module.exports = app;