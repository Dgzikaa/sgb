'use client'

import { useState, useRef, useEffect } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useBar } from '@/contexts/BarContext'
import { useUser } from '@/contexts/UserContext'
import { ChevronDown, User, Settings, LogOut, Moon, Sun, Bell, Check, Building2, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { CommandPaletteSearchPlaceholder, CommandPaletteIconTrigger } from '@/components/ui/command-palette-trigger'

// Mapeamento de rotas para breadcrumbs
const routeMapping: Record<string, { name: string; icon?: React.ComponentType<{ className?: string }> }> = {
  '/home': { name: 'Home', icon: Home },
  
  // Checklist
  '/checklists': { name: 'Checklist' },
  '/checklists/abertura': { name: 'Checklists' },
  
  // Produção
  '/producao': { name: 'Produção' },
  '/producao/receitas': { name: 'Receitas e Insumos' },
  '/producao/terminal': { name: 'Terminal de Produção' },
  
  // ContaAzul
  '/relatorios/financeiro-competencia': { name: 'Competência' },
  
  // Marketing
  '/visao-geral/marketing-360': { name: 'Marketing 360' },
  
  // Funcionário
  '/funcionario': { name: 'Funcionário' },
  '/funcionario/checklists': { name: 'Meus Checklists' },
  
  // Configurações (apenas admin)
  '/configuracoes': { name: 'Configurações' },
  '/configuracoes/checklists': { name: 'Checklists' },
  '/configuracoes/metas': { name: 'Metas' },
  '/configuracoes/integracoes': { name: 'Integrações' },
  '/configuracoes/seguranca': { name: 'Segurança' },
  '/configuracoes/whatsapp': { name: 'WhatsApp' },
  '/configuracoes/contahub-automatico': { name: 'ContaHub Auto' },
  '/configuracoes/meta-configuracao': { name: 'Meta Config' },
  '/configuracoes/templates': { name: 'Templates' },
  
  // Outras páginas
  '/minha-conta': { name: 'Minha Conta' },
  '/login': { name: 'Login' },
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Array<{
    name: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
    isLast?: boolean
  }> = []
  
  // Add home always
  breadcrumbs.push({
    name: 'SGB',
    href: '/home',
    icon: Home
  })
  
  // Build progressive paths
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const route = routeMapping[currentPath]
    
    if (route) {
      breadcrumbs.push({
        name: route.name,
        href: currentPath,
        icon: route.icon,
        isLast: index === segments.length - 1
      })
    }
  })
  
  return breadcrumbs
}

export function DarkHeader() {
  const { pageTitle } = usePageTitle()
  const { selectedBar, availableBars, setSelectedBar } = useBar()
  const { user, logout } = useUser()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()  // Usando o contexto global
  
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBarMenu, setShowBarMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  const barMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  const breadcrumbs = generateBreadcrumbs(pathname)

  // Removendo o useEffect local para dark mode, pois agora é gerenciado pelo contexto

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (barMenuRef.current && !barMenuRef.current.contains(event.target as Node)) {
        setShowBarMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  const handleBarSelect = (bar: typeof selectedBar) => {
    if (bar) {
      setSelectedBar(bar)
    }
    setShowBarMenu(false)
  }

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'Checklist de Abertura',
      message: 'Aguardando preenchimento por João Silva',
      time: '5 min atrás',
      unread: true
    },
    {
      id: 2,
      title: 'Sincronização ContaAzul',
      message: 'Dados atualizados com sucesso',
      time: '1 hora atrás',
      unread: false
    },
    {
      id: 3,
      title: 'Nova Reserva',
      message: 'Mesa para 4 pessoas às 20:00',
      time: '2 horas atrás',
      unread: true
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800">
      <div className="flex items-center justify-between h-12 px-4">
        {/* Breadcrumb Navigation - estilo Notion */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.href}-${index}`} className="flex items-center gap-1">
              {/* Separador */}
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-600 flex-shrink-0" />
              )}
              
              {/* Link do breadcrumb */}
              <Link
                href={crumb.href}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors ${
                  crumb.isLast
                    ? 'text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                } truncate max-w-40`}
              >
                {crumb.icon && (
                  <crumb.icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate">{crumb.name}</span>
              </Link>
            </div>
          ))}
        </div>

        {/* Centro - Busca */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <CommandPaletteSearchPlaceholder 
            placeholder="Buscar..." 
            className="w-full"
          />
        </div>

        {/* Direita - User info e controles */}
        <div className="flex items-center gap-2 ml-4">
          {/* Busca mobile */}
          <div className="md:hidden">
            <CommandPaletteIconTrigger />
          </div>
          
          {/* Notificações */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-slide-in-from-top">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">Notificações</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${
                        notification.unread ? 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.time}
                          </span>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    href="/notifications"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() => setShowNotifications(false)}
                  >
                    Ver todas as notificações
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Seletor de Bar */}
          <div className="relative" ref={barMenuRef}>
            <button
              onClick={() => setShowBarMenu(!showBarMenu)}
              className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors max-w-32"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="truncate">{selectedBar?.nome}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown de Bares */}
            {showBarMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-slide-in-from-top">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estabelecimentos
                  </span>
                </div>
                {availableBars.map((bar) => (
                  <button
                    key={bar.id}
                    onClick={() => handleBarSelect(bar)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="flex-1 text-left">{bar.nome}</span>
                    {selectedBar?.id === bar.id && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu do Usuário */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
                {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-xs text-gray-600 dark:text-gray-300 truncate max-w-24">
                {user?.nome?.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Dropdown do Usuário */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-slide-in-from-top">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
                      {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div>
                  <Link
                    href="/minha-conta"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Minha Conta
                  </Link>

                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-4 h-4" />
                        Modo Claro
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4" />
                        Modo Escuro
                      </>
                    )}
                  </button>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 