class ListarPedidosUseCase {
  constructor({ pedidoRepository }) {
    this.pedidoRepository = pedidoRepository;
  }

  execute() {
    return this.pedidoRepository.findAll();
  }
}

module.exports = ListarPedidosUseCase;
