import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'
import * as authHook from '../../hooks/useAuth'

describe('Login Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('valida campos vazios', async () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false,
      user: null,
      loading: false,
      logout: vi.fn(),
      isAdmin: false,
      hasPermission: vi.fn().mockReturnValue(false)
    } as any)

    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText(/preencha todos os campos/i)).toBeInTheDocument()
  })

  it('não envia login com email inválido', async () => {
    const login = vi.fn()
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      login,
      isAuthenticated: false,
      user: null,
      loading: false,
      logout: vi.fn(),
      isAdmin: false,
      hasPermission: vi.fn().mockReturnValue(false)
    } as any)

    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(login).not.toHaveBeenCalled()
    })
  })

  it('mostra erro de credenciais inválidas', async () => {
    const login = vi.fn().mockResolvedValue({ success: false, error: 'Credenciais inválidas' })
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      login,
      isAuthenticated: false,
      user: null,
      loading: false,
      logout: vi.fn(),
      isAdmin: false,
      hasPermission: vi.fn().mockReturnValue(false)
    } as any)
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText(/credenciais inválidas/i)).toBeInTheDocument()
  })

  it('fluxo com 2FA requerido', async () => {
    const login = vi.fn().mockResolvedValue({ success: true, requires2fa: true, tempToken: 'tmp' })
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      login,
      isAuthenticated: false,
      user: null,
      loading: false,
      logout: vi.fn(),
      isAdmin: false,
      hasPermission: vi.fn().mockReturnValue(false)
    } as any)
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByLabelText(/código 2fa/i)).toBeInTheDocument()
  })
})
