'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePWA } from '@/hooks/usePWA'
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor,
  Zap,
  Wifi,
  Bell
} from 'lucide-react'

interface PWAInstallBannerProps {
  className?: string
  variant?: 'floating' | 'inline' | 'modal'
  autoShow?: boolean
  showDelay?: number
}

export function PWAInstallBanner({ 
  className = '',
  variant = 'floating',
  autoShow = true,
  showDelay = 3000
}: PWAInstallBannerProps) {
  const { 
    isInstallable, 
    isInstalled, 
    isLoading,
    install,
    enableNotifications,
    notificationPermission
  } = usePWA()
  
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Controlar visibilidade do banner
  useEffect(() => {
    if (!autoShow || isInstalled || isDismissed || !isInstallable) {
      return
    }

    // Verificar se o usuário já dismissou antes
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const now = Date.now()
      // Mostrar novamente após 7 dias
      if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true)
        return
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, showDelay)

    return () => clearTimeout(timer)
  }, [autoShow, isInstalled, isDismissed, isInstallable, showDelay])

  const handleInstall = async () => {
    setIsInstalling(true)
    
    try {
      const success = await install()
      if (success) {
        setIsVisible(false)
        setIsDismissed(true)
      }
    } catch (error) {
      console.error('Erro na instalação:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    
    // Salvar no localStorage
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
  }

  const handleEnableNotifications = async () => {
    await enableNotifications()
  }

  // Não mostrar se não for necessário
  if (isLoading || isInstalled || !isInstallable || isDismissed || !isVisible) {
    return null
  }

  const features = [
    {
      icon: Zap,
      text: 'Acesso instantâneo'
    },
    {
      icon: Wifi,
      text: 'Funciona offline'
    },
    {
      icon: Bell,
      text: 'Notificações push'
    }
  ]

  const getVariantStyles = () => {
    switch (variant) {
      case 'floating':
        return `fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md ${className}`
      case 'modal':
        return `fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${className}`
      case 'inline':
      default:
        return `w-full ${className}`
    }
  }

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (variant === 'modal') {
      return (
        <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          {children}
        </Card>
      )
    }

    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
        {children}
      </Card>
    )
  }

  return (
    <div className={getVariantStyles()}>
      <CardWrapper>
        <CardContent className="p-4">
          {/* Header com close */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Instalar SGB App
                </h3>
                <Badge className="badge-primary text-xs">PWA</Badge>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Descrição */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Adicione o SGB à sua tela inicial para acesso rápido e experiência nativa.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <feature.icon className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Download className={`w-4 h-4 mr-2 ${isInstalling ? 'animate-bounce' : ''}`} />
              {isInstalling ? 'Instalando...' : 'Instalar App'}
            </Button>

            {notificationPermission !== 'granted' && (
              <Button
                onClick={handleEnableNotifications}
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600"
                size="sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                Habilitar Notificações
              </Button>
            )}
          </div>

          {/* Instructions para diferentes plataformas */}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <p className="flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              Desktop: Use o ícone de instalação na barra de endereços
            </p>
          </div>
        </CardContent>
      </CardWrapper>

      {/* Backdrop para modal */}
      {variant === 'modal' && (
        <div 
          className="absolute inset-0 -z-10" 
          onClick={handleDismiss}
        />
      )}
    </div>
  )
}

// Hook para usar o banner programaticamente
export function usePWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false)
  
  const showBanner = () => setIsVisible(true)
  const hideBanner = () => setIsVisible(false)
  
  return {
    isVisible,
    showBanner,
    hideBanner,
    PWABanner: ({ ...props }) => (
      <PWAInstallBanner
        {...props}
        variant="modal"
        autoShow={false}
      />
    )
  }
} 
