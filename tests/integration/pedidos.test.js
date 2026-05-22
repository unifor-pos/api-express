jest.mock('axios');

let request;
let app;
let axios;

beforeEach(() => {
  jest.resetModules();
  jest.mock('axios');
  request = require('supertest');
  app = require('../../app');
  axios = require('axios');
});

describe('GET /pedidos', () => {
  it('deve retornar lista de pedidos', async () => {
    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /pedidos/:id', () => {
  it('deve retornar pedido com dados do cliente', async () => {
    const res = await request(app).get('/pedidos/1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pedido');
    expect(res.body).toHaveProperty('cliente');
  });

  it('deve retornar 404 se pedido não existir', async () => {
    const res = await request(app).get('/pedidos/999');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Pedido não encontrado');
  });

  it('deve retornar cliente null quando usuário do pedido não existir', async () => {
    // Pedido id=3 tem usuarioId=99 que não existe
    const res = await request(app).get('/pedidos/3');

    expect(res.status).toBe(200);
    expect(res.body.cliente).toBeNull();
  });
});

describe('POST /pedidos', () => {
  it('deve retornar 400 se dados estiverem faltando', async () => {
    const res = await request(app).post('/pedidos').send({});

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Dados inválidos');
  });

  it('deve retornar 400 se cepDestino estiver faltando', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 1, valorTotal: 50 });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Dados inválidos');
  });

  it('deve retornar 404 se usuário não existir', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 999, valorTotal: 50, cepDestino: '01310100' });

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Usuário não encontrado');
  });

  it('deve criar pedido para usuário VIP com desconto e frete SP', async () => {
    axios.get.mockResolvedValue({ data: { uf: 'SP', erro: undefined } });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 1, valorTotal: 100, cepDestino: '01310100' });

    // 100 * 0.90 = 90 → 90 - 50 = 40 → 40 + 5 (SP) = 45
    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(45);
    expect(res.body.status).toBe('APROVADO');
  });

  it('deve criar pedido para usuário NORMAL sem desconto com frete RJ', async () => {
    axios.get.mockResolvedValue({ data: { uf: 'RJ', erro: undefined } });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 10, cepDestino: '20040020' });

    // 10 + 20 (RJ) = 30
    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(30);
    expect(res.body.status).toBe('APROVADO');
  });

  it('deve aplicar frete de 40 para CEP do CE', async () => {
    axios.get.mockResolvedValue({ data: { uf: 'CE', erro: undefined } });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 10, cepDestino: '60000000' });

    // 10 + 40 (CE) = 50 = saldo
    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(50);
  });

  it('deve retornar 400 para CEP inválido', async () => {
    axios.get.mockResolvedValue({ data: { erro: true } });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 10, cepDestino: '00000000' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('CEP inválido');
  });

  it('deve retornar 400 se saldo for insuficiente', async () => {
    axios.get.mockResolvedValue({ data: { uf: 'RJ', erro: undefined } });

    // 200 + 20 (RJ) = 220 > saldo=50
    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 200, cepDestino: '20040020' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Saldo insuficiente');
  });

  it('deve retornar 500 se a API de CEP falhar', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 1, valorTotal: 50, cepDestino: '01310100' });

    expect(res.status).toBe(500);
    expect(res.body.erro).toBe('Erro ao calcular frete externo');
  });
});
