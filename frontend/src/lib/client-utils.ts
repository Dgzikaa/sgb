import { useState, useEffect } from 'react'

/**
 * Utilitários para verificação de ambiente cliente/servidor
 * e acesso seguro a APIs do navegador
 */

/**
 * Verifica se o código está rodando no cliente (navegador)
 */
export const isClient = typeof window !== 'undefined'

/**
 * Verifica se o código está rodando no servidor
 */
export const isServer = typeof window === 'undefined'

/**
 * Safe access to localStorage
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn(`Error accessing localStorage for key "${key}":`, error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isClient) return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn(`Error setting localStorage for key "${key}":`, error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    if (!isClient) return false
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Error removing localStorage for key "${key}":`, error)
      return false
    }
  }
}

/**
 * Safe access to navigator
 */
export const safeNavigator = {
  isOnline: (): boolean => {
    if (!isClient || !navigator) return true
    return navigator.onLine
  },

  clipboard: {
    writeText: async (text: string): Promise<boolean> => {
      if (!isClient || !navigator?.clipboard) return false
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        console.warn('Error writing to clipboard:', error)
        return false
      }
    }
  },

  mediaDevices: {
    getUserMedia: async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
      if (!isClient || !navigator?.mediaDevices) return null
      try {
        return await navigator.mediaDevices.getUserMedia(constraints)
      } catch (error) {
        console.warn('Error accessing media devices:', error)
        return null
      }
    }
  },

  share: async (data: ShareData): Promise<boolean> => {
    if (!isClient || !navigator?.share) return false
    try {
      await navigator.share(data)
      return true
    } catch (error) {
      console.warn('Error sharing:', error)
      return false
    }
  },

  serviceWorker: {
    register: async (scriptURL: string): Promise<ServiceWorkerRegistration | null> => {
      if (!isClient || !('serviceWorker' in navigator)) return null
      try {
        return await navigator.serviceWorker.register(scriptURL)
      } catch (error) {
        console.warn('Error registering service worker:', error)
        return null
      }
    }
  }
}

/**
 * Hook para aguardar que o componente seja hidratado no cliente
 */
export const useIsClient = () => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return mounted
}

/**
 * Safe access to window
 */
export const safeWindow = {
  addEventListener: (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): boolean => {
    if (!isClient) return false
    try {
      window.addEventListener(type, listener, options)
      return true
    } catch (error) {
      console.warn(`Error adding window event listener for "${type}":`, error)
      return false
    }
  },

  removeEventListener: (type: string, listener: EventListener, options?: boolean | EventListenerOptions): boolean => {
    if (!isClient) return false
    try {
      window.removeEventListener(type, listener, options)
      return true
    } catch (error) {
      console.warn(`Error removing window event listener for "${type}":`, error)
      return false
    }
  }
}

// Export individual functions for convenience
export const { getItem: getLocalStorage, setItem: setLocalStorage, removeItem: removeLocalStorage } = safeLocalStorage
export const { isOnline, clipboard, mediaDevices, share, serviceWorker } = safeNavigator 
