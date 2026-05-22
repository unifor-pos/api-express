const Usuario = require('../../domain/entities/Usuario');

const INITIAL_DATA = [
  { id: 1, nome: 'João Silva', tipo: 'VIP', saldo: 100 },
  { id: 2, nome: 'Maria Souza', tipo: 'NORMAL', saldo: 50 },
];

class UsuarioRepositoryInMemory {
  constructor() {
    this.usuarios = INITIAL_DATA.map(u => new Usuario({ ...u }));
  }

  findById(id) {
    return this.usuarios.find(u => u.id === id) || null;
  }

  save(usuario) {
    const index = this.usuarios.findIndex(u => u.id === usuario.id);
    if (index >= 0) {
      this.usuarios[index] = usuario;
    } else {
      this.usuarios.push(usuario);
    }
  }
}

module.exports = UsuarioRepositoryInMemory;
