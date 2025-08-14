'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface NavigationGuardOptions {
  onNavigationError?: (error: Error) => void;
  enableDebugMode?: boolean;
}

export function useNavigationGuard(options: NavigationGuardOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { onNavigationError, enableDebugMode = false } = options;
  const isNavigatingRef = useRef(false);
  const lastPathnameRef = useRef(pathname);

  useEffect(() => {
    // Detectar início de navegação
    if (pathname !== lastPathnameRef.current) {
      isNavigatingRef.current = true;
      
      if (enableDebugMode) {
        console.log('🧭 Navegação detectada:', {
          from: lastPathnameRef.current,
          to: pathname,
        });
      }

      // Aguardar um frame para permitir que o React complete operações DOM
      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
        lastPathnameRef.current = pathname;
      });
    }
  }, [pathname, enableDebugMode]);

  useEffect(() => {
    // Interceptar erros DOM relacionados à navegação
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const isNavigationError = error?.message?.includes('removeChild') ||
                               error?.message?.includes('appendChild') ||
                               error?.message?.includes('Cannot read properties of null') ||
                               error?.message?.includes('Cannot read properties of undefined');

      if (isNavigationError) {
        event.preventDefault();
        
        if (enableDebugMode) {
          console.warn('🚨 Erro de navegação interceptado:', {
            message: error.message,
            stack: error.stack,
            isNavigating: isNavigatingRef.current,
            currentPath: pathname,
          });
        }

        // Chamar callback personalizado
        if (onNavigationError) {
          onNavigationError(error);
        } else {
          // Comportamento padrão: recarregar a página após um delay
          setTimeout(() => {
            if (enableDebugMode) {
              console.log('🔄 Recarregando página devido a erro de navegação...');
            }
            window.location.reload();
          }, 100);
        }
      }
    };

    // Interceptar erros não tratados
    window.addEventListener('error', handleError);
    
    // Interceptar promises rejeitadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (error?.message?.includes('removeChild') || 
          error?.message?.includes('appendChild')) {
        event.preventDefault();
        
        if (enableDebugMode) {
          console.warn('🚨 Promise rejeitada com erro de navegação:', error);
        }
        
        if (onNavigationError) {
          onNavigationError(error);
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onNavigationError, enableDebugMode, pathname]);

  // Função utilitária para navegação segura
  const safeNavigate = (href: string) => {
    try {
      // Aguardar frame anterior completar
      requestAnimationFrame(() => {
        router.push(href);
      });
    } catch (error) {
      if (enableDebugMode) {
        console.error('❌ Erro na navegação segura:', error);
      }
      
      // Fallback para navegação manual
      window.location.href = href;
    }
  };

  // Função para detectar se estamos no meio de uma navegação
  const isNavigating = () => isNavigatingRef.current;

  return {
    safeNavigate,
    isNavigating,
    currentPath: pathname,
  };
}

// Hook específico para componentes que fazem manipulação DOM
export function useDOMSafeEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList
) {
  const { isNavigating } = useNavigationGuard();

  useEffect(() => {
    // Só executar se não estivermos navegando
    if (!isNavigating()) {
      return effect();
    }
  }, [...deps, isNavigating]);
}

// Wrapper para operações DOM que podem falhar durante navegação
export function safeDOMOperation<T>(
  operation: () => T,
  fallback: T,
  enableDebugMode = false
): T {
  try {
    return operation();
  } catch (error) {
    if (enableDebugMode) {
      console.warn('⚠️ Operação DOM falhadora (usando fallback):', error);
    }
    return fallback;
  }
}
