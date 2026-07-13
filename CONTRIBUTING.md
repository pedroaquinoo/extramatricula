# Contribuindo

Contribuições de estudantes são especialmente bem-vindas, inclusive as primeiras contribuições em open source de alguém. Se você travar, abra a PR mesmo assim e a gente revisa junto.

Para mudanças grandes, abra uma issue antes de codar. Vale alinhar a abordagem antes de você gastar um fim de semana nela.

## Setup

O passo a passo está no [README](README.md#rodando-localmente). Duas armadilhas comuns: use `pnpm` (não `npm`), e o dev server sobe em `https://localhost:3000`, não `http`.

## O que você precisa saber antes da primeira PR

- **Tudo é estático.** Grade e oferta vivem em `data/` como JSON commitado. Não há banco nem API.
- **O estado do usuário é local.** Curso selecionado e disciplinas cursadas ficam no `localStorage` ([lib/store.ts](lib/store.ts)).
- **Não edite `components/ui/`**: é shadcn/ui gerado. Componentes de domínio vão em `components/extra/`.
- **A UI é 100% em português.** Toda string voltada ao usuário é pt-BR; código, nomes de variáveis, commits e comentários são em inglês.
- **Rode `pnpm lint` antes de commitar.** A formatação é automática (Prettier); diff de formatação misturado com diff de lógica é difícil de revisar.

## Atualizando a oferta do semestre

A manutenção recorrente mais importante do projeto, e um ótimo primeiro PR.

1. Faça a ingestão do PDF da oferta (manual ou via `scripts/ingest/`).
2. Rode `pnpm ingest 2026/1 controle-automacao ./caminho/para/oferta.json` (veja [`scripts/ingest/how-to-ingest.md`](scripts/ingest/how-to-ingest.md)).
3. Adicione o import do novo arquivo ao mapa `offersByTermAndOfferId` em [lib/offers.ts](lib/offers.ts).
4. Atualize `current` em [`data/offers/index.json`](data/offers/index.json) se este for o semestre ativo.
5. Confira o formato contra o snapshot anterior: mesmas chaves, mesmos tipos, mesma convenção de horário. Turmas com código prefixado por `P` são práticas/laboratórios.
6. Rode `pnpm build` e teste a simulação no app.

Se você automatizar a ingestão da oferta, seria uma contribuição excelente.

## Adicionando um novo curso

Hoje o app cobre apenas Eng. de Controle e Automação (diurno e noturno). Adicionar outros cursos é a maior expansão possível do projeto.

<!-- TODO: documentar o processo: de onde sai a grade, formato esperado do JSON
     em data/curriculum/, como registrar o curso em index.json, e como as cadeias de
     pré-requisitos são representadas. -->

_Processo ainda não documentado._ Se você quer adicionar o seu curso, abra uma issue e a gente escreve esta seção junto com você.

## Pull Requests

- Faça um fork, crie uma branch e abra a PR contra a `main`.
- Descreva **o que mudou e por quê**. Se for visual, inclua um print ou GIF.
- Confirme que `pnpm lint` e `pnpm build` passam, e teste na mão o fluxo que você mudou.
- PRs pequenas e focadas são revisadas muito mais rápido.

Nunca commite `.env.local`, credenciais ou dados reais de estudantes. Se achar que encontrou uma vulnerabilidade, não abra issue pública. Veja a [seção de segurança do README](README.md#segurança).

Ao contribuir, você concorda que seu código será licenciado sob a [AGPL-3.0](LICENSE).
