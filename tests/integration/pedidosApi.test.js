const test = require('node:test');
const assert = require('node:assert/strict');

const createApp = require('../../src/appFactory');
const createMockDatabase = require('../../src/data/mockDatabase');
const createHttpTestClient = require('../helpers/httpTestClient');

async function createApiContext({ cepClient } = {}) {
  const database = createMockDatabase();
  const app = createApp({ database, cepClient });
  const client = await createHttpTestClient(app);

  return {
    client,
    database
  };
}

test('GET /pedidos lista os pedidos mockados', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'SP' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos');

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(response.body), true);
  assert.equal(response.body.length, 3);
  assert.equal(response.body[0].id, 1);
});

test('GET /pedidos/:id retorna os dados do pedido e o nome do cliente', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'SP' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos/1');

  assert.equal(response.status, 200);
  assert.equal(response.body.pedido.id, 1);
  assert.equal(response.body.cliente, 'João Silva');
});

test('GET /pedidos/:id retorna cliente nulo para pedido órfão', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'SP' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos/3');

  assert.equal(response.status, 200);
  assert.equal(response.body.pedido.id, 3);
  assert.equal(response.body.cliente, null);
});

test('GET /pedidos/:id retorna 404 para pedido inexistente', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'SP' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos/999');

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { erro: 'Pedido não encontrado' });
});

test('POST /pedidos cria um pedido com sucesso', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'SP' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos', {
    method: 'POST',
    body: {
      usuarioId: 1,
      valorTotal: 100,
      cepDestino: '60352590'
    }
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.id, 4);
  assert.equal(response.body.usuarioId, 1);
  assert.equal(response.body.valorFinal, 45);
  assert.equal(response.body.status, 'APROVADO');
  assert.equal(context.database.pedidos.length, 4);
  assert.equal(context.database.usuarios[0].saldo, 55);
});

test('POST /pedidos retorna 400 para payload inválido', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'SP' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos', {
    method: 'POST',
    body: {
      usuarioId: 1
    }
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { erro: 'Dados inválidos' });
});

test('POST /pedidos retorna 404 quando o usuário não existe', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'SP' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos', {
    method: 'POST',
    body: {
      usuarioId: 999,
      valorTotal: 100,
      cepDestino: '60352590'
    }
  });

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { erro: 'Usuário não encontrado' });
});

test('POST /pedidos retorna 400 para CEP inválido', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ erro: true })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos', {
    method: 'POST',
    body: {
      usuarioId: 1,
      valorTotal: 100,
      cepDestino: '00000000'
    }
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { erro: 'CEP inválido' });
});

test('POST /pedidos retorna 500 quando a integração de CEP falha', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => {
        throw new Error('timeout');
      }
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos', {
    method: 'POST',
    body: {
      usuarioId: 1,
      valorTotal: 100,
      cepDestino: '60352590'
    }
  });

  assert.equal(response.status, 500);
  assert.deepEqual(response.body, { erro: 'Erro ao calcular frete externo' });
});

test('POST /pedidos retorna 400 quando o saldo é insuficiente', async (t) => {
  const context = await createApiContext({
    cepClient: {
      findByCep: async () => ({ uf: 'CE' })
    }
  });

  t.after(() => context.client.close());

  const response = await context.client.request('/pedidos', {
    method: 'POST',
    body: {
      usuarioId: 2,
      valorTotal: 20,
      cepDestino: '60352590'
    }
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { erro: 'Saldo insuficiente' });
});
