## 2025-12-03

- Corrigido roteamento Vercel para preservar `/api/*` e evitar 405 durante login
- Consolidada função serverless para respeitar limite de 12 funções (plano Hobby)
- Adicionado CORS consistente e preflight OPTIONS
- Melhorado frontend (`apiFetchAny`) com timeout e mensagens de erro claras
- Criados/ajustados handlers: login, logout, me, verify-2fa, 2fa/enroll, csrf-token, admin/products, integrations
- Adicionados testes de UI para Login e integração básica

