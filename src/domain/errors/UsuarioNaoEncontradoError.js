class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super('Usuário não encontrado');
    this.name = 'UsuarioNaoEncontradoError';
  }
}

module.exports = UsuarioNaoEncontradoError;
