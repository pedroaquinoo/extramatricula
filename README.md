# Extramatrícula

Planeje sua matrícula na UFMG e veja como sua semana ficaria antes de se comprometer.

Os dados oficiais existem: a grade curricular, as cadeias de pré-requisitos e as turmas ofertadas com horários e professores. Mas vêm como listas separadas, então planejar a matrícula vira um trabalho manual em que um choque de horário só aparece depois que a matrícula já está aberta.

O Extramatrícula não substitui o sistema oficial. Ele adiciona a interface que falta: uma oferta que você coloca num calendário, e pré-requisitos que você enxerga.

## Funcionalidades

| Rota | O que faz |
| --- | --- |
| `/flow` | Fluxograma de pré-requisitos. Disciplinas com pré-requisitos não cumpridos aparecem trancadas. |
| `/course` | Grade curricular. Marque o que você já cursou. |
| `/simulation` | Simulador semanal com as turmas em oferta. Blocos sobrepostos aparecem lado a lado. |
| `/s#...` | Grade compartilhada por link público. |

Sem conta, sem servidor, sem banco de dados. O app é um bundle estático: o que você marca fica no `localStorage` deste navegador, e as grades compartilhadas são comprimidas no próprio fragmento da URL.

## Dados

Tudo vem de fontes oficiais. Nada é *crowdsourced*.

- **Grade curricular**: JSON estático em [`data/curriculum/`](data/curriculum/), um arquivo por curso, listados em `index.json`.
- **Oferta do semestre**: JSON estático em [`data/offers/`](data/offers/), um arquivo por curso e semestre (`<termo>/<offerId>.json`). `index.json` aponta o semestre atual.

Atualizar a oferta a cada semestre é a manutenção recorrente do projeto. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Rodando localmente

Requer **Node.js 20+** e **pnpm** (o projeto usa `pnpm-workspace.yaml`; `npm` ou `yarn` geram uma árvore de dependências diferente).

```bash
git clone https://github.com/pedroaquinoo/extramatricula.git
cd extramatricula
pnpm install
pnpm dev
```

O script `dev` usa `--experimental-https`, então a app sobe em **https://localhost:3000**; o aviso de certificado autoassinado é esperado.

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build estático em `out/` |
| `pnpm lint` | Formata com Prettier e roda o ESLint |
| `pnpm ingest <termo> <offerId> <arquivo>` | Importa um snapshot da oferta de um curso |

## Arquitetura

Next.js 16 (App Router) com `output: "export"`, React 19, TypeScript, Tailwind v4 e shadcn/ui. O fluxograma é `@xyflow/react`.

```
app/          # flow, course, simulation, s (grade compartilhada), landing
components/   # ui/ = shadcn gerado · extra/ = domínio · landing/
data/         # curriculum/ e offers/, JSON estático
lib/          # curriculum.ts, offers.ts, store.ts (localStorage), share.ts
scripts/      # ingest/ da oferta
```

## Segurança

Encontrou uma vulnerabilidade? Não abra uma issue pública. Reporte por [security advisory](https://github.com/pedroaquinoo/extramatricula/security/advisories/new) ou por e-mail para **extragabarito@gmail.com**.

## Licença

[GNU AGPL-3.0](LICENSE).

## Aviso

Projeto independente, **sem vínculo oficial com a UFMG**. Os dados podem estar desatualizados. **Sempre confirme sua matrícula no sistema oficial.**
