# Script para fazer deploy do projeto Repal Equipamentos para o GitHub
# Execute este script no PowerShell para fazer o push do código

Write-Host "🚀 Iniciando deploy do projeto Repal Equipamentos para o GitHub..." -ForegroundColor Green

# Verificar se o Git está instalado
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não está instalado. Por favor, instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se estamos no diretório correto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Este script deve ser executado no diretório raiz do projeto." -ForegroundColor Red
    exit 1
}

# Inicializar repositório Git se não existir
if (!(Test-Path ".git")) {
    Write-Host "📁 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    git branch -M master
}

# Adicionar remote origin se não existir
$remoteUrl = "https://github.com/Ronickbr/repalnew2.git"
$existingRemote = git remote get-url origin 2>$null
if (!$existingRemote) {
    Write-Host "🔗 Adicionando remote origin..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
} elseif ($existingRemote -ne $remoteUrl) {
    Write-Host "🔄 Atualizando remote origin..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
}

# Criar e mudar para o branch de desenvolvimento
Write-Host "🌿 Criando branch de desenvolvimento..." -ForegroundColor Yellow
git checkout -b desenvolvimento 2>$null
if ($LASTEXITCODE -ne 0) {
    git checkout desenvolvimento
}

# Adicionar todos os arquivos
Write-Host "📦 Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add .

# Fazer commit com mensagem detalhada
$commitMessage = @"
feat: Implementação completa do site Repal Equipamentos

🎯 Funcionalidades principais:
- Sistema de catálogo de produtos com categorias hierárquicas
- Menu dropdown interativo com produtos em destaque
- Integração com Supabase para gerenciamento de dados
- Interface responsiva com Tailwind CSS
- Sistema de administração completo
- Formulário de contato integrado
- Componentes reutilizáveis em React/TypeScript

🛠️ Tecnologias utilizadas:
- React 18 + TypeScript
- Vite para build e desenvolvimento
- Tailwind CSS para estilização
- Supabase para backend e banco de dados
- React Query para gerenciamento de estado
- React Router para navegação

🏗️ Estrutura do projeto:
- /src/components: Componentes React reutilizáveis
- /src/pages: Páginas principais da aplicação
- /src/hooks: Custom hooks para lógica de negócio
- /src/lib: Configurações e utilitários
- /supabase: Migrações e configurações do banco
- /public: Assets estáticos e imagens

✨ Melhorias implementadas:
- Limpeza de código e remoção de dependências não utilizadas
- Otimização de performance e carregamento
- Sistema de produtos em destaque por categoria
- Interface de usuário moderna e intuitiva
- Código limpo e bem documentado

🔧 Configuração:
- Node.js 22.19.0
- npm run dev para desenvolvimento
- Suporte a Docker e Vercel para deploy
"@

Write-Host "💬 Fazendo commit..." -ForegroundColor Yellow
git commit -m $commitMessage

# Fazer push para o GitHub
Write-Host "🚀 Fazendo push para o GitHub..." -ForegroundColor Yellow
git push -u origin desenvolvimento

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Repositório: https://github.com/Ronickbr/repalnew2" -ForegroundColor Cyan
    Write-Host "🌿 Branch: desenvolvimento" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor White
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Acesse o repositório no GitHub" -ForegroundColor White
    Write-Host "2. Crie um Pull Request do branch 'desenvolvimento' para 'master'" -ForegroundColor White
    Write-Host "3. Revise as mudanças e faça o merge quando estiver pronto" -ForegroundColor White
} else {
    Write-Host "❌ Erro durante o push. Verifique suas credenciais do GitHub." -ForegroundColor Red
    Write-Host "💡 Dica: Você pode precisar configurar suas credenciais do Git:" -ForegroundColor Yellow
    Write-Host "   git config --global user.name 'Seu Nome'" -ForegroundColor White
    Write-Host "   git config --global user.email 'seu.email@exemplo.com'" -ForegroundColor White
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 Script finalizado!" -ForegroundColor Green