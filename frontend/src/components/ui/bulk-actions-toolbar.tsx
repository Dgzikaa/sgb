"use client"

import React from 'react'
import { X, Trash2, Edit, Archive, Download, Share2, Copy, MoreHorizontal } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Separator } from './separator'
import { cn } from '@/lib/utils'

export interface BulkAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  onClick: (selectedItems: unknown[]) => void | Promise<void>
  disabled?: boolean
  requiresConfirmation?: boolean
  confirmationMessage?: string
}

interface BulkActionsToolbarProps {
  selectedCount: number
  totalCount: number
  selectedItems: unknown[]
  actions: BulkAction[]
  onClearSelection: () => void
  className?: string
  position?: 'fixed' | 'sticky' | 'relative'
  showStats?: boolean
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  selectedItems,
  actions,
  onClearSelection,
  className,
  position = 'sticky',
  showStats = true
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  const percentage = Math.round((selectedCount / totalCount) * 100)

  const primaryActions = actions.filter(action => 
    ['edit', 'delete', 'archive', 'download'].includes(action.id)
  ).slice(0, 3)
  
  const secondaryActions = actions.filter(action => 
    !['edit', 'delete', 'archive', 'download'].includes(action.id)
  )

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        action.confirmationMessage || 
        `Confirma a ação "${action.label}" em ${selectedCount} item(s)?`
      )
      if (!confirmed) return
    }

    try {
      await action.onClick(selectedItems)
    } catch (error) {
      console.error('Erro na ação em lote:', error)
    }
  }

  return (
    <div
      className={cn(
        "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 transition-all duration-300 ease-in-out",
        position === 'fixed' && "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg",
        position === 'sticky' && "sticky top-0 z-40 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
          </Badge>
          
          {showStats && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {percentage}% do total
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Primary Actions */}
          {primaryActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleAction(action)}
                disabled={action.disabled}
                className="h-8"
              >
                {IconComponent && <IconComponent className="h-4 w-4 mr-1" />}
                {action.label}
              </Button>
            )
          })}

          {/* Secondary Actions Popover */}
          {secondaryActions.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div className="space-y-1">
                    {secondaryActions.map((action, index) => {
                      const IconComponent = action.icon
                      return (
                        <React.Fragment key={action.id}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(action)}
                            disabled={action.disabled}
                            className={cn(
                              "w-full justify-start h-8",
                              action.variant === 'destructive' && 
                              "text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            )}
                          >
                            {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                            {action.label}
                          </Button>
                          {index < secondaryActions.length - 1 && 
                           action.variant === 'destructive' && 
                           <Separator className="my-1" />
                          }
                        </React.Fragment>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Clear Selection */}
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Ações predefinidas comuns
export const commonBulkActions = {
  delete: (onDelete: (items: unknown[]) => void): BulkAction => ({
    id: 'delete',
    label: 'Excluir',
    icon: Trash2,
    variant: 'destructive' as const,
    onClick: onDelete,
    requiresConfirmation: true,
    confirmationMessage: 'Esta ação não pode ser desfeita. Confirma a exclusão?'
  }),
  
  edit: (onEdit: (items: unknown[]) => void): BulkAction => ({
    id: 'edit',
    label: 'Editar',
    icon: Edit,
    variant: 'outline' as const,
    onClick: onEdit
  }),
  
  archive: (onArchive: (items: unknown[]) => void): BulkAction => ({
    id: 'archive',
    label: 'Arquivar',
    icon: Archive,
    variant: 'outline' as const,
    onClick: onArchive,
    requiresConfirmation: true
  }),
  
  download: (onDownload: (items: unknown[]) => void): BulkAction => ({
    id: 'download',
    label: 'Baixar',
    icon: Download,
    variant: 'outline' as const,
    onClick: onDownload
  }),
  
  duplicate: (onDuplicate: (items: unknown[]) => void): BulkAction => ({
    id: 'duplicate',
    label: 'Duplicar',
    icon: Copy,
    variant: 'outline' as const,
    onClick: onDuplicate
  }),
  
  share: (onShare: (items: unknown[]) => void): BulkAction => ({
    id: 'share',
    label: 'Compartilhar',
    icon: Share2,
    variant: 'outline' as const,
    onClick: onShare
  })
} 
