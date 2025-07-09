'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MetaConfigRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a nova localização em configurações
    router.replace('/configuracoes?tab=marketing')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          Redirecionando para Configurações...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          A configuração Meta foi movida para /configuracoes
        </p>
      </div>
    </div>
  )
} 