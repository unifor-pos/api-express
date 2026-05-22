const axios = require('axios');

class CepClient {
  constructor({ httpClient = axios } = {}) {
    this.httpClient = httpClient;
  }

  async findByCep(cep) {
    const { data } = await this.httpClient.get(`https://viacep.com.br/ws/${cep}/json/`);
    return data;
  }
}

module.exports = CepClient;
