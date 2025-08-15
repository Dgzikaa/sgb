'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Sistema de Skeleton Loading moderno para Zykor
 * Componentes animados para estados de carregamento
 */

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'rounded' | 'circular' | 'text' | 'card';
  animate?: boolean;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'default',
  animate = true,
  width,
  height,
  ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    default: 'rounded-md',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-sm h-4',
    card: 'rounded-xl'
  };

  const pulseAnimation = {
    animate: {
      opacity: [0.4, 0.8, 0.4],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? pulseAnimation : {};

  return (
    <Component
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{
        width: width,
        height: height
      }}
      {...animationProps}
      {...props}
    />
  );
}

// Skeletons específicos para diferentes componentes do Zykor

export function SkeletonCard({ className, ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('card-dark p-6 space-y-4', className)} {...props}>
      <Skeleton variant="rounded" className="h-6 w-3/4" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
      <div className="flex space-x-4">
        <Skeleton variant="rounded" className="h-10 w-20" />
        <Skeleton variant="rounded" className="h-10 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className, ...props }: {
  rows?: number;
  columns?: number;
} & Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="h-5 bg-gray-300 dark:bg-gray-600" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className, ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('card-dark p-6', className)} {...props}>
      <Skeleton variant="rounded" className="h-6 w-1/3 mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-end space-x-1">
            <Skeleton 
              variant="rounded" 
              className="w-8" 
              height={Math.random() * 60 + 20}
            />
            <Skeleton 
              variant="rounded" 
              className="w-8" 
              height={Math.random() * 80 + 30}
            />
            <Skeleton 
              variant="rounded" 
              className="w-8" 
              height={Math.random() * 100 + 40}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className, ...props }: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
} & Omit<SkeletonProps, 'variant'>) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <Skeleton 
      variant="circular" 
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
}

export function SkeletonListItem({ className, ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('flex items-center space-x-4 p-4', className)} {...props}>
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
      <Skeleton variant="rounded" className="h-8 w-16" />
    </div>
  );
}

export function SkeletonDashboard({ className, ...props }: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton variant="rounded" className="h-8 w-48" />
        <Skeleton variant="rounded" className="h-10 w-32" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-dark p-6">
            <Skeleton variant="text" className="h-4 w-20 mb-2" />
            <Skeleton variant="rounded" className="h-8 w-16 mb-1" />
            <Skeleton variant="text" className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonTable rows={6} columns={3} />
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 5, className, ...props }: {
  fields?: number;
} & Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      <Skeleton variant="rounded" className="h-8 w-64 mb-6" />
      
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="rounded" className="h-10 w-full" />
        </div>
      ))}
      
      <div className="flex space-x-4 pt-4">
        <Skeleton variant="rounded" className="h-10 w-24" />
        <Skeleton variant="rounded" className="h-10 w-20" />
      </div>
    </div>
  );
}

// Hook para usar skeleton loading com states automáticos
export function useSkeletonLoading(isLoading: boolean, delay: number = 300) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      timeout = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, delay]);

  return showSkeleton;
}

export default Skeleton;
