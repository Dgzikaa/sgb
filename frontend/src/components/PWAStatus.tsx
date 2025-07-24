'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePWA } from '@/hooks/usePWA'
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Bell, 
  BellOff,
  RefreshCw,
  Download,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface PWAStatusProps {
  className?: string
  showActions?: boolean
  compact?: boolean
}

export default function PWAStatus({ className, showActions, compact }: PWAStatusProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [install, setInstall] = useState<() => Promise<void> | void>(() => Promise.resolve())
  const [enableNotifications, setEnableNotifications] = useState<() => Promise<void> | void>(() => Promise.resolve())
  const [updateServiceWorker, setUpdateServiceWorker] = useState<() => Promise<void> | void>(() => Promise.resolve())
  const [clearCache, setClearCache] = useState<() => Promise<void> | void>(() => Promise.resolve())
  const [checkForUpdates, setCheckForUpdates] = useState<() => Promise<boolean> | boolean>(() => Promise.resolve(false))

  const [isUpdating, setIsUpdating] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [lastUpdateCheck, setLastUpdateCheck] = useState<Date | null>(null)

  const handleInstall = async () => {
    await install()
  }

  const handleEnableNotifications = async () => {
    await enableNotifications()
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateServiceWorker()
      setLastUpdateCheck(new Date())
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearCache = async () => {
    setIsClearingCache(true)
    try {
      await clearCache()
      // Recarregar após limpar cache
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } finally {
      setIsClearingCache(false)
    }
  }

  const handleCheckUpdates = async () => {
    setIsUpdating(true)
    try {
      const hasUpdate = await checkForUpdates()
      setLastUpdateCheck(new Date())
      
      if (hasUpdate) {
        // Mostrar notificação de atualização disponível
        console.log('Nova atualização disponível')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusItems = () => [
    {
      label: 'PWA Status',
      value: isInstalled ? 'Instalada' : 'Disponível',
      icon: isInstalled ? CheckCircle : Smartphone,
      status: isInstalled ? 'success' : 'warning',
      action: !isInstalled ? {
        label: 'Instalar',
        onClick: handleInstall,
        icon: Download
      } : undefined
    },
    {
      label: 'Conectividade',
      value: isOnline ? 'Online' : 'Offline',
      icon: isOnline ? Wifi : WifiOff,
      status: isOnline ? 'success' : 'error'
    },
    {
      label: 'Notificações',
      value: notificationPermission === 'granted' ? 'Habilitadas' : 
             notificationPermission === 'denied' ? 'Negadas' : 'Pendente',
      icon: notificationPermission === 'granted' ? Bell : BellOff,
      status: notificationPermission === 'granted' ? 'success' : 'warning',
      action: notificationPermission !== 'granted' ? {
        label: 'Habilitar',
        onClick: handleEnableNotifications,
        icon: Bell
      } : undefined
    },
    {
      label: 'Service Worker',
      value: serviceWorkerRegistration ? 'Ativo' : 'Inativo',
      icon: serviceWorkerRegistration ? CheckCircle : AlertCircle,
      status: serviceWorkerRegistration ? 'success' : 'error'
    }
  ]

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Status compacto apenas com ícones */}
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {isInstalled && (
          <Badge className="badge-success text-xs">PWA</Badge>
        )}
        
        {notificationPermission === 'granted' && (
          <Bell className="w-3 h-3 text-green-500" />
        )}
      </div>
    )
  }

  return (
    <Card className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Status da PWA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status items */}
        <div className="space-y-3">
          {getStatusItems().map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${
                  item.status === 'success' ? 'text-green-500' :
                  item.status === 'warning' ? 'text-yellow-500' :
                  'text-red-500'
                }`} />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}:
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {item.value}
                  </span>
                </div>
              </div>
              
              {item.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={item.action.onClick}
                  className="h-8 px-3 text-xs"
                >
                  <item.action.icon className="w-3 h-3 mr-1" />
                  {item.action.label}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCheckUpdates}
                disabled={isUpdating}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Verificando...' : 'Verificar Atualizações'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isClearingCache ? 'Limpando...' : 'Limpar Cache'}
              </Button>
            </div>
            
            {lastUpdateCheck && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Última verificação: {lastUpdateCheck.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
        )}

        {/* Info adicional */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p>• PWA permite instalação como app nativo</p>
          <p>• Service Worker possibilita funcionamento offline</p>
          <p>• Cache local melhora performance significativamente</p>
        </div>
      </CardContent>
    </Card>
  )
} 
