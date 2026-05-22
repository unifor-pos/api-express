/**
 * Middleware central de erro.
 *
 * Combate o anti-padrão "tratamento de erro espalhado/inexistente":
 *   - AppError -> traduz `statusCode` e `mensagem` automaticamente
 *   - Erro inesperado -> 500 com mensagem genérica, sem vazar stack
 *
 * Registrar SEMPRE como último `app.use(...)` no bootstrap.
 */

const { AppError } = require('../errors/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { errorHandler };
