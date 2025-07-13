'use client'

import { useState, useTransition, useCallback, useMemo, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useBar } from '@/contexts/BarContext'
import { usePermissions } from '@/hooks/usePermissions'
import { useSidebar } from '@/contexts/SidebarContext'

interface MenuItem {
  id: string
  label: string
  icon: string
  route: string
  requiredModule?: string | null
  requiredRole?: 'admin' | 'manager' | 'funcionario'
}

interface MenuSection {
  id: string
  title: string
  icon: string
  items: MenuItem[]
  defaultExpanded?: boolean
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
  const { resetBars, selectedBar, availableBars, setSelectedBar } = useBar()
  const { hasPermission, isRole, user } = usePermissions()
  const { isSidebarCollapsed, toggleSidebarCollapse } = useSidebar()
  const [showBarMenu, setShowBarMenu] = useState(false)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Estado para controlar quais seções estão expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    checklists: false,
    operacoes: false,
    reservas: false,
    contaazul: false,
    contahub: false,
    social: false,
    desempenho: false,
  })

  // Forçar re-renderização quando as permissões mudarem
  const [forceRender, setForceRender] = useState(0)
  
  useEffect(() => {
    setForceRender(prev => prev + 1)
  }, [user?.modulos_permitidos])

  // Toggle de seções
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Definir todas as seções do menu
  const allMenuSections = useMemo((): MenuSection[] => [
    // 📋 CHECKLISTS
    {
      id: 'checklists',
      title: 'Checklists',
      icon: '📋',
      items: [
        { id: 'funcionario-checklists', label: 'Meus Checklists', icon: '📝', route: '/funcionario/checklists', requiredModule: null },
        { id: 'checklist-abertura', label: 'Checklist Abertura', icon: '✅', route: '/checklists/abertura', requiredModule: 'operacoes' },
        { id: 'checklists-admin', label: 'Admin Checklists', icon: '🔧', route: '/configuracoes/checklists', requiredModule: 'operacoes', requiredRole: 'admin' },
        { id: 'templates', label: 'Templates', icon: '📄', route: '/configuracoes/templates', requiredModule: 'operacoes', requiredRole: 'admin' },
        { id: 'relatorios-checklists', label: 'Relatórios Checklists', icon: '📊', route: '/relatorios/checklists', requiredModule: 'operacoes', requiredRole: 'admin' },
      ]
    },

    // 🏭 OPERAÇÕES
    {
      id: 'operacoes',
      title: 'Operações',
      icon: '🏭',
      items: [
        { id: 'receitas', label: 'Receitas & Insumos', icon: '🧪', route: '/operacoes/receitas', requiredModule: 'receitas_insumos' },
        { id: 'terminal-producao', label: 'Terminal Produção', icon: '🏭', route: '/producao/terminal', requiredModule: 'terminal_producao' },
        { id: 'relatorio-producoes', label: 'Relatório Produções', icon: '📊', route: '/producao/relatorios/producoes', requiredModule: 'relatorio_producoes' },
      ]
    },

    // 🎫 RESERVAS
    {
      id: 'reservas',
      title: 'Reservas',
      icon: '🎫',
      items: [
        { id: 'recorrencia', label: 'Recorrência Clientes', icon: '👥', route: '/reservas/recorrencia', requiredModule: 'recorrencia' },
        { id: 'planejamento', label: 'Planejamento', icon: '🎵', route: '/operacoes/planejamento', requiredModule: 'planejamento' },
      ]
    },

    // 🔗 CONTA AZUL
    {
      id: 'contaazul',
      title: 'Conta Azul',
      icon: '🔗',
      items: [
        { id: 'dashboard-financeiro', label: 'Dashboard Financeiro', icon: '💰', route: '/dashboard-financeiro', requiredModule: 'relatorio_produtos' },
        { id: 'contaazul-competencia', label: 'Relatório Competência', icon: '📊', route: '/relatorios/contaazul-competencia', requiredModule: 'relatorio_produtos' },
      ]
    },

    // 📦 CONTAHUB (com Dashboard & Análises + Relatórios)
    {
      id: 'contahub',
      title: 'ContaHub',
      icon: '📦',
      items: [
        // Dashboards & Análises
        { id: 'diario', label: 'Dashboard Diário', icon: '📅', route: '/visao-geral/diario', requiredModule: 'dashboard_diario' },
        { id: 'semanal', label: 'Dashboard Semanal', icon: '📊', route: '/visao-geral/semanal', requiredModule: 'dashboard_semanal' },
        { id: 'financeiro-mensal', label: 'Financeiro Mensal', icon: '💰', route: '/visao-geral/financeiro-mensal', requiredModule: 'dashboard_financeiro_mensal' },
        { id: 'metrica-evolucao', label: 'Evolução Métricas', icon: '📈', route: '/visao-geral/metrica-evolucao', requiredModule: 'dashboard_metrica_evolucao' },
        { id: 'metricas-barras', label: 'Métricas Mensais', icon: '📊', route: '/visao-geral/metricas-barras', requiredModule: 'dashboard_metricas_barras' },
        { id: 'comparativo', label: 'Comparativo', icon: '🔍', route: '/visao-geral/comparativo', requiredModule: 'dashboard_comparativo' },
        { id: 'garcons', label: 'Análise Garçons', icon: '👨‍🍳', route: '/visao-geral/garcons', requiredModule: 'dashboard_garcons' },
        
        // Gestão e Controles ContaHub
        { id: 'produtos', label: 'Gestão Produtos', icon: '🍽️', route: '/operacoes/produtos', requiredModule: 'produtos' },
        { id: 'tempo', label: 'Tempos Médios', icon: '⏱️', route: '/operacoes/tempo', requiredModule: 'tempo' },
        { id: 'periodo', label: 'Período', icon: '📅', route: '/operacoes/periodo', requiredModule: 'periodo' },
        
        // Relatórios Específicos  
        { id: 'relatorio-produtos', label: 'Relatório Produtos', icon: '📋', route: '/relatorios/dados/relatorio-produtos', requiredModule: 'relatorio_produtos' },
        { id: 'analitico', label: 'Analítico', icon: '📊', route: '/relatorios/analitico', requiredModule: 'analitico' },
        { id: 'fatporhora', label: 'Faturamento/Hora', icon: '⏰', route: '/relatorios/fatporhora', requiredModule: 'fatporhora' },
        { id: 'nfs', label: 'Notas Fiscais', icon: '📄', route: '/relatorios/nfs', requiredModule: 'nfs' },
        { id: 'pagamentos', label: 'Pagamentos', icon: '💳', route: '/relatorios/pagamentos', requiredModule: 'pagamentos' },
        
        // ContaHub específico
        { id: 'contahub-teste', label: 'Teste ContaHub', icon: '🧪', route: '/relatorios/contahub-teste', requiredModule: 'relatorio_produtos' },
        { id: 'contahub-automatico', label: 'Coleta Automática', icon: '🔄', route: '/configuracoes/contahub-automatico', requiredModule: 'relatorio_produtos', requiredRole: 'admin' },
      ]
    },

        // 📱 MARKETING
    {
      id: 'social',
      title: 'Marketing',
      icon: '📱',
      items: [
        { id: 'marketing-360', label: 'Marketing 360°', icon: '🚀', route: '/visao-geral/marketing-360', requiredModule: 'marketing_360' },
      ]
    },

    // 📊 DESEMPENHO 
    {
      id: 'desempenho',
      title: 'Desempenho',
      icon: '📊',
      items: [
        { id: 'tabela-desempenho', label: 'Tabela de Desempenho', icon: '📈', route: '/configuracoes/desempenho/tabela', requiredModule: 'dashboard_diario', requiredRole: 'admin' },
      ]
    },

  ], [])

  // Auto-expandir seção baseada na rota atual
  useEffect(() => {
    const currentSection = allMenuSections.find(section => section.items.some(item => item.route === pathname))
    if (currentSection) {
      setExpandedSections(prev => ({
        ...prev,
        [currentSection.id]: true
      }))
    }
  }, [pathname, allMenuSections])

  // Filtrar seções baseado nas permissões do usuário
  const visibleSections = useMemo(() => {
    return allMenuSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.requiredModule) return true // Item público
        if (item.requiredRole && !isRole(item.requiredRole)) return false
        return hasPermission(item.requiredModule)
      })
    })).filter(section => section.items.length > 0) // Só mostrar seções que têm itens visíveis
  }, [allMenuSections, hasPermission, isRole])

  const handleLogout = useCallback(async () => {
    try {
      // Limpar dados de autenticação do localStorage
      localStorage.removeItem('sgb_user')
      localStorage.removeItem('sgb_bars')
      localStorage.removeItem('selectedBarId')
      
      // Limpar cookie do usuário para o middleware
      const { clearAuthCookie } = await import('@/lib/cookies')
      clearAuthCookie()
      
      // Resetar contexto de bares
      resetBars()
      
      // Chamar API de logout para limpar cookies httpOnly
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      console.log('✅ Logout realizado com sucesso - dados e cookies limpos')
      
      // Redirecionar para login
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, tentar limpar e redirecionar
      localStorage.clear()
      const { clearAuthCookie } = await import('@/lib/cookies')
      clearAuthCookie()
      resetBars()
      window.location.href = '/login'
    }
  }, [resetBars])

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

  // Função para lidar com hover nas seções colapsadas
  const handleSectionHover = useCallback((sectionId: string | null, event?: React.MouseEvent) => {
    if (!isSidebarCollapsed) return
    
    if (sectionId && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.right + 10,
        y: rect.top
      })
    }
    
    setHoveredSection(sectionId)
  }, [isSidebarCollapsed])

  // Função para lidar com clique nas seções quando colapsada
  const handleSectionClick = useCallback((section: MenuSection) => {
    if (isSidebarCollapsed) {
      // Se a seção tem apenas 1 item, navegar diretamente
      if (section.items.length === 1) {
        handleMenuClick(section.items[0].route)
      }
      // Se tem múltiplos itens, o tooltip já mostra as opções no hover
    } else {
      // Comportamento normal quando expandida
      toggleSection(section.id)
    }
  }, [isSidebarCollapsed, handleMenuClick, toggleSection])

  // Memoizar o componente de botão para evitar re-renders
  const renderMenuButton = useCallback((item: MenuItem, isActive: boolean) => {
    return (
      <button
        key={item.id}
        onClick={() => handleMenuClick(item.route)}
        disabled={isPending}
        className={`
          group w-full flex items-center rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 text-sm font-medium
          ${isSidebarCollapsed ? 'justify-center p-1.5' : 'space-x-2 p-2'}
          ${isActive 
            ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30' 
            : 'text-slate-300 hover:text-white'
          }
        `}
        title={isSidebarCollapsed ? item.label : undefined}
      >
        {isSidebarCollapsed ? (
          <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {item.icon}
          </span>
        ) : (
          <div className="relative z-10 flex items-center w-full">
            <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="flex-1 ml-3">{item.label}</span>
            {isActive && (
              <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
            )}
          </div>
        )}
      </button>
    )
  }, [handleMenuClick, isPending, isSidebarCollapsed])

  // Renderizar seção colapsável
  const renderSection = useCallback((section: MenuSection) => {
    const isExpanded = expandedSections[section.id] ?? section.defaultExpanded ?? false
    const hasActiveItem = section.items.some(item => pathname === item.route)

    return (
      <div key={section.id} className="mb-2">
        {/* Header da seção */}
        <button
          onClick={() => handleSectionClick(section)}
          onMouseEnter={(e) => handleSectionHover(section.id, e)}
          onMouseLeave={() => handleSectionHover(null)}
          className={`
            group w-full flex items-center rounded-xl hover:bg-white/10 transition-colors
            ${isSidebarCollapsed ? 'justify-center p-1.5 cursor-pointer' : 'justify-between space-x-2 p-2 cursor-pointer'} 
            ${hasActiveItem 
              ? 'bg-white/20 text-white backdrop-blur-sm border border-white/30' 
              : 'text-slate-300 hover:text-white'
            }
          `}
          title={isSidebarCollapsed ? (section.items.length === 1 ? `Ir para ${section.items[0].label}` : section.title) : undefined}
        >
          {isSidebarCollapsed ? (
            <div className="relative">
              <span className={`text-lg transition-transform duration-300 ${hasActiveItem ? 'scale-110' : 'group-hover:scale-110'}`}>
                {section.icon}
              </span>
              {/* Indicador visual para seções com apenas 1 item (navegação direta) */}
              {section.items.length === 1 && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-slate-800"></div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <span className={`text-lg transition-transform duration-300 ${hasActiveItem ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {section.icon}
                </span>
                <span className="font-semibold text-sm">{section.title}</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-all duration-300 ${isExpanded ? 'rotate-180 scale-110' : 'group-hover:scale-110'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {/* Items da seção */}
        {!isSidebarCollapsed && (
          <div className={`
            overflow-hidden transition-all duration-500 ease-out
            ${isExpanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
          `}>
            <div className={`space-y-1.5 ${isSidebarCollapsed ? 'px-1' : 'pl-4 pr-2'}`}>
              {section.items.map((item) => {
                const isActive = pathname === item.route
                return renderMenuButton(item, isActive)
              })}
            </div>
          </div>
        )}
      </div>
    )
  }, [expandedSections, pathname, toggleSection, renderMenuButton, isSidebarCollapsed, handleSectionHover, handleSectionClick])

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Tooltip/Submenu para seções colapsadas - RENDERIZADO VIA PORTAL */}
      {isSidebarCollapsed && hoveredSection && typeof window !== 'undefined' &&
        createPortal(
          <div 
            className="fixed bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 min-w-[200px] max-w-[250px]"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              zIndex: 999999,
              position: 'fixed',
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => setHoveredSection(hoveredSection)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            {(() => {
              const section = visibleSections.find(s => s.id === hoveredSection)
              if (!section) return null
              
              return (
                <div>
                  <div className="px-3 py-2 border-b border-slate-700/50">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{section.icon}</span>
                      <span className="text-sm font-semibold text-white">{section.title}</span>
                    </div>
                  </div>
                  <div className="py-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.route
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item.route)}
                          disabled={isPending}
                          className={`
                            w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-slate-700/50 transition-colors disabled:opacity-50 text-sm
                            ${isActive 
                              ? 'bg-slate-700/50 text-white' 
                              : 'text-slate-300 hover:text-white'
                            }
                          `}
                        >
                          <span className="text-base">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {isActive && (
                            <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>,
          document.body
        )
      }

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen z-50 transform transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:fixed lg:z-50
        ${isSidebarCollapsed ? 'w-20' : 'w-80'}
        bg-gradient-to-b from-slate-800 via-slate-900 to-black
        border-r border-slate-700/50
        shadow-2xl shadow-black/20
      `}>
        <div className="flex flex-col h-full">
          {/* Seletor de Bar integrado - agora no topo absoluto */}
          <div className={`border-b border-slate-700/50 ${isSidebarCollapsed ? 'px-2 py-3' : 'p-3'}`}>
            <div className="relative">
              <button
                onClick={() => setShowBarMenu(!showBarMenu)}
                className={`w-full flex items-center rounded-xl hover:bg-white/10 transition-colors group ${isSidebarCollapsed ? 'justify-center p-1.5' : 'space-x-2 p-2'}`}
              >
                {isSidebarCollapsed ? (
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {selectedBar?.nome?.charAt(0)?.toUpperCase() || 'B'}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">
                        {selectedBar?.nome?.charAt(0)?.toUpperCase() || 'B'}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-white">{selectedBar?.nome || 'Selecione'}</div>
                      <div className="text-xs text-slate-400">Estabelecimento</div>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 group-hover:text-white transition-all duration-200 ${showBarMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Bar Dropdown Menu */}
              {showBarMenu && !isSidebarCollapsed && (
                <>
                  {/* Overlay */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowBarMenu(false)}
                  />
                  
                  {/* Menu */}
                  <div className="absolute top-12 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[200] py-2 mx-2">
                    <div className="py-2 max-h-60 overflow-y-auto">
                      {availableBars.map((bar: any) => (
                        <button
                          key={bar.id}
                          onClick={() => {
                            setSelectedBar(bar)
                            setShowBarMenu(false)
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-bold">
                              {bar.nome?.charAt(0)?.toUpperCase() || 'B'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{bar.nome}</div>
                            <div className="text-xs text-slate-400">ID: {bar.id}</div>
                          </div>
                          {selectedBar?.id === bar.id && (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botão fechar no mobile */}
          <div className={`lg:hidden border-b border-slate-700/50 ${isSidebarCollapsed ? 'px-2 py-3' : 'p-3'}`}>
            <button
              onClick={onToggle}
              className={`w-full flex items-center rounded-xl hover:bg-white/10 transition-colors group ${isSidebarCollapsed ? 'justify-center p-1.5' : 'justify-center space-x-2 p-2'}`}
            >
              {isSidebarCollapsed ? (
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="ml-2 text-xs font-medium">Fechar</span>
                </>
              )}
            </button>
          </div>

          {/* Menu Items */}
          <nav className={`flex-1 space-y-1 overflow-y-auto sidebar-scroll ${isSidebarCollapsed ? 'px-2 py-3' : 'p-3'}`}>
            {/* Botão Home - sempre visível no topo */}
            <div className="mb-2">
              <button
                onClick={() => handleMenuClick('/home')}
                disabled={isPending}
                className={`
                  group w-full flex items-center rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 font-medium
                  ${isSidebarCollapsed ? 'justify-center p-1.5' : 'space-x-2 p-2'}
                  ${pathname === '/home' 
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30' 
                    : 'text-slate-300 hover:text-white'
                  }
                `}
                title={isSidebarCollapsed ? "Home" : undefined}
              >
                {isSidebarCollapsed ? (
                  <span className={`text-lg transition-transform duration-300 ${pathname === '/home' ? 'scale-110' : 'group-hover:scale-110'}`}>
                    🏠
                  </span>
                ) : (
                  <div className="relative z-10 flex items-center w-full">
                    <span className={`text-lg transition-transform duration-300 ${pathname === '/home' ? 'scale-110' : 'group-hover:scale-110'}`}>
                      🏠
                    </span>
                    <span className="flex-1 ml-3">Home</span>
                    {pathname === '/home' && (
                      <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    )}
                  </div>
                )}
              </button>
            </div>

            {/* Seções Colapsáveis */}
            {visibleSections.map(renderSection)}

            {/* Divisor */}
            <div className="border-t border-slate-700/50 my-4"></div>

            {/* Botão Configurações */}
            {hasPermission('configuracoes') && (
              <button
                onClick={() => handleMenuClick('/configuracoes')}
                disabled={isPending}
                className={`
                  group w-full flex items-center rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 font-medium
                  ${isSidebarCollapsed ? 'justify-center p-1.5' : 'space-x-2 p-2'}
                  ${pathname === '/configuracoes' 
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30' 
                    : 'text-slate-300 hover:text-white'
                  }
                `}
                title={isSidebarCollapsed ? "Configurações" : undefined}
              >
                {isSidebarCollapsed ? (
                  <span className={`text-lg transition-transform duration-300 ${pathname === '/configuracoes' ? 'scale-110' : 'group-hover:scale-110'}`}>
                    ⚙️
                  </span>
                ) : (
                  <div className="relative z-10 flex items-center w-full">
                    <span className={`text-lg transition-transform duration-300 ${pathname === '/configuracoes' ? 'scale-110' : 'group-hover:scale-110'}`}>
                      ⚙️
                    </span>
                    <span className="flex-1 ml-3">Configurações</span>
                    {pathname === '/configuracoes' && (
                      <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    )}
                  </div>
                )}
              </button>
            )}
          </nav>

          {/* Footer */}
          <div className={`border-t border-slate-700/50 ${isSidebarCollapsed ? 'px-2 py-3' : 'p-3'}`}>
            {/* Botão de Logout */}
            <button
              onClick={handleLogout}
              disabled={isPending}
              className={`group w-full flex items-center rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 ${isSidebarCollapsed ? 'justify-center p-1.5' : 'space-x-2 p-2'}`}
              title={isSidebarCollapsed ? "Sair" : undefined}
            >
              {isSidebarCollapsed ? (
                <span className="text-lg group-hover:scale-110 transition-transform duration-300">🚪</span>
              ) : (
                <>
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">🚪</span>
                  <span className="font-medium text-sm">Sair</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Estilos personalizados para scrollbar */}
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </>
  )
} 