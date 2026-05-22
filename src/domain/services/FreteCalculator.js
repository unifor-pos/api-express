class FreteCalculator {
  calcular(uf) {
    if (uf === 'SP') return 5;
    if (uf === 'CE') return 40;
    return 20;
  }
}

module.exports = FreteCalculator;
