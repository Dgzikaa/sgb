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
}

export function usePermissions(): PermissionsHook {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    try {
      const userData = localStorage.getItem('sgb_user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const hasPermission = (moduloId: string): boolean => {
    if (!user || !user.ativo) return false
    
    // Admins têm acesso a tudo
    if (user.role === 'admin') return true
    
    // Verificar se o módulo está na lista de permissões
    return user.modulos_permitidos?.includes(moduloId) || false
  }

  const hasAnyPermission = (modulosIds: string[]): boolean => {
    if (!user || !user.ativo) return false
    
    // Admins têm acesso a tudo
    if (user.role === 'admin') return true
    
    // Verificar se tem pelo menos uma permissão
    return modulosIds.some(modulo => user.modulos_permitidos?.includes(modulo))
  }

  const isRole = (role: string): boolean => {
    return user?.role === role
  }

  const canAccessModule = (categoria: string): boolean => {
    if (!user || !user.ativo) return false
    
    // Admins têm acesso a tudo
    if (user.role === 'admin') return true
    
    // Mapear categorias para módulos
    const modulosPorCategoria: Record<string, string[]> = {
      'dashboards': ['dashboard_diario', 'dashboard_semanal', 'dashboard_mensal', 'dashboard_garcons'],
      'dados': ['produtos', 'receitas_insumos'],
      'terminal': ['terminal_producao'],
      'configuracao': ['configuracoes']
    }
    
    const modulosCategoria = modulosPorCategoria[categoria] || []
    return hasAnyPermission(modulosCategoria)
  }

  return {
    user,
    hasPermission,
    hasAnyPermission,
    isRole,
    canAccessModule,
    loading
  }
} 