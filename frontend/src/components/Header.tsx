'use client'

import { useState } from 'react'
import { useBarLogo } from '@/hooks/useBarLogo'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { usePermissions } from '@/hooks/usePermissions'

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
  const [showNotifications, setShowNotifications] = useState(false)
  const { logoUrl, shouldUseLogo } = useBarLogo({ barName: selectedBar?.nome, size: 'small' })
  const { pageTitle } = usePageTitle()
  const { user } = usePermissions()

  // Mock notifications - em produção viria de uma API
  const notifications = [
    { id: 1, title: 'Nova sincronização', message: 'ContaHub sincronizado com sucesso', time: '2m ago', unread: true },
    { id: 2, title: 'Relatório gerado', message: 'Relatório semanal disponível', time: '5m ago', unread: true },
    { id: 3, title: 'Sistema atualizado', message: 'Nova versão do SGB disponível', time: '1h ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-black border-b border-slate-700/50 px-4 py-3 lg:px-6 relative z-[100] shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        {/* Left Section - Menu e Título */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors group"
          >
            <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-white">
                  SGB
                </h1>
              </div>
              {pageTitle && (
                <>
                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
                </>
              )}
            </div>
            

          </div>
        </div>

        {/* Right Section - Notificações e Controles */}
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          <button className="p-2 rounded-xl hover:bg-white/10 transition-colors group">
            <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors group relative"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.74a6 6 0 0 1 8.25 8.98m0 0A6 6 0 0 1 5.25 8.98m0 0a6.002 6.002 0 0 0-3.75 5.25m0 0a6 6 0 0 0 6 6c1.66 0 3.14-.69 4.22-1.78M12 3a6.002 6.002 0 0 0-3.75 5.25m0 0a6 6 0 0 0 6 6c1.66 0 3.14-.69 4.22-1.78" />
              </svg>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{unreadCount}</span>
                </div>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowNotifications(false)}
                />
                
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[10000] overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">Notificações</h3>
                      <span className="text-xs text-slate-500">{unreadCount} não lidas</span>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                          notification.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 text-sm">{notification.title}</h4>
                            <p className="text-slate-600 text-sm mt-1">{notification.message}</p>
                            <span className="text-xs text-slate-400 mt-2 block">{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-slate-200">
                    <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

                    {/* Settings */}
          <button className="p-2 rounded-xl hover:bg-white/10 transition-colors group">
            <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">
                {user?.nome ? user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-white">{user?.nome || 'Usuário'}</div>
              <div className="text-xs text-slate-400">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'manager' ? 'Gerente' : 
                 user?.role === 'funcionario' ? 'Funcionário' : 'Usuário'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Selector Dropdown */}
      {showBarSelector && availableBars.length > 1 && (
        <>
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowBarSelector(false)}
          />
          
          <div className="absolute left-4 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[10000] overflow-hidden">
            <div className="p-3">
              <div className="text-sm font-semibold text-slate-800 mb-3">Selecionar Estabelecimento</div>
              
              <div className="space-y-1">
                {availableBars.map((bar) => (
                  <button
                    key={bar.id}
                    onClick={() => {
                      onBarChange(bar)
                      setShowBarSelector(false)
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition-colors
                      ${selectedBar?.id === bar.id 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                        : 'hover:bg-slate-50 text-slate-700'
                      }
                    `}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      {bar.avatar ? (
                        <img 
                          src={bar.avatar} 
                          alt={bar.nome}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-bold">🏪</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{bar.nome}</span>
                      {selectedBar?.id === bar.id && (
                        <div className="text-xs text-indigo-600">Selecionado</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
} 