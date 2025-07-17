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
    // Carregar dados do usuário do localStorage
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
          // Dados do usuário carregados:
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

  const canAccessModule = (modulo: string): boolean => {
    if (!user || !user.ativo) return false
    
    // Mapeamento 1:1 - cada item da sidebar é um módulo individual
    const modulosSidebar: Record<string, string> = {
      // Navegação Principal
      'home': 'home',
      'checklists': 'checklists',
      'checklists_abertura': 'checklists_abertura',
      
      // Operações
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
      
      // Visão Geral  
      'visao_geral_diario': 'visao_geral_diario',
      'visao_geral_comparativo': 'visao_geral_comparativo',
      'visao_geral_garcons': 'visao_geral_garcons',
      'visao_geral_metricas': 'visao_geral_metricas',
      'visao_geral_financeiro_mensal': 'visao_geral_financeiro_mensal',
      
      // Funcionário
      'funcionario_checklists': 'funcionario_checklists',
      
      // Configurações
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

  // Função para atualizar dados do usuário do servidor
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
          console.log('Dados do usuário atualizados:', userData.user.nome)
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error)
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
    safeLocalStorage.setItem('sgb_user', JSON.stringify(updatedUser))
    
    // Disparar evento personalizado para notificar outros componentes
    if (isClient) {
      window.dispatchEvent(new CustomEvent('userDataUpdated'))
    }
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

