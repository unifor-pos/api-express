const request = require('supertest');
const axios = require('axios');
const app = require('./app');
jest.mock('axios');

describe('Testes da API de Pedidos', () => {
  beforeEach(() => {
    if (app.resetState) {
      app.resetState();
    }
    jest.clearAllMocks();
  });

  describe('GET /pedidos', () => {
    it('deve retornar a lista de pedidos com status 200', async () => {
      const response = await request(app).get('/pedidos');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /pedidos', () => {
    it('deve retornar erro 400 se faltarem dados (usuarioId ou valorTotal)', async () => {
      const response = await request(app).post('/pedidos').send({
        usuarioId: 1
      });

      expect(response.status).toBe(400);
      expect(response.body.erro).toBe('Dados inválidos');
    });

    it('deve retornar erro 404 se usuário não for encontrado', async () => {
      const response = await request(app).post('/pedidos').send({
        usuarioId: 999,
        valorTotal: 50,
        cepDestino: '00000000'
      });

      expect(response.status).toBe(404);
      expect(response.body.erro).toBe('Usuário não encontrado');
    });

    it('deve retornar erro 400 se CEP for inválido segundo o ViaCEP', async () => {
      axios.get.mockResolvedValueOnce({ data: { erro: true } });

      const response = await request(app).post('/pedidos').send({
        usuarioId: 1,
        valorTotal: 50,
        cepDestino: '11111111'
      });

      expect(response.status).toBe(400);
      expect(response.body.erro).toBe('CEP inválido');
    });

    it('deve retornar erro 500 se ocorrer um erro ao consultar o ViaCEP', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app).post('/pedidos').send({
        usuarioId: 1,
        valorTotal: 50,
        cepDestino: '01001000'
      });

      expect(response.status).toBe(500);
      expect(response.body.erro).toBe('Erro ao calcular frete externo');
    });

    it('deve retornar erro 400 se usuário não tiver saldo suficiente', async () => {
      axios.get.mockResolvedValueOnce({ data: { uf: 'SP' } });

      const response = await request(app).post('/pedidos').send({
        usuarioId: 2,
        valorTotal: 100, // 100 + 5 frete = 105
        cepDestino: '01001000'
      });

      expect(response.status).toBe(400);
      expect(response.body.erro).toBe('Saldo insuficiente');
    });

    it('deve processar o pedido com sucesso para usuário VIP com desconto (CEP de SP)', async () => {
      // Usuário 1: VIP, Saldo 100
      // Valor Total: 100 -> VIP = (100 * 0.9) - 50 = 40.
      // Frete SP: 5 -> Valor Final = 45.
      // Saldo final do usuario: 100 - 45 = 55.

      axios.get.mockResolvedValueOnce({ data: { uf: 'SP' } });

      const response = await request(app).post('/pedidos').send({
        usuarioId: 1,
        valorTotal: 100,
        cepDestino: '01001000'
      });

      expect(response.status).toBe(201);
      expect(response.body.valorFinal).toBe(45);
      expect(response.body.status).toBe('APROVADO');
      expect(response.body.usuarioId).toBe(1);
      expect(response.body.id).toBeDefined();
    });

    it('deve processar o pedido com sucesso para usuário NORMAL com frete do CE', async () => {
      // Usuário 2: NORMAL, Saldo 50
      // Valor Total: 10 -> sem desconto
      // Frete CE: 40 -> Valor Final = 50.
      // Saldo final: 50 - 50 = 0.

      axios.get.mockResolvedValueOnce({ data: { uf: 'CE' } });

      const response = await request(app).post('/pedidos').send({
        usuarioId: 2,
        valorTotal: 10,
        cepDestino: '60000000'
      });

      expect(response.status).toBe(201);
      expect(response.body.valorFinal).toBe(50);
      expect(response.body.status).toBe('APROVADO');
    });

    it('deve aplicar frete padrão (R$ 20) para outros estados', async () => {
      // Usuário 2: NORMAL, Saldo 50
      // Valor Total: 20 -> sem desconto
      // Frete RJ (padrão): 20 -> Valor Final = 40.
      // Saldo final: 50 - 40 = 10.

      axios.get.mockResolvedValueOnce({ data: { uf: 'RJ' } });

      const response = await request(app).post('/pedidos').send({
        usuarioId: 2,
        valorTotal: 20,
        cepDestino: '20000000'
      });

      expect(response.status).toBe(201);
      expect(response.body.valorFinal).toBe(40);
    });
  });

  describe('GET /pedidos/:id', () => {
    it('deve retornar detalhes do pedido e o cliente quando existir', async () => {
      // O seed inicial tem o pedido 1 com usuario 1 (João Silva)
      const response = await request(app).get('/pedidos/1');

      expect(response.status).toBe(200);
      expect(response.body.pedido.id).toBe(1);
      expect(response.body.cliente).toBe('João Silva');
    });

    it('deve retornar cliente Desconhecido se o dono do pedido nao for achado no array de usuarios', async () => {
      // O pedido 3 inicial tem usuarioId: 99 que nao existe na base
      const response = await request(app).get('/pedidos/3');

      expect(response.status).toBe(200);
      expect(response.body.pedido.id).toBe(3);
      expect(response.body.cliente).toBe('Desconhecido');
    });

    it('deve retornar erro 404 se o pedido não existir', async () => {
      const response = await request(app).get('/pedidos/999');

      expect(response.status).toBe(404);
      expect(response.body.erro).toBe('Pedido não encontrado');
    });
  });
});
