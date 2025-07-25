import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  data?: Record<string, unknown>;
}

export default function DraggableItem({
  id,
  children,
  data,
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
