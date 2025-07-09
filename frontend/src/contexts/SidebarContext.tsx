'use client'

import { createContext, useContext, ReactNode, useState } from 'react'

// Contexto para o toggle da sidebar
interface SidebarContextType {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  isSidebarCollapsed: boolean
  toggleSidebarCollapse: () => void
  setSidebarCollapsed: (isCollapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

// Provider para fornecer o contexto
export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const setSidebarOpen = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen)
  }

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const setSidebarCollapsed = (isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed)
  }

  return (
    <SidebarContext.Provider value={{ 
      isSidebarOpen, 
      toggleSidebar, 
      setSidebarOpen, 
      isSidebarCollapsed, 
      toggleSidebarCollapse, 
      setSidebarCollapsed 
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export { SidebarContext } 