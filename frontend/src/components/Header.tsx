'use client'

import { useState } from 'react'
import { useBarLogo } from '@/hooks/useBarLogo'

interface Bar {
  id: number
  nome: string
  avatar?: string
}

interface HeaderProps {
  onMenuToggle: () => void
  selectedBar: Bar | null
  availableBars: Bar[]
  onBarChange: (bar: Bar) => void
}

export default function Header({ onMenuToggle, selectedBar, availableBars, onBarChange }: HeaderProps) {
  const [showBarSelector, setShowBarSelector] = useState(false)
  const { logoUrl, shouldUseLogo } = useBarLogo({ barName: selectedBar?.nome, size: 'small' })

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 lg:px-6 relative z-[100]">
      <div className="flex items-center justify-between">
        {/* Menu Hambúrguer e Título */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="hidden lg:block">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
              <div id="status-badge-placeholder"></div>
            </div>
            <p className="text-sm text-slate-500">SGB</p>
          </div>
        </div>

        {/* Seletor de Bar */}
        <div className="flex items-center space-x-4">
          {availableBars.length > 0 ? (
            <>
              <div className="relative">
                <button
                  onClick={() => availableBars.length > 1 && setShowBarSelector(!showBarSelector)}
                  className={`flex items-center space-x-3 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm transition-colors ${
                    availableBars.length > 1 ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {shouldUseLogo && logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt={selectedBar?.nome}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : selectedBar?.avatar ? (
                      <img 
                        src={selectedBar.avatar} 
                        alt={selectedBar.nome}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-sm text-white">🏪</span>
                    )}
                  </div>
                  <span className="font-medium text-slate-700 hidden sm:block">
                    {selectedBar?.nome || 'Carregando...'}
                  </span>
                  {availableBars.length > 1 && (
                    <svg 
                      className={`w-4 h-4 text-slate-400 transition-transform ${showBarSelector ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Dropdown - apenas se houver mais de um bar */}
                {showBarSelector && availableBars.length > 1 && (
                  <>
                    {/* Overlay para fechar o dropdown */}
                    <div 
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setShowBarSelector(false)}
                    />
                    
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl drop-shadow-lg z-[10000]">
                      <div className="p-2">
                        <div className="text-xs font-medium text-slate-500 px-3 py-2 uppercase tracking-wide">
                          Selecionar Bar
                        </div>
                        {availableBars.map((bar) => (
                          <button
                            key={bar.id}
                            onClick={() => {
                              onBarChange(bar)
                              setShowBarSelector(false)
                            }}
                            className={`
                              w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors
                              ${selectedBar?.id === bar.id 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                : 'hover:bg-gray-50 text-slate-700'
                              }
                            `}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                              {bar.nome?.toLowerCase().includes('ordinário') || bar.nome?.toLowerCase().includes('ordinario') ? (
                                <img 
                                  src="/favicons/ordinario/favicon-32x32.png" 
                                  alt={bar.nome}
                                  className="w-full h-full rounded-lg object-cover"
                                />
                              ) : bar.avatar ? (
                                <img 
                                  src={bar.avatar} 
                                  alt={bar.nome}
                                  className="w-full h-full rounded-lg object-cover"
                                />
                              ) : (
                                <span className="text-sm text-white">🏪</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{bar.nome}</span>
                              {selectedBar?.id === bar.id && (
                                <div className="text-xs text-indigo-600">Selecionado</div>
                              )}
                            </div>
                            {selectedBar?.id === bar.id && (
                              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Indicador se há apenas um bar */}
              {availableBars.length === 1 && (
                <div className="text-xs text-slate-500 hidden sm:block">
                  1 bar disponível
                </div>
              )}
            </>
          ) : (
            /* Mostrar quando não há bares disponíveis */
            <div className="flex items-center space-x-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-sm text-white">⚠️</span>
              </div>
              <span className="font-medium text-red-700 hidden sm:block">
                Nenhum bar disponível
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 