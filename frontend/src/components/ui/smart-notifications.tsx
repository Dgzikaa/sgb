'use client'

import { useState, useEffect } from 'react'
import { Bell, X, AlertCircle, CheckCircle, Info, AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useUser } from '@/contexts/UserContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'checklist' | 'production' | 'financial' | 'security' | 'system' | 'alert'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

const typeIcons = {
  checklist: CheckCircle,
  production: Settings,
  financial: AlertCircle,
  security: AlertTriangle,
  system: Info,
  alert: AlertTriangle
}

// Mock notifications para demonstração
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'checklist',
    priority: 'high',
    title: 'Checklist de Abertura Pendente',
    message: 'Checklist aguardando preenchimento no bar principal',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    actionUrl: '/checklists/abertura'
  },
  {
    id: '2',
    type: 'production',
    priority: 'medium',
    title: 'Produção em Andamento',
    message: '3 itens sendo preparados na cozinha',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionUrl: '/producao/terminal'
  },
  {
    id: '3',
    type: 'financial',
    priority: 'low',
    title: 'Sincronização ContaAzul',
    message: 'Dados financeiros atualizados com sucesso',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    actionUrl: '/relatorios/contaazul-v3'
  },
  {
    id: '4',
    type: 'security',
    priority: 'urgent',
    title: 'Tentativa de Acesso Suspeita',
    message: 'Múltiplas tentativas de login detectadas',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    actionUrl: '/configuracoes/seguranca'
  },
  {
    id: '5',
    type: 'system',
    priority: 'medium',
    title: 'Atualização do Sistema',
    message: 'Nova versão disponível para instalação',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true
  }
]

export function SmartNotifications() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notificações</span>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Marcar todas como lidas
              </Button>
            </DialogTitle>
            <DialogDescription>
              {unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Todas as notificações foram lidas'}
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          {/* Lista de Notificações */}
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon = typeIcons[notification.type]
                  return (
                    <Card key={notification.id} className={`transition-all duration-200 ${
                      !notification.read ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <Icon className="h-5 w-5 mt-1 text-gray-500 dark:text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-medium truncate">
                                {notification.title}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {notification.message}
                              </CardDescription>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge className={`text-xs ${priorityColors[notification.priority]}`}>
                                  {notification.priority === 'low' && 'Baixa'}
                                  {notification.priority === 'medium' && 'Média'}
                                  {notification.priority === 'high' && 'Alta'}
                                  {notification.priority === 'urgent' && 'Urgente'}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDistanceToNow(notification.timestamp, { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook para usar o sistema de notificações
export function useSmartNotifications() {
  const { user } = useUser()
  
  const createNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Mock para demonstração
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }
    
    console.log('Nova notificação criada:', newNotification)
    return newNotification
  }
  
  return {
    createNotification
  }
} 