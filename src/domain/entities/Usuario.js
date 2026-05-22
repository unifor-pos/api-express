class Usuario {
  constructor({ id, nome, tipo, saldo }) {
    this.id = id;
    this.nome = nome;
    this.tipo = tipo;
    this.saldo = saldo;
  }

  calcularDesconto(valorTotal) {
    if (this.tipo === 'VIP') {
      return valorTotal * 0.90 - 50;
    }
    return valorTotal;
  }

  temSaldo(valor) {
    return this.saldo >= valor;
  }

  debitar(valor) {
    this.saldo -= valor;
  }
}

module.exports = Usuario;
