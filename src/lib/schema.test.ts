import { describe, it, expect } from 'vitest'
import { table, TABLES } from './schema'

describe('schema table mapping', () => {
  it('retorna o nome da tabela configurada', () => {
    expect(table('products')).toBe(TABLES.products)
    expect(table('categories')).toBe(TABLES.categories)
    expect(table('brands')).toBe(TABLES.brands)
  })

  it('permite extensão futura sem quebrar chamadas', () => {
    const keys: (keyof typeof TABLES)[] = [
      'products','categories','product_images','leads','brands','banners','profiles','site_settings','admin_users'
    ]
    for (const k of keys) {
      expect(typeof table(k)).toBe('string')
    }
  })
})