/**
 * Funções puras de precificação — sem I/O, sem efeitos colaterais.
 *
 * Isolando essas regras em um módulo próprio:
 *   - viram trivialmente testáveis (unit tests rápidos, sem mocks)
 *   - podem evoluir sem tocar no controller
 *   - documentam as regras de negócio em um lugar único
 *
 * NOTA: mantém o comportamento atual do app.js (inclusive os bugs de
 * regra de negócio identificados). Os fixes serão feitos em commits
 * subsequentes, separados da refatoração estrutural.
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
 * Comportamento atual: valor * 0.9 - 50 (pode resultar em valor negativo).
 *
 * @param {number} valorTotal
 * @param {string} tipoUsuario
 * @returns {number} valor após desconto
 */
function aplicarDescontoVIP(valorTotal, tipoUsuario) {
  if (tipoUsuario !== TIPO_USUARIO.VIP) {
    return valorTotal;
  }
  const valorComPercentual = valorTotal * (1 - DESCONTO_VIP_PERCENTUAL);
  return valorComPercentual - DESCONTO_VIP_FIXO;
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
