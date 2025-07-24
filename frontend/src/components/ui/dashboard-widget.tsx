'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  GripVertical, 
  Settings, 
  X, 
  RefreshCw, 
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Tipos para widgets
export type WidgetSize = 'small' | 'medium' | 'large' | 'full'
export type WidgetType = 'metric' | 'chart' | 'table' | 'activity' | 'status' | 'custom'

export interface WidgetConfig {
  id: string
  title: string
  type: WidgetType
  size: WidgetSize
  position: { x: number; y: number }
  visible: boolean
  refreshInterval?: number
  customConfig?: Record<string, (unknown)>
}

export interface DashboardWidgetProps {
  config: WidgetConfig
  children: React.ReactNode
  onConfigChange?: (config: WidgetConfig) => void
  onRemove?: (id: string) => void
  isDragging?: boolean
  isEditing?: boolean
  loading?: boolean
  error?: string
  className?: string
}

const sizeClasses = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-1',
  large: 'col-span-2 row-span-2',
  full: 'col-span-full row-span-1'
}

const sizeLabels = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
  full: 'Largura Total'
}

export function DashboardWidget({
  config,
  children,
  onConfigChange,
  onRemove,
  isDragging = false,
  isEditing = false,
  loading = false,
  error,
  className
}: DashboardWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  // Auto-refresh se configurado
  useEffect(() => {
    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(() => {
        handleRefresh()
      }, config.refreshInterval * 1000)
      
      return () => clearInterval(interval)
    }
  }, [config.refreshInterval])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simular refresh - em implementação real, chamar API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleSizeChange = (newSize: WidgetSize) => {
    if (onConfigChange) {
      onConfigChange({
        ...config,
        size: newSize
      })
    }
  }

  const handleVisibilityToggle = () => {
    if (onConfigChange) {
      onConfigChange({
        ...config,
        visible: !config.visible
      })
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(config.id)
    }
  }

  if (!config.visible && !isEditing) {
    return null
  }

  return (
    <Card
      ref={dragRef}
      className={cn(
        'relative group transition-all duration-200',
        sizeClasses[config.size],
        isDragging && 'shadow-2xl scale-105 rotate-1 z-50',
        isEditing && 'ring-2 ring-blue-500 ring-opacity-50',
        error && 'border-red-500 bg-red-50 dark:bg-red-900/20',
        !config.visible && isEditing && 'opacity-50',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header com controles */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div className={cn(
            'cursor-grab active:cursor-grabbing transition-opacity',
            isHovered || isEditing ? 'opacity-100' : 'opacity-0'
          )}>
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          
          {/* Widget title */}
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            {config.title}
          </CardTitle>
          
          {/* Widget type badge */}
          <Badge variant="secondary" className="text-xs">
            {config.type}
          </Badge>
        </div>

        {/* Controls */}
        <div className={cn(
          'flex items-center gap-1 transition-opacity',
          isHovered || isEditing ? 'opacity-100' : 'opacity-0'
        )}>
          {/* Visibility toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVisibilityToggle}
            className="h-6 w-6 p-0"
          >
            {config.visible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn(
              'h-3 w-3',
              isRefreshing && 'animate-spin'
            )} />
          </Button>

          {/* Settings button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-6 w-6 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>

          {/* Remove button */}
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-full left-0 right-0 z-10 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tamanho
              </label>
              <div className="flex gap-2">
                {Object.entries(sizeLabels).map(([size, label]) => (
                  <Button
                    key={size}
                    variant={config.size === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSizeChange(size as WidgetSize)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Auto-refresh (segundos)
              </label>
              <input
                type="number"
                value={config.refreshInterval || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  if (onConfigChange) {
                    onConfigChange({
                      ...config,
                      refreshInterval: value
                    })
                  }
                }}
                className="w-full px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0 = desabilitado"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <CardContent className="space-y-4">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 py-4">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Widget content */}
        {!loading && !error && children}
      </CardContent>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 rounded-lg border-2 border-blue-500 border-dashed" />
      )}
    </Card>
  )
}

// Widget presets
export const WIDGET_PRESETS = {
  resumo_financeiro: {
    id: 'resumo_financeiro',
    title: 'Resumo Financeiro',
    type: 'metric' as WidgetType,
    size: 'medium' as WidgetSize,
    position: { x: 0, y: 0 },
    visible: true,
    refreshInterval: 30
  },
  checklist_status: {
    id: 'checklist_status',
    title: 'Status dos Checklists',
    type: 'status' as WidgetType,
    size: 'small' as WidgetSize,
    position: { x: 0, y: 1 },
    visible: true,
    refreshInterval: 60
  },
  producao_ativa: {
    id: 'producao_ativa',
    title: 'Produção Ativa',
    type: 'status' as WidgetType,
    size: 'small' as WidgetSize,
    position: { x: 1, y: 1 },
    visible: true,
    refreshInterval: 30
  },
  metricas_integracoes: {
    id: 'metricas_integracoes',
    title: 'Métricas das Integrações',
    type: 'metric' as WidgetType,
    size: 'large' as WidgetSize,
    position: { x: 0, y: 2 },
    visible: true,
    refreshInterval: 120
  },
  feed_atividades: {
    id: 'feed_atividades',
    title: 'Feed de Atividades',
    type: 'activity' as WidgetType,
    size: 'medium' as WidgetSize,
    position: { x: 2, y: 0 },
    visible: true,
    refreshInterval: 15
  },
  alertas_sistema: {
    id: 'alertas_sistema',
    title: 'Alertas do Sistema',
    type: 'status' as WidgetType,
    size: 'full' as WidgetSize,
    position: { x: 0, y: 3 },
    visible: true,
    refreshInterval: 10
  }
} as const 
