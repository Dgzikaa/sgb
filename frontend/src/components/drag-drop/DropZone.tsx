import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { DragHandlers } from '@/hooks/useDragAndDrop'

export interface DropZoneProps {
  children: ReactNode
  onDrop: (item: any) => void
  accepts?: string[]
  className?: string
  disabled?: boolean
  zone: string
  title?: string
  description?: string
  icon?: ReactNode
  emptyState?: ReactNode
}

export function DropZone({
  children,
  onDrop,
  accepts = [],
  className = '',
  disabled = false,
  zone,
  title,
  description,
  icon,
  emptyState
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    
    setDragCounter(prev => prev + 1)
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    
    setDragCounter(prev => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setIsDragOver(false)
      }
      return newCounter
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    
    setIsDragOver(false)
    setDragCounter(0)
    
    try {
      const data = e.dataTransfer.getData('text/plain')
      if (data) {
        const item = JSON.parse(data)
        
        // Check if item type is accepted
        if (accepts.length > 0 && item.type && !accepts.includes(item.type)) {
          return
        }
        
        onDrop({ ...item, targetZone: zone })
      }
    } catch (error) {
      console.warn('Could not parse dropped data:', error)
    }
  }

  const hasContent = !!children
  const showEmptyState = !hasContent && emptyState

  return (
    <div
      className={cn(
        'drop-zone relative transition-all duration-200 ease-out',
        'border-2 border-dashed rounded-xl',
        {
          // Default state
          'border-gray-300 dark:border-gray-600': !isDragOver && !disabled,
          'bg-gray-50/50 dark:bg-gray-800/50': !isDragOver && !disabled,
          
          // Drag over state
          'border-blue-400 dark:border-blue-500': isDragOver && !disabled,
          'bg-blue-50 dark:bg-blue-900/20': isDragOver && !disabled,
          'ring-2 ring-blue-400/50 dark:ring-blue-500/50': isDragOver && !disabled,
          'scale-105': isDragOver && !disabled,
          
          // Disabled state
          'border-gray-200 dark:border-gray-700': disabled,
          'bg-gray-100 dark:bg-gray-800': disabled,
          'opacity-50 cursor-not-allowed': disabled,
          
          // Content states
          'min-h-[200px]': !hasContent,
          'p-6': !hasContent,
          'p-2': hasContent
        },
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-drop-zone={zone}
      role="region"
      aria-label={`Drop zone: ${title || zone}`}
      aria-describedby={`dropzone-${zone}-desc`}
    >
      {/* Accessibility description */}
      {(title || description) && (
        <div id={`dropzone-${zone}-desc`} className="sr-only">
          {title && `Drop zone: ${title}. `}
          {description}
          {accepts.length > 0 && ` Accepts: ${accepts.join(', ')}`}
        </div>
      )}

      {/* Drag overlay */}
      {isDragOver && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2">
              {icon || <span className="text-xl">📦</span>}
              Soltar aqui
            </div>
          </div>
        </div>
      )}

      {/* Content or empty state */}
      {hasContent ? (
        children
      ) : showEmptyState ? (
        emptyState
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-8">
          {icon && (
            <div className="text-4xl mb-4 opacity-50">
              {icon}
            </div>
          )}
          
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
          )}
          
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs">
              {description}
            </p>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
            {disabled ? 'Drop zone desabilitada' : 'Arraste itens aqui'}
          </div>
          
          {accepts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {accepts.map(type => (
                <span
                  key={type}
                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-400"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Variantes específicas
export function ChecklistDropZone({ onDrop, className, ...props }: Omit<DropZoneProps, 'zone' | 'accepts'>) {
  return (
    <DropZone
      {...props}
      zone="checklist"
      accepts={['checklist-item', 'task']}
      icon={<span>✓</span>}
      title="Checklist"
      description="Solte itens de checklist aqui"
      onDrop={onDrop}
      className={cn('border-green-300 dark:border-green-600', className)}
    />
  )
}

export function CategoryDropZone({ 
  category, 
  onDrop, 
  className, 
  ...props 
}: Omit<DropZoneProps, 'zone'> & { category: string }) {
  return (
    <DropZone
      {...props}
      zone={`category-${category}`}
      title={category}
      description={`Mover para categoria ${category}`}
      icon={<span>📂</span>}
      onDrop={onDrop}
      className={cn('border-purple-300 dark:border-purple-600', className)}
    />
  )
}

export function TrashDropZone({ onDrop, className, ...props }: Omit<DropZoneProps, 'zone'>) {
  return (
    <DropZone
      {...props}
      zone="trash"
      title="Lixeira"
      description="Solte aqui para remover"
      icon={<span>🗑️</span>}
      onDrop={onDrop}
      className={cn('border-red-300 dark:border-red-600 hover:border-red-400', className)}
    />
  )
} 