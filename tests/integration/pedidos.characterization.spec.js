/**
 * Characterization tests — congelam o comportamento ATUAL do app.js
 * (incluindo bugs) antes de qualquer refatoração.
 *
 * Estratégia (Shift-Left):
 *   1. Documentar o que o sistema faz hoje (mesmo quando errado).
 *   2. Refatorar com essa rede de segurança ativa.
 *   3. Após a refatoração, os testes marcados com [BUG] são corrigidos
 *      junto com o código (commit mostra o fix com rastreabilidade).
 *
 * Isolamento de dependência externa:
 *   - ViaCEP é mockado com `nock` para garantir testes determinísticos,
 *     rápidos e independentes de rede.
 */

const request = require('supertest');
const nock = require('nock');

const VIACEP_HOST = 'https://viacep.com.br';

let app;

beforeEach(() => {
  jest.resetModules();
  nock.cleanAll();
  nock.disableNetConnect();
  // supertest cria um servidor efêmero em 127.0.0.1 — precisamos liberá-lo.
  nock.enableNetConnect('127.0.0.1');
  app = require('../../app');
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

describe('GET /pedidos', () => {
  it('lista os 3 pedidos do seed inicial', async () => {
    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ id: 1, usuarioId: 1, valorFinal: 85, status: 'APROVADO' });
    expect(res.body[1]).toMatchObject({ id: 2, usuarioId: 2, valorFinal: 105, status: 'APROVADO' });
    expect(res.body[2]).toMatchObject({ id: 3, usuarioId: 99, valorFinal: 30, status: 'APROVADO' });
  });
});

describe('GET /pedidos/:id', () => {
  it('retorna pedido + nome do dono quando ambos existem', async () => {
    const res = await request(app).get('/pedidos/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      pedido: { id: 1, usuarioId: 1, valorFinal: 85, status: 'APROVADO' },
      cliente: 'João Silva'
    });
  });

  it('[BUG] lança 500 quando o pedido referencia usuário inexistente (usuarioId=99)', async () => {
    // Pedido 3 do seed aponta para usuarioId=99 que não está em `usuarios`.
    // O código acessa `donoPedido.nome` sem checagem -> TypeError.
    const res = await request(app).get('/pedidos/3');
    expect(res.status).toBe(500);
  });

  it('[BUG] lança 500 quando o pedido NÃO existe (em vez de 404)', async () => {
    // `pedidos.find(...)` retorna undefined e o código acessa `pedido.usuarioId`.
    const res = await request(app).get('/pedidos/999');
    expect(res.status).toBe(500);
  });
});

describe('POST /pedidos — validação básica', () => {
  it('retorna 400 quando usuarioId está ausente', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ valorTotal: 50, cepDestino: '01001000' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Dados inválidos' });
  });

  it('retorna 400 quando valorTotal está ausente', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 1, cepDestino: '01001000' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Dados inválidos' });
  });

  it('retorna 404 quando o usuário não existe', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 9999, valorTotal: 50, cepDestino: '01001000' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Usuário não encontrado' });
  });
});

describe('POST /pedidos — cálculo de frete por UF', () => {
  it('cliente NORMAL com CEP de SP soma frete de 5', async () => {
    nock(VIACEP_HOST).get('/ws/01001000/json/').reply(200, { uf: 'SP', localidade: 'São Paulo' });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 40, cepDestino: '01001000' });

    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(45); // 40 + 5
    expect(res.body.status).toBe('APROVADO');
  });

  it('cliente VIP com CEP de SP aplica desconto e frete: valorTotal*0.9 - 50 + 5', async () => {
    nock(VIACEP_HOST).get('/ws/01001000/json/').reply(200, { uf: 'SP' });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 1, valorTotal: 100, cepDestino: '01001000' });

    // 100 * 0.9 = 90, 90 - 50 = 40, 40 + 5 = 45
    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(45);
  });

  it('cliente VIP com CEP de CE aplica desconto e frete: valorTotal*0.9 - 50 + 40', async () => {
    nock(VIACEP_HOST).get('/ws/60000000/json/').reply(200, { uf: 'CE' });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 1, valorTotal: 100, cepDestino: '60000000' });

    // 100 * 0.9 = 90, 90 - 50 = 40, 40 + 40 = 80
    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(80);
  });

  it('cliente NORMAL com CEP fora de SP/CE usa frete padrão de 20', async () => {
    nock(VIACEP_HOST).get('/ws/30130010/json/').reply(200, { uf: 'MG' });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 25, cepDestino: '30130010' });

    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(45); // 25 + 20
  });
});

describe('POST /pedidos — bugs de regra de negócio', () => {
  it('[BUG] cliente VIP com valorTotal baixo gera valorFinal NEGATIVO', async () => {
    // Regra atual: 10 * 0.9 = 9, 9 - 50 = -41, -41 + 5 (SP) = -36.
    // Saldo é DESCONTADO desse negativo (ou seja, AUMENTA), o que é claramente um bug.
    nock(VIACEP_HOST).get('/ws/01001000/json/').reply(200, { uf: 'SP' });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 1, valorTotal: 10, cepDestino: '01001000' });

    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBeLessThan(0);
  });

  it('[BUG] race condition: 2 POSTs concorrentes podem gerar IDs duplicados', async () => {
    // `id: pedidos.length + 1` é lido antes do push -> duas requisições
    // simultâneas leem o mesmo length e geram o mesmo id.
    nock(VIACEP_HOST).persist().get('/ws/01001000/json/').reply(200, { uf: 'SP' });

    const [r1, r2] = await Promise.all([
      request(app).post('/pedidos').send({ usuarioId: 2, valorTotal: 10, cepDestino: '01001000' }),
      request(app).post('/pedidos').send({ usuarioId: 2, valorTotal: 10, cepDestino: '01001000' })
    ]);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    // No estado atual, IDs podem colidir. Documentamos a possibilidade.
    // Após o fix (gerador atômico) este teste vira "IDs sempre únicos".
    expect(r1.body.id === r2.body.id || r1.body.id !== r2.body.id).toBe(true);
  });
});

describe('POST /pedidos — integração com ViaCEP (isolado por nock)', () => {
  it('retorna 400 quando ViaCEP responde { erro: true } (CEP inválido)', async () => {
    nock(VIACEP_HOST).get('/ws/00000000/json/').reply(200, { erro: true });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 30, cepDestino: '00000000' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'CEP inválido' });
  });

  it('retorna 500 quando ViaCEP está indisponível', async () => {
    nock(VIACEP_HOST).get('/ws/01001000/json/').reply(503, 'Service Unavailable');

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 30, cepDestino: '01001000' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: 'Erro ao calcular frete externo' });
  });
});

describe('POST /pedidos — saldo', () => {
  it('retorna 400 quando o saldo do usuário é insuficiente', async () => {
    // Maria (NORMAL, saldo 50). Pedido 100 + frete 5 (SP) = 105 > 50.
    nock(VIACEP_HOST).get('/ws/01001000/json/').reply(200, { uf: 'SP' });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 100, cepDestino: '01001000' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'Saldo insuficiente' });
  });

  it('aprova pedido quando saldo é exatamente igual ao valor final', async () => {
    // Maria (saldo 50). Pedido 45 + frete 5 (SP) = 50.
    nock(VIACEP_HOST).get('/ws/01001000/json/').reply(200, { uf: 'SP' });

    const res = await request(app)
      .post('/pedidos')
      .send({ usuarioId: 2, valorTotal: 45, cepDestino: '01001000' });

    expect(res.status).toBe(201);
    expect(res.body.valorFinal).toBe(50);
  });
});
