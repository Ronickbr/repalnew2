# Repal Equipamentos - Site Institucional

Site institucional da Repal Equipamentos, especializada em equipamentos para cozinha industrial e comercial.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Roteamento**: React Router DOM
- **Estado**: React Query (TanStack Query)
- **Backend**: Supabase (Database, Auth, Storage)
- **Ícones**: Lucide React
- **Notificações**: Sonner
- **Data**: date-fns
- **Containerização**: Docker + Docker Compose

## 📋 Funcionalidades

### Públicas
- ✅ Página inicial com hero impactante
- ✅ Catálogo de produtos com filtros e busca
- ✅ Páginas individuais de produtos com galeria
- ✅ Páginas de categorias
- ✅ Sistema de leads com captura automática
- ✅ Integração WhatsApp
- ✅ Páginas institucionais (Sobre, Contato)
- ✅ Design responsivo
- ✅ SEO otimizado com slugs amigáveis

### Administrativas
- ✅ Dashboard com estatísticas
- ✅ Gestão de produtos
- ✅ Gestão de categorias
- ✅ Gestão de leads com status
- ✅ Interface intuitiva
- ✅ **Geração de conteúdo com IA** (Gemini API) - Gera descrições, especificações técnicas e SEO automaticamente

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Node.js 20+
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone <repository-url>
cd repalnew2
```

### 2. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# WhatsApp
VITE_WHATSAPP_NUMBER=5511999999999

# Informações da Empresa
VITE_COMPANY_NAME=Repal Equipamentos
VITE_COMPANY_EMAIL=contato@repalequipamentos.com.br
VITE_COMPANY_PHONE=(11) 99999-9999
VITE_COMPANY_ADDRESS=São Paulo, SP

# Google Gemini API (opcional - para geração de conteúdo com IA)
VITE_GEMINI_API_KEY=sua_chave_do_gemini_aqui
```

### 3. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Execute a migração SQL localizada em `supabase/migrations/001_initial_schema.sql`
3. Configure as permissões RLS conforme necessário
4. Copie a URL e a chave anônima para o arquivo `.env`

## 🚀 Desenvolvimento

### Opção 1: Desenvolvimento Local (Node.js)

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

### Opção 2: Desenvolvimento com Docker (Recomendado)

```bash
# Iniciar ambiente de desenvolvimento
docker-compose up app-dev

# Ou em background
docker-compose up -d app-dev
```

Acesse: http://localhost:5173

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificar código
npm run type-check   # Verificar tipos TypeScript
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.tsx      # Layout principal
│   ├── ProductCard.tsx # Card de produto
│   └── ContactForm.tsx # Formulário de contato
├── hooks/              # Hooks customizados
│   ├── useCategories.ts
│   ├── useProducts.ts
│   └── useLeads.ts
├── lib/                # Configurações e utilitários
│   ├── supabase.ts     # Cliente Supabase
│   └── react-query.ts  # Configuração React Query
├── pages/              # Páginas da aplicação
│   ├── Home.tsx
│   ├── Catalog.tsx
│   ├── Category.tsx
│   ├── ProductDetail.tsx
│   ├── About.tsx
│   ├── Contact.tsx
│   └── Admin.tsx
└── App.tsx             # Componente principal
```

## 🎨 Design System

### Paleta de Cores
- **Vermelho Principal**: #8B0000 (Repal Red)
- **Azul Secundário**: #000080 (Navy Blue)
- **Branco**: #FFFFFF
- **Cinza Escuro**: #333333
- **Verde WhatsApp**: #25D366

### Tipografia
- Fonte principal: Inter (via Tailwind CSS)
- Hierarquia clara com tamanhos responsivos

## 📱 Responsividade

O site é totalmente responsivo com breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Segurança

- Row Level Security (RLS) configurado no Supabase
- Validação de dados no frontend e backend
- Sanitização de inputs
- Headers de segurança configurados no Nginx

## 🤖 Funcionalidade de IA - Geração de Conteúdo

O sistema possui uma funcionalidade integrada de geração de conteúdo com IA que utiliza a API do Google Gemini para criar automaticamente:

### Conteúdo Gerado
- **Descrição Detalhada**: Texto persuasivo com mínimo 500 caracteres
- **Descrição Curta**: Resumo impactante em 1-2 frases
- **Principais Características**: Lista dos 5 principais diferenciais
- **Especificações Técnicas**: Lista detalhada com mínimo 8 itens
- **Dados do Produto**: Modelo e código SKU sugeridos
- **SEO Completo**: Meta title, meta description e palavras-chave otimizadas

### Como Usar
1. Acesse o painel administrativo
2. Crie ou edite um produto
3. Clique no botão "✨ Gerar com IA" ao lado do campo de descrição
4. Aguarde o processamento (indicador de loading)
5. O conteúdo será gerado e preenchido automaticamente nos campos apropriados
6. Revise e edite conforme necessário antes de salvar

### Configuração
1. Obtenha uma chave de API do Google Gemini em: https://makersuite.google.com/app/apikey
2. Adicione a chave ao arquivo `.env` como `VITE_GEMINI_API_KEY`
3. A funcionalidade estará disponível automaticamente no formulário de produtos

### Observações
- A API do Gemini é gratuita até certo limite de uso mensal
- O conteúdo gerado deve ser revisado antes da publicação
- A funcionalidade é opcional - o sistema funcionará normalmente sem a chave API
- Em caso de erro na API, o sistema usará conteúdo padrão estruturado

## 🚀 Deploy

### Opção 1: Docker (Produção)

```bash
# Build e iniciar em produção
docker-compose --profile production up app-prod
```

### Opção 2: Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Opção 3: Build Manual

```bash
# Gerar build
npm run build

# Os arquivos estarão em dist/
# Servir com qualquer servidor web
```

## 📊 Monitoramento

- React Query Devtools (desenvolvimento)
- Console logs estruturados
- Métricas do Supabase Dashboard

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é propriedade da Repal Equipamentos. Todos os direitos reservados.

## 📞 Suporte

Para suporte técnico, entre em contato:
- Email: dev@repalequipamentos.com.br
- WhatsApp: (11) 99999-9999

---

**Desenvolvido com ❤️ para Repal Equipamentos**
# Repal New — Autenticação e Login

## Correções e Melhorias Implementadas

- Unificação do roteamento API na Vercel para respeitar limite do plano Hobby (1 função): `api/[...path].js` com rewrite apenas para rotas não-API
- Handlers robustos para autenticação: login, logout, me, 2FA, CSRF e admin/products
- CORS consistente: `Access-Control-Allow-Origin` baseado em `Origin/Host` e `Allow-Credentials: true`
- Tratamento de erros com mensagens claras (401, 403, 404, 405, 429) e logs de auditoria
- Frontend resiliente: `apiFetchAny` com fallback de rotas, timeout (15s) e mensagens amigáveis
- Testes automatizados (Vitest) cobrindo UI de login, erros comuns e integração básica

## Variáveis de Ambiente (Vercel)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — acesso de leitura
- `SUPABASE_SERVICE_ROLE_KEY` — operações administrativas
- `JWT_SECRET` — assinatura de sessão
- `VITE_DEV_AUTH_BYPASS=false` — produção
- `VITE_API_BASE_URL` — vazio em produção (same-origin)

## Deploy — vercel.json

```json
{
  "version": 2,
  "builds": [
    { "src": "api/[...path].js", "use": "@vercel/node" },
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }
  ],
  "rewrites": [
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ]
}
```

## Testes

- Executar: `npm run test`
- E2E básico: `npm run e2e:auth` (define `TARGET_URL` quando necessário)

## Segurança

- Cookies de sessão: `HttpOnly`, `Secure`, `SameSite=Strict`
- CSRF: cookie `csrf_token` + cabeçalho `X-CSRF-Token` em mutações
- 2FA: TOTP com verificação no backend
