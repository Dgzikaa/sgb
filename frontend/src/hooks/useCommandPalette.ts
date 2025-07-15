import { useState, useEffect, useCallback } from 'react'

interface UseCommandPaletteReturn {
  isOpen: boolean
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
}

export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false)

  const openPalette = useCallback(() => {
    console.log('🔍 openPalette called')
    setIsOpen(true)
  }, [])

  const closePalette = useCallback(() => {
    setIsOpen(false)
  }, [])

  const togglePalette = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Global keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K ou Ctrl+K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        togglePalette()
        return
      }

      // Cmd+Shift+P ou Ctrl+Shift+P (alternativo)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault()
        togglePalette()
        return
      }

      // / para busca rápida (quando não estiver em input)
      if (
        event.key === '/' && 
        !isOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        event.preventDefault()
        openPalette()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, togglePalette, openPalette])

  // Prevent body scroll when palette is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return {
    isOpen,
    openPalette,
    closePalette,
    togglePalette
  }
}

export default useCommandPalette 