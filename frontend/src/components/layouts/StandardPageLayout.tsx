'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StandardPageLayoutProps {
  children: ReactNode
  className?: string
  spacing?: 'normal' | 'tight' | 'loose'
}

export function StandardPageLayout({ 
  children, 
  className,
  spacing = 'normal' 
}: StandardPageLayoutProps) {
  const spacingClasses = {
    tight: 'space-y-4',
    normal: 'space-y-6',
    loose: 'space-y-8'
  }

  return (
    <div className={cn(
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}

export default StandardPageLayout 