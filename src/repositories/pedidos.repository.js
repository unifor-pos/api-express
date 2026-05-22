/**
 * Repositório de pedidos — abstração da persistência.
 *
 * Implementação atual: em memória.
 *
 * Geração de ID: contador atômico via closure (`nextId++`). Substitui o
 * `pedidos.length + 1` do app.js original, que sob duas requisições
 * concorrentes podia ler o mesmo length e emitir IDs duplicados.
 */

const SEED_PEDIDOS = Object.freeze([
  Object.freeze({ id: 1, usuarioId: 1, valorFinal: 85.0, status: 'APROVADO' }),
  Object.freeze({ id: 2, usuarioId: 2, valorFinal: 105.0, status: 'APROVADO' }),
  Object.freeze({ id: 3, usuarioId: 99, valorFinal: 30.0, status: 'APROVADO' })
]);

function createPedidosRepository(seed = SEED_PEDIDOS) {
  const pedidos = seed.map(p => ({ ...p }));
  let nextId = pedidos.reduce((max, p) => Math.max(max, p.id), 0) + 1;

  return {
    listarTodos() {
      return pedidos.map(p => ({ ...p }));
    },
    buscarPorId(id) {
      return pedidos.find(p => p.id == id); // == intencional, igual ao app.js original
    },
    salvar(pedido) {
      const novoPedido = { id: nextId++, ...pedido };
      pedidos.push(novoPedido);
      return novoPedido;
    }
  };
}

module.exports = { createPedidosRepository, SEED_PEDIDOS };
