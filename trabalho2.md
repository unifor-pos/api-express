### Entregáveis Técnicos:

1. **Isolamento de Regras em Funções Específicas (Refatoração):**
   * Extraia as regras de negócio de dentro do *controller* da rota `/pedidos` para módulos independentes (ex: `services/`, `utils/` ou `domain/`).
   * Isole a lógica de cálculo de descontos (Regras VIP e descontos cumulativos).
   * Isole a lógica de cálculo de frete e a chamada ao serviço externo do ViaCEP.
   * Elimine ou mitigue os riscos do estado global compartilhado (`let usuarios`, `let pedidos`) para garantir que os testes possam rodar em paralelo sem interferência mútua.

2. **Testes Unitários com Jest:**
   * Instale e configure o framework **Jest** (`npm install jest --save-dev`).
   * Cubra as funções isoladas (regras de desconto, validações de entrada, cálculo de frete) com testes unitários.
   * Garanta que cenários de borda (*edge cases*) sejam validados (ex: valores negativos, usuários inexistentes, strings vazias).

3. **Testes de Integração com Supertest:**
   * Instale o **Supertest** (`npm install supertest --save-dev`).
   * Crie testes de integração integrados para as rotas HTTP (`POST /pedidos` e `GET /pedidos/:id`).
   * **Mandatório:** Use `jest.mock('axios')` para interceptar as requisições à API do ViaCEP. Seus testes de integração **não podem** fazer requisições reais à internet.
   * Cubra cenários de falha externa (ex: simular a API do ViaCEP fora do ar retornando erro 500, ou retornando o objeto `{ erro: true }`).

---

## Parte 2: Cultura DevOps e Fluxo de Trabalho (Git/GitHub)

A automação só gera valor se estiver integrada ao fluxo de trabalho do time. 

1. **Gestão de Branches e Pull Request (PR):**
   * Crie uma branch específica para o desenvolvimento do seu trabalho (ex: `feature/refactor-and-tests`).
   * Após concluir as alterações e garantir que todos os testes estão passando localmente, suba as modificações e abra um **Pull Request (PR)** direcionado à branch principal (`main`).
   
2. **Relatório de Cobertura de Testes (Coverage):**
   * Execute o gerador de cobertura do Jest utilizando o comando:
     ```bash
     npm test -- --coverage
     ```
   * Na descrição do seu Pull Request, anexe o print ou a tabela textual gerada pelo terminal detalhando as métricas alcançadas:
     * `% Stmts` (Declarações)
     * `% Branch` (Ramificações/Condicionais)
     * `% Funcs` (Funções)
     * `% Lines` (Linhas)
   * *Dica de DevOps:* O objetivo recomendado para este projeto é atingir **no mínimo 85% de cobertura total**.

---

## Parte 3: Defesa Técnica (Apresentação)

Cada grupo/aluno deverá realizar uma apresentação técnica simulando um comitê de arquitetura (*Architecture Review Board*) ou uma *Sprint Review*.

### Requisitos da Apresentação:
* **Suporte Visual:** Utilização de slides (Reveal.js, PowerPoint, etc.).
* **Abordagem Didática:**
  * Apresentar o cenário inicial ("O diagnóstico do Código Deus" — quais eram os principais riscos que vocês identificaram).
  * Demonstrar visualmente a nova estrutura do software (como as responsabilidades foram divididas após a refatoração).
  * **A Defesa:** Defender tecnicamente o porquê de cada intervenção ter sido feita. Explique quais padrões de projeto (*Design Patterns*) ou boas práticas de *Clean Code* foram aplicados e como os testes criados protegem o negócio contra *bugs* em produção.
  * Mostrar os testes rodando com sucesso na esteira e comentar sobre os pontos desafiadores que exigiram o uso de Mocks/Stubs.

---

## Critérios de Avaliação
* **Qualidade do Código Refatorado:** Separação de conceitos, legibilidade e manutenibilidade.
* **Robustez da Suíte de Testes:** Variedade de cenários testados (caminho feliz e fluxos de exceção).
* **Maturidade DevOps:** Uso correto do Git, organização do Pull Request e clareza nos dados de cobertura.
* **Domínio Técnico:** Capacidade de justificar as escolhas arquiteturais durante a defesa oral.
