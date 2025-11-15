import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryNav from './CategoryNav'

describe('CategoryNav', () => {
  it('renderiza categorias padrão', () => {
    render(<CategoryNav />)
    expect(screen.getAllByText('Açougue').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bar e Restaurante').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mobiliário em Inox').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Padaria e Confeitaria').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Refrigeração Comercial').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Utilidades Domésticas').length).toBeGreaterThan(0)
  })

  it('aceita lista de categorias via props', () => {
    const custom = [
      { id: 'c1', name: 'Categoria A' },
      { id: 'c2', name: 'Categoria B' },
    ]
    render(<CategoryNav categories={custom} />)
    expect(screen.getAllByText('Categoria A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Categoria B').length).toBeGreaterThan(0)
    expect(screen.queryByText('Açougue')).toBeNull()
  })
})