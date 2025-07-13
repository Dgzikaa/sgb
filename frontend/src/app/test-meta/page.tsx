'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestMetaPage() {
  const [userData, setUserData] = useState<any>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const storedUser = localStorage.getItem('sgb_user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserData(user)
      } catch (e) {
        setError('Erro ao carregar dados do usuário')
      }
    } else {
      setError('Usuário não logado')
    }
  }, [])

  const testMetaAPI = async () => {
    if (!userData) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/meta/config', {
        method: 'GET',
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(userData))
        }
      })
      
      const data = await response.json()
      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        data
      })
    } catch (err) {
      setError('Erro na requisição: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teste Meta API - Debug</h1>
        <p className="text-gray-600">Teste de permissões e dados do usuário</p>
      </div>

      {error && (
        <Alert className="border-red-200">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Dados do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Usuário (localStorage)</CardTitle>
          <CardDescription>Dados que estão sendo enviados via header x-user-data</CardDescription>
        </CardHeader>
        <CardContent>
          {userData ? (
            <div className="space-y-2">
              <div><strong>ID:</strong> {userData.id}</div>
              <div><strong>Nome:</strong> {userData.nome}</div>
              <div><strong>Email:</strong> {userData.email}</div>
              <div><strong>Role:</strong> <Badge variant="outline">{userData.role}</Badge></div>
              <div><strong>Permissao:</strong> <Badge variant="outline">{userData.permissao}</Badge></div>
              <div><strong>Bar ID:</strong> {userData.bar_id}</div>
              <div><strong>Ativo:</strong> {userData.ativo ? '✅' : '❌'}</div>
              <div><strong>Módulos:</strong> {userData.modulos_permitidos?.join(', ') || 'Nenhum'}</div>
              
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">Ver dados completos (JSON)</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-gray-500">Carregando dados do usuário...</p>
          )}
        </CardContent>
      </Card>

      {/* Teste da API */}
      <Card>
        <CardHeader>
          <CardTitle>Teste API Meta Config</CardTitle>
          <CardDescription>Testar acesso à API /api/meta/config</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testMetaAPI} disabled={loading || !userData}>
            {loading ? 'Testando...' : 'Testar API Meta'}
          </Button>
          
          {apiResponse && (
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Badge variant={apiResponse.status === 200 ? 'default' : 'destructive'}>
                  {apiResponse.status} {apiResponse.statusText}
                </Badge>
              </div>
              
              <details>
                <summary className="cursor-pointer text-sm text-gray-600">Ver resposta da API</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(apiResponse.data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 