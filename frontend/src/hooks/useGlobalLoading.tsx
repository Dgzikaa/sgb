'use client';

import { useState, useCallback } from 'react';

export function useGlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const withLoading = useCallback(async (fn: () => Promise<any>): Promise<any> => {
    try {
      setIsLoading(true);
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Aliases para compatibilidade
  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);
  const GlobalLoadingComponent = () => null; // Componente vazio

  return {
    isLoading,
    setLoading,
    withLoading,
    showLoading,
    hideLoading,
    GlobalLoadingComponent
  };
}


