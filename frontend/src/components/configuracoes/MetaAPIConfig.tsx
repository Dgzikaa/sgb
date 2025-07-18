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

// ========================================
// Ã°Å¸â€Â§ META API CONFIGURATION COMPONENT
// ========================================
// Componente para configurar Meta API dentro da pÃ¡Â¡gina de configuraÃ¡Â§Ã¡Âµes

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
  access_token_valid: boolean;
  user_info: unknown; // Defina um tipo mais especÃ­fico se possÃ­vel
  accounts: unknown[]; // Defina um tipo mais especÃ­fico se possÃ­vel
  pages: Array<{
    id: string;
    name: string;
    category?: string;
    access_token?: string;
    instagram_business_account?: unknown;
  }>;
  instagram_accounts: Array<{
    instagram_account: {
      username: string;
      id: string;
      name?: string;
      followers_count?: number;
      media_count?: number;
    };
    page_name: string;
  }>;
  permissions: Array<{
    permission: string;
    status: string;
  }>;
  available_endpoints: Array<{
    name: string;
    status: string;
  }>;
  error_details: unknown; // Defina um tipo mais especÃ­fico se possÃ­vel
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
  // Ã°Å¸â€Â§ ESTADOS
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
  // Ã°Å¸Å¡â‚¬ CARREGAR CONFIGURAÃ¡â€¡Ã¡â€¢ES EXISTENTES
  // ========================================
  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      const userData = localStorage.getItem('sgb_user')
      if (!userData) {
        console.error('UsuÃ¡Â¡rio nÃ¡Â£o logado')
        return
      }

      const response = await fetch('/api/meta/config', {
        headers: {
          'x-user-data': encodeURIComponent(userData)
        }
      })
      
      const data = await response.json()
      if (data.exists && data.config) {
        // Converter a configuraÃ¡Â§Ã¡Â£o Ã¡Âºnica em array para compatibilidade
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
      console.error('Erro ao carregar configuraÃ¡Â§Ã¡Âµes:', error)
    }
  }

  // ========================================
  // Ã°Å¸Â§Âª TESTAR API META
  // ========================================
  const testMetaAPI = async () => {
    if (!accessToken) {
      setMessage({ type: 'error', text: 'Token de acesso Ã¡Â© obrigatÃ¡Â³rio' })
      return
    }

    setLoading(true)
    setMessage(null)
    setTestResults(null)

    try {
      const userData = localStorage.getItem('sgb_user')
      if (!userData) {
        setMessage({ type: 'error', text: 'UsuÃ¡Â¡rio nÃ¡Â£o logado' })
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
          text: `ConfiguraÃ¡Â§Ã¡Â£o salva! ${data.accounts?.facebook_page_name || 'Token vÃ¡Â¡lido'}` 
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
  // Ã°Å¸â€â€ž TESTAR CONFIGURAÃ¡â€¡Ã¡Æ’O EXISTENTE
  // ========================================
  const retestExistingConfig = async () => {
    setLoading(true)
    try {
      const userData = localStorage.getItem('sgb_user')
      if (!userData) {
        setMessage({ type: 'error', text: 'UsuÃ¡Â¡rio nÃ¡Â£o logado' })
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
      setMessage({ type: 'error', text: 'Erro ao testar configuraÃ¡Â§Ã¡Â£o' })
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // Ã°Å¸Å½Â¨ COMPONENTES DE RENDERIZAÃ¡â€¡Ã¡Æ’O
  // ========================================
  const renderPermissions = () => {
    if (!testResults?.permissions?.length) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            PermissÃ¡Âµes do Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {testResults.permissions.map((perm, index: number) => (
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
            PÃ¡Â¡ginas Facebook ({testResults.pages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.pages.map((page, index: number) => (
              <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">{page.name}</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      <span className="font-medium">ID:</span> {page.id}
                    </p>
                    {page.category && (
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Categoria:</span> {page.category}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant={page.access_token ? 'default' : 'secondary'}
                    className="bg-blue-600 text-white"
                  >
                    {page.access_token ? 'Acesso OK' : 'Conectado'}
                  </Badge>
                </div>
                {page.instagram_business_account && (
                  <div className="mt-3 p-3 bg-pink-100 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <p className="text-sm text-pink-800 font-medium">
                        Å“â€¦ Instagram Business conectado
                      </p>
                    </div>
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
            {testResults.instagram_accounts.map((ig, index: number) => (
              <div key={index} className="p-4 border border-pink-200 rounded-lg bg-pink-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <h4 className="font-semibold text-pink-900">@{ig.instagram_account.username}</h4>
                    </div>
                    
                    {ig.instagram_account.name && (
                      <p className="text-sm text-pink-800 mb-2 font-medium">{ig.instagram_account.name}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {ig.instagram_account.followers_count && (
                        <div className="p-2 bg-pink-100 rounded border border-pink-200">
                          <p className="text-lg font-bold text-pink-900">
                            {ig.instagram_account.followers_count.toLocaleString()}
                          </p>
                          <p className="text-xs text-pink-700 font-medium">Ã°Å¸â€˜Â¥ Seguidores</p>
                        </div>
                      )}
                      
                      {ig.instagram_account.media_count && (
                        <div className="p-2 bg-pink-100 rounded border border-pink-200">
                          <p className="text-lg font-bold text-pink-900">
                            {ig.instagram_account.media_count}
                          </p>
                          <p className="text-xs text-pink-700 font-medium">Ã°Å¸â€œÂ¸ Posts</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant="default" className="bg-pink-600 text-white">
                    Conectado
                  </Badge>
                </div>
                
                <div className="mt-3 pt-3 border-t border-pink-200">
                  <p className="text-xs text-pink-700">
                    <span className="font-medium">Vinculado Ã¡Â  pÃ¡Â¡gina:</span> {ig.page_name}
                  </p>
                </div>
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
            Endpoints DisponÃ¡Â­veis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {testResults.available_endpoints.map((endpoint, index: number) => (
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
  // Ã°Å¸Å½Â¨ RENDER PRINCIPAL
  // ========================================
  return (
    <div className="space-y-6">
      {/* Banner informativo */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>Apenas administradores podem modificar configuraÃ¡Â§Ã¡Âµes da Meta.</strong>
          <br />
          Para visualizar as configuraÃ¡Â§Ã¡Âµes existentes, administradores e usuÃ¡Â¡rios financeiros tÃ¡Âªm acesso.
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
          <TabsTrigger value="configure">Ã°Å¸â€Â§ Configurar</TabsTrigger>
          <TabsTrigger value="results">Ã°Å¸Â§Âª Resultados</TabsTrigger>
          <TabsTrigger value="existing">Ã°Å¸â€œâ€¹ HistÃ¡Â³rico</TabsTrigger>
        </TabsList>

        {/* Tab: Configurar */}
        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ConfiguraÃ¡Â§Ã¡Â£o Meta API</CardTitle>
              <CardDescription>
                Configure suas credenciais Facebook/Instagram para coleta automÃ¡Â¡tica de mÃ¡Â©tricas
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
                  Token obtido no Facebook Developers para acesso Ã¡Â s APIs (vÃ¡Â¡lido atÃ¡Â© setembro 2025)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app-id">App ID (Opcional)</Label>
                  <Input
                    id="app-id"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="ID da aplicaÃ¡Â§Ã¡Â£o Facebook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-secret">App Secret (Opcional)</Label>
                  <Input
                    id="app-secret"
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="Secret da aplicaÃ¡Â§Ã¡Â£o Facebook"
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
                    Testar e Salvar ConfiguraÃ¡Â§Ã¡Â£o
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-800 font-medium">Token vÃ¡Â¡lido e funcionando!</span>
                      </div>
                      
                      {testResults.user_info && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">InformaÃ¡Â§Ã¡Âµes da Conta</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Nome:</span> {testResults.user_info.name || 'Meta User'}
                            </p>
                            {testResults.user_info.id && (
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">ID:</span> {testResults.user_info.id}
                              </p>
                            )}
                            {testResults.user_info.email && (
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">Email:</span> {testResults.user_info.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <span className="text-red-800 font-medium">Token invÃ¡Â¡lido ou com problemas</span>
                      </div>
                      
                      {testResults.error_details && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-semibold text-red-900 mb-2">Detalhes do Erro</h4>
                          <pre className="text-sm text-red-800 whitespace-pre-wrap">
                            {JSON.stringify(testResults.error_details, null, 2)}
                          </pre>
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

        {/* Tab: ConfiguraÃ¡Â§Ã¡Âµes Existentes */}
        <TabsContent value="existing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">ConfiguraÃ¡Â§Ã¡Âµes Salvas</h3>
            <Button onClick={retestExistingConfig} variant="outline" disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Testar ConfiguraÃ¡Â§Ã¡Â£o Ativa
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
                          Ã¡Å¡ltima verificaÃ¡Â§Ã¡Â£o: {new Date(config.ultima_verificacao).toLocaleString('pt-BR')}
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
                    Nenhuma configuraÃ¡Â§Ã¡Â£o encontrada. Configure uma nova API Meta.
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

