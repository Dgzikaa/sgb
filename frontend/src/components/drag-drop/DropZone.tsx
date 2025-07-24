import React, { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'

interface DropZoneProps {
  id: string
  children: React.ReactNode
  className?: string
  onDrop?: (item: Record<string, unknown>) => void
}

export default function DropZone({ id, children, className = '', onDrop }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false)
  
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id,
  })

  React.useEffect(() => {
    setIsOver(isDroppableOver)
  }, [isDroppableOver])

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-50 border-blue-300' : ''}`}
    >
      {children}
    </div>
  )
} 
