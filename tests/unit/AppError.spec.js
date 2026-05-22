/**
 * Testes unitários do AppError.
 */

const { AppError } = require('../../src/errors/AppError');

describe('AppError', () => {
  it('herda de Error e expõe name "AppError"', () => {
    const err = new AppError('algo deu errado', 400);

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppError');
  });

  it('carrega mensagem e statusCode', () => {
    const err = new AppError('não encontrado', 404);

    expect(err.message).toBe('não encontrado');
    expect(err.statusCode).toBe(404);
  });

  it('usa statusCode 500 como default quando omitido', () => {
    const err = new AppError('inesperado');

    expect(err.statusCode).toBe(500);
  });
});
