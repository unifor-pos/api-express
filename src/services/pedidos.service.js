/**
 * Service de pedidos — orquestra a regra de criação de um pedido.
 *
 * Recebe todas as dependências por INJEÇÃO (Dependency Injection):
 *   - usuariosRepo, pedidosRepo: acesso a estado
 *   - viacepClient:              integração externa
 *   - precificacao:              regras puras
 *
 * Vantagens dessa abordagem:
 *   - testes unitários ficam triviais: passa-se `jest.fn()` em cada dep
 *   - troca de implementação (banco, outro provedor de CEP) não afeta a
 *     regra de negócio
 *   - cada caminho de retorno produz um objeto `Result` discriminado
 *     por `ok` (sucesso) ou `erro` (mensagem + statusCode), mantendo o
 *     controller HTTP livre de regra de negócio
 */

function criarPedidosService({ usuariosRepo, pedidosRepo, viacepClient, precificacao }) {
  async function criar({ usuarioId, valorTotal, cepDestino }) {
    if (!usuarioId || !valorTotal) {
      return { ok: false, statusCode: 400, erro: 'Dados inválidos' };
    }

    const usuario = usuariosRepo.buscarPorId(usuarioId);
    if (!usuario) {
      return { ok: false, statusCode: 404, erro: 'Usuário não encontrado' };
    }

    let valorFinal = precificacao.aplicarDescontoVIP(valorTotal, usuario.tipo);

    let enderecoCep;
    try {
      enderecoCep = await viacepClient.consultarCep(cepDestino);
    } catch (e) {
      return { ok: false, statusCode: 500, erro: 'Erro ao calcular frete externo' };
    }

    if (enderecoCep.erro) {
      return { ok: false, statusCode: 400, erro: 'CEP inválido' };
    }

    valorFinal += precificacao.calcularFrete(enderecoCep.uf);

    if (usuario.saldo < valorFinal) {
      return { ok: false, statusCode: 400, erro: 'Saldo insuficiente' };
    }

    usuariosRepo.debitarSaldo(usuario.id, valorFinal);

    const novoPedido = pedidosRepo.salvar({
      usuarioId,
      valorFinal,
      status: 'APROVADO'
    });

    return { ok: true, statusCode: 201, pedido: novoPedido };
  }

  function buscarPorIdComCliente(id) {
    const pedido = pedidosRepo.buscarPorId(id);
    const donoPedido = usuariosRepo.buscarPorId(pedido.usuarioId);

    return {
      pedido,
      cliente: donoPedido ? donoPedido.nome : null
    };
  }

  function listar() {
    return pedidosRepo.listarTodos();
  }

  return { criar, buscarPorIdComCliente, listar };
}

module.exports = { criarPedidosService };
