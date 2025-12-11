import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { table } from '../../lib/schema';
import { Search, Filter, Eye, KeyRound, User as UserIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at: string;
  last_sign_in_at?: string;
  source?: 'admin' | 'user';
}

interface Filters {
  name: string;
  email: string;
  status: '' | 'active' | 'inactive';
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ name: '', email: '', status: '' });
  const [sortBy, setSortBy] = useState<keyof User>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);
  const [resetting, setResetting] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createType, setCreateType] = useState<'admin' | 'user'>('admin');
  const [createForm, setCreateForm] = useState<{ name: string; email: string; role: string; is_active: boolean }>({ name: '', email: '', role: 'admin', is_active: true });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isSupabaseConfigured) {
        const [adminsRes, usersRes] = await Promise.all([
          supabase
            .from(table('admin_users'))
            .select('id,name,email,role,active,created_at')
            .order('name'),
          supabase
            .from(table('users'))
            .select('id,name,email,role,phone,avatar,is_active,created_at,last_login')
            .order('name')
        ]);

        const adminsError = (adminsRes as any).error;
        const usersError = (usersRes as any).error;
        if (adminsError && usersError) throw adminsError || usersError;

        const adminsData = (adminsRes as any).data || [];
        const usersData = (usersRes as any).data || [];

        const adminsNormalized: User[] = adminsData.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'admin',
          is_active: (u.active ?? true) !== false,
          created_at: u.created_at || new Date().toISOString(),
          last_sign_in_at: undefined,
          source: 'admin'
        }));

        const usersNormalized: User[] = usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'user',
          is_active: (u.is_active ?? true) !== false,
          created_at: u.created_at || new Date().toISOString(),
          last_sign_in_at: u.last_login || undefined,
          source: 'user'
        }));

        setUsers([...adminsNormalized, ...usersNormalized]);
      } else {
        const mockUsers: User[] = Array.from({ length: 23 }).map((_, i) => ({
          id: String(i + 1),
          name: `Usuário ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: i % 5 === 0 ? 'admin' : 'user',
          is_active: i % 3 !== 0,
          created_at: new Date(Date.now() - i * 86400000).toISOString(),
          last_sign_in_at: i % 4 === 0 ? undefined : new Date().toISOString(),
          source: i % 5 === 0 ? 'admin' : 'user'
        }));
        setUsers(mockUsers);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (filters.name.trim()) {
      const term = filters.name.toLowerCase();
      result = result.filter(u => (u.name || '').toLowerCase().includes(term));
    }
    if (filters.email.trim()) {
      const term = filters.email.toLowerCase();
      result = result.filter(u => (u.email || '').toLowerCase().includes(term));
    }
    if (filters.status) {
      const active = filters.status === 'active';
      result = result.filter(u => (u.is_active ?? true) === active);
    }
    result.sort((a, b) => {
      const aVal = (a[sortBy] ?? '').toString().toLowerCase();
      const bVal = (b[sortBy] ?? '').toString().toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [users, filters, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const onSort = (key: keyof User) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const openDetails = async (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setActivities([]);
    setActivitiesError(null);
    if (!isSupabaseConfigured) return;
    try {
      setActivitiesLoading(true);
      const { data, error } = await supabase
        .from(table('activity_logs'))
        .select('action,details,status,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setActivities(data || []);
    } catch (e) {
      setActivitiesError(e instanceof Error ? e.message : 'Erro ao carregar atividades');
    } finally {
      setActivitiesLoading(false);
    }
  };

  const openReset = (user: User) => {
    setShowResetModal(user);
  };

  const confirmResetPassword = async () => {
    if (!showResetModal) return;
    try {
      setResetting(true);
      if (isSupabaseConfigured) {
        await supabase.auth.resetPasswordForEmail(showResetModal.email);
      }
      setShowResetModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao resetar senha');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse" aria-live="polite" aria-busy="true">
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={fetchUsers}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-600 mt-1">Controle de acesso e permissões dos usuários do sistema</p>
          <div className="mt-4">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => { setShowCreateModal(true); setCreateType('admin'); setCreateForm({ name: '', email: '', role: 'admin', is_active: true }); setCreateErrors({}); }}
              aria-label="Criar usuário"
            >
              <Plus className="h-4 w-4" /> Criar Usuário
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-name">Nome</label>
              <div className="relative">
                <input
                  id="filter-name"
                  aria-label="Filtrar por nome"
                  type="text"
                  value={filters.name}
                  onChange={(e) => { setFilters(prev => ({ ...prev, name: e.target.value })); setCurrentPage(1); }}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-email">Email</label>
              <div className="relative">
                <input
                  id="filter-email"
                  aria-label="Filtrar por email"
                  type="text"
                  value={filters.email}
                  onChange={(e) => { setFilters(prev => ({ ...prev, email: e.target.value })); setCurrentPage(1); }}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-status">Status</label>
              <select
                id="filter-status"
                aria-label="Filtrar por status"
                value={filters.status}
                onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value as Filters['status'] })); setCurrentPage(1); }}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="page-size">Itens por página</label>
              <select
                id="page-size"
                aria-label="Itens por página"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => onSort('name')}
                    aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    Nome
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => onSort('email')}
                    aria-sort={sortBy === 'email' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => onSort('role')}
                    aria-sort={sortBy === 'role' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    Função
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => onSort('created_at')}
                    aria-sort={sortBy === 'created_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último acesso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user.source === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <span className={`inline-block h-2 w-2 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`} aria-hidden="true"></span>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50"
                          onClick={() => openDetails(user)}
                          aria-label={`Ver detalhes de ${user.name || user.email}`}
                        >
                          <Eye className="h-4 w-4" /> Detalhes
                        </button>
                        <a
                          href={`/perfil`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50"
                          aria-label={`Ver perfil de ${user.name || user.email}`}
                        >
                          <UserIcon className="h-4 w-4" /> Perfil
                        </a>
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border hover:bg-gray-50"
                          onClick={() => openReset(user)}
                          aria-label={`Resetar senha de ${user.name || user.email}`}
                        >
                          <KeyRound className="h-4 w-4" /> Resetar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-4" aria-label="Paginação de usuários">
              <div className="text-sm text-gray-600">Página {currentPage} de {totalPages}</div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md border disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md border disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Próxima página"
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDetailsModal && selectedUser && (
        <div role="dialog" aria-modal="true" aria-label="Detalhes do usuário" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedUser.name || selectedUser.email}</h3>
              <button className="px-3 py-1 rounded-md border" onClick={() => setShowDetailsModal(false)} aria-label="Fechar modal">Fechar</button>
            </div>
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="text-sm text-gray-900">{selectedUser.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Função</div>
                  <div className="text-sm text-gray-900">{selectedUser.role}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Criado em</div>
                  <div className="text-sm text-gray-900">{new Date(selectedUser.created_at).toLocaleString('pt-BR')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Último acesso</div>
                  <div className="text-sm text-gray-900">{selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="text-sm text-gray-900">{selectedUser.is_active ? 'Ativo' : 'Inativo'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Histórico de atividades</div>
                {activitiesLoading ? (
                  <div className="text-sm text-gray-600">Carregando...</div>
                ) : activitiesError ? (
                  <div className="text-sm text-red-600">{activitiesError}</div>
                ) : activities.length === 0 ? (
                  <div className="text-sm text-gray-600">Sem atividades registradas</div>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-auto">
                    {activities.map((a, idx) => (
                      <li key={idx} className="text-sm text-gray-800">
                        <span className="font-medium">{a.action}</span> — {a.status || 'ok'} — {new Date(a.created_at).toLocaleString('pt-BR')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Permissões</div>
                <div className="text-sm text-gray-800">{selectedUser.role === 'admin' ? 'manage_users, manage_content, view_dashboard' : selectedUser.role}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div role="dialog" aria-modal="true" aria-label="Confirmar reset de senha" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Resetar senha</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-800">Deseja enviar um email de recuperação para {showResetModal.email}?</p>
              <div className="flex items-center justify-end gap-2">
                <button className="px-3 py-1 rounded-md border" onClick={() => setShowResetModal(null)} aria-label="Cancelar">Cancelar</button>
                <button className="px-3 py-1 rounded-md bg-blue-600 text-white disabled:opacity-50" onClick={confirmResetPassword} disabled={resetting} aria-label="Confirmar reset">
                  {resetting ? 'Enviando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div role="dialog" aria-modal="true" aria-label="Criar usuário" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Criar Usuário</h3>
            </div>
            <div className="p-4 space-y-4">
              {createErrors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
                  {createErrors.submit}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="create-type">Tipo</label>
                <select
                  id="create-type"
                  value={createType}
                  onChange={(e) => {
                    const t = e.target.value as 'admin' | 'user'
                    setCreateType(t)
                    setCreateForm(f => ({ ...f, role: t === 'admin' ? 'admin' : 'user' }))
                  }}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Administrador</option>
                  <option value="user">Usuário</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="create-name">Nome</label>
                <input
                  id="create-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  aria-invalid={Boolean(createErrors.name)}
                  aria-errormessage={createErrors.name ? 'create-name-error' : undefined}
                />
                {createErrors.name && <div id="create-name-error" className="mt-1 text-xs text-red-600">{createErrors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="create-email">Email</label>
                <input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  aria-invalid={Boolean(createErrors.email)}
                  aria-errormessage={createErrors.email ? 'create-email-error' : undefined}
                />
                {createErrors.email && <div id="create-email-error" className="mt-1 text-xs text-red-600">{createErrors.email}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="create-role">Função</label>
                <select
                  id="create-role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {createType === 'admin' ? (
                    <>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </>
                  ) : (
                    <>
                      <option value="user">user</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="create-active"
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="create-active" className="text-sm text-gray-700">Ativo</label>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button className="px-3 py-1 rounded-md border" onClick={() => { setShowCreateModal(false); setCreateErrors({}); }} aria-label="Cancelar">Cancelar</button>
              <button
                className="px-3 py-1 rounded-md bg-blue-600 text-white disabled:opacity-50"
                onClick={async () => {
                  const errs: Record<string,string> = {}
                  if (!createForm.name.trim()) errs.name = 'Nome obrigatório'
                  if (!createForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errs.email = 'Email inválido'
                  setCreateErrors(errs)
                  if (Object.keys(errs).length > 0) return
                  try {
                    setCreating(true)
                    if (isSupabaseConfigured) {
                      const email = createForm.email.toLowerCase().trim()
                      if (createType === 'admin') {
                        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: 'temporario123' })
                        if (authError) throw authError
                        if (authData.user) {
                          const { error } = await supabase
                            .from(table('admin_users'))
                            .insert({ id: authData.user.id, name: createForm.name.trim(), email, role: createForm.role, active: createForm.is_active })
                          if (error) throw error
                        }
                      } else {
                        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: 'temporario123' })
                        if (authError) throw authError
                        if (authData.user) {
                          const { error: insertUserError } = await supabase
                            .from(table('users'))
                            .insert({ id: authData.user.id, name: createForm.name.trim(), email, role: createForm.role, is_active: createForm.is_active })
                          // Se a tabela não existir ou colunas divergirem, não falhar o fluxo
                          if (insertUserError) {
                            console.warn('Falha ao inserir em users:', insertUserError)
                          }
                        }
                      }
                      await fetchUsers()
                    } else {
                      const newUser: User = { id: Math.random().toString(36).slice(2), name: createForm.name.trim(), email: createForm.email.toLowerCase().trim(), role: createForm.role, is_active: createForm.is_active, created_at: new Date().toISOString(), source: createType, last_sign_in_at: undefined }
                      setUsers(prev => [newUser, ...prev])
                    }
                    setShowCreateModal(false)
                  } catch (e) {
                    setCreateErrors({ submit: e instanceof Error ? e.message : 'Falha ao criar usuário' })
                  } finally {
                    setCreating(false)
                  }
                }}
                disabled={creating}
                aria-label="Criar"
              >
                {creating ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
