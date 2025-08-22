'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Sistema de acessibilidade avançada para Zykor
 * Componentes e hooks para WCAG 2.1 AA compliance
 */

interface AccessibilityContextValue {
  isHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  toggleHighContrast: () => void;
  setFontSize: (size: AccessibilityContextValue['fontSize']) => void;
  toggleReducedMotion: () => void;
}

const AccessibilityContext = React.createContext<AccessibilityContextValue | null>(null);

export function useAccessibility() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser usado dentro de AccessibilityProvider');
  }
  return context;
}

// Provider de Acessibilidade
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  const [fontSize, setFontSize] = React.useState<AccessibilityContextValue['fontSize']>('medium');
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [screenReader, setScreenReader] = React.useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = React.useState(false);

  // Detectar preferências do sistema
  React.useEffect(() => {
    // Detectar prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detectar navegação por teclado
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Detectar screen reader
  React.useEffect(() => {
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') ||
                           window.navigator.userAgent.includes('JAWS') ||
                           window.speechSynthesis !== undefined;
    setScreenReader(hasScreenReader);
  }, []);

  // Aplicar classes CSS baseadas nas configurações
  React.useEffect(() => {
    const root = document.documentElement;
    
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    if (keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }

    root.setAttribute('data-font-size', fontSize);
  }, [isHighContrast, reducedMotion, keyboardNavigation, fontSize]);

  const toggleHighContrast = () => setIsHighContrast(!isHighContrast);
  const toggleReducedMotion = () => setReducedMotion(!reducedMotion);

  return (
    <AccessibilityContext.Provider value={{
      isHighContrast,
      fontSize,
      reducedMotion,
      screenReader,
      keyboardNavigation,
      toggleHighContrast,
      setFontSize,
      toggleReducedMotion
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Componente para foco visível aprimorado
interface FocusRingProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export function FocusRing({ children, className, visible }: FocusRingProps) {
  const { keyboardNavigation } = useAccessibility();
  
  return (
    <div
      className={cn(
        'relative',
        keyboardNavigation && visible && 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-blue-400 rounded-lg',
        className
      )}
    >
      {children}
    </div>
  );
}

// Componente para texto acessível
interface AccessibleTextProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  contrast?: 'normal' | 'high';
}

export function AccessibleText({ 
  children, 
  level, 
  className, 
  contrast = 'normal' 
}: AccessibleTextProps) {
  const { isHighContrast, fontSize } = useAccessibility();
  
  const Tag = level ? (`h${level}` as keyof React.JSX.IntrinsicElements) : 'p';
  
  const fontSizeClasses = {
    small: level ? 'text-lg' : 'text-sm',
    medium: level ? 'text-xl' : 'text-base',
    large: level ? 'text-2xl' : 'text-lg',
    'extra-large': level ? 'text-3xl' : 'text-xl'
  };

  const contrastClasses = {
    normal: 'text-gray-900 dark:text-gray-100',
    high: isHighContrast ? 'text-black dark:text-white' : 'text-gray-900 dark:text-gray-100'
  };

  return (
    <Tag 
      className={cn(
        fontSizeClasses[fontSize],
        contrastClasses[contrast],
        level && 'font-semibold',
        className
      )}
    >
      {children}
    </Tag>
  );
}

// Skip link para navegação
export function SkipLink({ href = '#main-content', children = 'Pular para o conteúdo principal' }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
    >
      {children}
    </a>
  );
}

// Componente para anúncios ao screen reader
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  live?: 'off' | 'polite' | 'assertive';
}

export function ScreenReaderOnly({ children, live = 'polite' }: ScreenReaderOnlyProps) {
  return (
    <div 
      className="sr-only" 
      aria-live={live}
      aria-atomic="true"
    >
      {children}
    </div>
  );
}

// Hook para anúncios dinâmicos
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Limpar primeiro para garantir que será lido
    setTimeout(() => {
      setAnnouncement(message);
    }, 10);
    
    // Limpar após um tempo para não acumular
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  }, []);

  return {
    announce,
    AnnouncementRegion: () => (
      <ScreenReaderOnly live="assertive">
        {announcement}
      </ScreenReaderOnly>
    )
  };
}

// Componente para botões acessíveis
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Carregando...',
  className,
  ...props
}: AccessibleButtonProps) {
  const { reducedMotion } = useAccessibility();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'hover:bg-gray-100 text-gray-900 dark:hover:bg-gray-800 dark:text-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, onAnimationIteration, ...motionProps } = props;
  
  return (
    <motion.button
      whileHover={!reducedMotion ? { scale: 1.02 } : {}}
      whileTap={!reducedMotion ? { scale: 0.98 } : {}}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={loading}
      aria-disabled={loading}
      aria-label={loading ? loadingText : undefined}
      {...motionProps}
    >
      {loading ? (
        <>
          <motion.div
            animate={!reducedMotion ? { rotate: 360 } : {}}
            transition={!reducedMotion ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
          />
          {loadingText}
        </>
      ) : children}
    </motion.button>
  );
}

// Painel de configurações de acessibilidade
export function AccessibilityPanel() {
  const {
    isHighContrast,
    fontSize,
    reducedMotion,
    toggleHighContrast,
    setFontSize,
    toggleReducedMotion
  } = useAccessibility();

  return (
    <div className="card-dark p-6 space-y-6">
      <AccessibleText level={2}>Configurações de Acessibilidade</AccessibleText>
      
      <div className="space-y-4">
        {/* Alto Contraste */}
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast" className="text-sm font-medium">
            Alto Contraste
          </label>
          <button
            id="high-contrast"
            onClick={toggleHighContrast}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isHighContrast ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            )}
            role="switch"
            aria-checked={isHighContrast}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isHighContrast ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Tamanho da Fonte */}
        <div>
          <div className="text-sm font-medium mb-2 block">
            Tamanho da Fonte
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={cn(
                  'px-3 py-2 text-sm rounded-md border transition-colors',
                  fontSize === size
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-900 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
                )}
              >
                {size === 'small' && 'Pequeno'}
                {size === 'medium' && 'Médio'}
                {size === 'large' && 'Grande'}
                {size === 'extra-large' && 'Extra Grande'}
              </button>
            ))}
          </div>
        </div>

        {/* Movimento Reduzido */}
        <div className="flex items-center justify-between">
          <label htmlFor="reduced-motion" className="text-sm font-medium">
            Reduzir Animações
          </label>
          <button
            id="reduced-motion"
            onClick={toggleReducedMotion}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              reducedMotion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            )}
            role="switch"
            aria-checked={reducedMotion}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                reducedMotion ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessibilityProvider;
