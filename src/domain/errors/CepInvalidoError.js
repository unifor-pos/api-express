class CepInvalidoError extends Error {
  constructor() {
    super('CEP inválido');
    this.name = 'CepInvalidoError';
  }
}

module.exports = CepInvalidoError;
