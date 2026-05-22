class UsuarioRepository {
  constructor(database) {
    this.database = database;
  }

  findById(id) {
    return this.database.usuarios.find((usuario) => usuario.id === Number(id));
  }

  debitBalance(id, amount) {
    const usuario = this.findById(id);

    if (!usuario) {
      return null;
    }

    usuario.saldo -= amount;
    return usuario;
  }
}

module.exports = UsuarioRepository;
