'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// =====================================================
// 🎬 SISTEMA DE TRANSIÇÕES DE PÁGINA - ZYKOR
// =====================================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'slide' | 'fade' | 'scale' | 'slide-up' | 'slide-down';
  duration?: number;
  delay?: number;
}

// Variantes de animação
const transitionVariants = {
  slide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  'slide-up': {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  'slide-down': {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 },
  },
};

export function PageTransition({
  children,
  className = '',
  variant = 'slide',
  duration = 0.3,
  delay = 0,
}: PageTransitionProps) {
  return (
    <motion.div
      className={cn('w-full', className)}
      variants={transitionVariants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1] as any, // Easing suave
      }}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// 🔄 TRANSITION PROVIDER - Gerenciador Global
// =====================================================

interface TransitionProviderProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync';
}

export function TransitionProvider({ 
  children, 
  mode = 'wait' 
}: TransitionProviderProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// =====================================================
// 📱 LOADING TRANSITION - Estado de Carregamento
// =====================================================

interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
}

export function LoadingTransition({
  isLoading,
  children,
  className = '',
  variant = 'spinner',
}: LoadingTransitionProps) {
  const loadingVariants = {
    spinner: (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    ),
    skeleton: (
      <div className="space-y-4 p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    ),
    pulse: (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse bg-blue-600 dark:bg-blue-400 rounded-full h-8 w-8" />
      </div>
    ),
    dots: (
      <div className="flex items-center justify-center p-8 space-x-2">
        <div className="animate-bounce bg-blue-600 dark:bg-blue-400 rounded-full h-2 w-2" />
        <div className="animate-bounce bg-blue-600 dark:bg-blue-400 rounded-full h-2 w-2" style={{ animationDelay: '0.1s' }} />
        <div className="animate-bounce bg-blue-600 dark:bg-blue-400 rounded-full h-2 w-2" style={{ animationDelay: '0.2s' }} />
      </div>
    ),
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn('w-full', className)}
        >
          {loadingVariants[variant]}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn('w-full', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =====================================================
// 🎯 ROUTE TRANSITION - Transição entre Rotas
// =====================================================

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: 'slide' | 'fade' | 'scale';
}

export function RouteTransition({
  children,
  className = '',
  transitionType = 'slide',
}: RouteTransitionProps) {
  const pathname = usePathname();

  const getTransitionVariant = () => {
    switch (transitionType) {
      case 'slide':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 },
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'scale':
        return {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.1, opacity: 0 },
        };
      default:
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 },
        };
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={getTransitionVariant()}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1] as any,
        }}
        className={cn('w-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// =====================================================
// 🎨 TRANSITION WRAPPER - Wrapper Universal
// =====================================================

interface TransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
  showTransition?: boolean;
  transitionVariant?: 'slide' | 'fade' | 'scale' | 'slide-up' | 'slide-down';
  transitionDuration?: number;
  transitionDelay?: number;
}

export function TransitionWrapper({
  children,
  className = '',
  showTransition = true,
  transitionVariant = 'slide',
  transitionDuration = 0.3,
  transitionDelay = 0,
}: TransitionWrapperProps) {
  if (!showTransition) {
    return <div className={className}>{children}</div>;
  }

  return (
    <PageTransition
      variant={transitionVariant}
      duration={transitionDuration}
      delay={transitionDelay}
      className={className}
    >
      {children}
    </PageTransition>
  );
}

// =====================================================
// 🚀 HOOKS DE TRANSIÇÃO
// =====================================================

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<'slide' | 'fade' | 'scale'>('slide');

  const startTransition = (type: 'slide' | 'fade' | 'scale' = 'slide') => {
    setTransitionType(type);
    setIsTransitioning(true);
  };

  const endTransition = () => {
    setIsTransitioning(false);
  };

  return {
    isTransitioning,
    transitionType,
    startTransition,
    endTransition,
  };
}

// =====================================================
// 🎭 ANIMAÇÕES ESPECÍFICAS PARA ZYKOR
// =====================================================

export const zykorTransitions = {
  // Transição suave para cards
  card: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any },
  },

  // Transição para modais
  modal: {
    initial: { opacity: 0, scale: 0.8, y: -20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 20 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as any },
  },

  // Transição para listas
  list: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as any },
  },

  // Transição para gráficos
  chart: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as any },
  },
};

// =====================================================
// 📱 RESPONSIVE TRANSITIONS
// =====================================================

export function useResponsiveTransition() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getTransitionVariant = () => {
    if (isMobile) {
      return 'slide-up'; // Transição vertical em mobile
    }
    return 'slide'; // Transição horizontal em desktop
  };

  return {
    isMobile,
    transitionVariant: getTransitionVariant(),
  };
}
