class SaldoInsuficienteError extends Error {
  constructor() {
    super('Saldo insuficiente');
    this.name = 'SaldoInsuficienteError';
  }
}

module.exports = SaldoInsuficienteError;
