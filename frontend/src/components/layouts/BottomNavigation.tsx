'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { useMenuBadges } from '@/hooks/useMenuBadges'
import { 
  Home, 
  CheckSquare, 
  ChefHat,
  TrendingUp,
  BarChart3,
  Menu,
  X,
  Zap
} from 'lucide-react'

interface BottomNavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number
  color?: string
}

interface MobileHamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

// Menu hambúrguer overlay para funcionalidades avançadas
function MobileHamburgerMenu({ isOpen, onClose }: MobileHamburgerMenuProps) {
  const pathname = usePathname()
  const { isRole } = usePermissions()
  const { badges } = useMenuBadges()

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname.startsWith(href)
  }

  const advancedItems = [
    { 
      icon: CheckSquare, 
      label: 'Funcionário Checklists', 
      href: '/operacoes/checklists/checklists-funcionario',
      description: 'Meus checklists pessoais'
    },
    { 
      icon: ChefHat, 
      label: 'Terminal Produção', 
      href: '/producao/terminal',
      description: 'Terminal de produção'
    },
    { 
      icon: BarChart3, 
      label: 'Relatórios Financeiros', 
      href: '/relatorios/financeiro-competencia',
      description: 'Windsor.ai relatórios'
    },
  ]

  const configItems = isRole('admin') ? [
    { 
      icon: CheckSquare, 
      label: 'Config Checklists', 
      href: '/configuracoes/checklists',
      description: 'Configurar checklists'
    },
    { 
      icon: BarChart3, 
      label: 'Integrações', 
      href: '/configuracoes/integracoes',
      description: 'Configurar integrações'
    },
  ] : []

  if (!isOpen) return null

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu content */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 md:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              SGB Mobile
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Menu items */}
        <div className="p-4 space-y-6">
          {/* Funcionalidades Avançadas */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Funcionalidades
            </h3>
            <div className="space-y-2">
              {advancedItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center p-3 rounded-xl transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <div className="ml-3">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Configurações (apenas admin) */}
          {configItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Configurações
              </h3>
              <div className="space-y-2">
                {configItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center p-3 rounded-xl transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <div className="ml-3">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Online
              </span>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              v2.0 Mobile
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export function BottomNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { badges } = useMenuBadges()

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname.startsWith(href)
  }

  // Principais funcionalidades para bottom nav
  const bottomNavItems: BottomNavItem[] = [
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
      href: '/checklists/abertura',
      color: 'text-green-600 dark:text-green-400',
      badge: badges.checklist > 0 ? badges.checklist : undefined
    },
    { 
      icon: Zap, 
      label: 'Operações', 
      href: '/operacoes',
      color: 'text-orange-600 dark:text-orange-400'
    },
    { 
      icon: TrendingUp, 
      label: 'Marketing', 
      href: '/visao-geral/marketing-360',
      color: 'text-pink-600 dark:text-pink-400',
      badge: badges.marketing > 0 ? badges.marketing : undefined
    },
    { 
      icon: BarChart3, 
      label: 'Visão Geral', 
      href: '/visao-geral',
      color: 'text-purple-600 dark:text-purple-400',
      badge: badges.visaoGeral > 0 ? badges.visaoGeral : undefined
    }
  ]

  return (
    <>
      {/* Bottom Navigation Bar - apenas no mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        {/* Gradient shadow above */}
        <div className="h-4 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
        
        {/* Navigation bar */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-2">
          <div className="flex items-center justify-around">
            {bottomNavItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="relative">
                    <item.icon 
                      className={`w-5 h-5 mb-1 transition-colors ${
                        active 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} 
                    />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    active 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
            
            {/* Menu button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Menu className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Menu
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Hamburger Menu */}
      <MobileHamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />

      {/* Bottom padding para compensar fixed bottom nav - apenas no mobile */}
      <div className="h-20 md:hidden"></div>
    </>
  )
} 
