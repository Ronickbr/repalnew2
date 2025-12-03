Roles
- super_admin: acesso total, todas as operações.
- admin: manage_settings, manage_users, manage_content, view_dashboard.
- editor: manage_content, view_dashboard.

Permissões
- manage_settings: alterar configurações do site, SEO, lojas.
- manage_users: gerenciar usuários administrativos.
- manage_content: CRUD de produtos, categorias, marcas, banners.
- view_dashboard: visualizar métricas e logs.

Controles
- Autenticação via JWT em cookie HttpOnly.
- CSRF obrigatório em POST/PUT/DELETE/PATCH nos endpoints administrativos.
- 2FA TOTP opcional e recomendada para administradores.
- Logs de atividades: activity_logs com admin_id, action, details, timestamp.

