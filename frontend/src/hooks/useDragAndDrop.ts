import { useRef, useCallback, useState, useEffect } from 'react'

export interface DraggableItem {
  id: string | number
  index?: number
  zone?: string
  [key: string]: unknown
}

export interface DragState {
  isDragging: boolean
  draggedItem: DraggableItem | null
  dragOverItem: DraggableItem | null
  dropZone: string | null
}

export interface DragHandlers {
  onDragStart: (e: React.DragEvent | React.TouchEvent, item: DraggableItem) => void
  onDragEnd: (e: React.DragEvent | React.TouchEvent) => void
  onDragOver: (e: React.DragEvent | React.TouchEvent) => void
  onDragEnter: (e: React.DragEvent | React.TouchEvent, item: DraggableItem) => void
  onDragLeave: (e: React.DragEvent | React.TouchEvent) => void
  onDrop: (e: React.DragEvent | React.TouchEvent, targetItem: DraggableItem) => void
}

export interface UseDragAndDropProps {
  onReorder?: (fromIndex: number, toIndex: number, items: DraggableItem[]) => void
  onMove?: (item: DraggableItem, targetZone: string) => void
  disabled?: boolean
  enableTouch?: boolean
}

export interface UseDragAndDropReturn {
  dragState: DragState
  dragHandlers: DragHandlers
  isDragging: boolean
  resetDrag: () => void
}

export function useDragAndDrop({
  onReorder,
  onMove,
  disabled = false,
  enableTouch = true
}: UseDragAndDropProps = {}): UseDragAndDropReturn {
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverItem: null,
    dropZone: null
  })

  // Touch tracking
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const touchElement = useRef<HTMLElement | null>(null)
  const dragImage = useRef<HTMLElement | null>(null)

  // Reset drag state
  const resetDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverItem: null,
      dropZone: null
    })
    touchStartPos.current = null
    touchElement.current = null
    if (dragImage.current) {
      dragImage.current.remove()
      dragImage.current = null
    }
  }, [])

  // Drag start handler
  const handleDragStart = useCallback((e: React.DragEvent | React.TouchEvent, item: DraggableItem) => {
    if (disabled) return

    if ('dataTransfer' in e) {
      // Desktop drag
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify(item))
      
      // Custom drag image
      const target = e.target as HTMLElement
      const rect = target.getBoundingClientRect()
      
      // Create a more visible drag image
      const dragImg = target.cloneNode(true) as HTMLElement
      dragImg.style.transform = 'rotate(5deg)'
      dragImg.style.opacity = '0.8'
      dragImg.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)'
      dragImg.style.position = 'absolute'
      dragImg.style.top = '-1000px'
      dragImg.style.zIndex = '9999'
      document.body.appendChild(dragImg)
      
      e.dataTransfer.setDragImage(dragImg, rect.width / 2, rect.height / 2)
      
      setTimeout(() => {
        if (dragImg.parentNode) {
          dragImg.parentNode.removeChild(dragImg)
        }
      }, 0)
    } else if (enableTouch && 'touches' in e) {
      // Touch start
      const touch = e.touches[0]
      touchStartPos.current = { x: touch.clientX, y: touch.clientY }
      touchElement.current = e.target as HTMLElement
      
      // Prevent scrolling during drag
      e.preventDefault()
    }

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedItem: item
    }))
  }, [disabled, enableTouch])

  // Drag end handler
  const handleDragEnd = useCallback((e: React.DragEvent | React.TouchEvent) => {
    if (disabled) return
    
    // Small delay to allow drop handler to complete
    setTimeout(() => {
      resetDrag()
    }, 100)
  }, [disabled, resetDrag])

  // Drag over handler
  const handleDragOver = useCallback((e: React.DragEvent | React.TouchEvent) => {
    if (disabled) return
    
    e.preventDefault()
    
    if ('dataTransfer' in e) {
      e.dataTransfer.dropEffect = 'move'
    }
  }, [disabled])

  // Drag enter handler
  const handleDragEnter = useCallback((e: React.DragEvent | React.TouchEvent, item: DraggableItem) => {
    if (disabled) return
    
    e.preventDefault()
    
    setDragState(prev => ({
      ...prev,
      dragOverItem: item
    }))
  }, [disabled])

  // Drag leave handler
  const handleDragLeave = useCallback((e: React.DragEvent | React.TouchEvent) => {
    if (disabled) return
    
    // Only reset if we're leaving the container entirely
    const relatedTarget = ('relatedTarget' in e) ? e.relatedTarget as HTMLElement : null
    const currentTarget = e.currentTarget as HTMLElement
    
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragState(prev => ({
        ...prev,
        dragOverItem: null
      }))
    }
  }, [disabled])

  // Drop handler
  const handleDrop = useCallback((e: React.DragEvent | React.TouchEvent, targetItem: DraggableItem) => {
    if (disabled) return
    
    e.preventDefault()
    
    let draggedData: DraggableItem | null = dragState.draggedItem

    if ('dataTransfer' in e) {
      try {
        const data = e.dataTransfer.getData('text/plain')
        if (data) {
          draggedData = JSON.parse(data) as DraggableItem
        }
      } catch (error) {
        console.warn('Could not parse drag data:', error)
      }
    }

    if (!draggedData || draggedData === targetItem) {
      resetDrag()
      return
    }

    // Handle reorder callback
    if (onReorder && typeof draggedData.index === 'number' && typeof targetItem.index === 'number') {
      onReorder(draggedData.index, targetItem.index, [draggedData, targetItem])
    }

    // Handle move callback
    if (onMove && targetItem.zone) {
      onMove(draggedData, targetItem.zone)
    }

    resetDrag()
  }, [disabled, dragState.draggedItem, onReorder, onMove, resetDrag])

  // Touch move handler for visual feedback
  useEffect(() => {
    if (!enableTouch || !dragState.isDragging || !touchElement.current) return

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPos.current) return
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartPos.current.x
      const deltaY = touch.clientY - touchStartPos.current.y
      
      // Only start visual drag if moved enough
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        e.preventDefault()
        
        // Create drag image if not exists
        if (!dragImage.current && touchElement.current) {
          const element = touchElement.current
          const rect = element.getBoundingClientRect()
          
          dragImage.current = element.cloneNode(true) as HTMLElement
          dragImage.current.style.position = 'fixed'
          dragImage.current.style.pointerEvents = 'none'
          dragImage.current.style.zIndex = '9999'
          dragImage.current.style.opacity = '0.8'
          dragImage.current.style.transform = 'rotate(5deg) scale(1.05)'
          dragImage.current.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)'
          dragImage.current.style.borderRadius = '12px'
          dragImage.current.style.width = rect.width + 'px'
          dragImage.current.style.height = rect.height + 'px'
          
          document.body.appendChild(dragImage.current)
        }
        
        // Update drag image position
        if (dragImage.current) {
          dragImage.current.style.left = (touch.clientX - 50) + 'px'
          dragImage.current.style.top = (touch.clientY - 25) + 'px'
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      // Find element under touch point
      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      
      // Try to trigger drop on the element below
      if (elementBelow) {
        const dropZone = elementBelow.closest('[data-drop-zone]')
        if (dropZone) {
          const targetData = dropZone.getAttribute('data-drop-item')
          if (targetData) {
            try {
              const targetItem = JSON.parse(targetData) as DraggableItem
              handleDrop(e as (unknown), targetItem)
            } catch (error) {
              console.warn('Could not parse drop target data:', error)
            }
          }
        }
      }
      
      resetDrag()
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enableTouch, dragState.isDragging, handleDrop, resetDrag])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetDrag()
    }
  }, [resetDrag])

  const dragHandlers: DragHandlers = {
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop
  }

  return {
    dragState,
    dragHandlers,
    isDragging: dragState.isDragging,
    resetDrag
  }
}

// Hook específico para listas ordenáveis
export interface UseSortableListProps<T> {
  items: T[]
  onReorder: (newItems: T[]) => void
  getId?: (item: T, index: number) => string | number
  disabled?: boolean
}

export function useSortableList<T>({
  items,
  onReorder,
  getId = (item: T, index: number) => index,
  disabled = false
}: UseSortableListProps<T>) {
  
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    
    const newItems = [...items]
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)
    
    onReorder(newItems)
  }, [items, onReorder])

  const { dragState, dragHandlers, isDragging, resetDrag } = useDragAndDrop({
    onReorder: handleReorder,
    disabled
  })

  // Transform items with index information
  const enhancedItems = items.map((item, index) => ({
    ...item,
    originalItem: item,
    index,
    id: getId(item, index),
    isDragging: dragState.isDragging && dragState.draggedItem?.index === index,
    isDragOver: dragState.dragOverItem?.index === index
  }))

  return {
    items: enhancedItems,
    dragHandlers,
    dragState,
    isDragging,
    resetDrag
  }
} 
