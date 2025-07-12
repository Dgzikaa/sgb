'use client'

import { useState, useEffect, Suspense, Component, ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, Home, ArrowLeft } from 'lucide-react'

// Componente para mostrar mensagem de acesso negado
function AccessDeniedAlert() {
  const searchParams = useSearchParams()
  const [showAlert, setShowAlert] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  
  useEffect(() => {
    if (searchParams.get('error') === 'acesso_negado') {
      setShowAlert(true)
      // Auto-remover após 10 segundos
      const timer = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => setShowAlert(false), 300)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams])
  
  if (!showAlert) return null
  
  return (
    <div className={`transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <Alert className="border-red-200 bg-red-50 mb-6">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Acesso Negado</strong>
              <p className="mt-1 text-sm">
                Você não tem permissão para acessar a página solicitada. 
                Entre em contato com o administrador se precisar de acesso.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-700 hover:bg-red-100"
                onClick={() => {
                  setFadeOut(true)
                  setTimeout(() => setShowAlert(false), 300)
                }}
              >
                ✕
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Componente simples para home em construção
function HomeContent() {
  const { isAdminWithSpecificPermissions, user } = usePermissions()
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Dashboard Principal')
    return () => setPageTitle('')
  }, [setPageTitle])

  return (
    <div className="space-y-6">
      {/* Alerta de Acesso Negado */}
      <Suspense fallback={null}>
        <AccessDeniedAlert />
      </Suspense>

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
                Você está vendo apenas os módulos permitidos ({user?.modulos_permitidos?.length || 0}/23). 
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

      {/* Conteúdo Principal */}
      <div className="text-center py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Home className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bem-vindo ao SGB
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Sistema de Gestão de Bares - Controle total do seu estabelecimento
            </p>
          </div>

          {/* Status do Sistema */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Sistema Online</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Segurança Ativa</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Dados Sincronizados</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span>Backup Automático</span>
              </div>
            </div>
          </div>

          {/* Acesso Rápido */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Acesso Rápido
            </h2>
            <p className="text-gray-600 mb-6">
              Use o menu lateral para navegar pelas funcionalidades do sistema. 
              Suas permissões determinam quais módulos você pode acessar.
            </p>
            <div className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-lg inline-block">
              💡 Dica: Use o botão de colapsar no menu lateral para mais espaço na tela
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal com Error Boundary
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
} 