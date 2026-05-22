/**
 * Controller HTTP de pedidos.
 *
 * Recebe o service por injeção e cuida APENAS de:
 *   - extrair dados de req (body, params, query)
 *   - traduzir o Result do service em status HTTP + body
 *
 * Nenhuma regra de negócio aqui — facilita troca de framework
 * (Express -> Fastify -> Koa) sem reescrever o domínio.
 */

function criarPedidosController({ pedidosService }) {
  function listar(req, res) {
    res.send(pedidosService.listar());
  }

  async function criar(req, res) {
    const resultado = await pedidosService.criar(req.body);

    if (!resultado.ok) {
      return res.status(resultado.statusCode).json({ erro: resultado.erro });
    }
    return res.status(resultado.statusCode).json(resultado.pedido);
  }

  function buscarPorId(req, res) {
    const dados = pedidosService.buscarPorIdComCliente(req.params.id);
    res.json(dados);
  }

  return { listar, criar, buscarPorId };
}

module.exports = { criarPedidosController };
