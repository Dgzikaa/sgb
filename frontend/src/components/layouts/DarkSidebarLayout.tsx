'use client'

import { ReactNode } from 'react'
import { BarProvider, useBar } from '@/contexts/BarContext'
import { PageTitleProvider } from '@/contexts/PageTitleContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import DarkHeader from '@/components/DarkHeader'
import { useFavicon } from '@/hooks/useFavicon'

interface DarkSidebarLayoutProps {
  children: ReactNode
  showBackgroundContainer?: boolean
}

function DarkSidebarLayoutContent({ children, showBackgroundContainer = true }: DarkSidebarLayoutProps) {
  const { selectedBar } = useBar()
  const { isSidebarOpen, toggleSidebar, isSidebarCollapsed } = useSidebar()

  // Usar hook do favicon
  useFavicon({ barName: selectedBar?.nome })

  return (
    <PageTitleProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 relative overflow-hidden">
        {/* Header fixo - agora posicionado após a sidebar */}
        <div className="relative z-30">
          <DarkHeader />
        </div>
        
        {/* Background decorativo - baixo z-index */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="flex h-screen relative z-10">
          <div className="relative z-10">
            <Sidebar 
              isOpen={isSidebarOpen}
              onToggle={toggleSidebar}
              barInfo={selectedBar}
            />
          </div>
          <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-500 ease-out relative z-10 ${
            isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
          }`}>
            <div className="flex-1 overflow-auto bg-transparent pt-12">
              <div className="p-4 lg:p-6">
                {showBackgroundContainer ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-900/10 border border-white/20 min-h-[calc(100vh-160px)]">
                    <div className="p-6">
                      {children}
                    </div>
                  </div>
                ) : (
                  children
                )}
              </div>
            </div>
            
            <Footer />
          </main>
        </div>
      </div>
    </PageTitleProvider>
  )
}

export function DarkSidebarLayout({ children, showBackgroundContainer = true }: DarkSidebarLayoutProps) {
  return (
    <BarProvider>
      <SidebarProvider>
        <DarkSidebarLayoutContent showBackgroundContainer={showBackgroundContainer}>
          {children}
        </DarkSidebarLayoutContent>
      </SidebarProvider>
    </BarProvider>
  )
}

export default DarkSidebarLayout 