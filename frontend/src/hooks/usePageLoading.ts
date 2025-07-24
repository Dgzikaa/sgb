import { useState, useEffect, useCallback } from 'react'

export type SkeletonType = 
  | 'dashboard'
  | 'checklist'
  | 'relatorio'
  | 'configuracoes'
  | 'operacoes'
  | 'visao-geral'
  | 'marketing-360'
  | 'funcionario'
  | 'fullscreen'
  | 'custom'

export interface PageLoadingState {
  isLoading: boolean
  skeletonType: SkeletonType
  loadingMessage?: string
  error: string | null
}

export interface UsePageLoadingReturn {
  loading: boolean
  error: string | null
  skeletonType: SkeletonType
  loadingMessage?: string
  startLoading: (type?: SkeletonType, message?: string) => void
  stopLoading: () => void
  setError: (error: string | null) => void
  withLoading: <T>(
    asyncFn: () => Promise<T>, 
    type?: SkeletonType, 
    message?: string
  ) => Promise<T>
}

export function usePageLoading(
  initialType: SkeletonType = 'fullscreen',
  initialLoading: boolean = false
): UsePageLoadingReturn {
  const [state, setState] = useState<PageLoadingState>({
    isLoading: initialLoading,
    skeletonType: initialType,
    loadingMessage: undefined,
    error: null
  })

  // Iniciar loading
  const startLoading = useCallback((
    type: SkeletonType = initialType, 
    message?: string
  ) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      skeletonType: type,
      loadingMessage: message,
      error: null
    }))
  }, [initialType])

  // Parar loading
  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      loadingMessage: undefined
    }))
  }, [])

  // Definir erro
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error,
      loadingMessage: undefined
    }))
  }, [])

  // Wrapper para executar função assíncrona com loading
  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    type: SkeletonType = initialType,
    message?: string
  ): Promise<T> => {
    try {
      startLoading(type, message)
      const result = await asyncFn()
      stopLoading()
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      throw error
    }
  }, [initialType, startLoading, stopLoading, setError])

  return {
    loading: state.isLoading,
    error: state.error,
    skeletonType: state.skeletonType,
    loadingMessage: state.loadingMessage,
    startLoading,
    stopLoading,
    setError,
    withLoading
  }
}

// Hook específico para loading de dados de API
export function useApiLoading(skeletonType: SkeletonType = 'fullscreen') {
  const {
    loading,
    error,
    skeletonType: currentSkeletonType,
    loadingMessage,
    startLoading,
    stopLoading,
    setError,
    withLoading
  } = usePageLoading(skeletonType)

  // Função para fazer requisições com loading automático
  const fetchWithLoading = useCallback(async <T>(
    url: string,
    options?: RequestInit,
    message?: string
  ): Promise<T> => {
    return withLoading(async () => {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    }, skeletonType, message || 'Carregando dados...')
  }, [withLoading, skeletonType])

  return {
    loading,
    error,
    skeletonType: currentSkeletonType,
    loadingMessage,
    startLoading,
    stopLoading,
    setError,
    fetchWithLoading,
    withLoading
  }
}

// Hook para múltiplos estados de loading (útil para páginas complexas)
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, PageLoadingState>>({})

  const startLoading = useCallback((
    key: string, 
    type: SkeletonType = 'fullscreen', 
    message?: string
  ) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        skeletonType: type,
        loadingMessage: message,
        error: null
      }
    }))
  }, [])

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        loadingMessage: undefined
      }
    }))
  }, [])

  const setError = useCallback((key: string, error: string | null) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        error,
        loadingMessage: undefined
      }
    }))
  }, [])

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key]?.isLoading || false
  }, [loadingStates])

  const getError = useCallback((key: string): string | null => {
    return loadingStates[key]?.error || null
  }, [loadingStates])

  const getSkeletonType = useCallback((key: string): SkeletonType => {
    return loadingStates[key]?.skeletonType || 'fullscreen'
  }, [loadingStates])

  const hasAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(state => state.isLoading)
  }, [loadingStates])

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>,
    type: SkeletonType = 'fullscreen',
    message?: string
  ): Promise<T> => {
    try {
      startLoading(key, type, message)
      const result = await asyncFn()
      stopLoading(key)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(key, errorMessage)
      throw error
    }
  }, [startLoading, stopLoading, setError])

  return {
    loadingStates,
    startLoading,
    stopLoading,
    setError,
    isLoading,
    getError,
    getSkeletonType,
    hasAnyLoading,
    withLoading
  }
}

// Hook com timer para evitar loading muito rápido (evita flicker)
export function useDelayedLoading(
  initialType: SkeletonType = 'fullscreen',
  minDelay: number = 300
) {
  const pageLoading = usePageLoading(initialType)
  const [shouldShowLoading, setShouldShowLoading] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (pageLoading.loading) {
      timer = setTimeout(() => {
        setShouldShowLoading(true)
      }, minDelay)
    } else {
      setShouldShowLoading(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [pageLoading.loading, minDelay])

  return {
    ...pageLoading,
    loading: shouldShowLoading && pageLoading.loading
  }
} 
