/**
 * Repositório de pedidos — abstração da persistência.
 *
 * Implementação atual: em memória.
 *
 * NOTA: o método `salvar` ainda usa `pedidos.length + 1` para o ID,
 * preservando intencionalmente o bug de race condition do app.js
 * original. A correção (gerador atômico) é aplicada em commit
 * subsequente, junto com a virada do characterization test [BUG].
 */

const SEED_PEDIDOS = Object.freeze([
  Object.freeze({ id: 1, usuarioId: 1, valorFinal: 85.0, status: 'APROVADO' }),
  Object.freeze({ id: 2, usuarioId: 2, valorFinal: 105.0, status: 'APROVADO' }),
  Object.freeze({ id: 3, usuarioId: 99, valorFinal: 30.0, status: 'APROVADO' })
]);

function createPedidosRepository(seed = SEED_PEDIDOS) {
  const pedidos = seed.map(p => ({ ...p }));

  return {
    listarTodos() {
      return pedidos.map(p => ({ ...p }));
    },
    buscarPorId(id) {
      return pedidos.find(p => p.id == id); // == intencional, igual ao app.js original
    },
    salvar(pedido) {
      const novoPedido = { id: pedidos.length + 1, ...pedido };
      pedidos.push(novoPedido);
      return novoPedido;
    }
  };
}

module.exports = { createPedidosRepository, SEED_PEDIDOS };
