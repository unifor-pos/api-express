const axios = require('axios');
const CepInvalidoError = require('../../domain/errors/CepInvalidoError');

class CepService {
  async buscarUF(cep) {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) {
      throw new CepInvalidoError();
    }
    return response.data.uf;
  }
}

module.exports = CepService;
