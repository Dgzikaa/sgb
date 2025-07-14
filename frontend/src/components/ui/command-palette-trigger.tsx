'use client'

import { Button } from '@/components/ui/button'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { Search, Command } from 'lucide-react'

interface CommandPaletteTriggerProps {
  variant?: 'default' | 'outline' | 'ghost' | 'sidebar'
  size?: 'sm' | 'md' | 'lg'
  showShortcut?: boolean
  className?: string
}

export function CommandPaletteTrigger({ 
  variant = 'outline', 
  size = 'md',
  showShortcut = true,
  className = ''
}: CommandPaletteTriggerProps) {
  const { openPalette } = useCommandPalette()

  const getButtonProps = () => {
    switch (variant) {
      case 'sidebar':
        return {
          variant: 'ghost' as const,
          className: `w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`
        }
      case 'ghost':
        return {
          variant: 'ghost' as const,
          className: `text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`
        }
      default:
        return {
          variant,
          className
        }
    }
  }

  const getSizeProps = () => {
    switch (size) {
      case 'sm': return { size: 'sm' as const }
      case 'lg': return { size: 'lg' as const }
      default: return {}
    }
  }

  const buttonProps = getButtonProps()
  const sizeProps = getSizeProps()

  return (
    <Button
      onClick={openPalette}
      {...buttonProps}
      {...sizeProps}
      title="Abrir Command Palette (Cmd+K)"
    >
      {variant === 'sidebar' ? (
        <>
          <Search className="w-4 h-4 mr-3" />
          <span className="flex-1 text-left">Buscar</span>
          {showShortcut && (
            <div className="flex items-center gap-1 text-xs opacity-60">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                ⌘K
              </kbd>
            </div>
          )}
        </>
      ) : (
        <>
          <Search className="w-4 h-4 mr-2" />
          <span>Buscar</span>
          {showShortcut && (
            <div className="ml-2 flex items-center gap-1 text-xs opacity-60">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                ⌘K
              </kbd>
            </div>
          )}
        </>
      )}
    </Button>
  )
}

// Versão compacta apenas com ícone
export function CommandPaletteIconTrigger({ 
  className = '',
  title = "Buscar (Cmd+K)"
}: { 
  className?: string
  title?: string 
}) {
  const { openPalette } = useCommandPalette()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={openPalette}
      className={`w-8 h-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ${className}`}
      title={title}
    >
      <Search className="w-4 h-4" />
    </Button>
  )
}

// Placeholder de busca que abre o Command Palette
export function CommandPaletteSearchPlaceholder({ 
  placeholder = "Buscar... (Cmd+K)",
  className = ""
}: {
  placeholder?: string
  className?: string
}) {
  const { openPalette } = useCommandPalette()

  return (
    <div 
      onClick={openPalette}
      className={`
        flex items-center gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 rounded-lg 
        cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50
        transition-colors ${className}
      `}
    >
      <Search className="w-4 h-4 text-gray-400" />
      <span className="text-gray-500 dark:text-gray-400 text-sm flex-1">
        {placeholder}
      </span>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
          ⌘K
        </kbd>
      </div>
    </div>
  )
} 