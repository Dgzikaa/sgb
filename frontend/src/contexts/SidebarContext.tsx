'use client'

import { createContext, useContext, ReactNode } from 'react'

// Contexto para o toggle da sidebar
interface SidebarContextType {
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

export { SidebarContext } 