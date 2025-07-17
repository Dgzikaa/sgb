import { useState, useEffect } from 'react'
import { safeLocalStorage, isClient } from '@/lib/client-utils'

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
    // Carregar dados do usuá¡rio do localStorage
    const loadUserData = () => {
      if (!isClient) {
        setLoading(false)
        return
      }
      
      try {
        const userData = safeLocalStorage.getItem('sgb_user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          // console.log('ðŸ”„ Dados do usuá¡rio carregados:', parsedUser.nome, 'Permissáµes:', parsedUser.modulos_permitidos)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuá¡rio:', error)
      } finally {
        setLoading(false)
      }
    }

    // Carregar dados iniciais
    loadUserData()

    // Listener para detectar mudaná§as no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sgb_user' && e.newValue) {
        loadUserData()
      }
    }

    // Listener customizado para mudaná§as internas
    const handleCustomStorageChange = () => {
      loadUserData()
    }

    if (isClient) {
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('userDataUpdated', handleCustomStorageChange)
    }

    return () => {
      if (isClient) {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('userDataUpdated', handleCustomStorageChange)
      }
    }
  }, [])

  const hasPermission = (moduloId: string): boolean => {
    if (!user || !user.ativo) {
      return false
    }
    
    // Se admin tem permissáµes especá­ficas configuradas, respeitar elas
    // Caso contrá¡rio, admin tem acesso a tudo (comportamento padrá£o)
    if (user.role === 'admin') {
      // Se o admin tem permissáµes explicitamente configuradas (ná£o todas), usar elas
      const hasExplicitPermissions = user.modulos_permitidos && user.modulos_permitidos.length < 23 // Total de má³dulos
      if (hasExplicitPermissions) {
        return user.modulos_permitidos.includes(moduloId)
      }
      // Admin sem permissáµes especá­ficas = acesso total
      return true
    }
    
    // Verificar se o má³dulo está¡ na lista de permissáµes
    return user.modulos_permitidos?.includes(moduloId) || false
  }

  const hasAnyPermission = (modulosIds: string[]): boolean => {
    if (!user || !user.ativo) return false
    
    // Se admin tem permissáµes especá­ficas configuradas, respeitar elas
    if (user.role === 'admin') {
      const hasExplicitPermissions = user.modulos_permitidos && user.modulos_permitidos.length < 23
      if (hasExplicitPermissions) {
        return modulosIds.some(modulo => user.modulos_permitidos?.includes(modulo))
      }
      return true
    }
    
    // Verificar se tem pelo menos uma permissá£o
    return modulosIds.some(modulo => user.modulos_permitidos?.includes(modulo))
  }

  const isRole = (role: string): boolean => {
    return user?.role === role
  }

  const canAccessModule = (modulo: string): boolean => {
    if (!user || !user.ativo) return false
    
    // Mapeamento 1:1 - cada item da sidebar á© um má³dulo individual
    const modulosSidebar: Record<string, string> = {
      // Navegaá§á£o Principal
      'home': 'home',
      'checklists': 'checklists',
      'checklists_abertura': 'checklists_abertura',
      
      // Operaá§áµes
      'operacoes_checklist_abertura': 'operacoes_checklist_abertura', 
      'terminal_producao': 'terminal_producao',
      
      // Reservas
      'reservas': 'reservas',
      'reservas_recorrencia': 'reservas_recorrencia',
      
      // ContaAzul
      'contaazul_competencia': 'contaazul_competencia',
      
      // ContaHub
      'contahub_teste': 'contahub_teste',
      'contahub_tempo': 'contahub_tempo',
      'contahub_produtos': 'contahub_produtos', 
      'contahub_receitas': 'contahub_receitas',
      'contahub_periodo': 'contahub_periodo',
      'contahub_analitico': 'contahub_analitico',
      'contahub_pagamentos': 'contahub_pagamentos',
      'contahub_faturamento_hora': 'contahub_faturamento_hora',
      
      // Marketing
      'marketing_360': 'marketing_360',
      
      // Visá£o Geral  
      'visao_geral_diario': 'visao_geral_diario',
      'visao_geral_comparativo': 'visao_geral_comparativo',
      'visao_geral_garcons': 'visao_geral_garcons',
      'visao_geral_metricas': 'visao_geral_metricas',
      'visao_geral_financeiro_mensal': 'visao_geral_financeiro_mensal',
      
      // Funcioná¡rio
      'funcionario_checklists': 'funcionario_checklists',
      
      // Configuraá§áµes
      'configuracoes_checklists': 'configuracoes_checklists',
      'configuracoes_metas': 'configuracoes_metas',
      'configuracoes_integracoes': 'configuracoes_integracoes',
      'configuracoes_seguranca': 'configuracoes_seguranca',
      'configuracoes_whatsapp': 'configuracoes_whatsapp',
      'configuracoes_contahub_auto': 'configuracoes_contahub_auto',
      'configuracoes_meta_config': 'configuracoes_meta_config',
      'configuracoes_templates': 'configuracoes_templates'
    }
    
    const moduloId = modulosSidebar[modulo] || modulo
    return hasPermission(moduloId)
  }

  // Funá§á£o para atualizar dados do usuá¡rio do servidor
  const refreshUserData = async (): Promise<void> => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/usuarios/${user.id}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData.success && userData.user) {
          // Atualizar localStorage
          safeLocalStorage.setItem('sgb_user', JSON.stringify(userData.user))
          setUser(userData.user)
          console.log('œ… Dados do usuá¡rio atualizados:', userData.user.nome)
        }
      }
    } catch (error) {
      console.error('Œ Erro ao atualizar dados do usuá¡rio:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funá§á£o para atualizar apenas as permissáµes localmente
  const updateUserPermissions = (newPermissions: string[]): void => {
    if (!user) return
    
    const updatedUser = {
      ...user,
      modulos_permitidos: newPermissions
    }
    
    // Atualizar estado local
    setUser(updatedUser)
    
    // Atualizar localStorage
    safeLocalStorage.setItem('sgb_user', JSON.stringify(updatedUser))
    
    // Disparar evento personalizado para notificar outros componentes
    if (isClient) {
      window.dispatchEvent(new CustomEvent('userDataUpdated'))
    }
  }

  // Funá§á£o para detectar se admin está¡ usando permissáµes especá­ficas
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
