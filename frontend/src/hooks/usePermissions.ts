import { useState, useEffect } from 'react'

interface Usuario {
  id: number
  email: string
  nome: string
  role: 'admin' | 'manager' | 'funcionario'
  modulos_permitidos: string[]
  ativo: boolean
}

interface PermissionsHook {
  user: Usuario | null
  hasPermission: (moduloId: string) => boolean
  hasAnyPermission: (modulosIds: string[]) => boolean
  isRole: (role: string) => boolean
  canAccessModule: (categoria: string) => boolean
  loading: boolean
  refreshUserData: () => Promise<void>
  updateUserPermissions: (newPermissions: string[]) => void
  isAdminWithSpecificPermissions: () => boolean
}

export function usePermissions(): PermissionsHook {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('sgb_user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          // console.log('🔄 Dados do usuário carregados:', parsedUser.nome, 'Permissões:', parsedUser.modulos_permitidos)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    // Carregar dados iniciais
    loadUserData()

    // Listener para detectar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sgb_user' && e.newValue) {
        loadUserData()
      }
    }

    // Listener customizado para mudanças internas
    const handleCustomStorageChange = () => {
      loadUserData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userDataUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userDataUpdated', handleCustomStorageChange)
    }
  }, [])

  const hasPermission = (moduloId: string): boolean => {
    if (!user || !user.ativo) {
      return false
    }
    
    // Se admin tem permissões específicas configuradas, respeitar elas
    // Caso contrário, admin tem acesso a tudo (comportamento padrão)
    if (user.role === 'admin') {
      // Se o admin tem permissões explicitamente configuradas (não todas), usar elas
      const hasExplicitPermissions = user.modulos_permitidos && user.modulos_permitidos.length < 23 // Total de módulos
      if (hasExplicitPermissions) {
        return user.modulos_permitidos.includes(moduloId)
      }
      // Admin sem permissões específicas = acesso total
      return true
    }
    
    // Verificar se o módulo está na lista de permissões
    return user.modulos_permitidos?.includes(moduloId) || false
  }

  const hasAnyPermission = (modulosIds: string[]): boolean => {
    if (!user || !user.ativo) return false
    
    // Se admin tem permissões específicas configuradas, respeitar elas
    if (user.role === 'admin') {
      const hasExplicitPermissions = user.modulos_permitidos && user.modulos_permitidos.length < 23
      if (hasExplicitPermissions) {
        return modulosIds.some(modulo => user.modulos_permitidos?.includes(modulo))
      }
      return true
    }
    
    // Verificar se tem pelo menos uma permissão
    return modulosIds.some(modulo => user.modulos_permitidos?.includes(modulo))
  }

  const isRole = (role: string): boolean => {
    return user?.role === role
  }

  const canAccessModule = (categoria: string): boolean => {
    if (!user || !user.ativo) return false
    
    // Mapear categorias para módulos (atualizado para nova estrutura)
    const modulosPorCategoria: Record<string, string[]> = {
      'dashboards': ['dashboard_diario', 'dashboard_semanal', 'dashboard_mensal', 'dashboard_financeiro_mensal', 'dashboard_metrica_evolucao', 'dashboard_metricas_barras', 'dashboard_comparativo', 'dashboard_garcons'],
      'operacoes': ['produtos', 'recorrencia', 'planejamento', 'tempo', 'periodo'],
      'producao': ['receitas_insumos', 'terminal_producao', 'relatorio_producoes'],
      'relatorios': ['relatorio_produtos', 'analitico', 'fatporhora', 'nfs', 'pagamentos'],
      'configuracao': ['configuracoes', 'integracoes']
    }
    
    const modulosCategoria = modulosPorCategoria[categoria] || []
    return hasAnyPermission(modulosCategoria)
  }

  // Função para atualizar dados do usuário do servidor
  const refreshUserData = async (): Promise<void> => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/usuarios/${user.id}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData.success && userData.user) {
          // Atualizar localStorage
          localStorage.setItem('sgb_user', JSON.stringify(userData.user))
          setUser(userData.user)
          console.log('✅ Dados do usuário atualizados:', userData.user.nome)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar apenas as permissões localmente
  const updateUserPermissions = (newPermissions: string[]): void => {
    if (!user) return
    
    const updatedUser = {
      ...user,
      modulos_permitidos: newPermissions
    }
    
    // Atualizar estado local
    setUser(updatedUser)
    
    // Atualizar localStorage
    localStorage.setItem('sgb_user', JSON.stringify(updatedUser))
    
    // Disparar evento personalizado para notificar outros componentes
    window.dispatchEvent(new CustomEvent('userDataUpdated'))
  }

  // Função para detectar se admin está usando permissões específicas
  const isAdminWithSpecificPermissions = (): boolean => {
    if (!user || user.role !== 'admin') return false
    return user.modulos_permitidos && user.modulos_permitidos.length < 23
  }

  return {
    user,
    hasPermission,
    hasAnyPermission,
    isRole,
    canAccessModule,
    loading,
    refreshUserData,
    updateUserPermissions,
    isAdminWithSpecificPermissions
  }
} 