'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useBar } from '@/contexts/BarContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Link2, AlertTriangle } from 'lucide-react'

interface ContaAzulConfig {
  id?: number
  access_token?: string
  refresh_token?: string
  expires_at?: string
  empresa_id?: string
  conectado: boolean
  ultima_sync?: string
}

export default function ContaAzulPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedBar } = useBar()
  const [config, setConfig] = useState<ContaAzulConfig>({ conectado: false })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')

  useEffect(() => {
    if (selectedBar) {
      carregarConfiguracao()
    }

    // Verificar URL parameters para callback do OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'connected') {
      setStatus('connected')
      toast({
        title: '✅ ContaAzul conectado',
        description: 'Conexão estabelecida com sucesso!'
      })
      // Limpar URL parameters
      window.history.replaceState({}, '', window.location.pathname)
      if (selectedBar) {
        carregarConfiguracao()
      }
    } else if (error) {
      setStatus('error')
      const errorMessage = getErrorMessage(error)
      toast({
        title: '❌ Erro na conexão',
        description: errorMessage,
        variant: 'destructive'
      })
      // Limpar URL parameters
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [selectedBar, toast])

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'unauthorized':
        return 'Não autorizado'
      case 'missing_code':
        return 'Código de autorização não recebido'
      case 'invalid_state':
        return 'Estado de segurança inválido'
      case 'callback_error':
        return 'Erro no processamento da autorização'
      default:
        return decodeURIComponent(error)
    }
  }

  const carregarConfiguracao = async () => {
    try {
      const supabase = await getSupabaseClient()
      if (!supabase || !selectedBar) return

      const { data, error } = await supabase
        .from('contaazul_config')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar config:', error)
        return
      }

      if (data) {
        const isConnected = !!data.access_token && new Date(data.expires_at) > new Date()
        setConfig({
          ...data,
          conectado: isConnected
        })
        setStatus(isConnected ? 'connected' : 'idle')
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      setStatus('error')
    }
  }

  const conectarContaAzul = async () => {
    if (!selectedBar) {
      toast({
        title: '❌ Erro',
        description: 'Selecione um bar primeiro!',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setStatus('connecting')

    try {
      const response = await fetch('/api/contaazul/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_auth_url',
          bar_id: selectedBar.id
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('🔗 Redirecionando para:', result.auth_url)
        window.location.href = result.auth_url
      } else {
        throw new Error(result.error || 'Erro na conexão')
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      setStatus('error')
      toast({
        title: '❌ Erro na conexão',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  const desconectar = async () => {
    if (!selectedBar) return

    setLoading(true)
    try {
      const response = await fetch('/api/contaazul/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'disconnect',
          bar_id: selectedBar.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setConfig({ conectado: false })
        setStatus('idle')
        toast({
          title: '✅ Desconectado',
          description: 'ContaAzul desconectado com sucesso!'
        })
      } else {
        throw new Error(result.error || 'Erro ao desconectar')
      }

    } catch (error) {
      console.error('Erro ao desconectar:', error)
      toast({
        title: '❌ Erro ao desconectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const sincronizarDados = async () => {
    if (!selectedBar) return

    setLoading(true)
    try {
      const response = await fetch('/api/contaazul/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barId: selectedBar.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await carregarConfiguracao()
        const summary = result.resultado || {}
        toast({
          title: '✅ Sincronização concluída',
          description: `Dados sincronizados com sucesso!`
        })
      } else {
        throw new Error(result.error || 'Erro na sincronização')
      }
    } catch (error) {
      console.error('Erro na sincronização:', error)
      toast({
        title: '❌ Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/configuracoes/integracoes')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">CA</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ContaAzul</h1>
                <p className="text-gray-600">Conecte seu ContaAzul para sincronizar dados financeiros</p>
              </div>
            </div>
          </div>

          {/* Status da Conexão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Status da Integração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'connected' ? 'bg-green-500' :
                    status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <div className="font-medium">
                      {status === 'connected' ? 'Conectado' :
                       status === 'connecting' ? 'Conectando...' :
                       status === 'error' ? 'Erro na conexão' : 'Não conectado'}
                    </div>
                    {config.empresa_id && (
                      <div className="text-sm text-gray-500">Empresa: {config.empresa_id}</div>
                    )}
                    {config.ultima_sync && (
                      <div className="text-sm text-gray-500">
                        Última sync: {new Date(config.ultima_sync).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {config.conectado ? (
                    <>
                      <Button
                        onClick={sincronizarDados}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sincronizar
                      </Button>
                      <Button
                        onClick={desconectar}
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                      >
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={conectarContaAzul}
                      disabled={loading || !selectedBar}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Conectar ContaAzul
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Integração */}
          <Card>
            <CardHeader>
              <CardTitle>Como funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🔗 Conexão Segura</h4>
                    <p className="text-sm text-blue-700">
                      Conecta-se ao ContaAzul usando OAuth2 para máxima segurança.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">📊 Sincronização</h4>
                    <p className="text-sm text-green-700">
                      Sincroniza receitas, despesas e categorias automaticamente.
                    </p>
                  </div>
                </div>
                
                {!config.conectado && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">Primeiro acesso</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Clique em "Conectar ContaAzul" para autorizar o acesso e começar a sincronizar seus dados.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 