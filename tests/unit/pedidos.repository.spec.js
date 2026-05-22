/**
 * Testes unitários do pedidos.repository.
 *
 * Foco especial no contrato do gerador de ID (Bug #1): atômico via
 * closure, inicializado em max(seed.ids) + 1.
 */

const {
  createPedidosRepository,
  SEED_PEDIDOS
} = require('../../src/repositories/pedidos.repository');

describe('createPedidosRepository — seed default', () => {
  it('expõe os 3 pedidos do seed', () => {
    const repo = createPedidosRepository();

    expect(repo.listarTodos()).toHaveLength(3);
    expect(repo.buscarPorId(1)).toMatchObject({ id: 1, usuarioId: 1 });
    expect(repo.buscarPorId(3)).toMatchObject({ id: 3, usuarioId: 99 });
  });

  it('aceita seed customizado', () => {
    const seed = [{ id: 50, usuarioId: 7, valorFinal: 12.5, status: 'APROVADO' }];
    const repo = createPedidosRepository(seed);

    expect(repo.listarTodos()).toHaveLength(1);
    expect(repo.buscarPorId(50)).toMatchObject({ id: 50, valorFinal: 12.5 });
  });

  it('isola instâncias: salvar em uma não afeta a outra', () => {
    const a = createPedidosRepository();
    const b = createPedidosRepository();

    a.salvar({ usuarioId: 1, valorFinal: 10, status: 'APROVADO' });

    expect(a.listarTodos()).toHaveLength(4);
    expect(b.listarTodos()).toHaveLength(3);
  });

  it('não muta o seed original', () => {
    const repo = createPedidosRepository();

    repo.salvar({ usuarioId: 1, valorFinal: 999, status: 'APROVADO' });

    expect(SEED_PEDIDOS).toHaveLength(3);
  });
});

describe('buscarPorId', () => {
  it('retorna o pedido quando o id existe', () => {
    const repo = createPedidosRepository();
    expect(repo.buscarPorId(2)).toBeDefined();
  });

  it('retorna undefined quando o id não existe', () => {
    const repo = createPedidosRepository();
    expect(repo.buscarPorId(999)).toBeUndefined();
  });

  it('usa comparação frouxa (==), aceitando string numérica', () => {
    // Característica intencional do app.js original — preservada para
    // não quebrar o handler que repassa req.params.id (sempre string).
    const repo = createPedidosRepository();
    expect(repo.buscarPorId('1')).toMatchObject({ id: 1 });
  });
});

describe('listarTodos', () => {
  it('retorna cópias — mutação não afeta o estado interno', () => {
    const repo = createPedidosRepository();
    const lista = repo.listarTodos();
    lista[0].valorFinal = -1;

    expect(repo.buscarPorId(1).valorFinal).toBe(85);
  });
});

describe('salvar — gerador atômico de ID (fix do Bug #1)', () => {
  it('atribui id = max(seed.ids) + 1 ao primeiro pedido novo', () => {
    const repo = createPedidosRepository();

    const novo = repo.salvar({ usuarioId: 1, valorFinal: 10, status: 'APROVADO' });

    expect(novo.id).toBe(4); // seed = [1, 2, 3]
  });

  it('incrementa o id em chamadas sequenciais', () => {
    const repo = createPedidosRepository();

    const a = repo.salvar({ usuarioId: 1, valorFinal: 10, status: 'APROVADO' });
    const b = repo.salvar({ usuarioId: 2, valorFinal: 20, status: 'APROVADO' });
    const c = repo.salvar({ usuarioId: 2, valorFinal: 30, status: 'APROVADO' });

    expect([a.id, b.id, c.id]).toEqual([4, 5, 6]);
  });

  it('respeita o maior id do seed mesmo quando há gaps', () => {
    const seed = [
      { id: 10, usuarioId: 1, valorFinal: 1, status: 'APROVADO' },
      { id: 3,  usuarioId: 1, valorFinal: 2, status: 'APROVADO' }
    ];
    const repo = createPedidosRepository(seed);

    const novo = repo.salvar({ usuarioId: 1, valorFinal: 99, status: 'APROVADO' });

    expect(novo.id).toBe(11);
  });

  it('começa em 1 quando o seed é vazio', () => {
    const repo = createPedidosRepository([]);

    const novo = repo.salvar({ usuarioId: 1, valorFinal: 5, status: 'APROVADO' });

    expect(novo.id).toBe(1);
  });

  it('persiste o pedido — listarTodos passa a incluí-lo', () => {
    const repo = createPedidosRepository();

    const novo = repo.salvar({ usuarioId: 1, valorFinal: 42, status: 'APROVADO' });

    expect(repo.buscarPorId(novo.id)).toMatchObject({ id: 4, usuarioId: 1, valorFinal: 42 });
    expect(repo.listarTodos()).toHaveLength(4);
  });
});
