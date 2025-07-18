import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useBar } from '@/contexts/BarContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, RefreshCw, Link2, AlertTriangle, CheckCircle, XCircle, Clock, Database, Shield } from 'lucide-react'

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
        title: 'Å“â€¦ ContaAzul conectado',
        description: 'ConexÃ¡Â£o estabelecida com sucesso!'
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
        title: 'ÂÅ’ Erro na conexÃ¡Â£o',
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
        return 'NÃ¡Â£o autorizado'
      case 'missing_code':
        return 'CÃ¡Â³digo de autorizaÃ¡Â§Ã¡Â£o nÃ¡Â£o recebido'
      case 'invalid_state':
        return 'Estado de seguranÃ¡Â§a invÃ¡Â¡lido'
      case 'callback_error':
        return 'Erro no processamento da autorizaÃ¡Â§Ã¡Â£o'
      default:
        return decodeURIComponent(error)
    }
  }

  const carregarConfiguracao = async () => {
    try {
      const supabase = await getSupabaseClient()
      if (!supabase || !selectedBar) return

      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .eq('sistema', 'contaazul')
        .eq('ativo', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar config:', error)
        return
      }

      if (data) {
        const isConnected = !!data.access_token && data.expires_at && new Date(data.expires_at) > new Date()
        setConfig({
          id: data.id,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          empresa_id: data.empresa_id,
          conectado: isConnected,
          ultima_sync: data.ultima_sync
        })
        setStatus(isConnected ? 'connected' : 'idle')
      }
    } catch (error) {
      console.error('Erro ao carregar configuraÃ¡Â§Ã¡Â£o:', error)
      setStatus('error')
    }
  }

  const conectarContaAzul = async () => {
    if (!selectedBar) {
      toast({
        title: 'ÂÅ’ Erro',
        description: 'Selecione um bar primeiro!',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setStatus('connecting')

    try {
      // Ã°Å¸â€â€ž Tentar renovaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica do token primeiro
      console.log('Ã°Å¸â€â€ž Tentando renovaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica do token...')
      
      const response = await fetch('/api/contaazul/refresh-token', {
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
        console.log('Å“â€¦ Token renovado com sucesso!')
        
        // Atualizar configuraÃ¡Â§Ã¡Â£o local
        setConfig(prev => ({
          ...prev,
          conectado: true,
          expires_at: result.expires_at,
          empresa_id: result.empresa_id,
          ultima_sync: new Date().toISOString()
        }))
        
        setStatus('connected')
        
        toast({
          title: 'Å“â€¦ ContaAzul conectado!',
          description: result.message || 'Token renovado e conexÃ¡Â£o estabelecida com sucesso!',
        })
        
        // Recarregar configuraÃ¡Â§Ã¡Â£o do banco
        await carregarConfiguracao()
      } else {
        // Se a renovaÃ¡Â§Ã¡Â£o falhar, mostrar erro e sugerir nova autorizaÃ¡Â§Ã¡Â£o
        console.log('ÂÅ’ RenovaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica falhou:', result.error)
        
        toast({
          title: 'ÂÅ’ RenovaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica falhou',
          description: result.error || 'Ã¡â€° necessÃ¡Â¡rio fazer nova autorizaÃ¡Â§Ã¡Â£o. Clique em "Autorizar Nova ConexÃ¡Â£o" abaixo.',
          variant: 'destructive'
        })
        
        setStatus('error')
      }
    } catch (error) {
      console.error('ÂÅ’ Erro na renovaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica:', error)
      setStatus('error')
      toast({
        title: 'ÂÅ’ Erro na conexÃ¡Â£o',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const autorizarNovaConexao = async () => {
    if (!selectedBar) {
      toast({
        title: 'ÂÅ’ Erro',
        description: 'Selecione um bar primeiro!',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setStatus('connecting')

    try {
      // Usar a API original para fazer nova autorizaÃ¡Â§Ã¡Â£o OAuth
      const response = await fetch(`/api/contaazul/auth?action=authorize&barId=${selectedBar.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        console.log('Ã°Å¸â€â€” Redirecionando para autorizaÃ¡Â§Ã¡Â£o OAuth:', result.authUrl)
        window.location.href = result.authUrl
      } else {
        throw new Error(result.error || 'Erro na autorizaÃ¡Â§Ã¡Â£o')
      }
    } catch (error) {
      console.error('ÂÅ’ Erro na autorizaÃ¡Â§Ã¡Â£o OAuth:', error)
      setStatus('error')
      toast({
        title: 'ÂÅ’ Erro na autorizaÃ¡Â§Ã¡Â£o',
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
      const response = await fetch('/api/contaazul/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'disconnect',
          barId: selectedBar.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setConfig({ conectado: false })
        setStatus('idle')
        toast({
          title: 'Å“â€¦ Desconectado',
          description: 'ContaAzul desconectado com sucesso!'
        })
      } else {
        throw new Error(result.error || 'Erro ao desconectar')
      }

    } catch (error) {
      console.error('Erro ao desconectar:', error)
      toast({
        title: 'ÂÅ’ Erro ao desconectar',
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
          title: 'Å“â€¦ SincronizaÃ¡Â§Ã¡Â£o concluÃ¡Â­da',
          description: `Dados sincronizados com sucesso!`
        })
      } else {
        throw new Error(result.error || 'Erro na sincronizaÃ¡Â§Ã¡Â£o')
      }
    } catch (error) {
      console.error('Erro na sincronizaÃ¡Â§Ã¡Â£o:', error)
      toast({
        title: 'ÂÅ’ Erro na sincronizaÃ¡Â§Ã¡Â£o',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // FunÃ¡Â§Ã¡Â£o para obter o Ã¡Â­cone do status
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'connecting':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Link2 className="w-5 h-5 text-gray-400" />
    }
  }

  // FunÃ¡Â§Ã¡Â£o para obter o texto do status
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'connecting':
        return 'Conectando...'
      case 'error':
        return 'Erro na conexÃ¡Â£o'
      default:
        return 'NÃ¡Â£o conectado'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">CA</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ContaAzul</h1>
                <p className="text-gray-600">IntegraÃ¡Â§Ã¡Â£o com sistema financeiro</p>
              </div>
            </div>
          </div>
          
          <Badge variant={config.conectado ? "default" : "secondary"} className="px-4 py-2">
            {getStatusIcon()}
            <span className="ml-2">{getStatusText()}</span>
          </Badge>
        </div>

        <Separator />

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status da ConexÃ¡Â£o */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Status da IntegraÃ¡Â§Ã¡Â£o
                </CardTitle>
                <CardDescription>
                  Acompanhe o status da conexÃ¡Â£o com o ContaAzul
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      status === 'connected' ? 'bg-green-500' :
                      status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                      status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {getStatusText()}
                      </div>
                      {config.empresa_id && (
                        <div className="text-sm text-gray-500">
                          Empresa: {config.empresa_id}
                        </div>
                      )}
                      {config.ultima_sync && (
                        <div className="text-sm text-gray-500">
                          Ã¡Å¡ltima sincronizaÃ¡Â§Ã¡Â£o: {new Date(config.ultima_sync).toLocaleString('pt-BR')}
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
                      <>
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
                        <Button
                          onClick={autorizarNovaConexao}
                          disabled={loading || !selectedBar}
                          variant="outline"
                          size="sm"
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Autorizar Nova ConexÃ¡Â£o
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* InformaÃ¡Â§Ã¡Âµes RÃ¡Â¡pidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                InformaÃ¡Â§Ã¡Âµes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">SeguranÃ¡Â§a</div>
                  <div className="text-sm text-blue-700">OAuth 2.0</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Database className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">SincronizaÃ¡Â§Ã¡Â£o</div>
                  <div className="text-sm text-green-700">AutomÃ¡Â¡tica</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Como Funciona */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona a integraÃ¡Â§Ã¡Â£o</CardTitle>
            <CardDescription>
              Entenda como a integraÃ¡Â§Ã¡Â£o com o ContaAzul funciona em sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">ConexÃ¡Â£o Segura</h4>
                    <p className="text-sm text-blue-700">
                      Utilizamos OAuth 2.0 para garantir a mÃ¡Â¡xima seguranÃ¡Â§a na conexÃ¡Â£o 
                      com seus dados do ContaAzul.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">SincronizaÃ¡Â§Ã¡Â£o AutomÃ¡Â¡tica</h4>
                    <p className="text-sm text-green-700">
                      Seus dados financeiros sÃ¡Â£o sincronizados automaticamente, 
                      mantendo tudo sempre atualizado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-2">Dados em Tempo Real</h4>
                    <p className="text-sm text-purple-700">
                      Receitas, despesas e categorias sÃ¡Â£o atualizadas 
                      automaticamente no sistema.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-900 mb-2">FÃ¡Â¡cil de Usar</h4>
                    <p className="text-sm text-orange-700">
                      Basta clicar em "Conectar" e autorizar o acesso. 
                      Tudo Ã¡Â© configurado automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!config.conectado && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Primeiro acesso</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Para comeÃ¡Â§ar a usar a integraÃ¡Â§Ã¡Â£o, clique em "Conectar ContaAzul" e 
                      autorize o acesso aos seus dados financeiros. O processo Ã¡Â© rÃ¡Â¡pido e seguro.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 

