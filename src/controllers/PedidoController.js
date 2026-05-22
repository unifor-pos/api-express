class PedidoController {
  constructor({ pedidoService }) {
    this.pedidoService = pedidoService;

    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
  }

  list(req, res) {
    const pedidos = this.pedidoService.listPedidos();
    return res.json(pedidos);
  }

  async create(req, res, next) {
    try {
      const pedido = await this.pedidoService.createPedido(req.body);
      return res.status(201).json(pedido);
    } catch (error) {
      return next(error);
    }
  }

  getById(req, res, next) {
    try {
      const pedido = this.pedidoService.getPedidoById(req.params.id);
      return res.json(pedido);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = PedidoController;
