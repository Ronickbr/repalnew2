# Especificações para o Novo Site da Repal Equipamentos

## 1. Introdução

Este documento detalha as especificações para a criação de uma versão moderna e atualizada do site da Repal Equipamentos. O objetivo é aprimorar a experiência do usuário, otimizar a gestão de produtos e leads, e implementar um fluxo de solicitação de orçamento mais eficiente via WhatsApp.

## 2. Análise do Site Atual (https://www.repalequipamentos.com.br/)

O site atual da Repal Equipamentos serve como um catálogo online para seus produtos. A estrutura é funcional, mas apresenta oportunidades de modernização em termos de design, usabilidade e funcionalidades de backend. Observações:

*   **Design:** O design atual é datado e não reflete uma imagem moderna e dinâmica. A responsividade para dispositivos móveis pode ser aprimorada.
*   **Navegação:** A navegação é baseada em categorias de produtos, o que é adequado, mas a experiência de busca e filtragem pode ser mais intuitiva.
*   **Informações de Produto:** Os produtos são exibidos com imagens e descrições, mas a ausência de preços e a necessidade de contato direto para orçamento são pontos a serem otimizados com uma solução mais integrada.
*   **Contato:** As informações de contato são visíveis, mas o processo de solicitação de orçamento pode ser mais direto e automatizado.
*   **Backend:** O site atual parece ter um backend mais simples, sem funcionalidades robustas de administração de produtos ou gerenciamento de leads visíveis para o usuário final.

## 3. Arquitetura Proposta: Supabase como Backend

Para o novo site, propõe-se a utilização do Supabase como solução de backend. O Supabase oferece uma plataforma completa com banco de dados PostgreSQL, autenticação, APIs instantâneas e funções serverless, o que o torna uma excelente escolha para um desenvolvimento ágil e escalável [1, 2].

**Vantagens do Supabase:**

*   **Banco de Dados PostgreSQL:** Um banco de dados relacional robusto e amplamente utilizado, garantindo integridade e flexibilidade para os dados de produtos, clientes e leads.
*   **APIs Instantâneas:** O Supabase gera automaticamente APIs RESTful e GraphQL a partir do esquema do banco de dados, facilitando a integração com o frontend.
*   **Autenticação:** Sistema de autenticação pronto para uso, suportando diversos métodos (e-mail/senha, OAuth), essencial para a área de administração.
*   **Funções Edge (Serverless Functions):** Permite a execução de lógica de backend personalizada, ideal para processar solicitações de orçamento e integrar com serviços externos como o WhatsApp.
*   **Realtime:** Capacidade de receber atualizações em tempo real do banco de dados, o que pode ser útil para notificações internas ou atualizações de status.

## 4. Funcionalidades Essenciais

### 4.1. Administração de Produtos

Será desenvolvida uma interface de administração para que a equipe da Repal possa gerenciar os produtos de forma eficiente. Esta interface permitirá:

*   **Cadastro de Produtos:** Adicionar novos produtos com informações detalhadas (nome, descrição, categoria, imagens, especificações técnicas).
*   **Edição de Produtos:** Atualizar informações de produtos existentes.
*   **Exclusão de Produtos:** Remover produtos do catálogo.
*   **Gestão de Categorias:** Criar, editar e excluir categorias de produtos para uma organização eficaz.
*   **Upload de Imagens:** Ferramenta para upload e gerenciamento de múltiplas imagens por produto.

### 4.1.1. Estrutura da Categorias de Produtos

O sistema de administração de produtos deverá suportar a seguinte estrutura de categorias e subcategorias, conforme o catálogo fornecido:

*   **Refrigeração Comercial:** Bebedouros, Câmaras Frias, Cervejeiras, Expositores, Freezers Comerciais, Geladeiras Profissionais, Ilhas para Congelados, Visa-Coolers.

*   **Equipamentos para Bares e Restaurantes:** Batedores de Milk Shake, Cafeteiras Profissionais, Chapas a Gás e Elétricas, Cilindros de Massas, Cortadores de Legumes, Cutters, Descascadores de Batata, Estufas Quentes, Extratores de Suco, Fogões Industriais, Fornos Combinados, Fornos de Convecção, Fornos de Lastro, Fritadeiras Elétricas e a Gás, Lava-louças Industriais, Liquidificadores Profissionais, Mesas de Buffet, Micro-ondas Industrial, Moedores de Café, Moinhos de Pão, Processadores de Alimentos, Refresqueiras, Seladoras a Vácuo e de Embalagens, Torres de Chopp.

*   **Padaria e Confeitaria:** Amassadeiras, Batedeiras Industriais, Câmaras Climáticas, Cortadores de Frios, Divisoras de Massa, Fatiadeiras de Pão, Fornos Turbo, Modeladoras de Pão, Resfriadores de Água.

*   **Açougue:** Amassadores de Carne, Aplicadores de Filme, Assadores, Balanças Digitais e Mecânicas, Balcões Refrigerados para Açougue, Ensacadeiras de Linguiça, Moedores de Carne, Serras-Fita.

*   **Utensílios e Utilidades:** Copos e Taças, Cubas GN’s, Formas e Assadeiras, Jarras, Louças, Panelas Profissionais, Talheres, Travessas, Utensílios Diversos.

*   **Mobiliário em Inox:** Bancadas em Aço Inox, Carrinhos, Estantes, Lixeiras, Pias de Assepsia, Prateleiras.

*   **Peças e Componentes para Refrigeração:** Compressores, Conexões, Controladores, Evaporadores, Filtros, Forçadores de Ar, Gás Refrigerante, Isolamentos, Maçaricos, Peças de Reposição, Tubos de Cobre, Unidades Condensadoras, Válvulas, Ventiladores.

Cada produto deverá ser associado a uma ou mais categorias e possuir os campos de informação detalhados na seção 4.1 (nome, descrição, imagens, especificações técnicas).


### 4.2. Gerenciamento de Leads

Um sistema de gerenciamento de leads será integrado para acompanhar as solicitações de orçamento e o contato com os clientes. As funcionalidades incluirão:

*   **Captura de Leads:** Todas as solicitações de orçamento via WhatsApp serão registradas como leads no sistema.
*   **Visualização de Leads:** Dashboard para visualizar todos os leads, com informações como nome, contato, produtos de interesse e data da solicitação.
*   **Status do Lead:** Possibilidade de atualizar o status de cada lead (novo, em contato, orçado, fechado, perdido).
*   **Histórico de Interações:** Registro de anotações e interações com cada lead.

### 4.3. Solicitação de Orçamento via WhatsApp

Em vez de exibir valores nos produtos, o site apresentará um botão claro de 


"Solicitar Orçamento via WhatsApp" em cada página de produto. Ao clicar neste botão, o usuário será direcionado para uma conversa no WhatsApp com a equipe da Repal, com uma mensagem pré-preenchida contendo o nome do produto de interesse. Isso agiliza o processo de contato e facilita a conversão de leads.

## 5. Design e Experiência do Usuário (UX)

O novo site terá um design moderno, limpo e responsivo, garantindo uma excelente experiência em qualquer dispositivo (desktop, tablet, mobile). Serão priorizados:

*   **Interface Intuitiva:** Navegação clara e fácil, com menus bem organizados e busca eficiente.
*   **Estética Profissional:** As paletas de cores atuais do site serão mantidas para garantir a identidade visual da marca. Cores, tipografia e elementos visuais que transmitam confiança e modernidade, alinhados à identidade da Repal.
*   **Imagens de Alta Qualidade:** Produtos exibidos com fotos de alta resolução e, se possível, vídeos.
*   **Performance:** Otimização para carregamento rápido das páginas, essencial para a retenção de usuários e SEO.
## 5.1. Paleta de Cores

Para manter a identidade visual da Repal Equipamentos, as seguintes cores predominantes do site atual serão mantidas:

*   **Vermelho Escuro:** #8B0000 (aproximado)
*   **Azul Marinho:** #000080 (aproximado)
*   **Branco:** #FFFFFF
*   **Cinza (texto e elementos):** Variações de cinza, como #333333 para textos e #CCCCCC para bordas e fundos mais claros.
*   **Verde WhatsApp:** #25D366 (para o botão de solicitação de orçamento)

Esses códigos hexadecimais servem como referência para a recriação do design, garantindo a consistência visual com a marca existente.

## 6. Considerações Técnicas Adicionais

*   **Frontend:** A ser desenvolvido com uma tecnologia moderna como React, Vue.js ou Next.js, para garantir interatividade e escalabilidade.
*   **Hospedagem:** A ser definida, mas compatível com a arquitetura Supabase e o framework frontend escolhido.
*   **SEO:** O site será otimizado para motores de busca, com URLs amigáveis, meta tags e conteúdo relevante.
*   **Segurança:** Implementação de boas práticas de segurança para proteger os dados dos usuários e da empresa.

## 7. Conclusão

A modernização do site da Repal Equipamentos com um backend Supabase e foco em administração de produtos, gerenciamento de leads e solicitação de orçamento via WhatsApp trará benefícios significativos, incluindo uma melhor experiência para o cliente, otimização dos processos internos e aumento das oportunidades de negócio.
