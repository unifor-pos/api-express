const Pedido = require('../../domain/entities/Pedido');

const INITIAL_DATA = [
  { id: 1, usuarioId: 1, valorFinal: 85.00, status: 'APROVADO' },
  { id: 2, usuarioId: 2, valorFinal: 105.00, status: 'APROVADO' },
  { id: 3, usuarioId: 99, valorFinal: 30.00, status: 'APROVADO' },
];

class PedidoRepositoryInMemory {
  constructor() {
    this.pedidos = INITIAL_DATA.map(p => new Pedido({ ...p }));
  }

  findAll() {
    return this.pedidos;
  }

  findById(id) {
    return this.pedidos.find(p => p.id == id) || null;
  }

  nextId() {
    return this.pedidos.length + 1;
  }

  save(pedido) {
    const index = this.pedidos.findIndex(p => p.id === pedido.id);
    if (index >= 0) {
      this.pedidos[index] = pedido;
    } else {
      this.pedidos.push(pedido);
    }
  }
}

module.exports = PedidoRepositoryInMemory;
