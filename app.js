const express = require('express');
const viacepClient = require('./src/clients/viacep.client');
const precificacao = require('./src/services/precificacao.service');
const app = express();
app.use(express.json());

let usuarios = [
  { id: 1, nome: "João Silva", tipo: "VIP", saldo: 100 },
  { id: 2, nome: "Maria Souza", tipo: "NORMAL", saldo: 50 }
];

let pedidos = [
  { id: 1, usuarioId: 1, valorFinal: 85.00, status: "APROVADO" },  
  { id: 2, usuarioId: 2, valorFinal: 105.00, status: "APROVADO" }, 
  { id: 3, usuarioId: 99, valorFinal: 30.00, status: "APROVADO" }  
];

app.get('/pedidos', (req, res) => {
  res.send(pedidos);
})

app.post('/pedidos', async (req, res) => {
  const { usuarioId, valorTotal, cepDestino } = req.body;

  if (!usuarioId || !valorTotal) {
    return res.status(400).json({ erro: "Dados inválidos" });
  }

  const usuario = usuarios.find(u => u.id === usuarioId);
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

  usuario.saldo -= valorFinal;

  const novoPedido = {
    id: pedidos.length + 1,
    usuarioId,
    valorFinal,
    status: "APROVADO"
  };
  pedidos.push(novoPedido);

  return res.status(201).json(novoPedido);
});

app.get('/pedidos/:id', (req, res) => {
  const pedido = pedidos.find(p => p.id == req.params.id);
  
  const donoPedido = usuarios.find(u => u.id === pedido.usuarioId); 

  res.json({
    pedido,
    cliente: donoPedido.nome
  });
});

module.exports = app;