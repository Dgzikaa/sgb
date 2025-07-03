'use client'

import { useState, useTransition, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useBarLogo } from '@/hooks/useBarLogo'
import { useUserInfo } from '@/hooks/useUserInfo'
import { useBar } from '@/contexts/BarContext'
import { usePermissions } from '@/hooks/usePermissions'

interface MenuItem {
  id: string
  label: string
  icon: string
  route: string
  requiredModule?: string | null
  requiredRole?: 'admin' | 'manager' | 'funcionario'
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  barInfo: {
    nome: string
    avatar?: string
  } | null
}

export default function Sidebar({ isOpen, onToggle, barInfo }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { logoUrl, shouldUseLogo } = useBarLogo({ barName: barInfo?.nome, size: 'medium' })
  const { userInfo, isLoading: userLoading, roleDisplayName } = useUserInfo()
  const { resetBars } = useBar()
  const { hasPermission, isRole, canAccessModule } = usePermissions()

  // Definir todos os itens do menu com suas permissões
  const allMenuItems = useMemo((): MenuItem[] => [
    { id: 'home', label: 'Início', icon: '🏠', route: '/dashboard', requiredModule: null },
  ], [])

  const allDashboardItems = useMemo((): MenuItem[] => [
    { id: 'diario', label: 'Diário', icon: '📅', route: '/dashboard/dashboards/diario', requiredModule: 'dashboard_diario' },
    { id: 'semanal', label: 'Semanal', icon: '📊', route: '/dashboard/dashboards/semanal', requiredModule: 'dashboard_semanal' },
    { id: 'financeiro-mensal', label: 'Financeiro Mensal', icon: '💰', route: '/dashboard/dashboards/financeiro-mensal', requiredModule: 'dashboard_mensal' },
    { id: 'metrica-evolucao', label: 'Evolução por Métrica', icon: '📈', route: '/dashboard/dashboards/metrica-evolucao', requiredModule: 'dashboard_mensal' },
    { id: 'metricas-barras', label: 'Métricas Mensais', icon: '📊', route: '/dashboard/dashboards/metricas-barras', requiredModule: 'dashboard_mensal' },
    { id: 'comparativo', label: 'Dashboard Comparativo', icon: '🔍', route: '/dashboard/dashboards/comparativo', requiredModule: 'dashboard_diario' },
    { id: 'garcons', label: 'Garçons', icon: '👨‍🍳', route: '/dashboard/dashboards/garcons', requiredModule: 'dashboard_garcons' },
    { id: 'recorrencia', label: 'Recorrência de Clientes', icon: '👥', route: '/dashboard/recorrencia', requiredModule: 'dashboard_diario' },
    { id: 'planejamento', label: 'Planejamento', icon: '🎵', route: '/dashboard/planejamento', requiredModule: 'dashboard_diario' },
    { id: 'configuracoes', label: 'Configurações', icon: '⚙️', route: '/dashboard/dashboards/configuracoes', requiredModule: 'configuracoes' },
  ], [])

  const allDataItems = useMemo((): MenuItem[] => [
    { id: 'produtos', label: 'Produtos', icon: '🍽️', route: '/dashboard/produtos', requiredModule: 'produtos' },
    { id: 'receitas', label: 'Receitas & Insumos', icon: '🧪', route: '/dashboard/receitas', requiredModule: 'receitas_insumos' },
    { id: 'terminal-producao', label: 'Terminal de Produção', icon: '🏭', route: '/dashboard/terminal-producao', requiredModule: 'terminal_producao' },
    { id: 'relatorio-produtos', label: 'Relatório de Produtos', icon: '⏱️', route: '/dashboard/dados/relatorio-produtos', requiredModule: 'produtos' },
    { id: 'relatorio-producoes', label: 'Relatório de Produções', icon: '📊', route: '/dashboard/relatorios/producoes', requiredModule: 'terminal_producao' },
    { id: 'teste-importacao', label: 'Teste Importação', icon: '🧪', route: '/teste-importacao', requiredRole: 'admin' },
  ], [])

  const allIntegracaoItems = useMemo((): MenuItem[] => [
    { id: 'contaazul', label: 'ContaAzul', icon: '🔗', route: '/dashboard/integracoes/contaazul', requiredRole: 'admin' },
  ], [])

  // Filtrar itens baseado nas permissões do usuário
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      if (!item.requiredModule) return true // Item público
      return hasPermission(item.requiredModule)
    })
  }, [allMenuItems, hasPermission])

  const dashboardItems = useMemo(() => {
    return allDashboardItems.filter(item => {
      if (item.requiredRole && !isRole(item.requiredRole)) return false
      if (item.requiredModule && !hasPermission(item.requiredModule)) return false
      return true
    })
  }, [allDashboardItems, hasPermission, isRole])

  const dataItems = useMemo(() => {
    return allDataItems.filter(item => {
      if (item.requiredRole && !isRole(item.requiredRole)) return false
      if (item.requiredModule && !hasPermission(item.requiredModule)) return false
      return true
    })
  }, [allDataItems, hasPermission, isRole])

  const integracaoItems = useMemo(() => {
    return allIntegracaoItems.filter(item => {
      if (item.requiredRole && !isRole(item.requiredRole)) return false
      if (item.requiredModule && !hasPermission(item.requiredModule)) return false
      return true
    })
  }, [allIntegracaoItems, hasPermission, isRole])

  const handleLogout = useCallback(async () => {
    try {
      // Limpar dados de autenticação do localStorage
      localStorage.removeItem('sgb_user')
      localStorage.removeItem('sgb_bars')
      localStorage.removeItem('selectedBarId')
      
      // Resetar contexto de bares
      resetBars()
      
      console.log('✅ Logout realizado com sucesso - dados limpos')
      
      startTransition(() => {
        router.push('/')
      })
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, tentar limpar e redirecionar
      localStorage.clear()
      resetBars()
      router.push('/')
    }
  }, [router, resetBars])

  const handleMenuClick = useCallback((route: string) => {
    try {
      // Verificar se já estamos na rota para evitar navegação desnecessária
      if (pathname === route || isPending) {
        return
      }

      // Usar transition para navegação mais suave
      startTransition(() => {
        router.push(route)
      })
      
      // Fechar sidebar no mobile após navegar (com timeout para evitar conflitos)
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          onToggle()
        }, 150)
      }
    } catch (error) {
      console.error('Erro na navegação:', error)
    }
  }, [pathname, isPending, router, onToggle])

  // Memoizar o componente de botão para evitar re-renders
  const renderMenuButton = useCallback((item: any, isActive: boolean) => (
    <button
      key={item.id}
      onClick={() => handleMenuClick(item.route)}
      disabled={isPending}
      className={`
        w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-200 disabled:opacity-50
        ${isActive 
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' 
          : 'text-slate-600 hover:bg-gray-50 hover:text-slate-800'
        }
      `}
    >
      <span className="text-xl">{item.icon}</span>
      <span className="font-medium">{item.label}</span>
      {isActive && (
        <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full"></div>
      )}
    </button>
  ), [handleMenuClick, isPending])

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200/50 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-50
      `}>
        <div className="flex flex-col h-full">
          {/* Header do Sidebar - Informações do Usuário */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Avatar do Usuário */}
                {userLoading ? (
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
                ) : userInfo ? (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    {userInfo.avatar ? (
                      <img 
                        src={userInfo.avatar} 
                        alt={userInfo.nome}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-white text-xl font-bold">
                        {userInfo.nome?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '👤'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">⚠️</span>
                  </div>
                )}
                
                <div className="flex-1">
                  {userLoading ? (
                    <div>
                      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  ) : userInfo ? (
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg leading-tight">
                        {userInfo.nome || 'Usuário'}
                      </h2>
                      <p className="text-slate-500 text-sm">{roleDisplayName || userInfo.role}</p>
                    </div>
                  ) : (
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg leading-tight">Erro ao carregar</h2>
                      <p className="text-slate-500 text-sm">Dados do usuário</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botão fechar no mobile */}
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {/* Menu Principal */}
            {menuItems.map((item) => {
              const isActive = pathname === item.route
              return renderMenuButton(item, isActive)
            })}

            {/* Dashboards */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pb-2">
                Dashboards
              </h3>
              <div className="space-y-1">
                {dashboardItems.map((item) => {
                  const isActive = pathname === item.route
                  return renderMenuButton(item, isActive)
                })}
              </div>
            </div>

            {/* Dados - Oculto quando não há itens */}
            {dataItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pb-2">
                  Dados
                </h3>
                <div className="space-y-1">
                  {dataItems.map((item) => {
                    const isActive = pathname === item.route
                    return renderMenuButton(item, isActive)
                  })}
                </div>
              </div>
            )}

            {/* Integrações */}
            {integracaoItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pb-2">
                  Integrações
                </h3>
                <div className="space-y-1">
                  {integracaoItems.map((item) => {
                    const isActive = pathname === item.route
                    return renderMenuButton(item, isActive)
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* Footer com Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 