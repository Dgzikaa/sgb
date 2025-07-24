'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TesteWebhookPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const configurarWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/financeiro/inter/configurar-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barId: '3',
          tipoWebhook: 'pix-pagamento'
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testarCallback = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/teste-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teste: 'sim' })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark">🧪 Teste de Webhook Inter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={configurarWebhook} 
                disabled={loading}
                className="btn-primary-dark"
              >
                {loading ? 'Configurando...' : '🔧 Configurar Webhook Inter'}
              </Button>
              
              <Button 
                onClick={testarCallback} 
                disabled={loading}
                className="btn-secondary-dark"
              >
                {loading ? 'Testando...' : '📨 Testar Callback'}
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Resultado:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 