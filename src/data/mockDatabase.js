const INITIAL_DATA = {
  usuarios: [
    { id: 1, nome: 'João Silva', tipo: 'VIP', saldo: 100 },
    { id: 2, nome: 'Maria Souza', tipo: 'NORMAL', saldo: 50 }
  ],
  pedidos: [
    { id: 1, usuarioId: 1, valorFinal: 85.0, status: 'APROVADO' },
    { id: 2, usuarioId: 2, valorFinal: 105.0, status: 'APROVADO' },
    { id: 3, usuarioId: 99, valorFinal: 30.0, status: 'APROVADO' }
  ]
};

function cloneEntries(entries) {
  return entries.map((entry) => ({ ...entry }));
}

function createMockDatabase() {
  return {
    usuarios: cloneEntries(INITIAL_DATA.usuarios),
    pedidos: cloneEntries(INITIAL_DATA.pedidos)
  };
}

module.exports = createMockDatabase;
