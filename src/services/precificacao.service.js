/**
 * Funções puras de precificação — sem I/O, sem efeitos colaterais.
 *
 * Isolando essas regras em um módulo próprio:
 *   - viram trivialmente testáveis (unit tests rápidos, sem mocks)
 *   - podem evoluir sem tocar no controller
 *   - documentam as regras de negócio em um lugar único
 */

const TIPO_USUARIO = Object.freeze({
  VIP: 'VIP',
  NORMAL: 'NORMAL'
});

const FRETE_POR_UF = Object.freeze({
  SP: 5,
  CE: 40
});

const FRETE_PADRAO = 20;
const DESCONTO_VIP_PERCENTUAL = 0.10;
const DESCONTO_VIP_FIXO = 50;

/**
 * Aplica desconto VIP sobre o valor total quando o usuário é VIP.
 * Regra: valor * (1 - 10%) - 50, com piso em 0 para evitar subtotal negativo.
 *
 * @param {number} valorTotal
 * @param {string} tipoUsuario
 * @returns {number} valor após desconto (>= 0)
 */
function aplicarDescontoVIP(valorTotal, tipoUsuario) {
  if (tipoUsuario !== TIPO_USUARIO.VIP) {
    return valorTotal;
  }
  const valorComPercentual = valorTotal * (1 - DESCONTO_VIP_PERCENTUAL);
  return Math.max(0, valorComPercentual - DESCONTO_VIP_FIXO);
}

/**
 * Calcula o frete com base na UF de destino.
 *
 * @param {string} uf - sigla da unidade federativa (ex.: "SP", "CE")
 * @returns {number} valor do frete
 */
function calcularFrete(uf) {
  if (Object.prototype.hasOwnProperty.call(FRETE_POR_UF, uf)) {
    return FRETE_POR_UF[uf];
  }
  return FRETE_PADRAO;
}

module.exports = {
  aplicarDescontoVIP,
  calcularFrete,
  TIPO_USUARIO,
  FRETE_POR_UF,
  FRETE_PADRAO
};
