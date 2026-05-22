# API Express

### Como rodar

1. Instale os pacotes
```sh
npm install
```

2. Suba o servidor
```sh
npx nodemon
```

Pronto, API rodando em <http://localhost:3000>

### Como testar
```sh
npm test
npm run test:coverage
```

Os scripts usam o padrão `tests/**/*.test.js` para executar todos os testes unitários e de integração.

### Estrutura
```txt
src/
  clients/
  controllers/
  data/
  middlewares/
  repositories/
  routes/
  services/
tests/
  helpers/
  integration/
  unit/
```

### Endpoints
- `GET /pedidos` (listar os pedidos)
- `GET /pedidos/:id` (buscar dados de um pedido)
- `POST /pedidos` (cadastrar pedido)
```json
{
    "usuarioId": 1, 
    "valorTotal": 123, 
    "cepDestino": "60352590"
}
```
