/**
 * Erro de aplicação tipado.
 *
 * Carrega `statusCode` e `mensagem` para que o errorHandler central
 * traduza em resposta HTTP coerente, sem cada handler precisar montar
 * `res.status(...).json(...)` espalhado.
 */

class AppError extends Error {
  constructor(mensagem, statusCode = 500) {
    super(mensagem);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

module.exports = { AppError };
