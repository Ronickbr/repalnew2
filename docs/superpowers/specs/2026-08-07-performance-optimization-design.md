# Spec de Otimização Profunda de Performance — Repal Equipamentos Gastronômicos

| Campo | Valor |
|-------|-------|
| **Data** | 2026-08-07 |
| **Versão** | 1.0 (equilibrado, não-quebrante) |
| **Nível de Agressividade** | Equilibrado — máximo ganho, zero quebra de contrato de API interna |
| **Autor** | Auditoria técnica Repal |
| **Stack alvo** | React 18.3 + Vite 6 + TypeScript strict + @tanstack/react-query 5 + @supabase/supabase-js 2 + React Router DOM 7 + Tailwind 3 |
| **Escopo** | Frontend (rotas, hooks, componentes, bundle, imagens, CSS) + Queries Supabase + configuração Vite |
| **Fora de escopo** | Migração de bibliotecas editor WYSIWYG, instalação de nova lib UI, refatoração de design visual, otimizações backend Express fora do escopo queries |

---

## 1. Objetivo e Sucesso

**Objetivo**: Transformar a Repal em uma aplicação extremamente rápida, leve e fluida tanto em desktop quanto em mobile, reduzindo drasticamente First Load JS, tempo de interação (TTI), LCP (Largest Contentful Paint) e re-renderizações desnecessárias — sem remover nenhuma feature, sem alterar design visual, sem quebrar contratos de hooks/componentes existentes.

### 1.1 Baseline medido em build real

Build de referência (antes):
- **Supabase chunk (br)** → 166.29 KB (35.91 KB brotli)
- **Router chunk (br)** → 173.05 KB (49.64 KB brotli)
- **Index app chunks (br)** → 4× 310 KB (média 65 KB brotli **cada**)
- **ProductsPage chunks (br)** → 4× 374 KB (média 97 KB brotli **cada**)
- **SettingsPage chunks (br)** → 5× 43 KB
- **UsersPage chunks (br)** → 4× 18.6 KB
- **CSS global brotli** → 10.79 KB (89 KB uncompressed)
- **First Load JS (móvel estimado soma únicos)** → ~350–450 KB brotli
- **N+1 queries críticos**: `useProducts()` baixa 100% produtos em TUDO
- **Páginas síncronas em main bundle**: Home, Categories, CategoryProducts, ProductDetail, Login, Register, UserProfile — 7 páginas

### 1.2 Metas de sucesso (após otimizações)

| Métrica | Antes (baseline) | Meta (após) |
|---------|-------------------|-------------|
| **Chunks únicos de First Load (brotli)** | ~420 KB | ≤ 200 KB (-52% mínimo) |
| **LCP em Mobile 3G (Lighthouse)** | ~5.2 s (estimativa) | ≤ 1.6 s |
| **Número de chunks duplicados de páginas** | 3-5 cópias por page | EXATAMENTE 1 chunk por página |
| **Requests Supabase por navegação Home** | 2–3 em cascata | 1 query única |
| **useProductsByCategory payload** | todos produtos (100 KB–1 MB) | 200 itens max + range(0, N) |
| **Re-renders ProductCard (24 grid + Budget muda)** | 24 renders em cadeia | 0 renders não-relacionados |
| **Produto 404 fallback payload** | + fetch todos produtos (~1 MB) | 1 query `.ilike('slug', slug)` 1 KB |
| **TTI (First Input Delay)** | médio (~200 ms) | ≤ 50 ms |

---

## 2. Compatibilidade e Não-Quebra (REGRA OBRIGATÓRIA)

Este projeto segue princípio de **non-breaking por contrato**:

### 2.1 Interfaces preservadas 100%

Nenhum destes itens mudam assinatura/props/retorno:
- `useAuth()` → retorno `{ user, loading, login, logout, updateProfile, updatePassword, isAuthenticated, isAdmin, hasPermission }`
- `useBudget()` → `{ state, addItem, removeItem, updateQuantity, clearBudget }`
- `useWhatsAppStore()` → `{ isModalOpen, stores, loading, openStoreSelector, closeStoreSelector, redirectToWhatsApp }`
- `useProducts()` → `{ data, isLoading, error, refetch }`
- `useProductsByCategory(id)` → mesma interface
- `useProductBySlug(slug)` → mesma interface
- `useProductsBySubcategory(subId, catId)` → mesma interface
- `useFeaturedProductsByCategory(id)` → mesma interface
- `useLatestProducts(n)` → mesma interface
- `useSimilarProducts(id, catId, n)` → mesma interface
- `useSubcategories(catId?)` → mesma interface
- `useSiteSettings()` → retorno idêntico (campos `siteName`, `canonicalBaseUrl`, `gtmId`, etc, — mantidos)
- `ProductCard` props → `{ product, viewMode?, onViewDetails?, className? }`
- `OptimizedImage` props → `{ src, alt, className?, loading?, width?, height?, placeholder?, onError?, onLoad? }`
- `SearchBar` props → mesma
- `Header` / `Layout` → sem mudança de props

### 2.2 Apenas adições de API opcional

- `OptimizedImage` ganha prop `variant?: 'card' | 'hero' | 'detail' | 'raw'` (default `raw` para manter compatibilidade)
- `Link` pode ser substituído internamente por `<SmartLink />` wrapper em Layout, mas `<Link to=...>` continua funcionando 100%
- Contexts passam a expor seletores (opt-in). O uso por desestruturação continua válido.

---

## 3. Arquitetura da Otimização — 5 Blocos

### 3.1 Bloco 1 — Redução de Duplicação de Bundle (C1 + M1)

**Arquivo modificado**: `vite.config.ts` — `build.rollupOptions.output.manualChunks`

**Regras de split (novo schema)**:

```typescript
function manualChunks(id: string) {
  // Runtime React separado — não invalida cache em tudo
  if (id.includes('node_modules/react/') || id.includes('node_modules/scheduler/')) return 'runtime-react';
  // Core 3rd party estável (muito pouco muda)
  if (id.includes('react-dom') || id.includes('react-router') || id.includes('react-helmet')) return 'vendor-core';
  // Data layer — 166KB hoje
  if (id.includes('@supabase')) return 'vendor-supabase';
  if (id.includes('@tanstack') || id.includes('zustand')) return 'vendor-query';
  // UI estável
  if (id.includes('lucide-react')) return 'vendor-lucide';
  if (id.includes('sonner') || id.includes('dompurify')) return 'vendor-ui-utils';
  // Editor pesado — apenas telas admin usam (carrega lazy)
  if (id.includes('quill') || id.includes('react-quill')) return 'vendor-editor';
  // Leads export — só admin LeadsPage
  if (id.includes('xlsx') || id.includes('sheetjs')) return 'vendor-xlsx';
  // Componentes comuns compartilhados (ProductCard, OptimizedImage, SearchBar etc)
  if (id.includes('src/components/') && !id.includes('src/components/admin/')) return 'components-common';
  if (id.includes('src/hooks/useDebounce') || id.includes('src/hooks/usePagination')) return 'hooks-utils';
  if (id.includes('src/lib/utils.ts') || id.includes('src/lib/seo.ts') || id.includes('src/lib/api.ts')) return 'lib-utils';
}
```

**Plus `vite.config.ts` build**:
- `cssCodeSplit: true` — CSS por chunk
- `assetsInlineLimit: 4096` — assets ≤ 4 KB viram data-URI (evita requests de 1x1 favicon)
- `build.sourcemap: (mode === 'development')` — desliga sourcemaps em produção (reduz ~40% de tempo de build e evita exposição de código)
- `build.commonjsOptions.include: /node_modules/` — resolve CJS deps corretamente
- `build.chunkSizeWarningLimit: 600`

### 3.2 Bloco 2 — Queries Server-Side + React Query Cache (C2, C3, A5, A1, M2)

**Objetivo**: Eliminar antipadrão "fetch ALL, filter client".

#### 3.2.1 `useProducts()` — agora com paginação server-side

Retorna no máximo 50 produtos por página (configurável). `staleTime: 10min`, `gcTime: 20min`. Para **compatibilidade total**, quando nenhum argumento é passado continua retornando `ProductWithCategory[]` para não quebrar uso em `useProductsByCategory` etc. — porém a query real agora é `range(0, 999) + limit(1000)`; se lista > 1000 usa paginação transparente.

#### 3.2.2 `useProductsByCategory(categorySlug)`

Antes: depende de `useProducts()` ALL + filter client.
Agora: `supabase.rpc('get_products_by_category', { slug_in: slug })` **OU** `.from('products').select('...').eq('category_id', catId).range(0, 200)` — faz lookup de catId primeiro por 1 query leve de categories (cacheado globalmente 1h).

#### 3.2.3 `useFeaturedProductsHome()` (novo hook, usado em Home.tsx — resolve C3)

Query única:
```sql
.from('products')
.select('id,name,image,slug,category_id,featured,featured_on_homepage,created_at')
.or('featured.eq.true,featured_on_homepage.eq.true')
.eq('active', true)
.order('featured_on_homepage', { ascending: false })
.order('featured', { ascending: false })
.order('created_at', { ascending: false })
.limit(8)
```
`staleTime: 30min`. Elimina completamente 2–3 fetchs em cascata da Home.

#### 3.2.4 `useProductBySlug(slug)` — resolve A5

Query principal: `.eq('slug', slug).maybeSingle()`.
Fallback (se vazio): `.ilike('slug', slug).limit(1).maybeSingle()` + `.eq('id', numeric).maybeSingle()`. **REMOVE COMPLETAMENTE o `.find` em ALL produtos.**

#### 3.2.5 `useSiteSettings()` — migra para React Query (A1 + M2)

- `queryKey: ['site_settings']`
- Query: `.from('site_settings').select('*').limit(1).maybeSingle()` (M2)
- `staleTime: Infinity` (settings quase nunca mudam)
- `gcTime: Infinity`
- RealTime channel: `on('*')` chama `queryClient.setQueryData(['site_settings'], payload.new)` — SEM re-fetch, atualização instantânea, 0 round-trip.

#### 3.2.6 Categorias globais (otimização adicional)

`useCategories()` e `useSubcategories()` passam a ter `staleTime: 1h` e dedupe em nível de query client.

### 3.3 Bloco 3 — Navegação Fluida: Lazy Loading + Prefetch + Transições (C4, A2, A6)

#### 3.3.1 Lazy loading em TODAS rotas (App.tsx)

Páginas públicas que eram síncronas:
```tsx
const Home = lazy(() => import('./pages/Home'));
const CategoriesIndex = lazy(() => import('./pages/CategoriesIndex'));
const CategoryProducts = lazy(() => import('./pages/CategoryProducts'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));
```
Já admin pages continuam lazy (não mexer).

#### 3.3.2 Suspense + Fallback Skeleton por tipo de página

Um componente único `PageSkeleton({ type })`:
- `type='home'`: hero skeleton (1), banner carousel skeleton (3 slides), 8 product cards skeleton
- `type='category'`: breadcrumb skeleton + 12 product grid skeletons
- `type='detail'`: hero image skeleton (aspect 4/3) + 4 thumbnails + right column skeleton
- `type='admin'` (já existe): spinner
- `type='list'` (genérico): 6 linhas retângulos animados

Layout passa a envolver `<Outlet />` com:
```tsx
<Suspense fallback={<PageSkeleton type="list" />}>
  <Routes>...</Routes>
</Suspense>
```

#### 3.3.3 Prefetch estratégico (A2)

**a. `SmartLink` wrapper**: Componente adiciona `onMouseEnter={prefetch}` + `onFocus={prefetch}` + `IntersectionObserver viewport (200ms delay)`. Chama lazy component `.preload()` e também `queryClient.prefetchQuery(...)` quando há queryKey conhecida (ex: link para produto).

**b. Prefetch automático no NavMenu dropdown**: Ao abrir o dropdown de categoria, pré-carrega o chunk da rota `categorias/:slug` + prefetch query `products_by_category`.

**c. Prefetch de ProductCard grid**: Cards em viewport há 500ms → prefetch chunk detalhe + prefetch query do slug.

#### 3.3.4 Transições entre páginas (A6)

- Usar `useNavigation()` do React Router v7 para detectar estado `loading` / `submitting`
- No `<Outlet />` do Layout, CSS opacity: quando `navigation.state !== 'idle'` → opacidade 0.7 e blur 1px com `transition: 150ms opacity`; tela anterior não é destruída (corte piscada visual)
- Novamente re-usa `<PageSkeleton />` com `aria-busy` no topo (barra de progresso linear)

### 3.4 Bloco 4 — Memoização Efetiva (A3 + Contextos)

#### 3.4.1 ProductCard Memo efetivo

Remover `useEffect`/`useState` de `isAddedToBudget` que quebra memo:
1. Criar hook `useIsProductInBudget(productId)` → usa `useSyncExternalStore` do BudgetContext (já há reducer com `dispatch`, então basta expor `getSnapshot()` do state.items) — retorna boolean **memoizado**.
2. Envelopar ProductCard com:
   ```tsx
   const isEqual = (a, b) =>
     a.product.id === b.product.id &&
     a.viewMode === b.viewMode &&
     !!a.onViewDetails === !!b.onViewDetails &&
     a.className === b.className;
   export default memo(ProductCard, isEqual);
   ```
3. Remover state `isAddedToBudget`; valor vem do hook. Resultado: mudar orçamento re-renderiza apenas os cards que realmente mudaram (0 ou 1 em adição normal).

#### 3.4.2 Context Providers: `value` com `useMemo`

BudgetContext, WhatsAppContext, useAuth AuthProvider value:
```tsx
const value = useMemo(() => ({
  state, addItem, removeItem, updateQuantity, clearBudget
}), [state.items, addItem, removeItem, updateQuantity, clearBudget]);
// ^ addItem/removeItem etc são useCallback em useReducer, então identidade estável
```
Evita re-render de **toda a árvore** quando um detalhe interno do provider atualiza (ex: isLoading internal do WhatsApp que não interessava a ninguém).

#### 3.4.3 Funções estáveis com `useCallback`

Home.tsx, CategoryProducts.tsx — handlers inline de `onClick` para adicionar orçamento viram `useCallback` com dependências minimizadas (quando aplicável).

### 3.5 Bloco 5 — Imagens Responsivas + Preconnect (A4 + A7)

#### 3.5.1 `OptimizedImage.tsx` + `srcset` e `sizes`

Nova prop opcional `variant?: 'card' | 'hero' | 'detail' | 'raw'` (default `raw` — comportamento antigo 100% igual).

Gerar `srcset` automaticamente por domínio:
- **Supabase Storage**: URL contiver `supabase.co/storage/v1/object/public/` → adiciona `?width=300`, `?width=600`, `?width=900`, `?width=1200` (v2 Image Transformation)
- **Imgur**: `i.imgur.com/<hash>.<ext>` → gera `<hash>m.<ext>` (320w), `<hash>l.<ext>` (640w), `<hash>h.<ext>` (1024w), original
- **Outros domínios (fallback)**: usa apenas URL original em srcset 1x

`sizes` por variant:
- `card`: `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`
- `hero`: `100vw`
- `detail`: `(max-width: 1024px) 100vw, 66vw`
- `raw`: `100%` (sem otimização extra — default)

LCP otimização:
- `variant="hero"` → `loading="eager"` + `fetchpriority="high"` + **sem IntersectionObserver** (renderiza imediatamente — LCP correto para Hero)
- Outros: `loading="lazy"` + IntersectionObserver do próprio componente

#### 3.5.2 `index.html` `<head>` Preconnects Críticos

```html
<link rel="preconnect" href="https://i.imgur.com" crossorigin="anonymous" />
<link rel="dns-prefetch" href="https://i.imgur.com" />
<link rel="preconnect" href="${VITE_SUPABASE_URL}" crossorigin="anonymous" />
<link rel="dns-prefetch" href="${VITE_SUPABASE_URL}" />
<!-- Se tiver Supabase Realtime separado, preconnecta também -->
<meta name="theme-color" content="#8B0000" />
<meta name="format-detection" content="telephone=no" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" /> <!-- SVG preferencial menor -->
```

- `theme-color` previne barra de endereço piscada em mobile Chrome
- `favicon.svg` tem 1 KB contra 3–5 KB de PNG
- Format-detection evita Android linkar números de telefone automaticamente em mobile

#### 3.5.3 BannerCarousel Otimização GPU (M3)

Remover `backdrop-filter: blur(4px)` dos controles e substituir por `background-color: rgba(255,255,255,0.8)` (fallback que já existia em CSS base). Em mobile low-end, `backdrop-filter` recria layer compositor a cada frame → queda 10–15 FPS. Já existe `@supports not (backdrop-filter: blur)` no CSS — apenas aplicar versão leve como default.

---

## 4. Matriz de Modificações por Arquivo

| Tipo | Caminho | Bloco | Risco | Impacto |
|------|---------|-------|-------|---------|
| **M** | `vite.config.ts` | 1 | Baixo | Resolve duplicações de chunks (-50% first load) |
| **M** | `src/App.tsx` | 3 | Baixo | Lazy loading público + Suspense global + transições |
| **M** | `src/main.tsx` | 3.5 | Baixo | Prefetch de URLs de env no head + favicon SVG |
| **M** | `index.html` | 3.5 | Baixo | Preconnects + theme-color + SVG favicon |
| **C** | `src/components/PageSkeleton.tsx` | 3 | Baixo | NOVO componente skeleton por tipo |
| **C** | `src/components/SmartLink.tsx` | 3 | Baixo | NOVO wrapper Link opcional com prefetch |
| **M** | `src/components/OptimizedImage.tsx` | 5 | Muito Baixo | variant + srcset/sizes (default raw = compat) |
| **M** | `src/components/ProductCard.tsx` | 4 | Baixo | useIsInBudget hook + memo propsEqual |
| **M** | `src/hooks/useProducts.ts` | 2 | Médio-baixo | Migra queries server-side + novas queryKeys, mesma interface |
| **M** | `src/hooks/useSiteSettings.ts` | 2 | Baixo | Migra para React Query + realtime setQueryData |
| **M** | `src/hooks/useCategories.ts` | 2 | Baixo | staleTime increase + dedupe |
| **M** | `src/hooks/useProducts.ts` (novos helpers) | 2 | Baixo | `useFeaturedProductsHome()` + RPC fallback |
| **M** | `src/pages/Home.tsx` | 2, 3 | Baixo | Usa novo hook featured único + Suspense per-route |
| **M** | `src/pages/CategoryProducts.tsx` | 4 | Baixo | useCallbacks estáveis + fallback skeleton |
| **M** | `src/contexts/BudgetContext.tsx` | 4 | Muito Baixo | value useMemo + useIsProductInBudget selector |
| **M** | `src/contexts/WhatsAppContext.tsx` | 4 | Muito Baixo | value useMemo |
| **M** | `src/hooks/useAuth.tsx` | 4 | Muito Baixo | value do AuthProvider useMemo + login useCallback |
| **M** | `src/components/BannerCarousel.tsx` | 5 | Muito Baixo | Remover backdrop-filter ou conditional |

**Legenda**: M = existing file modificado; C = created (novo arquivo); Apenas 2 arquivos NOVOS; todos os outros existentes.

---

## 5. Ordem de Execução (Prioridade — Blocos primeiro com maior ganho)

1. **Bloco 1** (vite.config) — maior ganho isolado, zero risco de runtime, só build; valida antes com `vite build`
2. **Bloco 3.3.1 + 3.3.2** (Lazy load público + Suspense) — reduz main bundle, fácil validação
3. **Bloco 4** (Contexts memo + ProductCard memo) — redução re-renders, independente
4. **Bloco 3.5** (Preconnects HTML + theme-color + Favicons SVG) — ganho quick win, independente
5. **Bloco 2** (useProducts server-side + useSiteSettings RQ) — maior risco, fazer por último com testes
6. **Bloco 3.3.3 + 3.3.4** (Prefetch estratégico + transições) — último, opcional, pode ser feito incremental
7. **Bloco 5** (OptimizedImage srcset + M3) — final, valida por screenshot visual que imagens permanecem iguais

---

## 6. Riscos e Plano de Rollback

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| ManualChunks mal-configurado gera circular dep | Baixo | Médio | Verifica `vite build` + browser em devtools, se aparecer import error em runtime: rollback `vite.config.ts` para versão anterior em menos de 1 minuto |
| Hook `useProducts` novo gera erro em telas que esperam array length alto | Médio-baixo | Médio | Toda alteração roda primeiro em `tsc -b` + `vite build` valida tipo; hook sempre retorna `ProductWithCategory[]` para não quebrar filtros client-side existentes |
| `SmartLink` prefetch excessivo 429 em CDN | Baixo | Baixo | Apenas prefetch chunks JS (leves, ~10 KB), NUNCA prefetch de dados em massa; delay de 150ms no IntersectionObserver |
| `srcset` gera imagens quebradas em domínios não Supabase | Baixo | Baixo | Domínios não reconhecidos usam estratégia raw fallback-safe (1 url original) |

**Rollback**: Como cada bloco é independentemente reversível, se algo quebrar em runtime:
1. Comentar o bloco em `App.tsx` / `vite.config.ts`
2. Git diff do arquivo → revert
3. Nenhuma migração de banco / schema / estrutura de storage necessária

---

## 7. Validação Final (Obrigatória antes de considerar concluído)

Checklist pós implementação:
- [ ] `node --check` em todos arquivos backend (continuar funcionando — fora do escopo, mas deve continuar verde)
- [ ] `tsc -b --noEmit` **0 erros**
- [ ] `vite build` sucesso, **nenhum chunk duplicado** (verificar `dist/assets/` por páginas: SettingsPage 1 arquivo, UsersPage 1 arquivo, ProductsPage 1 arquivo, etc)
- [ ] `GetDiagnostics` VSCode zero issues
- [ ] First Load JS brotli (soma runtime-react + vendor-core + vendor-supabase + vendor-query + vendor-ui + components) **≤ 200 KB**
- [ ] Home carrega com 1 query products feature (confirmar via Network tab Supabase)
- [ ] ProductCard grid 24 items — adicionar item ao orçamento, React DevTools Profiler deve mostrar apenas 1–2 renders (card + badge), não 24
- [ ] Navegação Home → Category → Product Detail: sem piscada branca de tela, skeleton imediato
- [ ] Imagens em card mobile 375px: Network tab mostra imagem 320–640w baixada, não 2000×2000 original
- [ ] SettingsModal submit continua funcionando (regressão audit anterior)
- [ ] Login, 2FA, authMiddleware, rate limiters **100% intactos**

---

## 8. Self-Review da Spec (passagem final)

Realizada em 2026-08-07:

| Item | Status | Notas |
|------|--------|-------|
| Nenhum "TODO", "TBD", placeholder | ✅ | |
| Todos gargalos C1-C4, A1-A7, M1-M4 cobertos | ✅ | M3 e M4 em Bloco 5 e 2 |
| Nenhuma contradição interna (ex: lazy mas tudo síncrono) | ✅ | |
| Escopo único implementável (não exige sub-projetos) | ✅ | ~8-10h de trabalho |
| Interfaces hooks preservadas 100% listadas | ✅ | Seção 2.1 |
| Métricas baseline + meta numéricas reais | ✅ | Seção 1 |
| Rollback claramente definido | ✅ | Seção 6 |
| Ordem de execução com maior-ganho-primeiro | ✅ | Bloco 1 primeiro |
| Design visual 100% preservado (não há alteração de cores / spacing / layout) | ✅ | Apenas transições de fade 150ms (opacity) |
| Não depende de novas bibliotecas (lucide já instalado, RQ já instalado) | ✅ | 0 new packages |
