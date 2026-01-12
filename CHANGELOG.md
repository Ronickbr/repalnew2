## 2026-01-12 - v0.5.5

- **Admin & Gestão**:
  - Novo **Gerenciador de Promoções**: Criação e edição de campanhas, banners e ofertas (`src/components/admin/PromotionManager.tsx`)
  - **Gerenciador de Produtos** aprimorado:
    - Suporte a SEO avançado (título, descrição, keywords)
    - Destaques customizáveis (Dropdown, Homepage)
    - Upload unificado de imagens (`UnifiedImageUpload`)
    - Exportação/Importação Excel
  - Sistema de **Popups Globais**: Gerenciamento de avisos e captura de leads (`src/components/GlobalPopup.tsx`)
  - Gestão de **Leads** integrada: Visualização e exportação de contatos (`src/pages/admin/LeadsPage.tsx`)

- **Frontend & UX**:
  - Nova página de **Detalhes do Produto** (`ProductDetail.tsx`) com layout otimizado
  - Integração de **Popups** com captura de leads e regras de exibição
  - Componentes de upload de imagem unificados e otimizados
  - Melhorias na navegação e performance geral

- **Infraestrutura & Backend**:
  - Atualização de dependências (`package.json` -> v0.5.5)
  - Integração aprimorada com **Supabase** (Tipagem e Hooks)
  - Otimizações de SEO e Analytics

## 2025-12-11 - v0.2.2

- Analytics: ajuste para `@vercel/analytics/react` em `src/App.tsx`
- Performance: integrado `@vercel/speed-insights` com `<SpeedInsights />` em `src/App.tsx`

## 2025-12-11 - v0.2.1

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

