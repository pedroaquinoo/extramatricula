# Como importar a oferta do semestre

Guia rápido para atualizar `data/offers/` com a oferta do semestre.

## O que você precisa

- Node.js 20+ e `pnpm install` já rodado no repo
- O `offerId` do curso registrado em [`data/curriculum/index.json`](../../data/curriculum/index.json) (veja abaixo se o curso ainda não existir)
- A oferta do semestre, em um destes formatos:
  - **PDF** — relatório *Mapa de oferta por curso* (recomendado)
  - **JSON** — snapshot já no formato do app

Diurno e noturno do mesmo curso compartilham um `offerId` (ex.: `controle-automacao`). A grade curricular continua separada por turno.

## Grade curricular a partir do PDF

Exporte o *Relatório de percurso curricular* do turno desejado. Cada PDF cobre um único turno (diurno ou noturno).

```bash
pnpm ingest-curriculum eng-producao-diurno ./curriculum.pdf --offer-id eng-producao
```

O script extrai apenas as disciplinas **obrigatórias** de cada período e ignora a seção de optativas abaixo. Também detecta o nome do curso e o turno a partir da primeira página.

O comando grava `data/curriculum/<courseId>.json`, atualiza [`data/curriculum/index.json`](../../data/curriculum/index.json) e registra o import em [`lib/curriculum.ts`](../../lib/curriculum.ts) automaticamente.

Só então o `pnpm ingest` de ofertas passa a aceitar o `offerId` correspondente.

## Opção A: a partir do PDF

Exporte o *Mapa de oferta por curso* do curso desejado. Depois rode:

```bash
pnpm ingest 2026/2 controle-automacao ./mapa.pdf
```

Vários PDFs do **mesmo** curso podem ser mesclados numa única execução:

```bash
pnpm ingest 2026/2 controle-automacao ./parte1.pdf ./parte2.pdf
```

O script parseia os PDFs, remove duplicatas por `(course_id, availabilityCode)`, anonimiza nomes de professores e grava em `data/offers/2026-2/controle-automacao.json`.

## Opção B: a partir de JSON

```bash
pnpm ingest 2026/2 controle-automacao ./caminho/para/oferta.json
```

Não misture PDF e JSON na mesma execução. Importações JSON também passam pela anonimização de nomes.

## Depois do `pnpm ingest`

O comando grava o JSON, atualiza `terms` e `programsByTerm` em `data/offers/index.json` e registra o import em [`lib/offers.ts`](../../lib/offers.ts) automaticamente. Para ativar o semestre no app, defina o termo atual em [`data/offers/index.json`](../../data/offers/index.json), se necessário:

```json
{
  "current": "2026/2",
  "terms": ["2025/2", "2026/2"],
  "programsByTerm": {
    "2025/2": ["controle-automacao"],
    "2026/2": ["controle-automacao"]
  }
}
```

Depois disso:

1. **Validar** — compare com o semestre anterior:
   - mesmas chaves (`course_id`, `name`, `availabilityCode`, `spots`, `times`, `teachers`)
   - horários no padrão `HH:MM` e dias por extenso (`Segunda`, `Terca`, …)
   - turmas com código começando em `P` são práticas/laboratórios

2. **Testar localmente:**

```bash
pnpm build
pnpm dev
```

Abra `/simulation` e confira algumas turmas contra o PDF original.

## Formato de cada turma

```json
{
  "course_id": "DCC011",
  "name": "INTRODUÇÃO A BANCO DE DADOS",
  "availabilityCode": "TB",
  "spots": 65,
  "times": [
    { "day": "Segunda", "start": "09:25", "end": "11:05" }
  ],
  "teachers": ["Francisco V. B."]
}
```

Nomes de professores são gravados como primeiro nome + iniciais (ex.: `Francisco V. B.`). Matrículas numéricas são descartadas automaticamente.

`course_id` aqui é o **código da disciplina** (DCC011), não o id do curso no app.

## Problemas comuns

| Sintoma | O que checar |
| --- | --- |
| `offerId desconhecido` | Registre o curso em `data/curriculum/index.json` primeiro |
| `Fonte inválida` | Passou `.json` e `.pdf` juntos, ou extensão errada |
| App sem oferta nova | `current` desatualizado em `data/offers/index.json` |
| Dados estranhos no PDF | Confirme que o relatório é o *Mapa de oferta por curso*, não outro relatório |

Os parsers vivem em [`parse-offer-pdf.ts`](./parse-offer-pdf.ts) (oferta) e [`parse-curriculum-pdf.ts`](./parse-curriculum-pdf.ts) (grade). São determinísticos (sem LLM) e compartilham utilitários em [`pdf-utils.ts`](./pdf-utils.ts).
