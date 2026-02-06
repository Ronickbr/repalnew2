## 2026-02-06 - v0.5.9

- **Correções & Melhorias**:
  - **Infraestrutura**:
    - Implementada função RPC `get_new_contacts_count` para contagem de leads, contornando bloqueios de AdBlockers que interceptavam requisições contendo "leads" na URL.
  - **Gestão de Leads**:
    - Corrigido erro de permissão (RLS) ao gerar leads de teste (agora permitido para usuários autenticados).
    - Adicionada opção para **Excluir Leads de Teste** (remove leads gerados automaticamente).
    - Badge do menu "Leads" agora exibe contagem dinâmica apenas de novos leads (status 'novo').
  - **Gestão de Preços**:
    - Implementada funcionalidade de **Reajuste de Preços em Massa** (`PriceAdjustmentsPage.tsx`).
    - Permite reajuste percentual ou fixo por produto ou marca.
  - **Qualidade de Código**:
    - Removidos imports e props não utilizados em `LeadManager`.
    - Corrigida tipagem na captura de leads via Popup (`GlobalPopup.tsx`).

## 2026-01-25 - v0.5.7

- **Infraestrutura & Banco de Dados**:
  - **Correções de Performance (Supabase)**:
    - Resolução de alertas de "Multiple Permissive Policies" na tabela `users`: Separação das políticas de escrita (INSERT/UPDATE/DELETE) para evitar sobreposição com políticas de leitura.
    - Adicionado índice ausente em `activity_logs.user_id` para otimização de joins e integridade referencial.

- **Segurança & Auditoria**:
  - Implementação de **Auditoria Automatizada**: Novo script Python (`scripts/security_audit.py`) para análise estática de vulnerabilidades e configurações.
  - Geração automática de relatórios de conformidade (`RELATORIO_SEGURANCA_ABRANGENTE.md`).

## 2026-01-14 - v0.5.6

- **SEO & Infraestrutura**:
  - **Sitemap Automatizado**:
    - Implementada regeneração automática no servidor (`server.js`) com cache de 24 horas.
    - Centralização do arquivo em `public/sitemap.xml`.
    - Correção do formato de datas (YYYY-MM-DD) no script de pré-renderização (`scripts/prerender.mjs`).
  - **Otimização de URLs**:
    - Normalização global de **URLs Canônicas** no `Layout.tsx` (tratamento de barras finais e duplicatas).
    - Proteção de indexação (`noindex, nofollow`) explícita para páginas de autenticação (Login/Register).

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

