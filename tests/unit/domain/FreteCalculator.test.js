const FreteCalculator = require('../../../src/domain/services/FreteCalculator');

describe('FreteCalculator.calcular', () => {
  const calc = new FreteCalculator();

  it('retorna 5 para SP', () => {
    expect(calc.calcular('SP')).toBe(5);
  });

  it('retorna 40 para CE', () => {
    expect(calc.calcular('CE')).toBe(40);
  });

  it('retorna 20 para RJ', () => {
    expect(calc.calcular('RJ')).toBe(20);
  });

  it('retorna 20 para qualquer outro estado', () => {
    expect(calc.calcular('MG')).toBe(20);
    expect(calc.calcular('BA')).toBe(20);
    expect(calc.calcular('AM')).toBe(20);
  });
});
