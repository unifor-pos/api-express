/**
 * Testes unitários do módulo de precificação.
 *
 * Por que aqui não há mocks: as funções são PURAS — recebem entrada,
 * retornam saída, sem I/O nem estado. Esse é o ganho de isolar regras
 * de negócio em um módulo dedicado: o teste fica trivial e rápido.
 */

const {
  aplicarDescontoVIP,
  calcularFrete,
  TIPO_USUARIO,
  FRETE_POR_UF,
  FRETE_PADRAO
} = require('../../src/services/precificacao.service');

describe('aplicarDescontoVIP', () => {
  it('cliente NORMAL: retorna o valor original sem desconto', () => {
    expect(aplicarDescontoVIP(100, TIPO_USUARIO.NORMAL)).toBe(100);
  });

  it('tipo desconhecido: trata como NORMAL e devolve valor original', () => {
    expect(aplicarDescontoVIP(100, 'PREMIUM')).toBe(100);
    expect(aplicarDescontoVIP(100, undefined)).toBe(100);
  });

  it('cliente VIP: aplica 10% de desconto e abate 50 fixos', () => {
    // 200 * 0.9 = 180; 180 - 50 = 130
    expect(aplicarDescontoVIP(200, TIPO_USUARIO.VIP)).toBe(130);
  });

  it('cliente VIP com valor que ficaria negativo: piso = 0 (fix do Bug #4)', () => {
    // 10 * 0.9 = 9; 9 - 50 = -41 -> max(0, -41) = 0
    expect(aplicarDescontoVIP(10, TIPO_USUARIO.VIP)).toBe(0);
  });

  it('cliente VIP no ponto de equilíbrio (~55.55): piso ainda em 0', () => {
    // 55.55 * 0.9 ≈ 49.995; - 50 ≈ -0.005 -> max(0, ...) = 0
    expect(aplicarDescontoVIP(55.55, TIPO_USUARIO.VIP)).toBe(0);
  });

  it('cliente VIP com valorTotal 0: resultado 0 (não negativo)', () => {
    expect(aplicarDescontoVIP(0, TIPO_USUARIO.VIP)).toBe(0);
  });
});

describe('calcularFrete', () => {
  it('UF mapeada (SP): retorna o frete específico', () => {
    expect(calcularFrete('SP')).toBe(FRETE_POR_UF.SP);
    expect(calcularFrete('SP')).toBe(5);
  });

  it('UF mapeada (CE): retorna o frete específico', () => {
    expect(calcularFrete('CE')).toBe(FRETE_POR_UF.CE);
    expect(calcularFrete('CE')).toBe(40);
  });

  it('UF não mapeada (MG): retorna o frete padrão', () => {
    expect(calcularFrete('MG')).toBe(FRETE_PADRAO);
    expect(calcularFrete('MG')).toBe(20);
  });

  it('UF undefined: retorna o frete padrão (sem lançar)', () => {
    expect(calcularFrete(undefined)).toBe(FRETE_PADRAO);
  });

  it('UF string vazia: retorna o frete padrão', () => {
    expect(calcularFrete('')).toBe(FRETE_PADRAO);
  });
});
