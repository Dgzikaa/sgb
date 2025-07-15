'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { LogOut, Search, Moon, Sun } from 'lucide-react'
import { useUnifiedSearch } from '@/components/ui/unified-search'
import { SmartNotifications } from '@/components/ui/smart-notifications'

export function DarkHeader() {
  const { user, logout } = useUser()
  const { pageTitle } = usePageTitle()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const search = useUnifiedSearch()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K para busca unificada
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        search.open()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [search])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!isClient) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="flex items-center space-x-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {pageTitle || 'SGB'}
          </h1>
          
          {/* Botão de Busca Unificada */}
          <Button
            variant="outline"
            size="sm"
            onClick={search.open}
            className="hidden sm:flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Search className="h-4 w-4" />
            <span>Buscar</span>
            <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user?.nome || 'Usuário'}
          </span>
          
          {/* Notificações Inteligentes */}
          <SmartNotifications />
          
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDarkMode}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
} 