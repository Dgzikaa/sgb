'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook para detectar o Ano Novo e redirecionar automaticamente para a retrospectiva
 */
export function useNewYearDetector() {
  const [shouldShowRetrospective, setShouldShowRetrospective] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkNewYear = () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const targetDate = new Date('2026-01-01T00:00:00')
      
      // Verificar se é 2026 ou depois
      if (now >= targetDate) {
        const hasSeenRetrospective = localStorage.getItem('retrospective-2025-viewed')
        
        // Se ainda não viu a retrospectiva, redirecionar
        if (!hasSeenRetrospective) {
          setShouldShowRetrospective(true)
          
          // Aguardar 1 segundo antes de redirecionar (para não ser muito abrupto)
          setTimeout(() => {
            router.push('/retrospectiva-2025')
            localStorage.setItem('retrospective-2025-viewed', 'true')
          }, 1000)
        }
      }
    }

    checkNewYear()
  }, [router])

  return { shouldShowRetrospective }
}

/**
 * Hook simples para verificar se deve mostrar o botão de retrospectiva
 */
export function useShowRetrospectiveButton() {
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const now = new Date()
    const targetDate = new Date('2026-01-01T00:00:00')
    
    // Mostrar botão se for 2026 ou depois
    if (now >= targetDate) {
      setShowButton(true)
    }
  }, [])

  return showButton
}
