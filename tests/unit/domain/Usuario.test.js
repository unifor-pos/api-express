const Usuario = require('../../../src/domain/entities/Usuario');

describe('Usuario.calcularDesconto', () => {
  it('não aplica desconto para NORMAL', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'NORMAL', saldo: 100 });
    expect(u.calcularDesconto(100)).toBe(100);
  });

  it('aplica 10% + R$50 off para VIP', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'VIP', saldo: 100 });
    // 100 * 0.9 - 50 = 40
    expect(u.calcularDesconto(100)).toBe(40);
  });

  it('NORMAL preserva qualquer valor total', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'NORMAL', saldo: 200 });
    expect(u.calcularDesconto(200)).toBe(200);
  });
});

describe('Usuario.temSaldo', () => {
  it('retorna true quando saldo é exatamente igual ao valor', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'NORMAL', saldo: 50 });
    expect(u.temSaldo(50)).toBe(true);
  });

  it('retorna true quando saldo é maior que o valor', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'NORMAL', saldo: 100 });
    expect(u.temSaldo(50)).toBe(true);
  });

  it('retorna false quando saldo é insuficiente', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'NORMAL', saldo: 49 });
    expect(u.temSaldo(50)).toBe(false);
  });
});

describe('Usuario.debitar', () => {
  it('reduz o saldo corretamente', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'NORMAL', saldo: 100 });
    u.debitar(30);
    expect(u.saldo).toBe(70);
  });

  it('saldo chega a zero após débito total', () => {
    const u = new Usuario({ id: 1, nome: 'Test', tipo: 'NORMAL', saldo: 50 });
    u.debitar(50);
    expect(u.saldo).toBe(0);
  });
});
