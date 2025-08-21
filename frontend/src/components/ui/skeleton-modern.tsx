'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// 🎯 TYPES
interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular' | 'text' | 'avatar' | 'card' | 'table' | 'form';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animated?: boolean;
  shimmer?: boolean;
  pulse?: boolean;
  width?: string | number;
  height?: string | number;
  count?: number;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  animated?: boolean;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  animated?: boolean;
}

interface SkeletonCardProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'glass' | 'premium';
  animated?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showImage?: boolean;
  showActions?: boolean;
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  variant?: 'default' | 'minimal' | 'bordered';
  animated?: boolean;
  showHeader?: boolean;
  showPagination?: boolean;
}

interface SkeletonFormProps {
  fields?: number;
  className?: string;
  variant?: 'default' | 'minimal' | 'inline';
  animated?: boolean;
  showLabels?: boolean;
  showActions?: boolean;
}

// 🎨 COMPONENTE BASE
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    animated = true,
    shimmer = true,
    pulse = false,
    width,
    height,
    count = 1,
    spacing = 'md',
    children,
    ...props
  }, ref) => {
    // 🎨 STYLES
    const getVariantStyles = () => {
      switch (variant) {
        case 'circular':
          return 'rounded-full';
        case 'rectangular':
          return 'rounded-lg';
        case 'text':
          return 'rounded';
        case 'avatar':
          return 'rounded-full';
        case 'card':
          return 'rounded-xl';
        case 'table':
          return 'rounded-md';
        case 'form':
          return 'rounded-lg';
        default:
          return 'rounded-md';
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'xs':
          return 'w-4 h-4';
        case 'sm':
          return 'w-6 h-6';
        case 'md':
          return 'w-8 h-8';
        case 'lg':
          return 'w-12 h-12';
        case 'xl':
          return 'w-16 h-16';
        case 'full':
          return 'w-full h-full';
        default:
          return 'w-8 h-8';
      }
    };

    const getSpacingStyles = () => {
      switch (spacing) {
        case 'none':
          return '';
        case 'sm':
          return 'space-y-2';
        case 'md':
          return 'space-y-3';
        case 'lg':
          return 'space-y-4';
        default:
          return 'space-y-3';
      }
    };

    // 🎭 ANIMATIONS
    const shimmerVariants = {
      initial: { x: '-100%' },
      animate: { 
        x: '100%',
        transition: {
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "linear"
        }
      }
    };

    const pulseVariants = {
      initial: { opacity: 1 },
      animate: { 
        opacity: [1, 0.5, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    };

    // 🎨 RENDER SKELETON
    const renderSkeleton = () => (
      <motion.div
        ref={ref}
        className={cn(
          'bg-gray-200 dark:bg-gray-700',
          getVariantStyles(),
          getSizeStyles(),
          className
        )}
        style={{
          width: width || undefined,
          height: height || undefined,
        }}
        variants={pulse ? pulseVariants : undefined}
        initial={pulse ? "initial" : undefined}
        animate={pulse ? "animate" : undefined}
        {...props}
      >
        {shimmer && animated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-500/20 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />
        )}
      </motion.div>
    );

    // 🚀 RENDER PRINCIPAL
    if (count === 1) {
      return renderSkeleton();
    }

    return (
      <div className={cn('flex flex-col', getSpacingStyles())}>
        {Array.from({ length: count }).map((_, index) => (
          <React.Fragment key={index}>
            {renderSkeleton()}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// 🎨 SKELETON TEXT
export const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({
    lines = 3,
    className,
    variant = 'body',
    animated = true,
    ...props
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'title':
          return 'h-8 w-3/4';
        case 'subtitle':
          return 'h-6 w-2/3';
        case 'body':
          return 'h-4 w-full';
        case 'caption':
          return 'h-3 w-1/2';
        default:
          return 'h-4 w-full';
      }
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            className={cn(
              getVariantStyles(),
              index === lines - 1 && 'w-2/3' // Last line shorter
            )}
            animated={animated}
          />
        ))}
      </div>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

// 🎨 SKELETON CARD
export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({
    className,
    variant = 'default',
    animated = true,
    showHeader = true,
    showFooter = true,
    showImage = true,
    showActions = true,
    ...props
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'bg-transparent border-0 shadow-none';
        case 'glass':
          return 'bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/50';
        case 'premium':
          return 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl';
        default:
          return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm';
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl p-6',
          getVariantStyles(),
          className
        )}
        initial={animated ? { opacity: 0, y: 20 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton variant="avatar" size="md" animated={animated} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-5 w-1/3" animated={animated} />
              <Skeleton variant="text" className="h-4 w-1/2" animated={animated} />
            </div>
          </div>
        )}

        {/* Image */}
        {showImage && (
          <Skeleton
            variant="rectangular"
            className="w-full h-48 mb-4"
            animated={animated}
          />
        )}

        {/* Content */}
        <div className="space-y-3 mb-4">
          <Skeleton variant="text" className="h-6 w-3/4" animated={animated} />
          <Skeleton variant="text" className="h-4 w-full" animated={animated} />
          <Skeleton variant="text" className="h-4 w-2/3" animated={animated} />
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2 mb-4">
            <Skeleton variant="rectangular" className="h-8 w-20" animated={animated} />
            <Skeleton variant="rectangular" className="h-8 w-20" animated={animated} />
          </div>
        )}

        {/* Footer */}
        {showFooter && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Skeleton variant="circular" size="sm" animated={animated} />
              <Skeleton variant="text" className="h-4 w-16" animated={animated} />
            </div>
            <Skeleton variant="text" className="h-4 w-20" animated={animated} />
          </div>
        )}
      </motion.div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

// 🎨 SKELETON TABLE
export const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({
    rows = 5,
    columns = 4,
    className,
    variant = 'default',
    animated = true,
    showHeader = true,
    showPagination = true,
    ...props
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'bg-transparent border-0';
        case 'bordered':
          return 'border border-gray-200 dark:border-gray-700';
        default:
          return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg overflow-hidden',
          getVariantStyles(),
          className
        )}
        initial={animated ? { opacity: 0, y: 20 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {/* Header */}
        {showHeader && (
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
            <div className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="text"
                  className="h-5 flex-1"
                  animated={animated}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="flex items-center space-x-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    variant="text"
                    className="h-4 flex-1"
                    animated={animated}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {showPagination && (
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="h-4 w-24" animated={animated} />
              <div className="flex items-center space-x-2">
                <Skeleton variant="rectangular" className="h-8 w-8" animated={animated} />
                <Skeleton variant="rectangular" className="h-8 w-8" animated={animated} />
                <Skeleton variant="rectangular" className="h-8 w-8" animated={animated} />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

SkeletonTable.displayName = 'SkeletonTable';

// 🎨 SKELETON FORM
export const SkeletonForm = React.forwardRef<HTMLDivElement, SkeletonFormProps>(
  ({
    fields = 4,
    className,
    variant = 'default',
    animated = true,
    showLabels = true,
    showActions = true,
    ...props
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'bg-transparent border-0 space-y-4';
        case 'inline':
          return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4';
        default:
          return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6';
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(getVariantStyles(), className)}
        initial={animated ? { opacity: 0, y: 20 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {/* Form fields */}
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            {showLabels && (
              <Skeleton variant="text" className="h-4 w-24" animated={animated} />
            )}
            <Skeleton
              variant="rectangular"
              className="w-full h-10"
              animated={animated}
            />
          </div>
        ))}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-3 pt-4">
            <Skeleton variant="rectangular" className="h-10 w-24" animated={animated} />
            <Skeleton variant="rectangular" className="h-10 w-20" animated={animated} />
          </div>
        )}
      </motion.div>
    );
  }
);

SkeletonForm.displayName = 'SkeletonForm';

// 🎨 SKELETON GROUP
export const SkeletonGroup = React.forwardRef<HTMLDivElement, SkeletonGroupProps>(
  ({
    children,
    className,
    spacing = 'md',
    direction = 'vertical',
    animated = true,
    ...props
  }, ref) => {
    const getSpacingStyles = () => {
      switch (spacing) {
        case 'none':
          return '';
        case 'sm':
          return direction === 'horizontal' ? 'space-x-2' : 'space-y-2';
        case 'md':
          return direction === 'horizontal' ? 'space-x-3' : 'space-y-3';
        case 'lg':
          return direction === 'horizontal' ? 'space-x-4' : 'space-y-4';
        default:
          return direction === 'horizontal' ? 'space-x-3' : 'space-y-3';
      }
    };

    const getDirectionStyles = () => {
      return direction === 'horizontal' ? 'flex-row' : 'flex-col';
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex',
          getDirectionStyles(),
          getSpacingStyles(),
          className
        )}
        initial={animated ? { opacity: 0, scale: 0.95 } : undefined}
        animate={animated ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

SkeletonGroup.displayName = 'SkeletonGroup';

// 🎨 SKELETON AVATAR
export const SkeletonAvatar = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>(
  (props, ref) => <Skeleton ref={ref} variant="avatar" {...props} />
);

SkeletonAvatar.displayName = 'SkeletonAvatar';

// 🎨 SKELETON BUTTON
export const SkeletonButton = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>(
  (props, ref) => <Skeleton ref={ref} variant="rectangular" {...props} />
);

SkeletonButton.displayName = 'SkeletonButton';

// 🎨 SKELETON INPUT
export const SkeletonInput = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>(
  (props, ref) => <Skeleton ref={ref} variant="rectangular" className="h-10" {...props} />
);

SkeletonInput.displayName = 'SkeletonInput';

// 🎨 SKELETON IMAGE
export const SkeletonImage = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>(
  (props, ref) => <Skeleton ref={ref} variant="rectangular" className="w-full h-48" {...props} />
);

SkeletonImage.displayName = 'SkeletonImage';

// 🚀 EXPORT DEFAULT
export default Skeleton;

// 🚀 EXPORT ALL
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  SkeletonGroup,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonImage
};
