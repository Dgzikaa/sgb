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

      // Aguardar múltiplos frames para permitir que o React complete operações DOM
      const timeoutId = setTimeout(() => {
        isNavigatingRef.current = false;
        lastPathnameRef.current = pathname;
      }, 100); // Aumentar delay para 100ms

      return () => clearTimeout(timeoutId);
    }
  }, [pathname, enableDebugMode]);

  useEffect(() => {
    // Interceptar erros DOM relacionados à navegação
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const errorMessage = error?.message || '';
      
      // Detectar erros específicos de navegação/DOM
      const isNavigationError = errorMessage.includes('removeChild') ||
                               errorMessage.includes('appendChild') ||
                               errorMessage.includes('Cannot read properties of null') ||
                               errorMessage.includes('Cannot read properties of undefined') ||
                               errorMessage.includes("reading 'call'") ||
                               errorMessage.includes('options.factory') ||
                               errorMessage.includes('webpack');

      if (isNavigationError && isNavigatingRef.current) {
        event.preventDefault();
        event.stopPropagation();
        
        if (enableDebugMode) {
          console.warn('🚨 Erro de navegação interceptado:', {
            message: errorMessage,
            stack: error?.stack,
            isNavigating: isNavigatingRef.current,
            currentPath: pathname,
          });
        }

        // Chamar callback personalizado
        if (onNavigationError) {
          onNavigationError(error);
        } else {
          // Comportamento padrão: aguardar um pouco mais antes de recarregar
          setTimeout(() => {
            if (enableDebugMode) {
              console.log('🔄 Tentando recuperar navegação...');
            }
            // Em vez de recarregar, tentar navegar novamente
            try {
              window.history.pushState({}, '', pathname);
              window.dispatchEvent(new PopStateEvent('popstate'));
            } catch (navError) {
              if (enableDebugMode) {
                console.log('🔄 Recarregando página devido a erro de navegação...');
              }
              window.location.reload();
            }
          }, 200);
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
  }, [deps, isNavigating, effect]);
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
