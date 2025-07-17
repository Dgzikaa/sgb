'use client'

import { CommandPalette } from '@/components/ui/command-palette'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'

export function CommandPaletteWrapper() {
  const { isOpen, closePalette } = useCommandPalette()

  return (
    <CommandPalette 
      isOpen={isOpen} 
      onClose={closePalette} 
    />
  )
} 
