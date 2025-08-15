'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Componentes de animação modernos para Zykor
 * Wraps com animações padronizadas e performáticas
 */

interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'flip' | 'bounce';
  delay?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

// Variantes de animação predefinidas
const animationVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  },
  flip: {
    hidden: { opacity: 0, rotateX: -90 },
    visible: { opacity: 1, rotateX: 0 }
  },
  bounce: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    }
  }
};

export function MotionWrapper({
  children,
  className,
  variant = 'fadeIn',
  delay = 0,
  duration = 0.5,
  once = true,
  threshold = 0.1
}: MotionWrapperProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={animationVariants[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}

// Componente para animações em lista (stagger)
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  variant?: MotionWrapperProps['variant'];
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  variant = 'slideUp'
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={animationVariants[variant]}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Componente para hover animations
interface HoverMotionProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'rotate' | 'tilt';
  clickEffect?: boolean;
}

export function HoverMotion({
  children,
  className,
  hoverEffect = 'lift',
  clickEffect = true
}: HoverMotionProps) {
  const hoverVariants = {
    lift: {
      y: -4,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    scale: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    glow: {
      boxShadow: '0 0 20px rgba(74, 144, 226, 0.3)',
      borderColor: 'rgba(74, 144, 226, 0.5)'
    },
    rotate: {
      rotate: 2,
      transition: { duration: 0.2 }
    },
    tilt: {
      rotateX: 5,
      rotateY: 5,
      transition: { duration: 0.2 }
    }
  };

  const tapVariant = clickEffect ? { scale: 0.98 } : {};

  return (
    <motion.div
      className={cn('cursor-pointer', className)}
      whileHover={hoverVariants[hoverEffect]}
      whileTap={tapVariant}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Page Transition Component
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

// Modal/Dialog Transition
interface ModalTransitionProps {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
}

export function ModalTransition({ children, isOpen, className }: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Modal Content */}
          <motion.div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4',
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.3,
              ease: 'easeOut'
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Toast/Notification Animation
interface ToastAnimationProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export function ToastAnimation({ 
  children, 
  position = 'top-right',
  className 
}: ToastAnimationProps) {
  const positionVariants = {
    'top-right': { x: 100, y: -100 },
    'top-left': { x: -100, y: -100 },
    'bottom-right': { x: 100, y: 100 },
    'bottom-left': { x: -100, y: 100 },
    'top-center': { y: -100 },
    'bottom-center': { y: 100 }
  };

  return (
    <motion.div
      className={cn(className)}
      initial={positionVariants[position]}
      animate={{ x: 0, y: 0 }}
      exit={positionVariants[position]}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
    >
      {children}
    </motion.div>
  );
}

// Loading Spinner with Animation
export function LoadingSpinner({ size = 'md', className }: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn(
        'border-2 border-gray-300 border-t-blue-500 rounded-full',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
}

// Progress Animation
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  showPercentage = false,
  color = 'blue'
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1,
            ease: 'easeOut'
          }}
        />
      </div>
      {showPercentage && (
        <motion.div
          className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  );
}

// Number Counter Animation
interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  className,
  prefix = '',
  suffix = ''
}: CounterProps) {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    const startTime = Date.now();
    const difference = to - from;

    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = from + (difference * easeOut);
      
      setCount(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    updateCounter();
  }, [from, to, duration]);

  return (
    <motion.span 
      className={cn(className)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
}

export default MotionWrapper;
