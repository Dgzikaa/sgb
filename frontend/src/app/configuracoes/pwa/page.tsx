'use client'

import { useState, useEffect } from 'react'
import PWAStatus from '@/components/PWAStatus'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { usePWA } from '@/hooks/usePWA'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Bell, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Globe,
  Home,
  RefreshCw,
  Settings
} from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAPage() {
  const { setPageTitle } = usePageTitle()
  const { isInstalled, isInstallable } = usePWA()
  const [isOnline, setIsOnline] = useState(true)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'unknown'>('unknown')

  useEffect(() => {
    setPageTitle('PWA - Configurações')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    // Detectar plataforma
    const userAgent = navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    setPlatform(isMobile ? 'mobile' : 'desktop')

    // Monitorar status online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      console.log(`PWA instalação: ${outcome}`)
      setInstallPrompt(null)
    } else {
      // Fallback para instruções manuais
      alert('Para instalar, use o menu do navegador ou clique no ícone de instalação na barra de endereços.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progressive Web App</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Instale o SGB como aplicativo nativo para melhor experiência
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>

          {/* Status e Instalação */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status atual */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isInstalled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  Status da Instalação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isInstalled ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <div>
                          <h3 className="font-semibold text-green-900 dark:text-green-100">
                            App Instalado com Sucesso!
                          </h3>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            O SGB está funcionando como aplicativo nativo
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Home className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Tela Inicial
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Ícone adicionado
                        </p>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Globe className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Modo Offline
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          Funcionando
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                            App Não Instalado
                          </h3>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Instale para ter acesso offline e melhor performance
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botão de instalação automática */}
                    {(isInstallable || installPrompt) && (
                      <div className="text-center">
                        <Button
                          onClick={handleInstallClick}
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Instalar App Agora
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Instalação rápida e automática
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações da plataforma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {platform === 'mobile' ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Monitor className="w-5 h-5" />
                  )}
                  Sua Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {platform === 'mobile' ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Smartphone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-medium text-blue-900 dark:text-blue-100">Mobile</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Ideal para instalação PWA
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Monitor className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-900 dark:text-green-100">Desktop</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Suporte completo PWA
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">PWA Support</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Service Worker</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Cache Offline</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status da PWA (componente existente) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PWAStatus showActions={true} />
            </CardContent>
          </Card>

          {/* Funcionalidades PWA */}
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades PWA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📱 App Nativo
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Experiência de app nativo com instalação na tela inicial
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    🌐 Modo Offline
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Funciona sem internet com cache inteligente
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    🔔 Push Notifications
                  </h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Notificações em tempo real mesmo com app fechado
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    ⚡ Performance
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Carregamento instantâneo com Service Worker
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guia de instalação */}
          <Card>
            <CardHeader>
              <CardTitle>Como Instalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    📱 Mobile (Android/iOS)
                  </h3>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Abra o menu do navegador (⋮)</li>
                    <li>Toque em &quot;Adicionar à tela inicial&quot;</li>
                    <li>Confirme a instalação</li>
                    <li>O app aparecerá na tela inicial</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    💻 Desktop (Chrome/Edge)
                  </h3>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Clique no ícone de instalação na barra de endereços</li>
                    <li>Ou use o menu → Instalar SGB</li>
                    <li>O app aparecerá como programa instalado</li>
                    <li>Funciona independentemente do navegador</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
