-- Teste de inserção na tabela site_settings

-- Primeiro, verificar se já existe algum registro
SELECT COUNT(*) as total_records FROM site_settings;

-- Se não existir nenhum registro, inserir um registro de teste
INSERT INTO site_settings (
    site_name, 
    site_description, 
    meta_title, 
    meta_description, 
    meta_keywords, 
    contact_email, 
    contact_phone, 
    address
) 
SELECT 
    'Site Teste',
    'Descrição do site teste',
    'Meta título teste',
    'Meta descrição teste',
    'palavras, chave, teste',
    'teste@exemplo.com',
    '(11) 99999-9999',
    'Endereço de teste'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- Verificar o resultado
SELECT * FROM site_settings;

-- Testar UPDATE
UPDATE site_settings 
SET site_name = 'Site Atualizado Teste', 
    updated_at = NOW()
WHERE id = (SELECT id FROM site_settings LIMIT 1);

-- Verificar se o UPDATE funcionou
SELECT * FROM site_settings;