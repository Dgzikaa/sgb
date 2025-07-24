'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useBar } from '@/contexts/BarContext'
import { useUser } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Home, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Package, 
  Settings, 
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Navigation,
  Compass,
  Sparkles,
  Star
} from 'lucide-react'

interface MenuItem {
  id: string
  title: string
  icon: React.ElementType
  href: string
  badge?: string
  badgeColor?: 'default' | 'secondary' | 'destructive' | 'outline'
  description?: string
  keywords?: string[]
  category: 'main' | 'operations' | 'reports' | 'config' | 'admin'
  requiredRole?: 'admin' | 'manager' | 'user'
  importance?: 'high' | 'medium' | 'low'
  isNew?: boolean
  isActive?: boolean
  subItems?: MenuItem[]
}

interface NavigationContext {
  currentPath: string
  userRole: string
  barId: string
  recentPages: string[]
  favorites: string[]
  workflowState: 'opening' | 'production' | 'closing' | 'reports' | 'normal'
}

interface SmartSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function SmartSidebar({ isCollapsed = false, onToggle }: SmartSidebarProps) {
  const pathname = usePathname()
  const { selectedBar } = useBar()
  const { user } = useUser()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['main'])
  const [favorites, setFavorites] = useState<string[]>([])
  const [recentPages, setRecentPages] = useState<string[]>([])
  const [workflowState, setWorkflowState] = useState<'opening' | 'production' | 'closing' | 'reports' | 'normal'>('normal')

  // Definir itens de menu com contexto inteligente
  const menuItems: MenuItem[] = [
    // Main navigation
    {
      id: 'home',
      title: 'Home',
      icon: Home,
      href: '/home',
      category: 'main',
      importance: 'high',
      keywords: ['início', 'principal', 'dashboard']
    },
    {
      id: 'dashboard-unificado',
      title: 'Dashboard Unificado',
      icon: Package,
      href: '/dashboard-unificado',
      category: 'main',
      importance: 'high',
      isNew: true,
      badge: 'Novo',
      badgeColor: 'default',
      description: 'Centro de comando completo do sistema',
      keywords: ['dashboard', 'unificado', 'centro', 'comando', 'widgets']
    },
    {
      id: 'visao-geral',
      title: 'Visão Geral',
      icon: BarChart3,
      href: '/visao-geral',
      category: 'main',
      importance: 'high',
      keywords: ['visão', 'geral', 'overview', 'métricas']
    },
    
    // Checklists
    {
      id: 'checklists',
      title: 'Checklists',
      icon: CheckCircle,
      href: '/checklists',
      category: 'main',
      importance: 'high',
      keywords: ['checklists', 'verificação', 'templates'],
      subItems: [
        {
          id: 'checklist-abertura-main',
          title: 'Checklist de Abertura',
          icon: CheckCircle,
          href: '/checklists/abertura',
          category: 'main',
          importance: 'high',
          keywords: ['checklist', 'abertura', 'verificação']
        },
        {
          id: 'templates-main',
          title: 'Templates',
          icon: Package,
          href: '/configuracoes/templates',
          category: 'main',
          importance: 'medium',
          keywords: ['templates', 'modelos', 'documentos']
        }
      ]
    },
    
    // Operations
    {
      id: 'operacoes',
      title: 'Operações',
      icon: Package,
      href: '/operacoes',
      category: 'operations',
      importance: 'high',
      keywords: ['operações', 'operacional', 'gestão'],
      subItems: [
        {
          id: 'checklist-abertura',
          title: 'Checklist de Abertura',
          icon: CheckCircle,
          href: '/operacoes/checklist-abertura',
          category: 'operations',
          importance: 'high',
          keywords: ['checklist', 'abertura', 'verificação']
        },
        {
          id: 'receitas',
          title: 'Receitas',
          icon: Package,
          href: '/operacoes/receitas',
          category: 'operations',
          importance: 'medium',
          keywords: ['receitas', 'produtos', 'cardápio']
        },
        {
          id: 'tempo',
          title: 'Gestão de Tempo',
          icon: Clock,
          href: '/operacoes/tempo',
          category: 'operations',
          importance: 'medium',
          keywords: ['tempo', 'cronômetro', 'produtividade']
        }
      ]
    },
    
    // Production
    {
      id: 'producao',
      title: 'Produção',
      icon: Package,
      href: '/producao',
      category: 'operations',
      importance: 'high',
      keywords: ['produção', 'terminal', 'cozinha'],
      subItems: [
        {
          id: 'terminal',
          title: 'Terminal de Produção',
          icon: Package,
          href: '/producao/terminal',
          category: 'operations',
          importance: 'high',
          keywords: ['terminal', 'produção', 'cozinha']
        },
        {
          id: 'receitas-producao',
          title: 'Receitas',
          icon: Package,
          href: '/producao/receitas',
          category: 'operations',
          importance: 'medium',
          keywords: ['receitas', 'ingredientes', 'preparo']
        }
      ]
    },
    
    // Reports
    {
      id: 'relatorios',
      title: 'Relatórios',
      icon: Package,
      href: '/relatorios',
      category: 'reports',
      importance: 'high',
      keywords: ['relatórios', 'reports', 'análise'],
      subItems: [
        {
          id: 'dashboard-financeiro',
          title: 'Dashboard Financeiro',
          icon: Package,
          href: '/dashboard-financeiro',
          category: 'reports',
          importance: 'high',
          keywords: ['financeiro', 'receitas', 'despesas']
        },
        {
          id: 'analitico',
          title: 'Analítico',
          icon: TrendingUp,
          href: '/relatorios/analitico',
          category: 'reports',
          importance: 'medium',
          keywords: ['analítico', 'análise', 'detalhado']
        }
      ]
    },
    
    // Configuration
    {
      id: 'configuracoes',
      title: 'Configurações',
      icon: Settings,
      href: '/configuracoes',
      category: 'config',
      importance: 'medium',
      requiredRole: 'admin',
      keywords: ['configurações', 'config', 'admin'],
      subItems: [
        {
          id: 'checklists-config',
          title: 'Gerenciar Checklists',
          icon: CheckCircle,
          href: '/configuracoes/checklists',
          category: 'config',
          importance: 'medium',
          keywords: ['checklists', 'configurar', 'gerenciar']
        },
        {
          id: 'integracoes',
          title: 'Integrações',
          icon: Package,
          href: '/configuracoes/integracoes',
          category: 'config',
          importance: 'medium',
          keywords: ['integrações', 'apis', 'conexões']
        },
        {
          id: 'analytics',
          title: 'Analytics',
          icon: BarChart3,
          href: '/configuracoes/analytics',
          category: 'config',
          importance: 'medium',
          keywords: ['analytics', 'métricas', 'dashboard', 'performance']
        },
        {
          id: 'cache',
          title: 'Cache',
          icon: Package,
          href: '/configuracoes/cache',
          category: 'config',
          importance: 'medium',
          keywords: ['cache', 'redis', 'performance', 'memória']
        },
        {
          id: 'seguranca',
          title: 'Segurança',
          icon: Package,
          href: '/configuracoes/seguranca',
          category: 'config',
          importance: 'high',
          keywords: ['segurança', 'proteção', 'acesso']
        }
      ]
    }
  ]

  // Detectar contexto de navegação
  const getNavigationContext = (): NavigationContext => {
    const currentHour = new Date().getHours()
    let detectedWorkflow: 'opening' | 'production' | 'closing' | 'reports' | 'normal' = 'normal'
    
    if (currentHour >= 6 && currentHour <= 10) {
      detectedWorkflow = 'opening'
    } else if (currentHour >= 11 && currentHour <= 14) {
      detectedWorkflow = 'production'
    } else if (currentHour >= 15 && currentHour <= 18) {
      detectedWorkflow = 'production'
    } else if (currentHour >= 19 && currentHour <= 22) {
      detectedWorkflow = 'closing'
    } else if (currentHour >= 23 || currentHour <= 5) {
      detectedWorkflow = 'reports'
    }

    return {
      currentPath: pathname,
      userRole: user?.role || 'user',
      barId: selectedBar?.id?.toString() || '',
      recentPages,
      favorites,
      workflowState: detectedWorkflow
    }
  }

  // Filtrar itens baseado no contexto
  const getContextualItems = (context: NavigationContext): MenuItem[] => {
    let filtered = menuItems.filter(item => {
      // Filtrar por role
      if (item.requiredRole && context.userRole !== item.requiredRole) {
        return false
      }
      
      // Filtrar por busca
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        return item.title.toLowerCase().includes(searchLower) ||
               item.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
      }
      
      return true
    })

    // Priorizar baseado no contexto de workflow
    filtered = filtered.sort((a, b) => {
      const getWorkflowScore = (item: MenuItem) => {
        switch (context.workflowState) {
          case 'opening':
            if (item.id === 'checklist-abertura') return 100
            if (item.category === 'operations') return 80
            break
          case 'production':
            if (item.id === 'terminal') return 100
            if (item.id === 'producao') return 90
            if (item.category === 'operations') return 80
            break
          case 'closing':
            if (item.id === 'checklist-fechamento') return 100
            if (item.category === 'reports') return 80
            break
          case 'reports':
            if (item.category === 'reports') return 100
            if (item.id === 'dashboard-financeiro') return 90
            break
        }
        return 0
      }

      const scoreA = getWorkflowScore(a)
      const scoreB = getWorkflowScore(b)
      
      if (scoreA !== scoreB) return scoreB - scoreA
      
      // Ordenar por importância
      const importanceOrder = { high: 3, medium: 2, low: 1 }
      return importanceOrder[b.importance || 'medium'] - importanceOrder[a.importance || 'medium']
    })

    return filtered
  }

  // Adicionar à lista de favoritos
  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Expandir/colapsar categorias
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Detectar página atual
  const isCurrentPage = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const context = getNavigationContext()
  const contextualItems = getContextualItems(context)

  // Agrupar itens por categoria
  const groupedItems = contextualItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const category = item.category
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const categoryLabels = {
    main: 'Principal',
    operations: 'Operações',
    reports: 'Relatórios',
    config: 'Configurações',
    admin: 'Administração'
  }

  const categoryIcons = {
    main: Package,
    operations: Package,
    reports: Package,
    config: Settings,
    admin: Package
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Navegação
            </span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Workflow Status */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              context.workflowState === 'opening' && 'bg-yellow-500',
              context.workflowState === 'production' && 'bg-green-500',
              context.workflowState === 'closing' && 'bg-orange-500',
              context.workflowState === 'reports' && 'bg-blue-500',
              context.workflowState === 'normal' && 'bg-gray-500'
            )} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {context.workflowState === 'opening' && 'Abertura'}
              {context.workflowState === 'production' && 'Produção'}
              {context.workflowState === 'closing' && 'Fechamento'}
              {context.workflowState === 'reports' && 'Relatórios'}
              {context.workflowState === 'normal' && 'Normal'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              {/* Category Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  {React.createElement(categoryIcons[category as keyof typeof categoryIcons], { className: 'h-3 w-3' })}
                  {categoryLabels[category as keyof typeof categoryLabels]}
                  <ChevronRight className={cn(
                    'h-3 w-3 transition-transform',
                    expandedCategories.includes(category) && 'rotate-90'
                  )} />
                </button>
              )}

              {/* Category Items */}
              {(isCollapsed || expandedCategories.includes(category)) && (
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      isCollapsed={isCollapsed}
                      isActive={isCurrentPage(item.href)}
                      isFavorite={favorites.includes(item.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Compass className="h-3 w-3" />
              <span>Navegação Inteligente</span>
            </div>
            <div className="mt-1">
              {selectedBar?.nome || 'Nenhum bar selecionado'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para item de navegação
function NavItem({ 
  item, 
  isCollapsed, 
  isActive, 
  isFavorite, 
  onToggleFavorite 
}: {
  item: MenuItem
  isCollapsed: boolean
  isActive: boolean
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  const content = (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group',
      isActive 
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
    )}>
      <item.icon className={cn(
        'h-4 w-4 flex-shrink-0',
        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
      )} />
      
      {!isCollapsed && (
        <>
          <span className="flex-1 font-medium text-sm truncate">
            {item.title}
          </span>
          
          <div className="flex items-center gap-1">
            {item.isNew && (
              <Sparkles className="h-3 w-3 text-yellow-500" />
            )}
            
            {item.badge && (
              <Badge variant={item.badgeColor || 'secondary'} className="text-xs">
                {item.badge}
              </Badge>
            )}
            
            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleFavorite(item.id)
              }}
              className={cn(
                'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {isFavorite ? (
                <Star className="h-3 w-3 fill-current" />
              ) : (
                <Star className="h-3 w-3" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <a href={item.href} className="block" title={isCollapsed ? item.title : undefined}>
      {content}
    </a>
  )
} 
