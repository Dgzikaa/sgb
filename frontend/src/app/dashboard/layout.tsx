'use client'

import { useState, Suspense, Component, ReactNode } from 'react'
import { BarProvider, useBar } from '@/contexts/BarContext'
import { SidebarContext } from '@/contexts/SidebarContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useFavicon } from '@/hooks/useFavicon'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado!</h2>
            <p className="text-gray-600 mb-4">
              Por favor, recarregue a página ou tente novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { selectedBar, availableBars, setSelectedBar, isLoading } = useBar()

  // Usar hook do favicon para trocar automaticamente baseado no bar selecionado
  useFavicon({ barName: selectedBar?.nome })

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarContext.Provider value={{ toggleSidebar }}>
      <div className="min-h-screen flex relative">
        {/* Sidebar */}
        <ErrorBoundary>
          <Sidebar 
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
            barInfo={selectedBar}
          />
        </ErrorBoundary>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0 relative">
          {/* Header */}
          <ErrorBoundary>
            <Header 
              onMenuToggle={toggleSidebar}
              selectedBar={selectedBar}
              availableBars={availableBars}
              onBarChange={setSelectedBar}
            />
          </ErrorBoundary>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto relative">
            <div className="p-4 lg:p-6">
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                }>
                  {children}
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <BarProvider>
        <DashboardContent>{children}</DashboardContent>
      </BarProvider>
    </ErrorBoundary>
  )
} 