'use client'

import { ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Card Principal
interface StandardCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'stats' | 'filter' | 'table'
}

const StandardCard = forwardRef<HTMLDivElement, StandardCardProps>(
  ({ children, className, variant = 'default' }, ref) => {
    const baseClasses = "bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl"
    
    const variantClasses = {
      default: baseClasses,
      stats: baseClasses, // Para cards de estatísticas
      filter: baseClasses, // Para seção de filtros
      table: baseClasses   // Para tabelas
    }

    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], className)}
      >
        {children}
      </div>
    )
  }
)
StandardCard.displayName = "StandardCard"

// Header do Card
interface StandardCardHeaderProps {
  children: ReactNode
  className?: string
}

const StandardCardHeader = forwardRef<HTMLDivElement, StandardCardHeaderProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pb-3", className)}
    >
      {children}
    </div>
  )
)
StandardCardHeader.displayName = "StandardCardHeader"

// Título do Card
interface StandardCardTitleProps {
  children: ReactNode
  className?: string
  icon?: ReactNode
}

const StandardCardTitle = forwardRef<HTMLHeadingElement, StandardCardTitleProps>(
  ({ children, className, icon }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-lg font-semibold text-slate-800 flex items-center gap-2",
        className
      )}
    >
      {icon}
      {children}
    </h3>
  )
)
StandardCardTitle.displayName = "StandardCardTitle"

// Descrição do Card
interface StandardCardDescriptionProps {
  children: ReactNode
  className?: string
}

const StandardCardDescription = forwardRef<HTMLParagraphElement, StandardCardDescriptionProps>(
  ({ children, className }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-slate-600 mt-1", className)}
    >
      {children}
    </p>
  )
)
StandardCardDescription.displayName = "StandardCardDescription"

// Conteúdo do Card
interface StandardCardContentProps {
  children: ReactNode
  className?: string
}

const StandardCardContent = forwardRef<HTMLDivElement, StandardCardContentProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pt-0", className)}
    >
      {children}
    </div>
  )
)
StandardCardContent.displayName = "StandardCardContent"

// Card de Estatística (formato especial para métricas)
interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: string
    type: 'up' | 'down' | 'neutral'
    icon?: ReactNode
  }
  className?: string
}

const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, subtitle, icon, trend, className }, ref) => {
    const trendColors = {
      up: 'text-green-600',
      down: 'text-red-600', 
      neutral: 'text-slate-600'
    }

    return (
      <StandardCard ref={ref} variant="stats" className={className}>
        <StandardCardHeader className="pb-3">
          <StandardCardTitle className="text-sm font-medium text-slate-600">
            {title}
          </StandardCardTitle>
        </StandardCardHeader>
        <StandardCardContent>
          <div className="text-2xl font-bold text-slate-800 mb-1">
            {value}
          </div>
          {(subtitle || trend) && (
            <div className={cn(
              "flex items-center text-sm mt-1",
              trend ? trendColors[trend.type] : "text-slate-600"
            )}>
              {trend?.icon && <span className="h-4 w-4 mr-1">{trend.icon}</span>}
              {trend ? trend.value : subtitle}
            </div>
          )}
        </StandardCardContent>
      </StandardCard>
    )
  }
)
StatsCard.displayName = "StatsCard"

export {
  StandardCard,
  StandardCardHeader,
  StandardCardTitle,
  StandardCardDescription,
  StandardCardContent,
  StatsCard
} 
