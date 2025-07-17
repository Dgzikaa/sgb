import { ReactNode, useCallback, useId } from 'react'
import { cn } from '@/lib/utils'
import { useSortableList } from '@/hooks/useDragAndDrop'
import { DraggableItem } from './DraggableItem'

export interface SortableListProps<T> {
  items: T[]
  onReorder: (newItems: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  getId?: (item: T, index: number) => string | number
  className?: string
  itemClassName?: string
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
  gap?: 'sm' | 'md' | 'lg'
  showDragHandle?: boolean
  emptyState?: ReactNode
  loading?: boolean
}

export function SortableList<T>({
  items: originalItems,
  onReorder,
  renderItem,
  getId,
  className = '',
  itemClassName = '',
  disabled = false,
  orientation = 'vertical',
  gap = 'md',
  showDragHandle = true,
  emptyState,
  loading = false
}: SortableListProps<T>) {
  const listId = useId()

  const { items, dragHandlers, isDragging } = useSortableList({
    items: originalItems,
    onReorder,
    getId,
    disabled: disabled || loading
  })

  // Keyboard reordering for accessibility
  const handleKeyboardReorder = useCallback((index: number, direction: 'up' | 'down') => {
    const currentIndex = index
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (targetIndex < 0 || targetIndex >= items.length) return
    
    const newItems = [...originalItems]
    const [movedItem] = newItems.splice(currentIndex, 1)
    newItems.splice(targetIndex, 0, movedItem)
    
    onReorder(newItems)
  }, [originalItems, onReorder, items.length])

  // Gap classes
  const gapClasses = {
    sm: orientation === 'vertical' ? 'space-y-2' : 'space-x-2',
    md: orientation === 'vertical' ? 'space-y-4' : 'space-x-4',
    lg: orientation === 'vertical' ? 'space-y-6' : 'space-x-6'
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          'animate-pulse',
          orientation === 'vertical' ? 'space-y-3' : 'flex space-x-3',
          className
        )}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-gray-200 dark:bg-gray-700 rounded-lg',
              orientation === 'vertical' ? 'h-16 w-full' : 'h-16 w-48'
            )}
          />
        ))}
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        {emptyState || (
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg font-medium mb-2">Nenhum item encontrado</p>
            <p className="text-sm">Adicione itens para começar a organizá-los</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'sortable-list relative',
        {
          // Orientation classes
          'flex flex-col': orientation === 'vertical',
          'flex flex-row flex-wrap': orientation === 'horizontal',
          
          // Dragging state
          'select-none': isDragging
        },
        gapClasses[gap],
        className
      )}
      role="list"
      aria-label="Lista ordenável"
      aria-describedby={`${listId}-instructions`}
    >
      {/* Instructions for screen readers */}
      <div id={`${listId}-instructions`} className="sr-only">
        Lista ordenável com {items.length} itens. 
        Use Ctrl+Setas para reordenar via teclado ou arraste com o mouse.
      </div>

      {/* Drag overlay for better UX */}
      {isDragging && (
        <div className="fixed inset-0 bg-black/5 dark:bg-white/5 pointer-events-none z-40" />
      )}

      {/* Items */}
      {items.map((item, index) => {
        const itemKey = getId ? getId(item.originalItem, index) : index

        return (
          <DraggableItem
            key={itemKey}
            item={item}
            dragHandlers={dragHandlers}
            isDragging={item.isDragging}
            isDragOver={item.isDragOver}
            disabled={disabled}
            renderDragHandle={showDragHandle}
            onKeyboardReorder={(direction) => handleKeyboardReorder(index, direction)}
            className={cn(
              'sortable-item',
              'card-dark p-4',
              {
                // Orientation specific classes
                'w-full': orientation === 'vertical',
                'flex-shrink-0': orientation === 'horizontal',
                
                // State classes
                'shadow-2xl z-50': item.isDragging,
                'ring-2 ring-blue-400 dark:ring-blue-500': item.isDragOver && !item.isDragging,
                
                // Interaction states
                'hover:shadow-md transition-shadow': !disabled && !item.isDragging
              },
              itemClassName
            )}
          >
            {renderItem(item.originalItem, index)}
          </DraggableItem>
        )
      })}

      {/* Drop zone indicator */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg pointer-events-none bg-blue-50/50 dark:bg-blue-900/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
              📦 Solte aqui para reordenar
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Variant específico para cards horizontais
export function SortableCardGrid<T>(props: Omit<SortableListProps<T>, 'orientation'>) {
  return (
    <SortableList
      {...props}
      orientation="horizontal"
      className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', props.className)}
    />
  )
}

// Variant específico para listas simples
export function SortableSimpleList<T>(props: Omit<SortableListProps<T>, 'orientation' | 'showDragHandle'>) {
  return (
    <SortableList
      {...props}
      orientation="vertical"
      showDragHandle={true}
      gap="sm"
      className={cn('max-w-2xl', props.className)}
    />
  )
} 
