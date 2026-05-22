class PedidoRepository {
  constructor(database) {
    this.database = database;
  }

  findAll() {
    return this.database.pedidos;
  }

  findById(id) {
    return this.database.pedidos.find((pedido) => pedido.id === Number(id));
  }

  create(data) {
    const newPedido = {
      id: this.getNextId(),
      ...data
    };

    this.database.pedidos.push(newPedido);
    return newPedido;
  }

  getNextId() {
    return this.database.pedidos.reduce((highestId, pedido) => {
      return pedido.id > highestId ? pedido.id : highestId;
    }, 0) + 1;
  }
}

module.exports = PedidoRepository;
