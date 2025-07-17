'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChecklistsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar automaticamente para checklist de abertura
    router.replace('/checklists/abertura')
  }, [router])

  // Loading enquanto redireciona
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Redirecionando...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Carregando checklist de abertura
        </p>
      </div>
    </div>
  )
} 
