# Política de Upload de Imagens para Produtos

## Visão Geral
Esta política define os requisitos técnicos e de segurança para upload de imagens de produtos no sistema, garantindo qualidade, segurança e performance.

## Especificações Técnicas

### 1. Formatos de Imagem Permitidos
- **JPEG/JPG** - Recomendado para fotos
- **PNG** - Para imagens com transparência
- **WebP** - Para melhor compressão
- **GIF** - Para imagens animadas (limitado)

### 2. Dimensões e Tamanhos

#### Imagem Principal (Produto)
- **Dimensões mínimas:** 300x300 pixels
- **Dimensões máximas:** 4000x4000 pixels
- **Tamanho máximo:** 10MB
- **Proporção recomendada:** 1:1 (quadrado)
- **Tolerância de proporção:** 20%

#### Imagens Adicionais
- **Dimensões mínimas:** 200x200 pixels
- **Dimensões máximas:** 4000x4000 pixels
- **Tamanho máximo:** 10MB
- **Proporção recomendada:** 4:3
- **Tolerância de proporção:** 50%

### 3. Requisitos de Qualidade
- Resolução mínima de 72 DPI
- Qualidade JPEG mínima de 80%
- Sem artefatos de compressão visíveis
- Boa iluminação e foco

## Processo de Validação

### 1. Verificação de Segurança
- **Verificação de tipo MIME** - Confirma que o arquivo é realmente uma imagem
- **Sanitização de nome** - Remove caracteres especiais e espaços
- **Detecção de malware** - Verifica por padrões suspeitos
- **Validação de metadados** - Remove dados EXIF sensíveis

### 2. Validação Técnica
- **Verificação de formato** - Confirma extensão vs MIME type
- **Validação de dimensões** - Verifica largura e altura
- **Verificação de tamanho** - Confirma limite de 10MB
- **Análise de proporção** - Verifica se está dentro dos limites aceitáveis

### 3. Validação de Conteúdo
- **Verificação de integridade** - Confirma que a imagem não está corrompida
- **Análise de qualidade** - Detecta compressão excessiva
- **Verificação de transparência** - Identifica PNGs/GIFs com alpha channel

## Tratamento de Erros

### Erros de Validação
1. **Formato inválido:** "Formato de arquivo não permitido. Formatos aceitos: JPEG, PNG, WebP, GIF"
2. **Tamanho excedido:** "Arquivo muito grande. Tamanho máximo permitido: 10MB"
3. **Dimensões inválidas:** "Imagem muito pequena. Dimensão mínima: 300x300 pixels"
4. **Proporção inadequada:** "Proporção da imagem fora do padrão recomendado"

### Erros de Upload
1. **Erro de RLS:** "Erro de permissão no servidor. Por favor, entre em contato com o suporte."
2. **Erro de rede:** "Erro de conexão. Verifique sua internet e tente novamente."
3. **Erro de bucket:** "Erro de configuração no servidor. Por favor, entre em contato com o suporte."
4. **Erro de autenticação:** "Você precisa estar autenticado para fazer upload de imagens."

### Avisos
1. **Imagem grande:** "Imagem grande pode afetar o carregamento da página"
2. **Imagem fora de proporção:** "Imagem fora da proporção recomendada pode ser redimensionada"
3. **Qualidade baixa:** "Imagem com qualidade baixa pode afetar a apresentação do produto"

## Logs e Monitoramento

### Informações Registradas
- Timestamp do upload
- Nome original do arquivo
- Tamanho e tipo do arquivo
- Resultado da validação (erros e avisos)
- ID do usuário
- User Agent do navegador
- Tempo de processamento
- URL final da imagem

### Níveis de Log
- **INFO:** Uploads bem-sucedidos
- **WARNING:** Validações com avisos
- **ERROR:** Uploads falhados
- **DEBUG:** Detalhes técnicos para troubleshooting

## Boas Práticas para Usuários

### Preparação da Imagem
1. **Edição básica:** Ajustar brilho, contraste e saturação se necessário
2. **Corte adequado:** Centralizar o produto na imagem
3. **Fundo limpo:** Usar fundo neutro e sem distrações
4. **Múltiplos ângulos:** Capturar diferentes perspectivas do produto

### Otimização
1. **Compressão adequada:** Balancear qualidade e tamanho do arquivo
2. **Formato adequado:** Usar JPEG para fotos, PNG para gráficos
3. **Dimensões corretas:** Seguir as proporções recomendadas
4. **Nome descritivo:** Usar nomes que descrevam o produto

## Troubleshooting

### Problemas Comuns

#### "Erro de permissão no servidor"
**Causa:** Problemas com políticas de segurança (RLS) no Supabase
**Solução:** Verificar configurações do bucket e permissões do usuário

#### "Formato de arquivo não permitido"
**Causa:** Arquivo com extensão ou MIME type inválido
**Solução:** Converter imagem para formato suportado (JPEG, PNG, WebP)

#### "Imagem muito pequena"
**Causa:** Dimensões abaixo do mínimo permitido
**Solução:** Usar imagem com pelo menos 300x300 pixels

#### "Upload falha repetidamente"
**Causa:** Problemas de conexão ou configuração
**Solução:** Verificar conexão de internet e tamanho do arquivo

### Dicas de Debug
1. Verificar console do navegador para logs detalhados
2. Confirmar que o usuário está autenticado
3. Verificar se o bucket 'products' existe e está configurado
4. Testar com imagens menores para isolar problemas de tamanho

## Exemplos de Imagens Válidas

### Imagem Principal Ideal
- **Formato:** JPEG
- **Dimensões:** 800x800 pixels
- **Tamanho:** 200KB
- **Proporção:** 1:1 (quadrado perfeito)
- **Conteúdo:** Produto centralizado, fundo branco

### Imagem Adicional Ideal
- **Formato:** JPEG
- **Dimensões:** 1200x900 pixels
- **Tamanho:** 300KB
- **Proporção:** 4:3
- **Conteúdo:** Produto em uso ou diferentes ângulos

## Manutenção e Atualizações

### Revisões Periódicas
- Verificar logs de erro para padrões
- Atualizar limites de tamanho conforme necessário
- Ajustar políticas de segurança
- Revisar formatos suportados

### Métricas de Sucesso
- Taxa de sucesso de uploads > 95%
- Tempo médio de upload < 5 segundos
- Tamanho médio de imagem otimizado
- Satisfação do usuário com o processo