/**
 * Testes unitários do cliente ViaCEP.
 *
 * Usa nock para interceptar o HTTP antes de sair da máquina — nenhum
 * teste depende de rede, latência ou disponibilidade do serviço real.
 */

const nock = require('nock');
const { consultarCep, VIACEP_BASE_URL } = require('../../src/clients/viacep.client');

beforeEach(() => {
  nock.cleanAll();
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

describe('consultarCep', () => {
  it('retorna o payload do ViaCEP quando o CEP é válido', async () => {
    nock(VIACEP_BASE_URL)
      .get('/ws/01001000/json/')
      .reply(200, { cep: '01001-000', uf: 'SP', localidade: 'São Paulo' });

    const r = await consultarCep('01001000');

    expect(r).toEqual({ cep: '01001-000', uf: 'SP', localidade: 'São Paulo' });
  });

  it('retorna { erro: true } quando o ViaCEP indica CEP inválido', async () => {
    nock(VIACEP_BASE_URL)
      .get('/ws/00000000/json/')
      .reply(200, { erro: true });

    const r = await consultarCep('00000000');

    expect(r).toEqual({ erro: true });
  });

  it('lança erro quando o ViaCEP responde 5xx', async () => {
    nock(VIACEP_BASE_URL)
      .get('/ws/01001000/json/')
      .reply(503, 'Service Unavailable');

    await expect(consultarCep('01001000')).rejects.toThrow();
  });

  it('lança erro quando a rede falha', async () => {
    nock(VIACEP_BASE_URL)
      .get('/ws/01001000/json/')
      .replyWithError('ECONNREFUSED');

    await expect(consultarCep('01001000')).rejects.toThrow();
  });

  it('monta a URL com o CEP recebido (sem máscara, sem normalização)', async () => {
    const scope = nock(VIACEP_BASE_URL)
      .get('/ws/60000000/json/')
      .reply(200, { uf: 'CE' });

    await consultarCep('60000000');

    expect(scope.isDone()).toBe(true);
  });
});
