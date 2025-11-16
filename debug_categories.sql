-- Debug: Verificar estrutura das categorias
SELECT 
  id,
  name,
  slug,
  parent_id,
  is_active,
  CASE 
    WHEN parent_id IS NULL THEN 'CATEGORIA PRINCIPAL'
    ELSE 'SUBCATEGORIA'
  END as tipo
FROM categories 
WHERE is_active = true
ORDER BY parent_id NULLS FIRST, name;