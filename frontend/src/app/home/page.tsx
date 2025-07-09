'use client'

import { useState, useEffect, Suspense, Component, ReactNode } from 'react'
import { DarkSidebarLayout } from '@/components/layouts'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageTitle } from '@/contexts/PageTitleContext'

// Componente simples para home em construção
function HomeEmConstrucao() {
  const { isAdminWithSpecificPermissions, user } = usePermissions()
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Dashboard Principal')
    return () => setPageTitle('')
  }, [setPageTitle])

  return (
    <div className="space-y-6">
      {/* Banner de Teste de Permissões para Admin */}
      {isAdminWithSpecificPermissions() && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">🧪</span>
            </div>
            <div className="flex-1">
              <p className="text-amber-800 text-sm font-bold">
                Modo de Teste de Permissões Ativo
              </p>
              <p className="text-amber-700 text-xs leading-relaxed">
                Você está vendo apenas os módulos permitidos ({user?.modulos_permitidos?.length || 0}/8). 
                Para voltar ao acesso completo, configure todas as permissões.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/configuracoes?tab=usuarios'}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              Ajustar Permissões
            </button>
          </div>
        </div>
      )}

      {/* Card Principal "Em Construção" */}
      <div className="text-center max-w-lg mx-auto">
        {/* Ícone Principal */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 hover:shadow-3xl hover:scale-110 transition-all duration-500">
            <span className="text-4xl">🏠</span>
          </div>
        </div>

        {/* Título no header global */}

        {/* Descrição */}
        <p className="text-slate-600 mb-8 leading-relaxed text-lg">
          Visão geral completa com métricas de performance, faturamento e indicadores do seu estabelecimento.
        </p>

        {/* Features previstas */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-semibold text-blue-800">Métricas em Tempo Real</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-semibold text-green-800">Faturamento Diário</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200/50">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-semibold text-purple-800">Análise de Clientes</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200/50">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm font-semibold text-orange-800">Performance</div>
          </div>
        </div>

        {/* Badge de Prioridade */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <span className="w-5 h-5 mr-2">⚡</span>
            Alta Prioridade
          </span>
        </div>

        {/* Previsão */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center text-blue-800 mb-2">
            <span className="w-6 h-6 mr-3 text-xl">⏰</span>
            <span className="text-lg font-bold">
              Previsão: 1-2 semanas
            </span>
          </div>
          <p className="text-blue-600 text-sm">
            Dashboard completo com widgets interativos e análises avançadas
          </p>
        </div>

        {/* Progresso visual */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span className="font-medium">Progresso do Desenvolvimento</span>
            <span className="font-bold">75%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full w-3/4 shadow-lg animate-pulse"></div>
          </div>
        </div>


      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <DarkSidebarLayout>
      <HomeEmConstrucao />
    </DarkSidebarLayout>
  )
} 