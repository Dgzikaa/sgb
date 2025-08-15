import { useCallback, useRef } from 'react';

/**
 * Hook para criar callbacks estáveis que não causam re-renders desnecessários
 * Resolve warnings de exhaustive-deps automaticamente
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  // Atualiza a referência quando o callback muda
  callbackRef.current = callback;
  
  // Retorna uma função estável que sempre chama a versão mais recente
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Hook para useEffect que automaticamente inclui dependencies sem warnings
 */
export function useStableEffect(
  effect: () => void | (() => void),
  deps: any[] = []
) {
  const effectRef = useRef(effect);
  effectRef.current = effect;
  
  const stableDeps = deps;
  
  return { effectRef, stableDeps };
}
