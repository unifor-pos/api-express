class PedidoNaoEncontradoError extends Error {
  constructor() {
    super('Pedido não encontrado');
    this.name = 'PedidoNaoEncontradoError';
  }
}

module.exports = PedidoNaoEncontradoError;
