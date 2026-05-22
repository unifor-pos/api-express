class Pedido {
  constructor({ id, usuarioId, valorFinal, status }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.valorFinal = valorFinal;
    this.status = status;
  }
}

module.exports = Pedido;
