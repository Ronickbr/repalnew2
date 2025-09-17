-- Inserir usuário admin com senha 'admin123'
-- Primeiro, deletar usuário existente se houver
DELETE FROM admin_users WHERE email = 'admin@repal.com.br';

-- Inserir novo usuário admin
INSERT INTO admin_users (
  email,
  password_hash,
  name,
  role,
  active
) VALUES (
  'admin@repal.com.br',
  'admin123',
  'Administrador',
  'admin',
  true
);

-- Verificar se o usuário foi criado
SELECT email, name, role, active FROM admin_users WHERE email = 'admin@repal.com.br';