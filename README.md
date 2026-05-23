# API Express

[![CI](https://github.com/unifor-devops/api-express/actions/workflows/ci.yml/badge.svg)](https://github.com/unifor-devops/api-express/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/unifor-devops/api-express/branch/main/graph/badge.svg)](https://codecov.io/gh/unifor-devops/api-express)

API HTTP de pedidos em Node.js + Express, usada como caso de estudo do
trabalho prático da disciplina **Testes Automatizados e Contínuos** da
Pós-Graduação em **Engenharia de Software com foco em DevOps** (Unifor).

A versão original (commit inicial) era um arquivo `app.js` monolítico
com regras de negócio, integração HTTP e estado global misturados, e
sem testes. Este fork refatora o projeto em camadas testáveis sob a
metodologia **Shift-Left**: characterization tests primeiro, refator
comportamento-preservante depois, fix de bugs ao final — cada fix
acompanhado da virada do teste correspondente.

## Equipe

- Alexandre Morlin
- Daniel Azevedo
- Dheyme Sena
- Rafael Oliveira

## Como rodar

```sh
npm install
npm start       # produção (node index.js)
npm run dev     # desenvolvimento (nodemon)
```

API disponível em <http://localhost:3000>.

## Como testar

```sh
npm test                 # roda toda a suíte (unit + integração)
npm run test:watch       # modo watch
npm run test:coverage    # gera relatório em coverage/index.html
```

### Estado atual da suíte

- **74 testes** em 8 suítes (6 unit + 1 integração + characterization)
- **Cobertura:** 100% statements / 100% branches / 100% functions / 100% lines

## Endpoints

- `GET /pedidos` — lista todos os pedidos
- `GET /pedidos/:id` — busca o pedido pelo id (com nome do cliente)
- `POST /pedidos` — cria um pedido

```json
{
    "usuarioId": 1,
    "valorTotal": 123,
    "cepDestino": "60352590"
}
```

## Arquitetura

```
src/
├── clients/viacep.client.js          integração HTTP externa (axios)
├── services/
│   ├── precificacao.service.js       regras puras (desconto, frete)
│   └── pedidos.service.js            orquestração com Dependency Injection
├── repositories/
│   ├── usuarios.repository.js        factory in-memory
│   └── pedidos.repository.js         factory in-memory com gerador atômico de ID
├── controllers/pedidos.controller.js HTTP only (sem regra de negócio)
├── routes/pedidos.routes.js          mapping Express
├── middlewares/errorHandler.js       tratamento central de erro
└── errors/AppError.js                erro tipado (statusCode + message)
app.js                                bootstrap / composição
index.js                              runtime
tests/
├── integration/                      supertest + nock
└── unit/                             jest.fn() para DI mockada
```

## Stack de testes

- **Jest 29** — runner e assertions
- **supertest 7** — invocação HTTP do `app` Express sem subir servidor real
- **nock 13** — interceptação HTTP para isolar a integração com ViaCEP

## Princípios aplicados

- **Shift-Left** — testes (incluindo `[BUG]`) escritos antes da refatoração, congelando o comportamento atual antes de mexer no código
- **Design para Testabilidade** — separação em camadas, factories nos repos, Dependency Injection no service
- **Isolamento de Dependências** — `nock` na integração, `jest.fn()` na unit
- **Métricas de Qualidade** — `jest --coverage` com lines/branches/functions/statements
