export type BlogSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export type BlogArticle = {
  slug: string
  title: string
  description: string
  category: string
  publishedAt: string
  updatedAt: string
  sections: BlogSection[]
  relatedLinks: { label: string; href: string }[]
}

export const blogArticles: BlogArticle[] = [
  {
    slug: "como-fazer-matricula-na-ufmg",
    title: "Como fazer matrícula na UFMG: guia para planejar seu semestre",
    description:
      "Entenda as etapas da matrícula na UFMG, confira pré-requisitos e monte sua grade antes de escolher as turmas no sistema oficial.",
    category: "Matrícula UFMG",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    sections: [
      {
        heading: "Resposta rápida",
        paragraphs: [
          "Para fazer sua matrícula na UFMG, primeiro confira a grade curricular e as disciplinas liberadas, depois escolha turmas sem conflito de horário e, por fim, confirme o requerimento no sistema oficial dentro do prazo. O Extramatrícula ajuda nas etapas de planejamento, mas não substitui a confirmação no SiGA ou nos canais oficiais da universidade.",
        ],
      },
      {
        heading: "O que preparar antes da matrícula",
        bullets: [
          "Sua lista de disciplinas já concluídas e as que pretende cursar.",
          "Os pré-requisitos de cada disciplina desejada.",
          "Uma ou mais alternativas de turma para as disciplinas mais concorridas.",
          "O calendário e as regras publicados pela UFMG para o semestre.",
        ],
      },
      {
        heading: "Monte a grade antes do sistema abrir",
        paragraphs: [
          "O maior risco é descobrir um choque de horário ou um pré-requisito faltando somente quando a matrícula já começou. No Extramatrícula, selecione seu curso, marque o que já cursou e simule as turmas ofertadas. O calendário semanal mostra os conflitos enquanto você monta a grade, e o fluxograma ajuda a entender a sequência das disciplinas.",
        ],
      },
      {
        heading: "No dia do requerimento",
        bullets: [
          "Entre com antecedência e deixe sua grade principal pronta.",
          "Tenha alternativas caso uma turma fique sem vaga.",
          "Confira códigos, horários e turmas antes de enviar.",
          "Salve ou fotografe a confirmação do requerimento.",
          "Verifique sempre as informações diretamente no sistema oficial.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Simular meu semestre", href: "/simulation" },
      { label: "Ver o fluxograma", href: "/flow" },
      { label: "Como usar o Extramatrícula", href: "/blog/como-usar-o-extramatricula" },
    ],
  },
  {
    slug: "cronograma-matricula-ufmg-2026-2",
    title: "Calendário da matrícula UFMG 2026/2: como se preparar",
    description:
      "Um checklist para acompanhar o calendário da matrícula UFMG 2026/2 e chegar a cada etapa com a grade planejada.",
    category: "Matrícula UFMG",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    sections: [
      {
        heading: "Use o calendário oficial como referência",
        paragraphs: [
          "As datas e regras da matrícula podem mudar entre semestres. Consulte sempre a publicação oficial da UFMG e use esta página como um checklist de preparação. O Extramatrícula exibe o ciclo atual no aplicativo, mas a decisão final sobre prazos é sempre da universidade.",
        ],
      },
      {
        heading: "Checklist antes da abertura",
        bullets: [
          "Confirme seu curso, turno e período atual.",
          "Marque as disciplinas que já concluiu na grade curricular.",
          "Veja quais disciplinas estão liberadas pelos pré-requisitos.",
          "Monte uma primeira opção e pelo menos uma alternativa.",
          "Anote o horário de abertura e deixe seus acessos funcionando.",
        ],
      },
      {
        heading: "Como usar o tempo entre as etapas",
        paragraphs: [
          "Depois de cada resultado, atualize sua lista de disciplinas e refaça a simulação. Uma turma que ficou indisponível pode criar um conflito em cadeia; por isso, vale manter duas ou três versões da semana. Quando o calendário mudar, atualize também a data desta página para deixar claro o que foi revisado.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Planejar a grade", href: "/simulation" },
      {
        label: "Como fazer matrícula na UFMG",
        href: "/blog/como-fazer-matricula-na-ufmg",
      },
    ],
  },
  {
    slug: "pre-requisitos-disciplinas-ufmg",
    title: "Pré-requisitos na UFMG: como descobrir o que você pode cursar",
    description:
      "Aprenda a ler a cadeia de pré-requisitos da sua graduação e descubra quais disciplinas estão liberadas para o próximo semestre.",
    category: "Grade curricular",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    sections: [
      {
        heading: "O que é um pré-requisito",
        paragraphs: [
          "Pré-requisito é uma disciplina, ou conjunto de disciplinas, que precisa ser concluído antes de outra. A ordem sugerida na grade curricular não é apenas uma lista: ela ajuda a evitar que você tente cursar uma matéria sem ter a base necessária.",
        ],
      },
      {
        heading: "Como ler a sequência",
        bullets: [
          "Comece pelas disciplinas que você já concluiu.",
          "Siga as setas ou relações até as matérias que elas liberam.",
          "Separe o que está bloqueado por uma única matéria do que depende de uma cadeia inteira.",
          "Confira a regra da sua versão de currículo antes de fazer exceções.",
        ],
      },
      {
        heading: "Use o fluxograma para encontrar o próximo passo",
        paragraphs: [
          "No Extramatrícula, as disciplinas com pré-requisitos pendentes aparecem bloqueadas. Ao marcar o que já foi cursado, o fluxograma atualiza as matérias liberadas e mostra o que cada disciplina desbloqueia. Isso transforma uma lista difícil de conferir em um mapa do seu caminho pelo curso.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Abrir fluxograma", href: "/flow" },
      { label: "Ver grade curricular", href: "/course" },
    ],
  },
  {
    slug: "como-montar-grade-sem-choque-de-horario",
    title: "Como montar uma grade sem choque de horário na UFMG",
    description:
      "Veja como comparar turmas, identificar sobreposições e montar uma semana de aulas mais organizada antes da matrícula.",
    category: "Planejamento",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    sections: [
      {
        heading: "Por que o conflito aparece tão tarde",
        paragraphs: [
          "As informações de currículo, oferta e horário costumam aparecer separadas. Quando você compara várias turmas manualmente, é fácil esquecer uma aula, um laboratório ou uma alternativa escolhida para outra disciplina.",
        ],
      },
      {
        heading: "Método prático",
        bullets: [
          "Liste primeiro as disciplinas que você precisa cursar.",
          "Escolha uma turma por disciplina e coloque todas no mesmo calendário.",
          "Procure sobreposições no mesmo dia e nos intervalos entre aulas.",
          "Troque uma turma por vez e mantenha uma segunda opção.",
          "Confira novamente a carga horária total e os pré-requisitos.",
        ],
      },
      {
        heading: "Planeje a semana, não apenas cada disciplina",
        paragraphs: [
          "Uma grade sem choque pode ainda ter muitas janelas ou exigir presença em todos os dias. O calendário semanal do Extramatrícula permite comparar versões da sua grade e o Modo mágico pode procurar opções com menos dias e menos intervalos, respeitando as disciplinas essenciais escolhidas.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Simular horários", href: "/simulation" },
      { label: "Conhecer o Modo mágico", href: "/" },
    ],
  },
  {
    slug: "o-que-fazer-quando-nao-ha-vaga-na-ufmg",
    title: "O que fazer quando não há vaga em uma disciplina da UFMG?",
    description:
      "Saiba como se preparar para uma turma lotada, encontrar alternativas e conferir os procedimentos oficiais de ajuste de matrícula.",
    category: "Matrícula UFMG",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    sections: [
      {
        heading: "Não dependa de uma única turma",
        paragraphs: [
          "Se uma disciplina é importante para o próximo semestre, monte sua grade com uma alternativa de horário sempre que possível. Isso reduz o risco de ficar sem plano quando a turma preferida lotar.",
        ],
      },
      {
        heading: "O que conferir",
        bullets: [
          "Se existe outra turma da mesma disciplina.",
          "Se há oferta da disciplina em outro turno ou curso, quando as regras permitirem.",
          "Se a disciplina pode ser deixada para o próximo período sem bloquear outras.",
          "Quais são os procedimentos e prazos oficiais para ajuste ou acerto.",
        ],
      },
      {
        heading: "Faça um plano A, B e C",
        paragraphs: [
          "O simulador permite testar combinações diferentes antes da matrícula. Prepare uma opção ideal, uma opção com outro horário e uma opção que preserve as disciplinas que destravam o restante do curso. Confirme qualquer possibilidade de troca ou equivalência com o colegiado e com a UFMG.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Ver turmas em oferta", href: "/simulation" },
      { label: "Guia de matrícula", href: "/blog/como-fazer-matricula-na-ufmg" },
    ],
  },
  {
    slug: "como-usar-o-extramatricula",
    title: "Como usar o Extramatrícula para planejar sua matrícula na UFMG",
    description:
      "Aprenda a escolher seu curso, marcar disciplinas concluídas, simular turmas e compartilhar sua grade no Extramatrícula.",
    category: "Extramatrícula",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    sections: [
      {
        heading: "1. Escolha curso, turno e período",
        paragraphs: [
          "O aplicativo usa essas informações para selecionar a grade curricular e mostrar as disciplinas mais relevantes para o seu momento. As escolhas ficam salvas apenas neste navegador e não exigem cadastro.",
        ],
      },
      {
        heading: "2. Marque o que já cursou",
        paragraphs: [
          "Na grade curricular, marque as disciplinas concluídas. O progresso e o fluxograma usam essa informação para mostrar o que pode ser cursado em seguida.",
        ],
      },
      {
        heading: "3. Simule sua semana",
        paragraphs: [
          "Na simulação, escolha entre as turmas realmente carregadas para o semestre atual e veja os blocos no calendário. Conflitos aparecem lado a lado, e você pode testar outras combinações.",
        ],
      },
      {
        heading: "4. Confira no sistema oficial",
        paragraphs: [
          "O Extramatrícula é uma ferramenta independente de planejamento. Antes de enviar sua matrícula, confirme vagas, regras, pré-requisitos e prazos no sistema oficial da UFMG.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Começar uma simulação", href: "/simulation" },
      { label: "Por que o projeto existe", href: "/why" },
    ],
  },
]

export function getArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug)
}
