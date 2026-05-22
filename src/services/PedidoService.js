const AppError = require('../errors/AppError');

class PedidoService {
  constructor({ pedidoRepository, usuarioRepository, cepClient }) {
    this.pedidoRepository = pedidoRepository;
    this.usuarioRepository = usuarioRepository;
    this.cepClient = cepClient;
  }

  listPedidos() {
    return this.pedidoRepository.findAll();
  }

  async createPedido({ usuarioId, valorTotal, cepDestino }) {
    this.validateCreatePedidoInput({ usuarioId, valorTotal, cepDestino });

    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    let valorFinal = this.calculateBaseOrderValue({
      usuario,
      valorTotal: Number(valorTotal)
    });

    const endereco = await this.fetchAddress(cepDestino);
    const frete = this.calculateShippingByState(endereco.uf);
    valorFinal += frete;

    if (usuario.saldo < valorFinal) {
      throw new AppError(400, 'Saldo insuficiente');
    }

    this.usuarioRepository.debitBalance(usuario.id, valorFinal);

    return this.pedidoRepository.create({
      usuarioId: usuario.id,
      valorFinal,
      status: 'APROVADO'
    });
  }

  getPedidoById(id) {
    const pedido = this.pedidoRepository.findById(id);
    if (!pedido) {
      throw new AppError(404, 'Pedido não encontrado');
    }

    const usuario = this.usuarioRepository.findById(pedido.usuarioId);

    return {
      pedido,
      cliente: usuario ? usuario.nome : null
    };
  }

  validateCreatePedidoInput({ usuarioId, valorTotal, cepDestino }) {
    const parsedUsuarioId = Number(usuarioId);
    const parsedValorTotal = Number(valorTotal);

    if (!parsedUsuarioId || !parsedValorTotal || !cepDestino) {
      throw new AppError(400, 'Dados inválidos');
    }
  }

  calculateBaseOrderValue({ usuario, valorTotal }) {
    if (usuario.tipo !== 'VIP') {
      return valorTotal;
    }

    const discountedValue = valorTotal * 0.9;
    return discountedValue - 50;
  }

  async fetchAddress(cepDestino) {
    try {
      const endereco = await this.cepClient.findByCep(cepDestino);

      if (endereco.erro) {
        throw new AppError(400, 'CEP inválido');
      }

      return endereco;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, 'Erro ao calcular frete externo');
    }
  }

  calculateShippingByState(uf) {
    if (uf === 'SP') {
      return 5;
    }

    if (uf === 'CE') {
      return 40;
    }

    return 20;
  }
}

module.exports = PedidoService;
