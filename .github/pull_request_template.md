<!--
Obrigado pela contribuição! 🎓
PRs pequenas e focadas são revisadas muito mais rápido.
-->

## O que muda

<!-- O que essa PR faz, e por quê? Se resolve uma issue, escreva "Closes #123". -->

## Como testar

<!-- Os passos para o revisor ver isso funcionando. -->

1.
2.

## Print / GIF

<!-- Se a mudança for visual, mostre. Vale muito. Borre dados pessoais. -->

## Checklist

- [ ] Rodei `pnpm lint` (Prettier + ESLint passam)
- [ ] `pnpm build` passa
- [ ] Testei o fluxo na mão, no navegador, não só o build
- [ ] Strings novas de UI estão em **português**
- [ ] Não commitei `.env.local`, credenciais, nem dados reais de estudantes

### Se essa PR toca dados ou banco

- [ ] Toda Server Action nova revalida o usuário no servidor com `supabase.auth.getUser()`, não confia em `userId` vindo do client
- [ ] Toda tabela nova tem **RLS habilitada** e políticas que restringem cada linha ao seu dono
- [ ] Entradas do usuário são validadas com **Zod**
