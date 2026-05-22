const axios = require('axios');

const VIACEP_BASE_URL = 'https://viacep.com.br';

/**
 * Consulta o ViaCEP e retorna os dados do endereço.
 *
 * Encapsula a dependência HTTP externa em um único ponto, permitindo:
 *   - mockar em testes via injeção de dependência (jest.fn)
 *   - interceptar via nock nos testes de integração
 *   - trocar a implementação (fetch, outro provedor) sem tocar nos services
 *
 * @param {string} cep - CEP sem máscara (apenas dígitos)
 * @returns {Promise<{uf?: string, localidade?: string, erro?: boolean}>}
 * @throws {Error} quando o ViaCEP está indisponível ou a requisição falha
 */
async function consultarCep(cep) {
  const response = await axios.get(`${VIACEP_BASE_URL}/ws/${cep}/json/`);
  return response.data;
}

module.exports = { consultarCep, VIACEP_BASE_URL };
