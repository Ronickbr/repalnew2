# Documento de Requisitos do Produto (PRD) - Repal Equipamentos

## 1. Visão Geral do Produto

### 1.1 Descrição
O projeto consiste em um site para a Repal Equipamentos, uma empresa especializada em equipamentos para cozinhas industriais, refrigeração comercial e outros equipamentos profissionais. O site permite a exibição de produtos organizados por categorias e subcategorias, com funcionalidades de administração para gerenciamento de conteúdo e captura de leads.

### 1.2 Objetivos do Produto
- Apresentar o catálogo de produtos da empresa de forma organizada e atrativa
- Facilitar o contato dos clientes via WhatsApp para solicitação de orçamentos
- Permitir a administração completa do conteúdo através de um painel administrativo
- Capturar e gerenciar leads de potenciais clientes
- Oferecer uma experiência de usuário moderna e responsiva

## 2. Público-Alvo

### 2.1 Perfis de Usuário
- **Visitantes**: Potenciais clientes buscando informações sobre produtos
- **Administradores**: Equipe interna responsável pela gestão de conteúdo

### 2.2 Necessidades dos Usuários
- **Visitantes**:
  - Encontrar produtos específicos por categoria
  - Visualizar detalhes e especificações dos produtos
  - Entrar em contato facilmente para solicitar orçamentos
  - Acessar o site em diferentes dispositivos

- **Administradores**:
  - Gerenciar categorias, subcategorias e produtos
  - Adicionar, editar e remover conteúdo
  - Visualizar e gerenciar leads recebidos
  - Configurar informações do site

## 3. Funcionalidades Principais

### 3.1 Frontend (Área Pública)

#### 3.1.1 Home Page
- Banner principal com destaque para produtos/categorias
- Exibição de produtos em destaque
- Seção de benefícios e diferenciais da empresa
- Acesso rápido às categorias principais

#### 3.1.2 Listagem de Categorias
- Visualização de todas as categorias disponíveis
- Layout em grid com imagens e descrições
- Navegação intuitiva para subcategorias

#### 3.1.3 Página de Categoria
- Listagem de produtos da categoria selecionada
- Filtro de busca por nome ou descrição
- Alternância entre visualização em grid ou lista
- Navegação para subcategorias relacionadas

#### 3.1.4 Página de Detalhes do Produto
- Galeria de imagens com zoom
- Descrição detalhada e características do produto
- Listagem de benefícios/recursos
- Botão para contato via WhatsApp para orçamento
- Navegação para produtos relacionados

#### 3.1.5 Contato via WhatsApp
- Seletor de loja (Curitiba ou Londrina)
- Mensagem pré-formatada incluindo informações do produto
- Redirecionamento para o WhatsApp Web/App

#### 3.1.6 Páginas Institucionais
- Sobre a empresa
- Contato

### 3.2 Backend (Área Administrativa)

#### 3.2.1 Autenticação
- Login seguro para administradores
- Proteção de rotas administrativas
- Gerenciamento de sessões

#### 3.2.2 Dashboard
- Visão geral com estatísticas (produtos, categorias, leads)
- Acesso rápido às principais funcionalidades

#### 3.2.3 Gerenciamento de Categorias
- CRUD completo para categorias e subcategorias
- Ordenação e ativação/desativação
- Upload de imagens

#### 3.2.4 Gerenciamento de Produtos
- CRUD completo para produtos
- Upload múltiplo de imagens com ordenação
- Editor WYSIWYG para descrições
- Marcação de produtos como destaque
- Associação com categorias/subcategorias

#### 3.2.5 Gerenciamento de Leads
- Visualização e filtro de leads recebidos
- Marcação de status (novo, em contato, convertido, etc.)
- Exportação de dados

#### 3.2.6 Configurações do Site
- Informações de contato (telefones, endereços)
- Metadados para SEO
- Configurações gerais

## 4. Arquitetura Técnica

### 4.1 Frontend
- **Framework**: React com TypeScript
- **Roteamento**: React Router v7
- **Estilização**: TailwindCSS
- **Gerenciamento de Estado**: Hooks do React e Zustand
- **Consultas de API**: React Query
- **Componentes de UI**: Componentes customizados com Lucide React para ícones
- **Notificações**: Sonner

### 4.2 Backend
- **Banco de Dados**: PostgreSQL via Supabase
- **Autenticação**: Supabase Auth
- **Armazenamento**: Supabase Storage para imagens
- **API**: Supabase API + Express para endpoints adicionais

### 4.3 Estrutura do Banco de Dados
- **Tabelas Principais**:
  - categories (categorias principais)
  - subcategories (subcategorias)
  - products (produtos)
  - product_images (imagens dos produtos)
  - admin_users (usuários administrativos)
  - leads (leads capturados)
  - site_settings (configurações do site)

## 5. Requisitos Não-Funcionais

### 5.1 Performance
- Tempo de carregamento inicial < 3 segundos
- Otimização de imagens para carregamento rápido
- Lazy loading para conteúdo abaixo da dobra

### 5.2 Segurança
- Autenticação segura para área administrativa
- Proteção contra ataques comuns (XSS, CSRF)
- Validação de dados em formulários

### 5.3 Usabilidade
- Interface responsiva para todos os dispositivos
- Acessibilidade seguindo diretrizes WCAG
- Feedback visual para ações do usuário

### 5.4 SEO
- URLs amigáveis com slugs
- Metadados customizáveis
- Estrutura semântica de HTML

## 6. Fluxos de Usuário

### 6.1 Visitante Buscando Produto
1. Acessa a página inicial
2. Navega para a seção de categorias
3. Seleciona uma categoria de interesse
4. Filtra ou busca produtos específicos
5. Visualiza detalhes do produto
6. Solicita orçamento via WhatsApp

### 6.2 Administrador Gerenciando Produtos
1. Acessa a área de login
2. Insere credenciais
3. Navega para a seção de produtos no dashboard
4. Adiciona novo produto ou edita existente
5. Preenche informações e faz upload de imagens
6. Salva alterações

## 7. Integrações

### 7.1 WhatsApp
- Integração direta com WhatsApp Web/App para contato
- Seletor de loja com números diferentes

### 7.2 Google Maps
- Exibição de localização das lojas na página de contato

## 8. Considerações de Implementação

### 8.1 Priorização de Funcionalidades
1. Estrutura básica do site e navegação
2. Catálogo de produtos e categorias
3. Detalhes de produto e contato via WhatsApp
4. Painel administrativo
5. Gerenciamento de leads

### 8.2 Estratégia de Lançamento
- Versão inicial com funcionalidades essenciais
- Iterações posteriores para recursos adicionais
- Testes de usabilidade com usuários reais

## 9. Métricas de Sucesso

- Número de visualizações de produtos
- Taxa de conversão (visualizações → contatos via WhatsApp)
- Tempo médio de permanência nas páginas de produtos
- Número de leads capturados
- Satisfação dos administradores com o painel de gestão

## 10. Limitações e Restrições

- Não inclui sistema de e-commerce completo (apenas catálogo)
- Integração com WhatsApp limitada aos recursos da API pública
- Gerenciamento de estoque não implementado na versão inicial