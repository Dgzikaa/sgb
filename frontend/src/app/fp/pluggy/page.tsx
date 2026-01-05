'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plug, RefreshCw, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { fetchFP } from '@/lib/api-fp'

interface PluggyItem {
  id: string
  connector_name: string
  status: string
  created_at: string
  lastUpdatedAt?: string
}

export default function PluggyPage() {
  const [items, setItems] = useState<PluggyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await fetchFP('/api/fp/pluggy/items')
      const result = await response.json()
      
      if (result.success) {
        setItems(result.data)
      }
    } catch (error) {
      toast.error('Erro ao carregar conexões')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSync = async (itemId: string) => {
    setSyncing(itemId)
    try {
      // Pegar data de 90 dias atrás
      const from = new Date()
      from.setDate(from.getDate() - 90)
      
      const response = await fetchFP('/api/fp/pluggy/sync', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          from: from.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
        }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success(`Sincronizado! ${result.data.transacoesImportadas} transações importadas`, {
          description: result.data.contasCriadas > 0 ? `${result.data.contasCriadas} contas criadas` : undefined
        })
        fetchItems()
      } else {
        toast.error('Erro ao sincronizar', { description: result.error })
      }
    } catch (error: any) {
      toast.error('Erro de conexão', { description: error.message })
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja desconectar este banco?')) return

    try {
      const response = await fetchFP(`/api/fp/pluggy/items?id=${itemId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Banco desconectado!')
        fetchItems()
      } else {
        toast.error('Erro ao desconectar', { description: result.error })
      }
    } catch (error) {
      toast.error('Erro de conexão')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPDATED':
      case 'LOGIN_IN_PROGRESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'OUTDATED':
      case 'UPDATING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'LOGIN_ERROR':
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPDATED':
        return 'Atualizado'
      case 'OUTDATED':
        return 'Desatualizado'
      case 'UPDATING':
        return 'Atualizando...'
      case 'LOGIN_IN_PROGRESS':
        return 'Conectando...'
      case 'LOGIN_ERROR':
        return 'Erro de login'
      case 'ERROR':
        return 'Erro'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Link href="/fp" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Conexões Bancárias</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Open Finance via Pluggy
            </p>
          </div>

          <div className="w-32" />
        </div>

        {/* Aviso de Implementação */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Plug className="w-5 h-5" />
              Open Finance Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-blue-700 dark:text-blue-300">
              <p><strong>🔧 Em Desenvolvimento:</strong> A integração completa com o Pluggy Widget está sendo finalizada.</p>
              <p><strong>📋 Próximas etapas:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Implementar Pluggy Connect Widget para conexão de bancos</li>
                <li>Sincronização automática de transações</li>
                <li>Atualização em tempo real de saldos</li>
                <li>Suporte a múltiplos bancos simultaneamente</li>
              </ul>
              <p className="mt-4">
                <strong>💡 Como funciona:</strong> Após conectar sua conta bancária via Open Finance, 
                o sistema irá automaticamente importar suas transações e manter tudo sincronizado.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Conexões */}
        {loading ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando conexões...</p>
          </Card>
        ) : items.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-12 text-center">
            <Plug className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum banco conectado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Conecte sua conta bancária via Open Finance para importar transações automaticamente
            </p>
            <Button disabled className="bg-gray-400">
              <Plug className="w-4 h-4 mr-2" />
              Conectar Banco (Em breve)
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                        {item.connector_name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-2">
                        {getStatusIcon(item.status)}
                        {getStatusText(item.status)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Conectado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {item.lastUpdatedAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Última atualização: {new Date(item.lastUpdatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        onClick={() => handleSync(item.id)}
                        disabled={syncing === item.id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {syncing === item.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sincronizar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Informações Adicionais */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">🔒 Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><strong>Pluggy é certificado pelo Banco Central do Brasil</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Seus dados bancários são criptografados e protegidos</li>
                <li>Nunca armazenamos sua senha bancária</li>
                <li>Você pode desconectar a qualquer momento</li>
                <li>Conformidade com LGPD e Open Finance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
