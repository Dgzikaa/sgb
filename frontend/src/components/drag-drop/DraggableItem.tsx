import { ReactNode, forwardRef, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DragHandlers } from '@/hooks/useDragAndDrop'

export interface DraggableItemProps {
  children: ReactNode
  item: any
  dragHandlers: DragHandlers
  isDragging?: boolean
  isDragOver?: boolean
  className?: string
  disabled?: boolean
  renderDragHandle?: boolean
  onKeyboardReorder?: (direction: 'up' | 'down') => void
}

export const DraggableItem = forwardRef<HTMLDivElement, DraggableItemProps>(({
  children,
  item,
  dragHandlers,
  isDragging = false,
  isDragOver = false,
  className = '',
  disabled = false,
  renderDragHandle = true,
  onKeyboardReorder
}, ref) => {
  const itemRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || !onKeyboardReorder) return

    if (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onKeyboardReorder('up')
    } else if (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onKeyboardReorder('down')
    }
  }

  // Auto-scroll during drag
  useEffect(() => {
    if (!isDragging) return

    const handleDragScroll = (e: MouseEvent) => {
      const viewport = window.innerHeight
      const scrollThreshold = 100
      const scrollSpeed = 5

      if (e.clientY < scrollThreshold) {
        window.scrollBy(0, -scrollSpeed)
      } else if (e.clientY > viewport - scrollThreshold) {
        window.scrollBy(0, scrollSpeed)
      }
    }

    document.addEventListener('mousemove', handleDragScroll)
    return () => document.removeEventListener('mousemove', handleDragScroll)
  }, [isDragging])

  const dragHandle = renderDragHandle && !disabled && (
    <div
      className="drag-handle opacity-40 group-hover:opacity-100 transition-opacity p-1 cursor-grab active:cursor-grabbing"
      aria-label="Arrastar para reordenar"
      title="Segurar e arrastar para reordenar"
    >
      <svg
        width="12"
        height="16"
        viewBox="0 0 12 16"
        fill="currentColor"
        className="text-gray-400 dark:text-gray-500"
      >
        <circle cx="3" cy="3" r="1.5" />
        <circle cx="9" cy="3" r="1.5" />
        <circle cx="3" cy="8" r="1.5" />
        <circle cx="9" cy="8" r="1.5" />
        <circle cx="3" cy="13" r="1.5" />
        <circle cx="9" cy="13" r="1.5" />
      </svg>
    </div>
  )

  return (
    <div
      ref={ref || itemRef}
      className={cn(
        'group relative transition-all duration-200 ease-out',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
        {
          // Dragging state
          'opacity-50 scale-95 rotate-2 z-50': isDragging,
          
          // Drag over state  
          'ring-2 ring-blue-400 ring-offset-2': isDragOver && !isDragging,
          'bg-blue-50 dark:bg-blue-900/20': isDragOver && !isDragging,
          
          // Disabled state
          'opacity-50 cursor-not-allowed': disabled,
          
          // Interactive state
          'cursor-grab hover:shadow-lg transform hover:-translate-y-1': !disabled && !isDragging,
          'active:cursor-grabbing': !disabled
        },
        className
      )}
      draggable={!disabled}
      onDragStart={(e) => dragHandlers.onDragStart(e, item)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={dragHandlers.onDragOver}
      onDragEnter={(e) => dragHandlers.onDragEnter(e, item)}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={(e) => dragHandlers.onDrop(e, item)}
      onTouchStart={(e) => dragHandlers.onDragStart(e, item)}
      onTouchEnd={dragHandlers.onDragEnd}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-grabbed={isDragging}
      aria-describedby={`item-${item.id || item.index}-instructions`}
      data-drop-zone="true"
      data-drop-item={JSON.stringify(item)}
    >
      {/* Accessibility instructions */}
      <div
        id={`item-${item.id || item.index}-instructions`}
        className="sr-only"
      >
        {!disabled && onKeyboardReorder && (
          'Use Ctrl+Arrow keys to reorder, or drag with mouse. Press Enter to select.'
        )}
      </div>

      {/* Drag indicator lines */}
      {isDragOver && !isDragging && (
        <>
          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-400 rounded-full animate-pulse" />
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-400 rounded-full animate-pulse" />
        </>
      )}

      {/* Content container */}
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        {dragHandle}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Visual indicators */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isDragging && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
          
          {!disabled && (
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Arrastar
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay during drag */}
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none" />
      )}
    </div>
  )
})

DraggableItem.displayName = 'DraggableItem' 