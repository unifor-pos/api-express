const ListarPedidosUseCase = require('../../../src/application/usecases/ListarPedidosUseCase');

describe('ListarPedidosUseCase', () => {
  it('retorna todos os pedidos do repositório', () => {
    const pedidos = [{ id: 1 }, { id: 2 }];
    const pedidoRepository = { findAll: jest.fn(() => pedidos) };
    const useCase = new ListarPedidosUseCase({ pedidoRepository });

    expect(useCase.execute()).toEqual(pedidos);
    expect(pedidoRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('retorna lista vazia quando não há pedidos', () => {
    const pedidoRepository = { findAll: jest.fn(() => []) };
    const useCase = new ListarPedidosUseCase({ pedidoRepository });

    expect(useCase.execute()).toEqual([]);
  });
});
