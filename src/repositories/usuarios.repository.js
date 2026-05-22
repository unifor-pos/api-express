/**
 * Repositório de usuários — abstração da persistência.
 *
 * Implementação atual: em memória, com seed inicial.
 * Substituível por banco de dados sem impactar services/controllers,
 * desde que mantenha a mesma interface pública.
 *
 * Exporta uma FACTORY para que cada execução de teste (ou cada deploy)
 * comece com estado limpo, isolado.
 */

const SEED_USUARIOS = Object.freeze([
  Object.freeze({ id: 1, nome: 'João Silva', tipo: 'VIP', saldo: 100 }),
  Object.freeze({ id: 2, nome: 'Maria Souza', tipo: 'NORMAL', saldo: 50 })
]);

function createUsuariosRepository(seed = SEED_USUARIOS) {
  const usuarios = seed.map(u => ({ ...u }));

  return {
    buscarPorId(id) {
      return usuarios.find(u => u.id === id);
    },
    listarTodos() {
      return usuarios.map(u => ({ ...u }));
    },
    debitarSaldo(id, valor) {
      const usuario = usuarios.find(u => u.id === id);
      if (!usuario) return null;
      usuario.saldo -= valor;
      return usuario;
    }
  };
}

module.exports = { createUsuariosRepository, SEED_USUARIOS };
