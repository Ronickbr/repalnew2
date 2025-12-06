- A página d:\Sites\repalnew2\src\components\admin\ProductManager.tsx salva dados do produto diretamente nas tabelas products e product_images e lida com upload de imagens para o bucket products do Supabase Storage.
- O fluxo separa claramente: validação e preparo dos dados de formulário, processamento/validação de URLs de imagens (incluindo base64), persistência de produto (create/update), e persistência das imagens adicionais em tabela própria.
- A autorização de ação na UI usa hasPermission('manage_content') para gatear create/update, mas a efetiva permissão depende das políticas RLS do Supabase (detalhadas abaixo).
Fluxo de Dados (Salvar Produto)

- Submissão do formulário:
  - handleSubmit valida URLs de imagem já processadas e o resto do formulário, anuncia acessibilidade e decide entre createProduct e updateProduct conforme está editando: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:560–606 .
- Criação:
  - Checa permissão manage_content : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:608–613 .
  - Gera slug único com laço de verificação e fallback por timestamp: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:616–669 .
  - Monta productData sanitizado (tipos e trims), injeta image principal e metas de SEO: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:673–685 .
  - Insere em products e retorna o registro: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:687–696 .
  - Insere imagens adicionais em product_images com product_id , url e sort_order : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:699–707 .
- Atualização:
  - Monta productData (similar à criação), atualiza products por id com retorno expandindo categories(name) : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:720–747 .
  - Remove todas as imagens antigas ( delete where product_id = ... ): d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:759–765 .
  - Insere a nova lista de imagens adicionais, com tratamento de erro detalhado: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:774–801 .
- Exclusão:
  - Única: confirmDelete deleta por id : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:821–839 .
  - Em massa: confirmBulkDelete usa in('id', selectedProducts) : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:855–876 .
Fluxo de Imagens (Upload e Associação)

- Upload de múltiplos arquivos (input file):
  - Gera nome único, faz upload para storage.from('products').upload('product-images/...') , obtém URL pública via getPublicUrl , retorna a lista: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:151–181 e d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:172–176 .
  - Ao selecionar arquivos, chama handleFileUpload e adiciona ao estado unifiedImages : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:191–217 e d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:203–213 .
- Upload de base64 (quando URL excede o limite ou veio colada como data URI):
  - uploadBase64Image extrai MIME, converte para Blob , salva em product-images/ , lida com erros de RLS/bucket, e obtém URL pública: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:382–435 e d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:425–428 .
- Processamento de URL de imagem:
  - processImageUrl corta URLs muito longas; se base64, faz upload e retorna URL curta; senão remove query params não essenciais: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:437–487 .
- Sincronização com o form:
  - syncUnifiedImagesToFormData define a principal ( image ) como a primeira da lista e processa/valida adicionais, aplicando validateImageUrl : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:489–558 e d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:372–380 .
Validações e Sanitações

- Validação de URL de imagem com tamanho máximo (1024 chars) e mensagens específicas: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:372–380 .
- Normalizações de SEO e specifications antes de persistir: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:681–684 e d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:733–736 .
- Validações de formulário com feedback ARIA e notificações: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:582–591 .
Listagem e Conversão de Imagens

- Carrega produtos com product_images(url, sort_order) e mapeia para additional_images ordenadas para uso na UI: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:224–235 e d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:263–275 .
Políticas RLS (Row Level Security)

- Tabelas de produtos e imagens:
  - A UI utiliza supabase.auth e hasPermission('manage_content') para restringir uso, mas a efetiva execução depende das políticas RLS no Supabase. Recomendações típicas:
    - SELECT : aberto para anon / authenticated em products e product_images para catálogo público.
    - INSERT / UPDATE / DELETE : permitido apenas para authenticated com jwt contendo role IN ('admin','super_admin','editor') . Essas claims são lidas de user_metadata.role configurado no login: d:\Sites\repalnew2\src\hooks\useAuth.tsx:52–63 e d:\Sites\repalnew2\src\hooks\useAuth.tsx:90–97,109–137 .
  - Erros de RLS são detectados explicitamente no upload de imagens (mensagens com “row-level security”/“RLS”) e tratados com mensagens claras: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:415–418 e d:\Sites\repalnew2\src\services\productImageUpload.ts:130–133,299–301 .
- Storage (bucket products ):
  - Recomenda-se: leitura pública (objetos public ), escrita apenas para usuários authenticated com papel administrativo. A página faz upload em products/product-images/... e obtém publicUrl : d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:163–176 e d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:409–428 .
  - Erro de bucket ausente é tratado com mensagem “Bucket não encontrado”: d:\Sites\repalnew2\src\components\admin\ProductManager.tsx:419–422 . Há lógica semelhante e discussões de criação de bucket em banners: d:\Sites\repalnew2\src\hooks\useBanners.ts:292–334,357–379 .
- Bypass via Service Role (Server):
  - O backend tem endpoints administrativos que usam SUPABASE_SERVICE_ROLE_KEY para contornar RLS ao criar produtos (adequado para operações sensíveis): d:\Sites\repalnew2\server.js:347–396 e cliente de serviço: d:\Sites\repalnew2\server.js:51–61 .
  - A página ProductManager.tsx atualmente persiste direto via cliente web; se suas políticas RLS estiverem estritas, considere migrar create/update para esse endpoint /api/admin/products para maior confiabilidade.
Resumo Operacional

- Dados:
  - Criação/atualização usam supabase.from('products') com checks de permissão e sanitização.
  - Imagens adicionais persistem em product_images após a gravação do produto.
- Imagens:
  - Upload de arquivo e base64 para bucket products ; URL pública é guardada no banco.
  - URLs muito longas são encurtadas ou transformadas em uploads.
- RLS:
  - Necessário garantir políticas: leitura pública do catálogo, gravação restrita aos administradores autenticados; storage com escrita autenticada.
  - Erros de RLS são capturados e comunicados ao usuário com mensagens específicas.