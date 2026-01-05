'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FinanceiroPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para o dashboard
    router.push('/fp/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400">Redirecionando...</p>
    </div>
  )
}
