## 2025-12-11 - v0.3.0

- Admin: criação de usuários com modal e validações básicas
  - Página: `src/pages/admin/UsersPage.tsx`
- Analytics: integração do Vercel Analytics
  - App principal: `src/App.tsx`
- Dependências: adicionado pacote `@vercel/analytics`

## 2025-12-10 - v0.2.0

- Adicionada página 404 amigável com SEO `noindex` e CTAs
  - Arquivo: `src/pages/NotFound.tsx`
- Incluídas rotas coringa (`path="*"`) para capturar URLs inexistentes
  - App principal: `src/App.tsx`
  - Área administrativa: `src/App.tsx`
- Melhoria de UX: navegação robusta em rotas inválidas sem quebra de layout

## 2025-12-03

- Corrigido roteamento Vercel para preservar `/api/*` e evitar 405 durante login
- Consolidada função serverless para respeitar limite de 12 funções (plano Hobby)
- Adicionado CORS consistente e preflight OPTIONS
- Melhorado frontend (`apiFetchAny`) com timeout e mensagens de erro claras
- Criados/ajustados handlers: login, logout, me, verify-2fa, 2fa/enroll, csrf-token, admin/products, integrations
- Adicionados testes de UI para Login e integração básica

