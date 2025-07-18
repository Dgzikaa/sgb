'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function WindsorMultiAccountPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <h1 className="card-title-dark mb-4">Carregando...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          <h1 className="card-title-dark mb-4">Windsor Multi-Account</h1>
          <Alert>
            <AlertDescription>
              Esta página está temporariamente indisponível devido a problemas de build.
              Estamos trabalhando para resolver o problema.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
} 