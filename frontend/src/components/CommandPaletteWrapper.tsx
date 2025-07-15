'use client'

import { CommandPalette } from '@/components/ui/command-palette'
import { useCommandPalette } from '@/hooks/useCommandPalette'

export function CommandPaletteWrapper() {
  const { isOpen, closePalette } = useCommandPalette()

  console.log('🔍 CommandPaletteWrapper render - isOpen:', isOpen)

  return (
    <CommandPalette 
      isOpen={isOpen} 
      onClose={closePalette} 
    />
  )
} 