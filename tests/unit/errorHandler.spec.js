/**
 * Testes unitários do errorHandler central.
 */

const { errorHandler } = require('../../src/middlewares/errorHandler');
const { AppError } = require('../../src/errors/AppError');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('AppError: traduz statusCode e mensagem na resposta', () => {
    const res = makeRes();
    const err = new AppError('Pedido não encontrado', 404);

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Pedido não encontrado' });
  });

  it('erro genérico (não-AppError): retorna 500 com mensagem sanitizada', () => {
    const res = makeRes();
    const err = new Error('detalhe interno que não deve vazar');

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
  });
});
