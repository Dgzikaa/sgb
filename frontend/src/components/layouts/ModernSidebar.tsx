'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { useMenuBadges } from '@/hooks/useMenuBadges'
import { 
  Home, 
  CheckSquare, 
  Settings, 
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  Database,
  Zap,
  ChefHat,
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  Package,
  Utensils,
  Calculator,
  Shield,
  RefreshCw,
  CheckCircle,
  Target,
  Smartphone,
  DollarSign,
  MessageSquare,
  CreditCard
} from 'lucide-react'

interface SubMenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number
  description?: string
}

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
  badge?: number
  color?: string
  subItems?: SubMenuItem[]
}



export function ModernSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [manuallyToggledItems, setManuallyToggledItems] = useState<string[]>([])
  const pathname = usePathname()
  const { isRole } = usePermissions()
  const { badges } = useMenuBadges()
  
  // Função para obter itens da sidebar com badges dinâmicos
  const getSidebarItems = (): SidebarItem[] => [
    { 
      icon: Home, 
      label: 'Home', 
      href: '/home', 
      color: 'text-blue-600 dark:text-blue-400',
      badge: badges.home > 0 ? badges.home : undefined
    },

    { 
      icon: Zap, 
      label: 'Operações', 
      href: '/operacoes', 
      color: 'text-orange-600 dark:text-orange-400',
      subItems: [
        { 
          icon: CheckSquare, 
          label: 'Gestão de Checklists', 
          href: '/operacoes/checklists', 
          description: 'Gestão de checklists'
        },
        { 
          icon: Users, 
          label: 'Meus Checklists', 
          href: '/operacoes/checklists/checklists-funcionario', 
          description: 'Meus checklists pessoais'
        },
        { 
          icon: FileText, 
          label: 'Receitas', 
          href: '/operacoes/receitas', 
          description: 'Gestão de receitas operacionais'
        },
        { 
          icon: Zap, 
          label: 'Terminal de Produção', 
          href: '/operacoes/terminal', 
          description: 'Terminal de produção em tempo real'
        },
      ]
    },

    { 
      icon: BarChart3, 
      label: 'Relatórios', 
      href: '/relatorios',
      color: 'text-blue-600 dark:text-blue-400',
      subItems: [
        { 
          icon: BarChart3, 
          label: 'Visão Geral', 
          href: '/relatorios/visao-geral',
          description: 'Dashboard principal'
        },
        { 
          icon: Clock, 
          label: 'Gestão de Tempo', 
          href: '/relatorios/tempo',
          description: 'Análise de tempo'
        },
        { 
          icon: RefreshCw, 
          label: 'Recorrência', 
          href: '/relatorios/recorrencia',
          description: 'Análise de padrões'
        },
        { 
          icon: FileText, 
          label: 'Analítico', 
          href: '/relatorios/analitico',
          description: 'Relatórios detalhados'
        },
        { 
          icon: TrendingUp, 
          label: 'ContaHub', 
          href: '/relatorios/contahub-teste',
          description: 'Relatórios ContaHub'
        },
        { 
          icon: Calculator, 
          label: 'Windsor.ai', 
          href: '/relatorios/windsor-analytics',
          description: 'Analytics Windsor.ai'
        },
      ]
    },

    { 
      icon: TrendingUp, 
      label: 'Marketing', 
      href: '/marketing',
      color: 'text-pink-600 dark:text-pink-400',
      subItems: [
        { 
          icon: TrendingUp, 
          label: 'Marketing 360', 
          href: '/marketing/marketing-360',
          description: 'Estratégia completa'
        },
        { 
          icon: Target, 
          label: 'Campanhas', 
          href: '/marketing/campanhas',
          description: 'Gestão de campanhas'
        },
        { 
          icon: MessageSquare, 
          label: 'WhatsApp', 
          href: '/marketing/whatsapp',
          description: 'Marketing via WhatsApp'
        },
        { 
          icon: BarChart3, 
          label: 'Analytics', 
          href: '/marketing/analytics',
          description: 'Métricas de marketing'
        },
      ]
    },

    { 
      icon: DollarSign, 
      label: 'Financeiro', 
      href: '/financeiro',
      color: 'text-green-600 dark:text-green-400',
      subItems: [
        { 
          icon: Calendar, 
          label: 'Agendamento', 
          href: '/financeiro/agendamento',
          description: 'Agendar pagamentos'
        },
      ]
    },

    { 
      icon: Settings, 
      label: 'Configurações', 
      href: '/configuracoes',
      color: 'text-gray-600 dark:text-gray-400',
      badge: badges.configuracoes > 0 ? badges.configuracoes : undefined,
      subItems: [
        { 
          icon: CheckSquare, 
          label: 'Checklists', 
          href: '/configuracoes/checklists',
          description: 'Configurar checklists'
        },
        { 
          icon: Target, 
          label: 'Metas', 
          href: '/configuracoes/metas',
          description: 'Configurar metas'
        },
        { 
          icon: Database, 
          label: 'Integrações', 
          href: '/configuracoes/integracoes',
          description: 'APIs e integrações'
        },
        { 
          icon: Shield, 
          label: 'Segurança', 
          href: '/configuracoes/seguranca',
          description: 'Configurações de segurança'
        },
        { 
          icon: MessageSquare, 
          label: 'WhatsApp', 
          href: '/configuracoes/whatsapp',
          description: 'Configurar WhatsApp'
        },
        { 
          icon: Zap, 
          label: 'ContaHub Auto', 
          href: '/configuracoes/contahub-automatico',
          description: 'Sincronização automática'
        },
        { 
          icon: Clock, 
          label: 'Meta Config', 
          href: '/configuracoes/meta-config',
          description: 'Configuração Meta'
        },
        { 
          icon: FileText, 
          label: 'Templates', 
          href: '/configuracoes/templates',
          description: 'Gerenciar templates'
        },
        { 
          icon: BarChart3, 
          label: 'Analytics', 
          href: '/configuracoes/analytics',
          description: 'Configurar analytics'
        },
        { 
          icon: Smartphone, 
          label: 'PWA', 
          href: '/configuracoes/pwa',
          description: 'Progressive Web App'
        },
      ]
    },
  ]

  // Obter itens da sidebar com badges
  const sidebarItems = getSidebarItems()
  
  // Usar diretamente os itens da sidebar (já inclui configurações)
  const allSidebarItems = sidebarItems

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname.startsWith(href)
  }

  const hasActiveSubItem = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false
    return subItems.some(subItem => pathname.startsWith(subItem.href))
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => {
      const newState = prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
      return newState
    })
    
    // Marcar como manualmente manipulado
    setManuallyToggledItems(prev => 
      prev.includes(label) ? prev : [...prev, label]
    )
  }

  const isExpanded = (label: string) => {
    // Se o item foi manipulado manualmente, respeita apenas o estado manual
    if (manuallyToggledItems.includes(label)) {
      const result = expandedItems.includes(label)
      return result
    }
    
    // Se não foi manipulado manualmente, pode usar expansão automática por hover
    if (isHovered && hasActiveSubItem(allSidebarItems.find(item => item.label === label)?.subItems)) {
      return true
    }
    
    return false
  }

  return (
    <div 
      className={`hidden md:block fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-out ${
        isHovered ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        // Reset manual toggles after leaving hover for better UX
        setTimeout(() => {
          setManuallyToggledItems([])
        }, 3000)
      }}
    >
      {/* Header spacer com design integrado */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center h-full px-4">
          <div className={`flex items-center transition-all duration-300 ${
            isHovered ? 'justify-start' : 'justify-center'
          }`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            {isHovered && (
              <span className="ml-3 font-semibold text-gray-900 dark:text-white animate-slide-in-from-left">
                SGB
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full pt-4 pb-4">
        {/* Navigation items */}
        <nav className="flex-1 px-2 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {/* Command Palette Search Button removido da sidebar */}
            
            {allSidebarItems.map((item) => {
              const isItemActive = item.href ? isActive(item.href) : hasActiveSubItem(item.subItems)
              const itemExpanded = isExpanded(item.label)
              
              return (
                <div key={item.label}>
                  {/* Main item */}
                  <div
                    className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative cursor-pointer ${
                      isItemActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {/* Link wrapper for items with direct href - clicar no nome/ícone navega */}
                    {item.href ? (
                      <Link href={item.href} className="flex items-center flex-1">
                        <ItemContent 
                          item={item} 
                          isItemActive={isItemActive} 
                          isHovered={isHovered} 
                          hasSubItems={!!item.subItems}
                          isExpanded={itemExpanded}
                          showExpandIcon={false}
                        />
                      </Link>
                    ) : (
                      <ItemContent 
                        item={item} 
                        isItemActive={isItemActive} 
                        isHovered={isHovered} 
                        hasSubItems={!!item.subItems}
                        isExpanded={itemExpanded}
                        showExpandIcon={false}
                      />
                    )}
                    
                    {/* Botão separado para expandir/colapsar - clicar na setinha expande */}
                    {item.subItems && isHovered && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleExpanded(item.label)
                        }}
                        className="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {itemExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {!isHovered && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                      </div>
                    )}
                  </div>

                  {/* Sub-items */}
                  {item.subItems && isHovered && itemExpanded && (
                    <div className="ml-6 mt-1 space-y-1 animate-slide-in-from-top">
                      {item.subItems.map((subItem) => {
                        const isSubActive = isActive(subItem.href)
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`group flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                              isSubActive
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            <subItem.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="ml-3 font-medium">
                              {subItem.label}
                            </span>
                            {subItem.badge && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className={`flex items-center transition-all duration-300 ${
            isHovered ? 'justify-between px-3' : 'justify-center'
          }`}>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
              {isHovered && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 animate-slide-in-from-left">
                  Online
                </span>
              )}
            </div>
            {isHovered && (
              <span className="text-xs text-gray-400 dark:text-gray-500 animate-slide-in-from-right">
                v2.0
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para renderizar o conteúdo do item
function ItemContent({ 
  item, 
  isItemActive, 
  isHovered, 
  hasSubItems = false, 
  isExpanded = false,
  showExpandIcon = true
}: {
  item: SidebarItem
  isItemActive: boolean
  isHovered: boolean
  hasSubItems?: boolean
  isExpanded?: boolean
  showExpandIcon?: boolean
}) {
  return (
    <>
      {/* Icon */}
      <item.icon 
        className={`w-5 h-5 flex-shrink-0 transition-colors ${
          isItemActive ? 'text-blue-600 dark:text-blue-400' : item.color || 'text-gray-500 dark:text-gray-400'
        }`} 
      />
      
      {/* Label */}
      {isHovered && (
        <span className="ml-3 font-medium animate-slide-in-from-left duration-200 flex-1">
          {item.label}
        </span>
      )}
      
      {/* Badge */}
      {item.badge && isHovered && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-slide-in-from-right duration-200 shadow-sm">
          {item.badge}
        </span>
      )}

      {/* Expand/Collapse Icon for items with subitems */}
      {showExpandIcon && hasSubItems && isHovered && (
        <div className="ml-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      )}
    </>
  )
} 
