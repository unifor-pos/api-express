/**
 * Testes unitários do usuarios.repository.
 *
 * Como a factory é a unidade testada, cada `it` cria a sua instância —
 * o isolamento é parte do contrato que estamos verificando.
 */

const {
  createUsuariosRepository,
  SEED_USUARIOS
} = require('../../src/repositories/usuarios.repository');

describe('createUsuariosRepository — seed default', () => {
  it('expõe os usuários do seed inicial', () => {
    const repo = createUsuariosRepository();

    expect(repo.buscarPorId(1)).toMatchObject({ id: 1, nome: 'João Silva', tipo: 'VIP' });
    expect(repo.buscarPorId(2)).toMatchObject({ id: 2, nome: 'Maria Souza', tipo: 'NORMAL' });
  });

  it('aceita um seed customizado', () => {
    const seed = [{ id: 7, nome: 'Custom', tipo: 'NORMAL', saldo: 999 }];
    const repo = createUsuariosRepository(seed);

    expect(repo.buscarPorId(7)).toMatchObject({ id: 7, nome: 'Custom', saldo: 999 });
    expect(repo.buscarPorId(1)).toBeUndefined();
  });

  it('isola instâncias: mutação em uma não afeta a outra', () => {
    const a = createUsuariosRepository();
    const b = createUsuariosRepository();

    a.debitarSaldo(1, 50);

    expect(a.buscarPorId(1).saldo).toBe(50);
    expect(b.buscarPorId(1).saldo).toBe(100);
  });

  it('não muta o seed original (preserva imutabilidade do Object.freeze)', () => {
    const repo = createUsuariosRepository();

    repo.debitarSaldo(1, 50);

    expect(SEED_USUARIOS[0].saldo).toBe(100);
  });
});

describe('buscarPorId', () => {
  it('retorna o usuário quando o id existe', () => {
    const repo = createUsuariosRepository();
    expect(repo.buscarPorId(1)).toBeDefined();
  });

  it('retorna undefined quando o id não existe', () => {
    const repo = createUsuariosRepository();
    expect(repo.buscarPorId(999)).toBeUndefined();
  });

  it('usa comparação estrita: string "1" não bate em id numérico 1', () => {
    const repo = createUsuariosRepository();
    expect(repo.buscarPorId('1')).toBeUndefined();
  });
});

describe('listarTodos', () => {
  it('retorna todos os usuários', () => {
    const repo = createUsuariosRepository();
    expect(repo.listarTodos()).toHaveLength(2);
  });

  it('retorna cópias — mutação no resultado não afeta o estado interno', () => {
    const repo = createUsuariosRepository();
    const lista = repo.listarTodos();
    lista[0].saldo = -999;

    expect(repo.buscarPorId(1).saldo).toBe(100);
  });
});

describe('debitarSaldo', () => {
  it('decrementa o saldo e retorna o usuário atualizado', () => {
    const repo = createUsuariosRepository();

    const r = repo.debitarSaldo(1, 30);

    expect(r.saldo).toBe(70);
    expect(repo.buscarPorId(1).saldo).toBe(70);
  });

  it('aceita débitos sucessivos', () => {
    const repo = createUsuariosRepository();

    repo.debitarSaldo(2, 10);
    repo.debitarSaldo(2, 20);

    expect(repo.buscarPorId(2).saldo).toBe(20);
  });

  it('retorna null quando o usuário não existe', () => {
    const repo = createUsuariosRepository();
    expect(repo.debitarSaldo(999, 10)).toBeNull();
  });
});
