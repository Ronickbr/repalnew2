Escopo
- Fluxos de login, 2FA, autorização por role, CSRF, proteção contra XSS/CSRF/SQLi.

Testes realizados
- Emissão de CSRF: GET /api/auth/csrf-token retorna token e cookie.
- Login dev: POST /api/auth/login com bypass ativo funciona e cria sessão.
- Acesso protegido com CSRF: POST /api/admin/products com X-CSRF-Token válido retorna sucesso.
- Bloqueio sem CSRF: POST /api/admin/products sem cabeçalho retorna 403.
- Proteção SEO e upload: endpoints exigem autenticação e role admin/super_admin.

Observações
- Helmet habilitado para cabeçalhos de segurança básicos.
- Cookies com SameSite=strict; JWT expira em 2h.
- Recomendado habilitar HTTPS e secure cookies em produção.

