'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Send } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useBar } from '@/contexts/BarContext'

interface ContaAzulStatus {
  connected: boolean;
  configured: boolean;
  tokenExpired: boolean;
  expiresAt: string;
  access_token?: string;
  empresa: {
    id: string;
    nome: string;
    cnpj: string;
  };
  lastRefresh: string;
  refreshCount: number;
  debug?: {
    access_token: string;
    refresh_token: string;
    authorization_code: string;
    client_id: string;
    environment: string;
  };
}

export default function ContaAzulOAuth() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedBar } = useBar()
  
  const [status, setStatus] = useState<ContaAzulStatus>({
    connected: false,
    configured: false,
    tokenExpired: false,
    expiresAt: '',
    empresa: { id: '', nome: '', cnpj: '' },
    lastRefresh: '',
    refreshCount: 0
  })
  
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)
  const [showSyncResults, setShowSyncResults] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  })

  // Auto-reload status quando voltar de callback OAuth
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadStatus()
      }
    }

    document.addEventListener('visibilitychange', handleFocus)
    return () => document.removeEventListener('visibilitychange', handleFocus)
  }, [])

  useEffect(() => {
    if (selectedBar?.id) {
      loadStatus()
    }
  }, [selectedBar])

  // Auto-renovar token quando expirado
  useEffect(() => {
    if (status.configured && !status.connected && status.tokenExpired) {
      console.log('ðŸ”„ FRONTEND - Token expirado detectado, tentando renovar automaticamente...')
      handleRefresh()
    }
  }, [status.configured, status.connected, status.tokenExpired])



  const loadStatus = async () => {
    if (!selectedBar?.id) return
    
    try {
      console.log('ðŸ” FRONTEND - Carregando status para bar:', selectedBar.id)
      const response = await fetch(`/api/contaazul/auth?action=status&barId=${selectedBar.id}`)
      const data = await response.json()
      
      console.log('ðŸ” FRONTEND - Resposta da API:', { 
        ok: response.ok, 
        status: response.status,
        data: data
      })
      
      if (response.ok) {
        // Sempre atualizar o status, independente se está¡ configurado ou ná£o
        setStatus({
          connected: data.connected || false,
          configured: data.configured || false,
          tokenExpired: data.tokenExpired || false,
          expiresAt: data.expiresAt || '',
          access_token: data.access_token,
          empresa: data.empresa || { id: '', nome: '', cnpj: '' },
          lastRefresh: data.lastRefresh || '',
          refreshCount: data.refreshCount || 0,
          debug: data.debug
        })
        
        console.log('œ… FRONTEND - Status atualizado:', {
          connected: data.connected || false,
          configured: data.configured || false,
          tokenExpired: data.tokenExpired || false
        })
      } else {
        console.log('Œ FRONTEND - Erro na resposta:', data)
        setStatus({
          connected: false,
          configured: false,
          tokenExpired: false,
          expiresAt: '',
          empresa: { id: '', nome: '', cnpj: '' },
          lastRefresh: '',
          refreshCount: 0
        })
      }
    } catch (error) {
      console.error('Œ FRONTEND - Erro ao carregar status:', error)
      setStatus({
        connected: false,
        configured: false,
        tokenExpired: false,
        expiresAt: '',
        empresa: { id: '', nome: '', cnpj: '' },
        lastRefresh: '',
        refreshCount: 0
      })
    }
  }

  const handleConfigure = async () => {
    if (!selectedBar?.id || !config.clientId || !config.clientSecret || !config.redirectUri) {
      toast({
        title: "Campos obrigatá³rios",
        description: "Preencha todos os campos de configuraá§á£o",
        variant: "destructive"
      })
      return
    }

    setConfiguring(true)
    
    try {
      const response = await fetch('/api/contaazul/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          barId: selectedBar.id,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao configurar')
      }

      toast({
        title: "Configuraá§á£o salva",
        description: "Credenciais OAuth configuradas com sucesso!"
      })

      setShowConfig(false)
      
      // Aguardar um pouco e recarregar status
      console.log('ðŸ” FRONTEND - Aguardando para recarregar status...')
      setTimeout(() => {
        loadStatus()
      }, 500)
    } catch (error) {
      toast({
        title: "Erro na configuraá§á£o",
        description: error instanceof Error ? error.message : "Erro ao configurar OAuth",
        variant: "destructive"
      })
    } finally {
      setConfiguring(false)
    }
  }

  const handleAuthorize = async () => {
    if (!selectedBar?.id || !status.configured) return

    setLoading(true)
    
    try {
      const response = await fetch(`/api/contaazul/auth?action=authorize&barId=${selectedBar.id}`)

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao autorizar')
      }

      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      toast({
        title: "Erro na autorizaá§á£o",
        description: error instanceof Error ? error.message : "Erro ao gerar URL de autorizaá§á£o",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!selectedBar?.id) return

    setRefreshing(true)
    
    try {
      const response = await fetch(`/api/contaazul/auth?action=refresh&barId=${selectedBar.id}`)

      const data = await response.json()
      
      if (!response.ok) {
        console.log('Œ FRONTEND - Falha na renovaá§á£o automá¡tica:', data.error)
        
        // Se a renovaá§á£o falhar, ná£o mostrar erro para renovaá§á£o automá¡tica
        if (!status.connected) {
          console.log('ðŸ”„ FRONTEND - Renovaá§á£o automá¡tica falhou, mantendo status atual')
          return
        }
        
        throw new Error(data.error || 'Erro ao renovar token')
      }

      console.log('œ… FRONTEND - Token renovado com sucesso!')
      
      toast({
        title: "Token renovado",
        description: "Token de acesso renovado com sucesso!"
      })

      loadStatus()
    } catch (error) {
      // Sá³ mostrar erro se for renovaá§á£o manual (usuá¡rio conectado)
      if (status.connected) {
        toast({
          title: "Erro ao renovar token",
          description: error instanceof Error ? error.message : "Erro ao renovar token",
          variant: "destructive"
        })
      }
    } finally {
      setRefreshing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!selectedBar?.id) return

    const confirmacao = confirm('Tem certeza que deseja desconectar do ContaAzul?')
    if (!confirmacao) return

    setLoading(true)
    
    try {
      const response = await fetch('/api/contaazul/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', barId: selectedBar.id })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desconectar')
      }

      toast({
        title: "Desconectado",
        description: "Desconectado do ContaAzul com sucesso!"
      })

      loadStatus()
    } catch (error) {
      toast({
        title: "Erro ao desconectar",
        description: error instanceof Error ? error.message : "Erro ao desconectar",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncDados = async () => {
    if (!selectedBar?.id || !status.connected) return
    
    setSyncLoading(true)
    setSyncResults(null)
    
    try {
      // Chamar API do sync completo unificado
      const response = await fetch('/api/contaazul/sync-categorizado-corrigido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barId: selectedBar.id,
          force: true 
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro no sync completo')
      }
      
      console.log('œ… SYNC COMPLETO CONCLUáDO:', data)
      
      // Usar estrutura da API unificada
      const adaptedResults = {
        timestamp: data.timestamp,
        estatisticas: {
          categorias_processadas: data.estatisticas?.categorias_processadas || 0,
          receitas_salvas: data.estatisticas?.eventos_receitas || 0,
          despesas_salvas: data.estatisticas?.eventos_despesas || 0,
          parcelas_processadas: data.estatisticas?.parcelas_inseridas || 0,
          competencias_encontradas: data.estatisticas?.eventos_sem_parcelas || 0
        },
        problemas_corrigidos: data.regras_implementadas || [
          'œ… Fluxo unificado de 7 passos implementado',
          'œ… Tabela unificada contaazul_eventos_financeiros',
          'œ… Regra: sem parcelas = data_competencia = data_vencimento',
          'œ… Parcelas reais salvas em contaazul_parcelas'
        ]
      }
      
      setSyncResults(adaptedResults)
      setShowSyncResults(true)
      
      const totalEventos = (adaptedResults.estatisticas.receitas_salvas || 0) + (adaptedResults.estatisticas.despesas_salvas || 0)
      const totalParcelas = adaptedResults.estatisticas.parcelas_processadas || 0
      
      toast({
        title: "œ… Sync Completo Concluá­do!",
        description: `${totalEventos} eventos salvos! ${totalParcelas} parcelas processadas. Veja logs no terminal!`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Erro na Sincronizaá§á£o",
        description: error instanceof Error ? error.message : "Erro na sincronizaá§á£o",
        variant: "destructive"
      })
    } finally {
      setSyncLoading(false)
    }
  }





  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: `${label} copiado para a á¡rea de transferáªncia`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Ná£o foi possá­vel copiar para a á¡rea de transferáªncia",
        variant: "destructive"
      })
    }
  }



  const getStatusIcon = () => {
    if (status.connected && !status.tokenExpired) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    return <AlertCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusText = () => {
    if (!status.configured) return "Ná£o configurado"
    if (!status.connected) return "Desconectado"
    if (status.tokenExpired) return "Token expirado"
    return "Conectado"
  }

  const getStatusBadge = () => {
    if (status.connected && !status.tokenExpired) {
      return <Badge className="bg-green-100 text-green-800">Conectado</Badge>
    }
    if (status.configured) {
      return <Badge variant="secondary">Configurado</Badge>
    }
    return <Badge variant="outline">Ná£o configurado</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon()}
            Integraá§á£o ContaAzul
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Conecte-se ao ContaAzul para sincronizar dados financeiros e processar competáªncias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!status.configured && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Configure suas credenciais OAuth para comeá§ar</p>
                <Button onClick={() => setShowConfig(true)}>
                  Configurar Credenciais
                </Button>
              </div>
            )}

            {status.configured && !status.connected && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Configuraá§á£o encontrada. Autorize o acesso ao ContaAzul.</p>
                <Button 
                  onClick={handleAuthorize}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Autorizar ContaAzul
                </Button>
              </div>
            )}

            {status.connected && (
              <div className="space-y-4">
                {/* Status da Conexá£o */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-green-800">Token expira em</p>
                      <p className="text-sm text-green-700">
                        {status.expiresAt ? new Date(status.expiresAt).toLocaleString('pt-BR') : 'Indefinido'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">ášltima renovaá§á£o</p>
                      <p className="text-sm text-green-700">
                        {status.lastRefresh ? new Date(status.lastRefresh).toLocaleString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                    {status.debug?.access_token && (
                      <div>
                        <p className="text-sm font-medium text-green-800">Token atual</p>
                        <p className="text-sm text-green-700 font-mono">
                          {status.debug.access_token.substring(0, 20)}...
                        </p>
                      </div>
                    )}
                    {status.empresa.nome && (
                      <div>
                        <p className="text-sm font-medium text-green-800">Empresa</p>
                        <p className="text-sm text-green-700">{status.empresa.nome}</p>
                      </div>
                    )}
                    {status.empresa.cnpj && (
                      <div>
                        <p className="text-sm font-medium text-green-800">CNPJ</p>
                        <p className="text-sm text-green-700">{status.empresa.cnpj}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outline"
                    size="sm"
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Renovar Token
                  </Button>
                  
                  <Button 
                    onClick={handleDisconnect}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    Desconectar
                  </Button>
                  
                  <Button 
                    onClick={handleSyncDados}
                    disabled={syncLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {syncLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    ðŸš€ Sync Completo
                  </Button>
                  
                  <Button 
                    onClick={() => setShowSyncResults(!showSyncResults)}
                    disabled={!syncResults}
                    variant="outline"
                    size="sm"
                  >
                    {showSyncResults ? 'Ocultar' : 'Ver'} Resultados
                  </Button>
                  
                  <Button 
                    onClick={() => setShowDebug(!showDebug)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    {showDebug ? 'Ocultar' : 'Ver'} Debug/Cá³digos
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {showConfig && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Configurar Credenciais OAuth 2.0</CardTitle>
            <CardDescription>
              Configure as credenciais da sua aplicaá§á£o ContaAzul
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={config.clientId}
                onChange={(e) => setConfig({...config, clientId: e.target.value})}
                placeholder="Seu Client ID"
              />
            </div>
            
            <div>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={config.clientSecret}
                onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                placeholder="Seu Client Secret"
              />
            </div>
            
            <div>
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <Input
                id="redirectUri"
                value={config.redirectUri}
                onChange={(e) => setConfig({...config, redirectUri: e.target.value})}
                placeholder="https://seu-dominio.com/contaazul-callback"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure estas credenciais no{' '}
                <a 
                  href="https://developers.contaazul.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Gerenciador de Aplicaá§áµes da ContaAzul
                </a>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleConfigure}
                disabled={configuring || !config.clientId || !config.clientSecret || !config.redirectUri}
              >
                {configuring ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Salvar Configuraá§áµes
              </Button>
              <Button 
                onClick={() => setShowConfig(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Debug/Cá³digos Section */}
      {showDebug && status.connected && status.debug && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              Debug - Cá³digos para Testes Locais
            </CardTitle>
            <CardDescription>
              Use estes cá³digos para testes e desenvolvimento local. Mantenha seguro!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">Access Token</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(status.debug?.access_token || '', 'Access Token')}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {status.debug.access_token.substring(0, 50)}...
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">Refresh Token</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(status.debug?.refresh_token || '', 'Refresh Token')}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {status.debug.refresh_token.substring(0, 50)}...
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">Client ID</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(status.debug?.client_id || '', 'Client ID')}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {status.debug.client_id}
                  </p>
                </div>

                {status.debug.authorization_code && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-800">Authorization Code</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(status.debug?.authorization_code || '', 'Authorization Code')}
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 font-mono break-all">
                      {status.debug.authorization_code.substring(0, 50)}...
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2">Ambiente</p>
                  <Badge variant={status.debug.environment === 'desenvolvimento' ? 'destructive' : 'default'}>
                    {status.debug.environment}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Results */}
      {showSyncResults && syncResults && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Resultados da Sincronizaá§á£o de Dados
            </CardTitle>
            <CardDescription>
              Executado em: {new Date(syncResults.timestamp).toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">ðŸ“‚ Categorias</h4>
                <p className="text-2xl font-bold text-blue-900">
                  {syncResults.estatisticas?.categorias_processadas || 0}
                </p>
                <p className="text-sm text-blue-700">processadas</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">ðŸ’° Receitas</h4>
                <p className="text-2xl font-bold text-green-900">
                  {syncResults.estatisticas?.receitas_salvas || 0}
                </p>
                <p className="text-sm text-green-700">salvas</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">ðŸ’¸ Despesas</h4>
                <p className="text-2xl font-bold text-red-900">
                  {syncResults.estatisticas?.despesas_salvas || 0}
                </p>
                <p className="text-sm text-red-700">salvas</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">ðŸ“‹ Competáªncia</h4>
                <p className="text-2xl font-bold text-purple-900">
                  {syncResults.estatisticas?.parcelas_processadas > 0 
                    ? Math.round((syncResults.estatisticas.competencias_encontradas / syncResults.estatisticas.parcelas_processadas) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-purple-700">
                  {syncResults.estatisticas?.competencias_encontradas || 0}/{syncResults.estatisticas?.parcelas_processadas || 0} real
                </p>
              </div>
            </div>

            {syncResults.problemas_corrigidos && syncResults.problemas_corrigidos.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">œ… Melhorias Aplicadas:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {syncResults.problemas_corrigidos.map((problema: string, index: number) => (
                    <li key={index}>€¢ {problema}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
