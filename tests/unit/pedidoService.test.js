const test = require('node:test');
const assert = require('node:assert/strict');

const AppError = require('../../src/errors/AppError');
const PedidoService = require('../../src/services/PedidoService');

function createServiceContext({
  usuarios = [
    { id: 1, nome: 'João Silva', tipo: 'VIP', saldo: 100 },
    { id: 2, nome: 'Maria Souza', tipo: 'NORMAL', saldo: 50 }
  ],
  pedidos = [
    { id: 1, usuarioId: 1, valorFinal: 85, status: 'APROVADO' },
    { id: 2, usuarioId: 99, valorFinal: 30, status: 'APROVADO' }
  ],
  cepResponse = { uf: 'SP' },
  cepError = null
} = {}) {
  const state = {
    usuarios: usuarios.map((usuario) => ({ ...usuario })),
    pedidos: pedidos.map((pedido) => ({ ...pedido })),
    debitedAmounts: [],
    lookedUpCeps: [],
    createdPedido: null
  };

  const pedidoRepository = {
    findAll() {
      return state.pedidos;
    },
    findById(id) {
      return state.pedidos.find((pedido) => pedido.id === Number(id));
    },
    create(data) {
      const newPedido = {
        id: state.pedidos.length + 1,
        ...data
      };

      state.createdPedido = newPedido;
      state.pedidos.push(newPedido);
      return newPedido;
    }
  };

  const usuarioRepository = {
    findById(id) {
      return state.usuarios.find((usuario) => usuario.id === Number(id));
    },
    debitBalance(id, amount) {
      const usuario = this.findById(id);
      if (!usuario) {
        return null;
      }

      usuario.saldo -= amount;
      state.debitedAmounts.push({ id, amount });
      return usuario;
    }
  };

  const cepClient = {
    async findByCep(cep) {
      state.lookedUpCeps.push(cep);

      if (cepError) {
        throw cepError;
      }

      return cepResponse;
    }
  };

  return {
    state,
    service: new PedidoService({
      pedidoRepository,
      usuarioRepository,
      cepClient
    })
  };
}

test('PedidoService.listPedidos retorna os pedidos do repositório', () => {
  const { service, state } = createServiceContext();

  const pedidos = service.listPedidos();

  assert.equal(pedidos, state.pedidos);
  assert.equal(pedidos.length, 2);
});

test('PedidoService.createPedido aplica desconto VIP, soma frete e debita saldo', async () => {
  const { service, state } = createServiceContext({
    cepResponse: { uf: 'SP' }
  });

  const pedido = await service.createPedido({
    usuarioId: 1,
    valorTotal: 100,
    cepDestino: '60352590'
  });

  assert.equal(pedido.id, 3);
  assert.equal(pedido.usuarioId, 1);
  assert.equal(pedido.valorFinal, 45);
  assert.equal(pedido.status, 'APROVADO');
  assert.deepEqual(state.lookedUpCeps, ['60352590']);
  assert.deepEqual(state.debitedAmounts, [{ id: 1, amount: 45 }]);
  assert.equal(state.usuarios[0].saldo, 55);
});

test('PedidoService.createPedido retorna erro 400 para payload inválido', async () => {
  const { service } = createServiceContext();

  await assert.rejects(
    service.createPedido({ usuarioId: 1, valorTotal: 0, cepDestino: '' }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, 'Dados inválidos');
      return true;
    }
  );
});

test('PedidoService.createPedido retorna erro 404 quando o usuário não existe', async () => {
  const { service } = createServiceContext();

  await assert.rejects(
    service.createPedido({ usuarioId: 999, valorTotal: 100, cepDestino: '60352590' }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.message, 'Usuário não encontrado');
      return true;
    }
  );
});

test('PedidoService.createPedido retorna erro 400 quando o CEP é inválido', async () => {
  const { service, state } = createServiceContext({
    cepResponse: { erro: true }
  });

  await assert.rejects(
    service.createPedido({ usuarioId: 1, valorTotal: 100, cepDestino: '00000000' }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, 'CEP inválido');
      return true;
    }
  );

  assert.equal(state.debitedAmounts.length, 0);
  assert.equal(state.createdPedido, null);
});

test('PedidoService.createPedido retorna erro 500 quando o client de CEP falha', async () => {
  const { service, state } = createServiceContext({
    cepError: new Error('timeout')
  });

  await assert.rejects(
    service.createPedido({ usuarioId: 1, valorTotal: 100, cepDestino: '60352590' }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 500);
      assert.equal(error.message, 'Erro ao calcular frete externo');
      return true;
    }
  );

  assert.equal(state.debitedAmounts.length, 0);
  assert.equal(state.createdPedido, null);
});

test('PedidoService.createPedido retorna erro 400 quando o saldo é insuficiente', async () => {
  const { service, state } = createServiceContext({
    cepResponse: { uf: 'CE' }
  });

  await assert.rejects(
    service.createPedido({ usuarioId: 2, valorTotal: 20, cepDestino: '60352590' }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, 'Saldo insuficiente');
      return true;
    }
  );

  assert.equal(state.usuarios[1].saldo, 50);
  assert.equal(state.createdPedido, null);
});

test('PedidoService.getPedidoById retorna o nome do cliente quando o pedido possui dono', () => {
  const { service } = createServiceContext();

  const result = service.getPedidoById(1);

  assert.equal(result.pedido.id, 1);
  assert.equal(result.cliente, 'João Silva');
});

test('PedidoService.getPedidoById retorna cliente nulo para pedido órfão', () => {
  const { service } = createServiceContext();

  const result = service.getPedidoById(2);

  assert.equal(result.pedido.id, 2);
  assert.equal(result.cliente, null);
});

test('PedidoService.getPedidoById retorna erro 404 quando o pedido não existe', () => {
  const { service } = createServiceContext();

  assert.throws(
    () => service.getPedidoById(999),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      assert.equal(error.message, 'Pedido não encontrado');
      return true;
    }
  );
});
