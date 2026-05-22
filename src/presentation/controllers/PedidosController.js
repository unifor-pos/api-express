const CepInvalidoError = require('../../domain/errors/CepInvalidoError');
const UsuarioNaoEncontradoError = require('../../domain/errors/UsuarioNaoEncontradoError');
const SaldoInsuficienteError = require('../../domain/errors/SaldoInsuficienteError');
const PedidoNaoEncontradoError = require('../../domain/errors/PedidoNaoEncontradoError');

class PedidosController {
  constructor({ listarPedidosUseCase, buscarPedidoUseCase, criarPedidoUseCase }) {
    this.listarPedidosUseCase = listarPedidosUseCase;
    this.buscarPedidoUseCase = buscarPedidoUseCase;
    this.criarPedidoUseCase = criarPedidoUseCase;
  }

  listar(req, res) {
    res.json(this.listarPedidosUseCase.execute());
  }

  buscar(req, res) {
    try {
      res.json(this.buscarPedidoUseCase.execute(req.params.id));
    } catch (e) {
      if (e instanceof PedidoNaoEncontradoError) {
        return res.status(404).json({ erro: e.message });
      }
      res.status(500).json({ erro: 'Erro interno' });
    }
  }

  async criar(req, res) {
    const { usuarioId, valorTotal, cepDestino } = req.body;

    if (!usuarioId || !valorTotal || !cepDestino) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }

    try {
      const pedido = await this.criarPedidoUseCase.execute({ usuarioId, valorTotal, cepDestino });
      res.status(201).json(pedido);
    } catch (e) {
      if (e instanceof UsuarioNaoEncontradoError) return res.status(404).json({ erro: e.message });
      if (e instanceof CepInvalidoError) return res.status(400).json({ erro: e.message });
      if (e instanceof SaldoInsuficienteError) return res.status(400).json({ erro: e.message });
      res.status(500).json({ erro: e.message || 'Erro interno' });
    }
  }
}

module.exports = PedidosController;
