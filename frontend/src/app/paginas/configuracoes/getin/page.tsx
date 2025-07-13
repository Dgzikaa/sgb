'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StandardPageLayout } from '@/components/layouts'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { 
  Settings, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react'

export default function GetInConfigPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    auto_sync: true,
    sync_interval: 30
  })
  const [isLoading, setIsLoading] = useState(false)
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticated' | 'error'>('idle')
  const [authData, setAuthData] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testResults, setTestResults] = useState<any>(null)

  // Verificar se já existe autenticação
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/getin/auth?bar_id=3')
      const data = await response.json()
      
      if (data.success) {
        setAuthStatus('authenticated')
        setAuthData(data.data)
      } else {
        setAuthStatus('error')
      }
    } catch (error) {
      setAuthStatus('error')
    }
  }

  const handleAuth = async () => {
    if (!credentials.email || !credentials.password) {
      setMessage({ type: 'error', text: 'Email e senha são obrigatórios' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/getin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          bar_id: 3
        })
      })

      const data = await response.json()

      if (data.success) {
        setAuthStatus('authenticated')
        setAuthData(data.data)
        setMessage({ type: 'success', text: 'Autenticação realizada com sucesso!' })
        
        // Limpar senha por segurança
        setCredentials(prev => ({ ...prev, password: '' }))
      } else {
        setAuthStatus('error')
        setMessage({ type: 'error', text: data.error || 'Erro na autenticação' })
      }
    } catch (error) {
      setAuthStatus('error')
      setMessage({ type: 'error', text: 'Erro interno. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setTestResults(null)

    try {
      const response = await fetch('/api/getin/reservas?bar_id=3&start_date=2025-01-10&end_date=2025-01-20')
      const data = await response.json()

      if (data.success) {
        setTestResults({
          success: true,
          total: data.total,
          reservas: data.data.slice(0, 3), // Mostrar apenas 3 reservas como exemplo
          unit: data.unit
        })
        setMessage({ type: 'success', text: `Conexão OK! Encontradas ${data.total} reservas` })
      } else {
        setTestResults({
          success: false,
          error: data.error
        })
        setMessage({ type: 'error', text: data.error || 'Erro ao testar conexão' })
      }
    } catch (error) {
      setTestResults({
        success: false,
        error: 'Erro interno'
      })
      setMessage({ type: 'error', text: 'Erro ao testar conexão' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Desativar credenciais no banco
      await fetch('/api/credenciais', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: 3,
          sistema: 'getin'
        })
      })

      setAuthStatus('idle')
      setAuthData(null)
      setCredentials(prev => ({ ...prev, email: '', password: '' }))
      setMessage({ type: 'success', text: 'Desconectado com sucesso' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao desconectar' })
    }
  }

  return (
    <ProtectedRoute requiredModule="12" errorMessage="sem_permissao_configuracoes">
      <StandardPageLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuração getIn</h1>
              <p className="text-gray-600">
                Configure a integração com o sistema de reservas getIn
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={authStatus === 'authenticated' ? 'default' : 'secondary'}>
                {authStatus === 'authenticated' ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="config" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="test">Teste & Dados</TabsTrigger>
              <TabsTrigger value="sync">Sincronização</TabsTrigger>
            </TabsList>

            {/* Configuração */}
            <TabsContent value="config" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Credenciais de Acesso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {authStatus === 'authenticated' && authData ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-800">Conectado com sucesso!</span>
                        </div>
                        <div className="space-y-2 text-sm text-green-700">
                          <p><strong>Usuário:</strong> {authData.user?.name || credentials.email}</p>
                          <p><strong>Unidades:</strong> {authData.units?.length || 0}</p>
                          <p><strong>Expira em:</strong> {new Date(authData.expires_at).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      {authData.units && authData.units.length > 0 && (
                        <div className="space-y-2">
                          <Label>Unidades Disponíveis:</Label>
                          <div className="space-y-2">
                            {authData.units.map((unit: any) => (
                              <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{unit.name}</p>
                                  <p className="text-sm text-gray-600">ID: {unit.id}</p>
                                </div>
                                <Badge variant="outline">Ativo</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={handleTestConnection} disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Testar Conexão
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                          Desconectar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email getIn</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu-email@exemplo.com"
                          value={credentials.email}
                          onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            value={credentials.password}
                            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button onClick={handleAuth} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
                        Conectar com getIn
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teste & Dados */}
            <TabsContent value="test" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Teste de Conexão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {authStatus === 'authenticated' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Teste a conexão buscando reservas dos últimos 10 dias
                      </p>
                      
                      <Button onClick={handleTestConnection} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Testar Agora
                      </Button>

                      {testResults && (
                        <div className="mt-4 p-4 border rounded-lg">
                          {testResults.success ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">Conexão OK!</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                  <p className="text-2xl font-bold text-blue-600">{testResults.total}</p>
                                  <p className="text-sm text-blue-700">Reservas encontradas</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                  <p className="text-lg font-bold text-green-600">{testResults.unit?.name || 'N/A'}</p>
                                  <p className="text-sm text-green-700">Unidade ativa</p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                  <p className="text-lg font-bold text-purple-600">{testResults.unit?.id || 'N/A'}</p>
                                  <p className="text-sm text-purple-700">ID da unidade</p>
                                </div>
                              </div>

                              {testResults.reservas && testResults.reservas.length > 0 && (
                                <div className="space-y-2">
                                  <Label>Exemplos de Reservas:</Label>
                                  <div className="space-y-2">
                                    {testResults.reservas.map((reserva: any) => (
                                      <div key={reserva.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div>
                                          <p className="font-medium">{reserva.nome_cliente}</p>
                                          <p className="text-sm text-gray-600">{reserva.data_reserva} - {reserva.horario}</p>
                                        </div>
                                        <div className="text-right">
                                          <Badge variant="outline">{reserva.status}</Badge>
                                          <p className="text-sm text-gray-600">{reserva.pessoas} pessoas</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-5 h-5" />
                              <span>Erro: {testResults.error}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Conecte-se primeiro para testar a conexão</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sincronização */}
            <TabsContent value="sync" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Sincronização Automática
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id="auto_sync"
                        checked={credentials.auto_sync}
                        onChange={(e) => setCredentials(prev => ({ ...prev, auto_sync: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="auto_sync">Ativar sincronização automática</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Intervalo de sincronização (minutos)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        value={credentials.sync_interval}
                        onChange={(e) => setCredentials(prev => ({ ...prev, sync_interval: parseInt(e.target.value) }))}
                        className="w-32"
                      />
                      <p className="text-sm text-gray-600">
                        Recomendado: 30 minutos para não sobrecarregar a API
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Como funciona:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Busca reservas automaticamente a cada intervalo definido</li>
                        <li>• Sincroniza apenas reservas dos últimos 30 dias</li>
                        <li>• Atualiza status de reservas existentes</li>
                        <li>• Mantém histórico local para relatórios</li>
                      </ul>
                    </div>

                    <Button disabled={authStatus !== 'authenticated'}>
                      <Settings className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  )
} 