/**
 * Testes unitários do pedidos.service.
 *
 * Cada dependência é injetada como jest.fn() — sem Express, sem HTTP,
 * sem rede. Foca exclusivamente na orquestração das regras.
 */

const { criarPedidosService } = require('../../src/services/pedidos.service');
const { AppError } = require('../../src/errors/AppError');

function makeDeps(overrides = {}) {
  return {
    usuariosRepo: {
      buscarPorId: jest.fn(),
      debitarSaldo: jest.fn(),
      ...overrides.usuariosRepo
    },
    pedidosRepo: {
      buscarPorId: jest.fn(),
      listarTodos: jest.fn(),
      salvar: jest.fn(),
      ...overrides.pedidosRepo
    },
    viacepClient: {
      consultarCep: jest.fn(),
      ...overrides.viacepClient
    },
    precificacao: {
      aplicarDescontoVIP: jest.fn(),
      calcularFrete: jest.fn(),
      ...overrides.precificacao
    }
  };
}

describe('pedidos.service — criar', () => {
  it('retorna 400 quando usuarioId está ausente', async () => {
    const deps = makeDeps();
    const service = criarPedidosService(deps);

    const r = await service.criar({ valorTotal: 50, cepDestino: '01001000' });

    expect(r).toEqual({ ok: false, statusCode: 400, erro: 'Dados inválidos' });
    expect(deps.usuariosRepo.buscarPorId).not.toHaveBeenCalled();
  });

  it('retorna 400 quando valorTotal está ausente', async () => {
    const deps = makeDeps();
    const service = criarPedidosService(deps);

    const r = await service.criar({ usuarioId: 1, cepDestino: '01001000' });

    expect(r).toEqual({ ok: false, statusCode: 400, erro: 'Dados inválidos' });
  });

  it('retorna 404 quando o usuário não existe', async () => {
    const deps = makeDeps();
    deps.usuariosRepo.buscarPorId.mockReturnValue(undefined);
    const service = criarPedidosService(deps);

    const r = await service.criar({ usuarioId: 999, valorTotal: 50, cepDestino: '01001000' });

    expect(r).toEqual({ ok: false, statusCode: 404, erro: 'Usuário não encontrado' });
    expect(deps.usuariosRepo.buscarPorId).toHaveBeenCalledWith(999);
    expect(deps.viacepClient.consultarCep).not.toHaveBeenCalled();
  });

  it('retorna 500 quando o ViaCEP lança erro', async () => {
    const deps = makeDeps();
    deps.usuariosRepo.buscarPorId.mockReturnValue({ id: 1, tipo: 'NORMAL', saldo: 100 });
    deps.precificacao.aplicarDescontoVIP.mockReturnValue(50);
    deps.viacepClient.consultarCep.mockRejectedValue(new Error('timeout'));
    const service = criarPedidosService(deps);

    const r = await service.criar({ usuarioId: 1, valorTotal: 50, cepDestino: '01001000' });

    expect(r).toEqual({ ok: false, statusCode: 500, erro: 'Erro ao calcular frete externo' });
    expect(deps.pedidosRepo.salvar).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o ViaCEP responde { erro: true }', async () => {
    const deps = makeDeps();
    deps.usuariosRepo.buscarPorId.mockReturnValue({ id: 1, tipo: 'NORMAL', saldo: 100 });
    deps.precificacao.aplicarDescontoVIP.mockReturnValue(50);
    deps.viacepClient.consultarCep.mockResolvedValue({ erro: true });
    const service = criarPedidosService(deps);

    const r = await service.criar({ usuarioId: 1, valorTotal: 50, cepDestino: '00000000' });

    expect(r).toEqual({ ok: false, statusCode: 400, erro: 'CEP inválido' });
    expect(deps.pedidosRepo.salvar).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o saldo é insuficiente', async () => {
    const deps = makeDeps();
    deps.usuariosRepo.buscarPorId.mockReturnValue({ id: 1, tipo: 'NORMAL', saldo: 10 });
    deps.precificacao.aplicarDescontoVIP.mockReturnValue(50);
    deps.viacepClient.consultarCep.mockResolvedValue({ uf: 'SP' });
    deps.precificacao.calcularFrete.mockReturnValue(5);
    const service = criarPedidosService(deps);

    const r = await service.criar({ usuarioId: 1, valorTotal: 50, cepDestino: '01001000' });

    expect(r).toEqual({ ok: false, statusCode: 400, erro: 'Saldo insuficiente' });
    expect(deps.usuariosRepo.debitarSaldo).not.toHaveBeenCalled();
    expect(deps.pedidosRepo.salvar).not.toHaveBeenCalled();
  });

  it('caso feliz: debita saldo, persiste pedido e retorna 201', async () => {
    const deps = makeDeps();
    deps.usuariosRepo.buscarPorId.mockReturnValue({ id: 1, tipo: 'VIP', saldo: 100 });
    deps.precificacao.aplicarDescontoVIP.mockReturnValue(40);
    deps.viacepClient.consultarCep.mockResolvedValue({ uf: 'SP' });
    deps.precificacao.calcularFrete.mockReturnValue(5);
    deps.pedidosRepo.salvar.mockReturnValue({ id: 7, usuarioId: 1, valorFinal: 45, status: 'APROVADO' });
    const service = criarPedidosService(deps);

    const r = await service.criar({ usuarioId: 1, valorTotal: 100, cepDestino: '01001000' });

    expect(r).toEqual({
      ok: true,
      statusCode: 201,
      pedido: { id: 7, usuarioId: 1, valorFinal: 45, status: 'APROVADO' }
    });
    expect(deps.precificacao.aplicarDescontoVIP).toHaveBeenCalledWith(100, 'VIP');
    expect(deps.precificacao.calcularFrete).toHaveBeenCalledWith('SP');
    expect(deps.usuariosRepo.debitarSaldo).toHaveBeenCalledWith(1, 45);
    expect(deps.pedidosRepo.salvar).toHaveBeenCalledWith({
      usuarioId: 1,
      valorFinal: 45,
      status: 'APROVADO'
    });
  });
});

describe('pedidos.service — buscarPorIdComCliente', () => {
  it('retorna pedido + nome quando ambos existem', () => {
    const deps = makeDeps();
    deps.pedidosRepo.buscarPorId.mockReturnValue({ id: 1, usuarioId: 10, valorFinal: 85 });
    deps.usuariosRepo.buscarPorId.mockReturnValue({ id: 10, nome: 'Ana' });
    const service = criarPedidosService(deps);

    const r = service.buscarPorIdComCliente(1);

    expect(r).toEqual({
      pedido: { id: 1, usuarioId: 10, valorFinal: 85 },
      cliente: 'Ana'
    });
  });

  it('retorna cliente:null quando o pedido referencia usuário inexistente (Bug #2)', () => {
    const deps = makeDeps();
    deps.pedidosRepo.buscarPorId.mockReturnValue({ id: 3, usuarioId: 99, valorFinal: 30 });
    deps.usuariosRepo.buscarPorId.mockReturnValue(undefined);
    const service = criarPedidosService(deps);

    const r = service.buscarPorIdComCliente(3);

    expect(r).toEqual({
      pedido: { id: 3, usuarioId: 99, valorFinal: 30 },
      cliente: null
    });
  });

  it('lança AppError(404) quando o pedido não existe (Bug #3)', () => {
    const deps = makeDeps();
    deps.pedidosRepo.buscarPorId.mockReturnValue(undefined);
    const service = criarPedidosService(deps);

    expect(() => service.buscarPorIdComCliente(999)).toThrow(AppError);
    expect(() => service.buscarPorIdComCliente(999)).toThrow('Pedido não encontrado');
    try {
      service.buscarPorIdComCliente(999);
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });
});

describe('pedidos.service — listar', () => {
  it('delega para pedidosRepo.listarTodos', () => {
    const deps = makeDeps();
    deps.pedidosRepo.listarTodos.mockReturnValue([{ id: 1 }, { id: 2 }]);
    const service = criarPedidosService(deps);

    const r = service.listar();

    expect(r).toEqual([{ id: 1 }, { id: 2 }]);
    expect(deps.pedidosRepo.listarTodos).toHaveBeenCalledTimes(1);
  });
});
