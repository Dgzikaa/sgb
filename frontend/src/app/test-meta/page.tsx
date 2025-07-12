'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TestMetaPage() {
  const [debugResult, setDebugResult] = useState<any>(null)
  const [configResult, setConfigResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  const testDebug = async () => {
    try {
      setLoading(true)
      
      // Simular dados do usuário
      const userData = {
        id: 1,
        bar_id: 3,
        permissao: 'admin',
        nome: 'Teste',
        email: 'teste@exemplo.com'
      }
      
      const response = await fetch('/api/meta/debug', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(userData))
        }
      })
      
      const data = await response.json()
      setDebugResult(data)
      
    } catch (error) {
      console.error('Erro no teste de debug:', error)
      setDebugResult({ error: 'Erro ao testar debug' })
    } finally {
      setLoading(false)
    }
  }

  const testConfig = async () => {
    try {
      setLoading(true)
      
      // Simular dados do usuário
      const userData = {
        id: 1,
        bar_id: 3,
        permissao: 'admin',
        nome: 'Teste',
        email: 'teste@exemplo.com'
      }
      
      const response = await fetch('/api/meta/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(userData))
        }
      })
      
      const data = await response.json()
      setConfigResult(data)
      
    } catch (error) {
      console.error('Erro no teste de config:', error)
      setConfigResult({ error: 'Erro ao testar config' })
    } finally {
      setLoading(false)
    }
  }

  const testSaveConfig = async () => {
    if (!token) {
      alert('Digite um token para testar')
      return
    }
    
    try {
      setLoading(true)
      
      // Simular dados do usuário
      const userData = {
        id: 1,
        bar_id: 3,
        permissao: 'admin',
        nome: 'Teste',
        email: 'teste@exemplo.com'
      }
      
      const response = await fetch('/api/meta/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(userData))
        },
        body: JSON.stringify({
          access_token: token,
          app_id: 'test-app-id',
          app_secret: 'test-app-secret'
        })
      })
      
      const data = await response.json()
      setConfigResult(data)
      
    } catch (error) {
      console.error('Erro no teste de save config:', error)
      setConfigResult({ error: 'Erro ao testar save config' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teste de Debug Meta API</CardTitle>
            <CardDescription>
              Teste para diagnosticar problemas com a API do Meta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testDebug} disabled={loading}>
                Testar Debug
              </Button>
              <Button onClick={testConfig} disabled={loading}>
                Testar GET Config
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token">Token para teste de POST:</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole seu token Meta aqui..."
              />
              <Button onClick={testSaveConfig} disabled={loading || !token}>
                Testar POST Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {debugResult && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado do Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(debugResult, null, 2)}
                readOnly
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        )}

        {configResult && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Config</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(configResult, null, 2)}
                readOnly
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 