const BuscarPedidoUseCase = require('../../../src/application/usecases/BuscarPedidoUseCase');
const PedidoNaoEncontradoError = require('../../../src/domain/errors/PedidoNaoEncontradoError');

describe('BuscarPedidoUseCase', () => {
  it('lança PedidoNaoEncontradoError se pedido não existir', () => {
    const useCase = new BuscarPedidoUseCase({
      pedidoRepository: { findById: jest.fn(() => null) },
      usuarioRepository: { findById: jest.fn() },
    });

    expect(() => useCase.execute(999)).toThrow(PedidoNaoEncontradoError);
    expect(() => useCase.execute(999)).toThrow('Pedido não encontrado');
  });

  it('retorna pedido com nome do cliente', () => {
    const pedido = { id: 1, usuarioId: 1, valorFinal: 50, status: 'APROVADO' };
    const usuario = { id: 1, nome: 'João' };
    const useCase = new BuscarPedidoUseCase({
      pedidoRepository: { findById: jest.fn(() => pedido) },
      usuarioRepository: { findById: jest.fn(() => usuario) },
    });

    const result = useCase.execute(1);
    expect(result.pedido).toEqual(pedido);
    expect(result.cliente).toBe('João');
  });

  it('retorna cliente null quando usuário do pedido não existir', () => {
    const pedido = { id: 3, usuarioId: 99, valorFinal: 30, status: 'APROVADO' };
    const useCase = new BuscarPedidoUseCase({
      pedidoRepository: { findById: jest.fn(() => pedido) },
      usuarioRepository: { findById: jest.fn(() => null) },
    });

    const result = useCase.execute(3);
    expect(result.pedido).toEqual(pedido);
    expect(result.cliente).toBeNull();
  });
});
