const AppError = require('../errors/AppError');

function errorHandler(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ erro: error.message });
  }

  console.error(error);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = errorHandler;
