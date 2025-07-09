'use client'

import { useState } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'

export default function DarkHeader() {
  const { pageTitle } = usePageTitle()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const { isSidebarCollapsed, toggleSidebarCollapse } = useSidebar()

  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-black border-b border-slate-700/50 shadow-2xl shadow-black/20 fixed top-0 right-0 z-30"
      style={{ 
        left: isSidebarCollapsed ? '80px' : '320px',
        transition: 'left 0.5s ease-out'
      }}
    >
      <div className="flex items-center justify-between py-1.5 px-4 lg:px-8">
        {/* Left Section - Botão de Collapse + Título */}
        <div className="flex items-center space-x-3">
          {/* Botão de expandir/colapsar sidebar - integrado no header */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex items-center justify-center p-2 
              text-slate-400 
              hover:bg-white/10 hover:text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5
              active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-white/20
              rounded-lg 
              transition-all duration-200 
              group"
            title={isSidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <svg 
              className={`w-4 h-4 transition-all duration-300 group-hover:scale-110 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Título da Página */}
          {pageTitle && (
            <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
          )}
        </div>

        {/* Right Section - User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-xl hover:bg-white/10 transition-colors group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">RO</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-white">Rodrigo Oliveira</div>
              <div className="text-xs text-slate-400">Administrador</div>
            </div>
            <svg className={`w-4 h-4 text-slate-400 group-hover:text-white transition-all duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              
              {/* Menu */}
              <div className="absolute top-12 right-0 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[60] py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">RO</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Rodrigo Oliveira</div>
                      <div className="text-xs text-slate-400">Administrador</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      router.push('/configuracoes')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">Account</span>
                  </button>

                  <button
                    onClick={() => {
                      // TODO: Implementar inbox
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-sm">Inbox</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/admin/checklists')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="text-sm">Taskboard</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/configuracoes')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Settings</span>
                  </button>

                  <div className="border-t border-slate-700 my-2"></div>

                  <button
                    onClick={() => {
                      // TODO: Implementar logout
                      localStorage.removeItem('sgb_user')
                      router.push('/login')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm">Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 