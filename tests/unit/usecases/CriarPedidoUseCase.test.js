const CriarPedidoUseCase = require('../../../src/application/usecases/CriarPedidoUseCase');
const Usuario = require('../../../src/domain/entities/Usuario');
const CepInvalidoError = require('../../../src/domain/errors/CepInvalidoError');
const UsuarioNaoEncontradoError = require('../../../src/domain/errors/UsuarioNaoEncontradoError');
const SaldoInsuficienteError = require('../../../src/domain/errors/SaldoInsuficienteError');

const makeUseCase = () => {
  const usuarioVip = new Usuario({ id: 1, nome: 'João', tipo: 'VIP', saldo: 100 });
  const usuarioNormal = new Usuario({ id: 2, nome: 'Maria', tipo: 'NORMAL', saldo: 50 });

  const usuarioRepository = {
    findById: jest.fn(id => {
      if (id === 1) return usuarioVip;
      if (id === 2) return usuarioNormal;
      return null;
    }),
    save: jest.fn(),
  };

  const pedidoRepository = {
    nextId: jest.fn(() => 10),
    save: jest.fn(),
  };

  const cepService = {
    buscarUF: jest.fn().mockResolvedValue('RJ'),
  };

  const freteCalculator = {
    calcular: jest.fn(uf => {
      if (uf === 'SP') return 5;
      if (uf === 'CE') return 40;
      return 20;
    }),
  };

  return {
    useCase: new CriarPedidoUseCase({ usuarioRepository, pedidoRepository, cepService, freteCalculator }),
    usuarioRepository,
    pedidoRepository,
    cepService,
    freteCalculator,
    usuarioVip,
    usuarioNormal,
  };
};

describe('CriarPedidoUseCase — validações', () => {
  it('lança UsuarioNaoEncontradoError se usuário não existir', async () => {
    const { useCase } = makeUseCase();
    await expect(useCase.execute({ usuarioId: 999, valorTotal: 50, cepDestino: '00000' }))
      .rejects.toThrow(UsuarioNaoEncontradoError);
  });

  it('lança CepInvalidoError se CEP for inválido', async () => {
    const { useCase, cepService } = makeUseCase();
    cepService.buscarUF.mockRejectedValue(new CepInvalidoError());

    await expect(useCase.execute({ usuarioId: 1, valorTotal: 100, cepDestino: '00000000' }))
      .rejects.toThrow(CepInvalidoError);
  });

  it('lança erro de frete externo em falha de rede', async () => {
    const { useCase, cepService } = makeUseCase();
    cepService.buscarUF.mockRejectedValue(new Error('Network Error'));

    await expect(useCase.execute({ usuarioId: 1, valorTotal: 100, cepDestino: '01310100' }))
      .rejects.toThrow('Erro ao calcular frete externo');
  });

  it('lança SaldoInsuficienteError quando saldo for insuficiente', async () => {
    const { useCase } = makeUseCase();
    // NORMAL, saldo=50: 200 + 20 (RJ) = 220 > 50
    await expect(useCase.execute({ usuarioId: 2, valorTotal: 200, cepDestino: '20040020' }))
      .rejects.toThrow(SaldoInsuficienteError);
  });
});

describe('CriarPedidoUseCase — criação com sucesso', () => {
  it('cria pedido VIP com desconto + frete SP', async () => {
    const { useCase, cepService } = makeUseCase();
    cepService.buscarUF.mockResolvedValue('SP');

    const pedido = await useCase.execute({ usuarioId: 1, valorTotal: 100, cepDestino: '01310100' });
    // 100 * 0.9 - 50 = 40 + 5 (SP) = 45
    expect(pedido.valorFinal).toBe(45);
    expect(pedido.status).toBe('APROVADO');
    expect(pedido.usuarioId).toBe(1);
  });

  it('cria pedido NORMAL sem desconto + frete RJ', async () => {
    const { useCase } = makeUseCase();
    // NORMAL, saldo=50: 10 + 20 (RJ) = 30
    const pedido = await useCase.execute({ usuarioId: 2, valorTotal: 10, cepDestino: '20040020' });
    expect(pedido.valorFinal).toBe(30);
    expect(pedido.status).toBe('APROVADO');
  });

  it('cria pedido com frete CE', async () => {
    const { useCase, cepService } = makeUseCase();
    cepService.buscarUF.mockResolvedValue('CE');
    // NORMAL, saldo=50: 10 + 40 (CE) = 50
    const pedido = await useCase.execute({ usuarioId: 2, valorTotal: 10, cepDestino: '60000000' });
    expect(pedido.valorFinal).toBe(50);
  });

  it('débita saldo do usuário após criação', async () => {
    const { useCase, usuarioNormal } = makeUseCase();
    await useCase.execute({ usuarioId: 2, valorTotal: 10, cepDestino: '20040020' });
    // 10 + 20 = 30 debitado de saldo=50
    expect(usuarioNormal.saldo).toBe(20);
  });

  it('salva o pedido no repositório', async () => {
    const { useCase, pedidoRepository } = makeUseCase();
    await useCase.execute({ usuarioId: 2, valorTotal: 10, cepDestino: '20040020' });
    expect(pedidoRepository.save).toHaveBeenCalledTimes(1);
  });
});
