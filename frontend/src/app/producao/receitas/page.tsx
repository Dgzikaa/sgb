'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReceitasRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a nova localizaÃ¡Â§Ã¡Â£o
    router.replace('/operacoes/receitas')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecionando para nova localizaÃ¡Â§Ã¡Â£o...</p>
        <p className="text-sm text-slate-400 mt-2">
          Esta pÃ¡Â¡gina foi movida para <strong>/operacoes/receitas</strong>
        </p>
      </div>
    </div>
  )
} 

