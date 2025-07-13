'use client'

// ========================================
// 🔧 META API CONFIGURATION COMPONENT
// ========================================
// Componente para configurar Meta API dentro da página de configurações

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  TestTube, 
  Settings, 
  RefreshCw,
  Facebook,
  Instagram,
  Activity
} from 'lucide-react'

interface MetaTestResults {
  access_token_valid: boolean
  user_info: any
  accounts: any[]
  pages: any[]
  instagram_accounts: any[]
  permissions: any[]
  available_endpoints: any[]
  error_details: any
}

interface MetaConfig {
  id: string
  access_token: string
  app_id?: string
  app_secret?: string
  page_id?: string
  page_name?: string
  instagram_account_id?: string
  instagram_username?: string
  ativo: boolean
  criado_em: string
  ultima_verificacao: string
}

export default function MetaAPIConfig() {
  // ========================================
  // 🔧 ESTADOS
  // ========================================
  const [accessToken, setAccessToken] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<MetaTestResults | null>(null)
  const [configs, setConfigs] = useState<MetaConfig[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('configure')

  // ========================================
  // 🚀 CARREGAR CONFIGURAÇÕES EXISTENTES
  // ========================================
  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      const userData = localStorage.getItem('sgb_user')
      if (!userData) {
        console.error('Usuário não logado')
        return
      }

      const response = await fetch('/api/meta/config', {
        headers: {
          'x-user-data': encodeURIComponent(userData)
        }
      })
      
      const data = await response.json()
      if (data.exists && data.config) {
        // Converter a configuração única em array para compatibilidade
        setConfigs([{
          id: data.config.id,
          access_token: data.config.access_token,
          page_name: data.config.facebook_page_name || 'N/A',
          instagram_username: data.config.instagram_username,
          ativo: data.config.ativo,
          criado_em: data.config.created_at,
          ultima_verificacao: data.config.last_tested_at || data.config.updated_at
        }])
      } else {
        setConfigs([])
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  // ========================================
  // 🧪 TESTAR API META
  // ========================================
  const testMetaAPI = async () => {
    if (!accessToken) {
      setMessage({ type: 'error', text: 'Token de acesso é obrigatório' })
      return
    }

    setLoading(true)
    setMessage(null)
    setTestResults(null)

    try {
      const userData = localStorage.getItem('sgb_user')
      if (!userData) {
        setMessage({ type: 'error', text: 'Usuário não logado' })
        return
      }

      const response = await fetch('/api/meta/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(userData)
        },
        body: JSON.stringify({
          access_token: accessToken,
          app_id: appId || null,
          app_secret: appSecret || null,
          test_immediately: true
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Simular test_results para manter compatibilidade
        const testResults: MetaTestResults = {
          access_token_valid: true,
          user_info: { name: 'Meta User' },
          accounts: [],
          pages: data.accounts?.facebook_page_name ? [{ 
            id: data.accounts.facebook_page_id, 
            name: data.accounts.facebook_page_name 
          }] : [],
          instagram_accounts: data.accounts?.instagram_username ? [{
            instagram_account: { 
              username: data.accounts.instagram_username,
              id: data.accounts.instagram_account_id
            },
            page_name: data.accounts.facebook_page_name
          }] : [],
          permissions: [],
          available_endpoints: [],
          error_details: null
        }
        
        setTestResults(testResults)
        setMessage({ 
          type: 'success', 
          text: `Configuração salva! ${data.accounts?.facebook_page_name || 'Token válido'}` 
        })
        loadConfigurations() // Recarregar lista
        setActiveTab('results') // Ir para aba de resultados
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao testar API Meta' })
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // 🔄 TESTAR CONFIGURAÇÃO EXISTENTE
  // ========================================
  const retestExistingConfig = async () => {
    setLoading(true)
    try {
      const userData = localStorage.getItem('sgb_user')
      if (!userData) {
        setMessage({ type: 'error', text: 'Usuário não logado' })
        setLoading(false)
        return
      }

      const response = await fetch('/api/meta/config/test', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(userData)
        }
      })

      const data = await response.json()
      if (data.success) {
        // Simular test_results para manter compatibilidade com a nova API
        const testResults: MetaTestResults = {
          access_token_valid: true,
          user_info: { name: 'Meta User' },
          accounts: [],
          pages: data.accounts?.facebook_page_name ? [{ 
            id: data.accounts.facebook_page_id, 
            name: data.accounts.facebook_page_name 
          }] : [],
          instagram_accounts: data.accounts?.instagram_username ? [{
            instagram_account: { 
              username: data.accounts.instagram_username,
              id: data.accounts.instagram_account_id
            },
            page_name: data.accounts.facebook_page_name
          }] : [],
          permissions: [],
          available_endpoints: [],
          error_details: null
        }
        
        setTestResults(testResults)
        setActiveTab('results')
        setMessage({ type: 'success', text: 'Teste realizado com sucesso!' })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao testar configuração' })
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // 🎨 COMPONENTES DE RENDERIZAÇÃO
  // ========================================
  const renderPermissions = () => {
    if (!testResults?.permissions?.length) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permissões do Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {testResults.permissions.map((perm: any, index: number) => (
              <Badge 
                key={index} 
                variant={perm.status === 'granted' ? 'default' : 'secondary'}
                className="justify-center"
              >
                {perm.permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPages = () => {
    if (!testResults?.pages?.length) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Páginas Facebook ({testResults.pages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.pages.map((page: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{page.name}</h4>
                    <p className="text-sm text-gray-600">ID: {page.id}</p>
                    <p className="text-sm text-gray-600">Categoria: {page.category}</p>
                  </div>
                  <Badge variant={page.access_token ? 'default' : 'secondary'}>
                    {page.access_token ? 'Acesso OK' : 'Sem Token'}
                  </Badge>
                </div>
                {page.instagram_business_account && (
                  <div className="mt-2 p-2 bg-pink-50 rounded">
                    <p className="text-sm text-pink-800">
                      ✅ Instagram Business conectado
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderInstagramAccounts = () => {
    if (!testResults?.instagram_accounts?.length) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Contas Instagram ({testResults.instagram_accounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.instagram_accounts.map((ig: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">@{ig.instagram_account.username}</h4>
                    <p className="text-sm text-gray-600">{ig.instagram_account.name}</p>
                    <p className="text-sm text-gray-600">
                      👥 {ig.instagram_account.followers_count?.toLocaleString()} seguidores
                    </p>
                    <p className="text-sm text-gray-600">
                      📸 {ig.instagram_account.media_count} posts
                    </p>
                  </div>
                  <Badge variant="default">Conectado</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Vinculado à página: {ig.page_name}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEndpoints = () => {
    if (!testResults?.available_endpoints?.length) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Endpoints Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {testResults.available_endpoints.map((endpoint: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{endpoint.name}</span>
                <div className="flex items-center gap-2">
                  {endpoint.status === 'accessible' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : endpoint.status === 'restricted' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <Badge 
                    variant={
                      endpoint.status === 'accessible' ? 'default' : 
                      endpoint.status === 'restricted' ? 'destructive' : 'secondary'
                    }
                  >
                    {endpoint.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ========================================
  // 🎨 RENDER PRINCIPAL
  // ========================================
  return (
    <div className="space-y-6">
      {/* Banner informativo */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>Apenas administradores podem modificar configurações da Meta.</strong>
          <br />
          Para visualizar as configurações existentes, administradores e usuários financeiros têm acesso.
        </AlertDescription>
      </Alert>

      {/* Mensagens */}
      {message && (
        <Alert className={`${message.type === 'error' ? 'border-red-200' : 'border-green-200'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">🔧 Configurar</TabsTrigger>
          <TabsTrigger value="results">🧪 Resultados</TabsTrigger>
          <TabsTrigger value="existing">📋 Histórico</TabsTrigger>
        </TabsList>

        {/* Tab: Configurar */}
        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Meta API</CardTitle>
              <CardDescription>
                Configure suas credenciais Facebook/Instagram para coleta automática de métricas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-token">Token de Acesso Meta *</Label>
                <div className="flex gap-2">
                  <Input
                    id="access-token"
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Seu token de acesso da Meta API..."
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Token obtido no Facebook Developers para acesso às APIs (válido até setembro 2025)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app-id">App ID (Opcional)</Label>
                  <Input
                    id="app-id"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="ID da aplicação Facebook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-secret">App Secret (Opcional)</Label>
                  <Input
                    id="app-secret"
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="Secret da aplicação Facebook"
                  />
                </div>
              </div>

              <Separator />

              <Button 
                onClick={testMetaAPI} 
                disabled={loading || !accessToken}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando API Meta...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar e Salvar Configuração
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Resultados */}
        <TabsContent value="results" className="space-y-6">
          {testResults ? (
            <>
              {/* Status Geral */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {testResults.access_token_valid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Status do Token Meta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.access_token_valid ? (
                    <div className="space-y-2">
                      <p className="text-green-800">✅ Token válido e funcionando!</p>
                      {testResults.user_info && (
                        <div className="p-3 bg-green-50 rounded">
                          <p className="font-medium">{testResults.user_info.name}</p>
                          <p className="text-sm text-gray-600">ID: {testResults.user_info.id}</p>
                          {testResults.user_info.email && (
                            <p className="text-sm text-gray-600">Email: {testResults.user_info.email}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-800">❌ Token inválido ou com problemas</p>
                      {testResults.error_details && (
                        <div className="p-3 bg-red-50 rounded">
                          <p className="text-sm text-red-800">
                            {JSON.stringify(testResults.error_details, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Componentes de resultado */}
              {renderPermissions()}
              {renderPages()}
              {renderInstagramAccounts()}
              {renderEndpoints()}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <TestTube className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Execute um teste para ver os resultados aqui
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Configurações Existentes */}
        <TabsContent value="existing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Configurações Salvas</h3>
            <Button onClick={retestExistingConfig} variant="outline" disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Testar Configuração Ativa
            </Button>
          </div>

          <div className="space-y-4">
            {configs.length > 0 ? (
              configs.map((config) => (
                <Card key={config.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={config.ativo ? 'default' : 'secondary'}>
                            {config.ativo ? 'ATIVA' : 'INATIVA'}
                          </Badge>
                          {config.page_name && (
                            <Badge variant="outline">{config.page_name}</Badge>
                          )}
                          {config.instagram_username && (
                            <Badge variant="outline">@{config.instagram_username}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Token: {config.access_token}
                        </p>
                        <p className="text-xs text-gray-500">
                          Criada: {new Date(config.criado_em).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Última verificação: {new Date(config.ultima_verificacao).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Nenhuma configuração encontrada. Configure uma nova API Meta.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 