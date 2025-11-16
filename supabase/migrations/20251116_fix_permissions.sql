-- Verificar e garantir permissões para as tabelas categories e subcategories
-- Esta migration garante que os dados possam ser lidos corretamente

-- Garantir permissões de leitura para a tabela categories
GRANT SELECT ON categories TO anon;
GRANT SELECT ON categories TO authenticated;

-- Garantir permissões de leitura para a tabela subcategories  
GRANT SELECT ON subcategories TO anon;
GRANT SELECT ON subcategories TO authenticated;

-- Verificar políticas RLS (Row Level Security)
-- Para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura de categorias ativas para todos
DROP POLICY IF EXISTS "Permitir leitura de categorias ativas" ON categories;
CREATE POLICY "Permitir leitura de categorias ativas" ON categories
    FOR SELECT
    USING (active = true);

-- Para subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura de subcategorias ativas para todos
DROP POLICY IF EXISTS "Permitir leitura de subcategorias ativas" ON subcategories;
CREATE POLICY "Permitir leitura de subcategorias ativas" ON subcategories
    FOR SELECT
    USING (is_active = true);

-- Criar política para permitir leitura de subcategorias de categorias ativas
DROP POLICY IF EXISTS "Permitir leitura por categoria ativa" ON subcategories;
CREATE POLICY "Permitir leitura por categoria ativa" ON subcategories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = subcategories.category_id 
            AND categories.active = true
        )
    );