import { useEffect, useRef } from 'react'

interface FaviconOptions {
  barName?: string
}

export const useFavicon = ({ barName }: FaviconOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    // Cleanup timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Evitar mÃºltiplas atualizaÃ§Ãµes simultÃ¢neas
    if (isUpdatingRef.current) {
      return
    }

    const updateFavicon = () => {
      // Verificar se estamos no browser e se o componente ainda estÃ¡ montado
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return
      }

      // Marcar como atualizando
      isUpdatingRef.current = true

      try {
        // Determinar qual pasta de favicon usar baseado no nome do bar
        const faviconPath = barName?.toLowerCase().includes('ordinÃ¡rio') || barName?.toLowerCase().includes('ordinario')
          ? '/favicons/ordinario'
          : '/favicons/default'

        // Usar setTimeout para executar a atualizaÃ§Ã£o de forma assÃ­ncrona
        timeoutRef.current = setTimeout(() => {
          try {
            // Atualizar apenas o favicon principal sem remover elementos
            const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
            if (existingFavicon) {
              existingFavicon.href = `${faviconPath}/favicon.ico?v=${Date.now()}`
            }

            // Atualizar tÃ­tulo da pÃ¡gina
            if (barName) {
              document.title = `${barName} - SGB`
            } else {
              document.title = 'SGB - Sistema de GestÃ£o de Bares'
            }

            // Favicon atualizado silenciosamente
          } catch (error) {
            console.debug('Erro ao atualizar favicon:', error)
          } finally {
            isUpdatingRef.current = false
          }
        }, 100) // Pequeno delay para evitar conflitos

      } catch (error) {
        console.debug('Erro geral no updateFavicon:', error)
        isUpdatingRef.current = false
      }
    }

    updateFavicon()

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      isUpdatingRef.current = false
    }
  }, [barName])
} 
