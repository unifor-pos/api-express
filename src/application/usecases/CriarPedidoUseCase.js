const Pedido = require('../../domain/entities/Pedido');
const CepInvalidoError = require('../../domain/errors/CepInvalidoError');
const UsuarioNaoEncontradoError = require('../../domain/errors/UsuarioNaoEncontradoError');
const SaldoInsuficienteError = require('../../domain/errors/SaldoInsuficienteError');

class CriarPedidoUseCase {
  constructor({ usuarioRepository, pedidoRepository, cepService, freteCalculator }) {
    this.usuarioRepository = usuarioRepository;
    this.pedidoRepository = pedidoRepository;
    this.cepService = cepService;
    this.freteCalculator = freteCalculator;
  }

  async execute({ usuarioId, valorTotal, cepDestino }) {
    const usuario = this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new UsuarioNaoEncontradoError();

    let valorFinal = usuario.calcularDesconto(valorTotal);

    let uf;
    try {
      uf = await this.cepService.buscarUF(cepDestino);
    } catch (e) {
      if (e instanceof CepInvalidoError) throw e;
      throw new Error('Erro ao calcular frete externo');
    }

    valorFinal += this.freteCalculator.calcular(uf);

    if (!usuario.temSaldo(valorFinal)) throw new SaldoInsuficienteError();

    usuario.debitar(valorFinal);
    this.usuarioRepository.save(usuario);

    const pedido = new Pedido({
      id: this.pedidoRepository.nextId(),
      usuarioId,
      valorFinal,
      status: 'APROVADO',
    });

    this.pedidoRepository.save(pedido);
    return pedido;
  }
}

module.exports = CriarPedidoUseCase;
