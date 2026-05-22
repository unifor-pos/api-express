const PedidoNaoEncontradoError = require('../../domain/errors/PedidoNaoEncontradoError');

class BuscarPedidoUseCase {
  constructor({ pedidoRepository, usuarioRepository }) {
    this.pedidoRepository = pedidoRepository;
    this.usuarioRepository = usuarioRepository;
  }

  execute(id) {
    const pedido = this.pedidoRepository.findById(id);
    if (!pedido) throw new PedidoNaoEncontradoError();

    const usuario = this.usuarioRepository.findById(pedido.usuarioId);

    return {
      pedido,
      cliente: usuario ? usuario.nome : null,
    };
  }
}

module.exports = BuscarPedidoUseCase;
