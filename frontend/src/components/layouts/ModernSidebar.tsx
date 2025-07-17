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
  PieChart,
  TrendingUp,
  Database,
  Zap,
  ChefHat,
  FileText,
  DollarSign,
  Smartphone,
  Target,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Package,
  Utensils,
  Calculator,
  CreditCard,
  Instagram,
  Facebook,
  MessageCircle as WhatsApp,
  Bell,
  Shield,
  Palette,
  BookOpen
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
  
  // FunÃ§Ã£o para obter itens da sidebar com badges dinÃ¢micos
  const getSidebarItems = (): SidebarItem[] => [
    { 
      icon: Home, 
      label: 'Home', 
      href: '/home', 
      color: 'text-blue-600 dark:text-blue-400',
      badge: badges.home > 0 ? badges.home : undefined
    },
    { 
      icon: CheckSquare, 
      label: 'Checklist', 
      color: 'text-green-600 dark:text-green-400',
      badge: badges.checklist > 0 ? badges.checklist : undefined,
      subItems: [
        { 
          icon: CheckSquare, 
          label: 'Checklists', 
          href: '/checklists/abertura', 
          description: 'Checklist de abertura diÃ¡ria'
        },
        { 
          icon: Users, 
          label: 'Meus Checklists', 
          href: '/funcionario/checklists', 
          description: 'Meus checklists pessoais'
        },
      ]
    },
    { 
      icon: ChefHat, 
      label: 'ProduÃ§Ã£o', 
      color: 'text-orange-600 dark:text-orange-400',
      badge: badges.producao > 0 ? badges.producao : undefined,
      subItems: [
        { 
          icon: Utensils, 
          label: 'Receitas e Insumos', 
          href: '/producao/receitas'
        },
        { 
          icon: Zap, 
          label: 'Terminal de ProduÃ§Ã£o', 
          href: '/producao/terminal'
        },
      ]
    },
    { 
      icon: Calculator, 
      label: 'ContaAzul', 
      color: 'text-blue-500 dark:text-blue-400',
      badge: badges.contaazul > 0 ? badges.contaazul : undefined,
      subItems: [
        { 
          icon: FileText, 
          label: 'CompetÃªncia', 
          href: '/relatorios/financeiro-competencia'
        },
        { 
          icon: FileText, 
          label: 'DRE OrdinÃ¡rio', 
          href: '/relatorios/contaazul-competencia'
        },
      ]
    },
    { 
      icon: TrendingUp, 
      label: 'Marketing', 
      color: 'text-pink-600 dark:text-pink-400',
      badge: badges.marketing > 0 ? badges.marketing : undefined,
      subItems: [
        { 
          icon: Instagram, 
          label: 'Marketing 360', 
          href: '/visao-geral/marketing-360'
        },
      ]
    },
    // { 
    //   icon: BarChart3, 
    //   label: 'VisÃ£o Geral', 
    //   href: '/visao-geral', 
    //   color: 'text-purple-600 dark:text-purple-400',
    //   badge: badges.visaoGeral > 0 ? badges.visaoGeral : undefined
    // },
  ]

  // FunÃ§Ã£o para obter configuraÃ§Ãµes com badges
  const getConfiguracoesItems = (): SidebarItem => ({ 
    icon: Settings, 
    label: 'ConfiguraÃ§Ãµes', 
    color: 'text-gray-600 dark:text-gray-400',
    badge: badges.configuracoes > 0 ? badges.configuracoes : undefined,
    subItems: [
      { 
        icon: CheckSquare, 
        label: 'Checklists', 
        href: '/configuracoes/checklists'
      },
      { 
        icon: Target, 
        label: 'Metas', 
        href: '/configuracoes/metas'
      },
      { 
        icon: Database, 
        label: 'IntegraÃ§Ãµes', 
        href: '/configuracoes/integracoes'
      },
      { 
        icon: Shield, 
        label: 'SeguranÃ§a', 
        href: '/configuracoes/seguranca'
      },
      { 
        icon: FileText, 
        label: 'Templates', 
        href: '/configuracoes/templates'
      },
      { 
        icon: Database, 
        label: 'Cache', 
        href: '/configuracoes/cache'
      },
      { 
        icon: Smartphone, 
        label: 'PWA', 
        href: '/configuracoes/pwa'
      },
      { 
        icon: CheckSquare, 
        label: 'Bulk Actions', 
        href: '/configuracoes/bulk-actions'
      },
      // Apenas o item Sincronizar
      {
        icon: FileText,
        label: 'Sincronizar',
        href: '/configuracoes/receitas/sync'
      }
    ]
  })

  // Obter itens da sidebar com badges
  const sidebarItems = getSidebarItems()
  
  // Combinar itens da sidebar com configuraÃ§Ãµes se for admin
  const allSidebarItems = [...sidebarItems]
  if (isRole('admin')) {
    allSidebarItems.push(getConfiguracoesItems())
  }

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
        ? prev.filter((item: any) => item !== label)
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
    
    // Se nÃ£o foi manipulado manualmente, pode usar expansÃ£o automÃ¡tica por hover
    if (isHovered && hasActiveSubItem(allSidebarItems.find((item: any) => item.label === label)?.subItems)) {
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
                    onClick={() => {
                      if (item.subItems) {
                        toggleExpanded(item.label)
                      }
                    }}
                  >
                    {/* Link wrapper for items with direct href */}
                    {item.href && !item.subItems ? (
                      <Link href={item.href} className="flex items-center w-full">
                        <ItemContent item={item} isItemActive={isItemActive} isHovered={isHovered} />
                      </Link>
                    ) : (
                      <ItemContent 
                        item={item} 
                        isItemActive={isItemActive} 
                        isHovered={isHovered} 
                        hasSubItems={!!item.subItems}
                        isExpanded={itemExpanded}
                      />
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

// Componente auxiliar para renderizar o conteÃºdo do item
function ItemContent({ 
  item, 
  isItemActive, 
  isHovered, 
  hasSubItems = false, 
  isExpanded = false 
}: {
  item: SidebarItem
  isItemActive: boolean
  isHovered: boolean
  hasSubItems?: boolean
  isExpanded?: boolean
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
      {hasSubItems && isHovered && (
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
