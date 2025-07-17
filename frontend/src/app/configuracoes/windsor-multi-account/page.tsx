'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Settings, 
  Database, 
  Activity, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Play,
  Stop
} from 'lucide-react'

interface WindsorAccount {
  id: number
  windsor_account_name: string
  windsor_plan: 'basic' | 'standard'
  api_key: string
  webhook_url?: string
  enabled: boolean
  created_at: string
  updated_at: string
}

interface WindsorMapping {
  id: number
  windsor_account_id: number
  company_name: string
  bar_id?: number
  platform: string
  platform_account_id: string
  platform_account_name?: string
  enabled: boolean
  sync_frequency: 'hourly' | 'daily'
  last_sync_at?: string
  created_at: string
  windsor_accounts?: {
    id: number
    windsor_account_name: string
    windsor_plan: string
    enabled: boolean
  }
}

interface WindsorLog {
  id: number
  windsor_account_id?: number
  company_name?: string
  level: 'info' | 'warning' | 'error'
  event_type: string
  platform?: string
  platform_account_id?: string
  message: string
  details: any
  created_at: string
}

export default function WindsorMultiAccountPage() {
  const [accounts, setAccounts] = useState<WindsorAccount[]>([])
  const [mappings, setMappings] = useState<WindsorMapping[]>([])
  const [logs, setLogs] = useState<WindsorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [activeTab, setActiveTab] = useState('accounts')

  // Estados para formulários
  const [newAccount, setNewAccount] = useState({
    windsor_account_name: '',
    windsor_plan: 'basic' as 'basic' | 'standard',
    api_key: '',
    webhook_url: '',
    enabled: true
  })

  const [newMapping, setNewMapping] = useState({
    windsor_account_id: 0,
    company_name: '',
    bar_id: undefined as number | undefined,
    platform: '',
    platform_account_id: '',
    platform_account_name: '',
    enabled: true,
    sync_frequency: 'daily' as 'hourly' | 'daily'
  })

  // Carregar dados
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar contas
      const accountsRes = await fetch('/api/windsor/accounts')
      const accountsData = await accountsRes.json()
      if (accountsData.success) {
        setAccounts(accountsData.data)
      }

      // Carregar mapeamentos
      const mappingsRes = await fetch('/api/windsor/mappings')
      const mappingsData = await mappingsRes.json()
      if (mappingsData.success) {
        setMappings(mappingsData.data)
      }

      // Carregar logs (últimos 50)
      const logsRes = await fetch('/api/windsor/logs-v2?company=menos-e-mais&limit=50')
      const logsData = await logsRes.json()
      if (logsData.success) {
        setLogs(logsData.data.logs)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Salvar conta
  const saveAccount = async () => {
    try {
      const response = await fetch('/api/windsor/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      })

      const data = await response.json()
      if (data.success) {
        setNewAccount({
          windsor_account_name: '',
          windsor_plan: 'basic',
          api_key: '',
          webhook_url: '',
          enabled: true
        })
        loadData()
      }
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
    }
  }

  // Salvar mapeamento
  const saveMapping = async () => {
    try {
      const response = await fetch('/api/windsor/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMapping)
      })

      const data = await response.json()
      if (data.success) {
        setNewMapping({
          windsor_account_id: 0,
          company_name: '',
          bar_id: undefined,
          platform: '',
          platform_account_id: '',
          platform_account_name: '',
          enabled: true,
          sync_frequency: 'daily'
        })
        loadData()
      }
    } catch (error) {
      console.error('Erro ao salvar mapeamento:', error)
    }
  }

  // Coletar dados
  const collectData = async (companyName?: string) => {
    setCollecting(true)
    try {
      const url = companyName 
        ? '/api/windsor/collect-v2'
        : '/api/windsor/collect-v2'
      
      const body = companyName 
        ? { company_name: companyName }
        : {}

      const response = await fetch(url, {
        method: companyName ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: companyName ? JSON.stringify(body) : undefined
      })

      const data = await response.json()
      if (data.success) {
        loadData() // Recarregar dados
      }
    } catch (error) {
      console.error('Erro na coleta:', error)
    } finally {
      setCollecting(false)
    }
  }

  // Toggle conta
  const toggleAccount = async (account: WindsorAccount) => {
    try {
      const response = await fetch('/api/windsor/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          enabled: !account.enabled
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Erro ao toggle conta:', error)
    }
  }

  // Toggle mapeamento
  const toggleMapping = async (mapping: WindsorMapping) => {
    try {
      const response = await fetch('/api/windsor/mappings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mapping.id,
          enabled: !mapping.enabled
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Erro ao toggle mapeamento:', error)
    }
  }

  const platforms = [
    { value: 'facebook_ads', label: 'Facebook Ads' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'google_ads', label: 'Google Ads' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'meta_business', label: 'Meta Business' }
  ]

  const companies = [
    { value: 'menos-e-mais', label: 'Menos é Mais' },
    { value: 'ordinario', label: 'Ordinário' },
    { value: 'deboche', label: 'Deboche' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Carregando configurações Windsor.ai...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="card-title-dark mb-2">Windsor.ai Multi-Account</h1>
          <p className="card-description-dark">
            Gerencie suas contas Windsor.ai e mapeamentos de empresas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="tabs-list-dark">
            <TabsTrigger value="accounts" className="tabs-trigger-dark">
              <Database className="h-4 w-4 mr-2" />
              Contas
            </TabsTrigger>
            <TabsTrigger value="mappings" className="tabs-trigger-dark">
              <Settings className="h-4 w-4 mr-2" />
              Mapeamentos
            </TabsTrigger>
            <TabsTrigger value="collect" className="tabs-trigger-dark">
              <Activity className="h-4 w-4 mr-2" />
              Coleta
            </TabsTrigger>
            <TabsTrigger value="logs" className="tabs-trigger-dark">
              <FileText className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* TAB: CONTAS */}
          <TabsContent value="accounts" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Nova Conta Windsor.ai</CardTitle>
                <CardDescription className="card-description-dark">
                  Configure uma nova conta Windsor.ai
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_name">Nome da Conta</Label>
                    <Input
                      id="account_name"
                      value={newAccount.windsor_account_name}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, windsor_account_name: e.target.value }))}
                      placeholder="ex: menos-e-mais"
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan">Plano</Label>
                    <Select
                      value={newAccount.windsor_plan}
                      onValueChange={(value: 'basic' | 'standard') => 
                        setNewAccount(prev => ({ ...prev, windsor_plan: value }))
                      }
                    >
                      <SelectTrigger className="select-dark">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic ($19/mês)</SelectItem>
                        <SelectItem value="standard">Standard ($99/mês)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={newAccount.api_key}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Sua API key do Windsor.ai"
                      className="input-dark"
                    />
                  </div>
                </div>
                <Button onClick={saveAccount} className="btn-primary-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar Conta
                </Button>
              </CardContent>
            </Card>

            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Contas Configuradas</CardTitle>
                <CardDescription className="card-description-dark">
                  {accounts.length} conta(s) configurada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {account.windsor_account_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Plano: {account.windsor_plan}
                          </p>
                        </div>
                        <Badge variant={account.enabled ? "default" : "secondary"}>
                          {account.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAccount(account)}
                        className="btn-outline-dark"
                      >
                        {account.enabled ? <Stop className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: MAPEAMENTOS */}
          <TabsContent value="mappings" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Novo Mapeamento</CardTitle>
                <CardDescription className="card-description-dark">
                  Configure mapeamento de empresa para plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mapping_account">Conta Windsor.ai</Label>
                    <Select
                      value={newMapping.windsor_account_id.toString()}
                      onValueChange={(value) => 
                        setNewMapping(prev => ({ ...prev, windsor_account_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="select-dark">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.windsor_account_name} ({account.windsor_plan})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mapping_company">Empresa</Label>
                    <Select
                      value={newMapping.company_name}
                      onValueChange={(value) => 
                        setNewMapping(prev => ({ ...prev, company_name: value }))
                      }
                    >
                      <SelectTrigger className="select-dark">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.value} value={company.value}>
                            {company.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mapping_platform">Plataforma</Label>
                    <Select
                      value={newMapping.platform}
                      onValueChange={(value) => 
                        setNewMapping(prev => ({ ...prev, platform: value }))
                      }
                    >
                      <SelectTrigger className="select-dark">
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="platform_account_id">ID da Conta na Plataforma</Label>
                    <Input
                      id="platform_account_id"
                      value={newMapping.platform_account_id}
                      onChange={(e) => setNewMapping(prev => ({ ...prev, platform_account_id: e.target.value }))}
                      placeholder="ex: act_123456789"
                      className="input-dark"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="platform_account_name">Nome da Conta (opcional)</Label>
                    <Input
                      id="platform_account_name"
                      value={newMapping.platform_account_name}
                      onChange={(e) => setNewMapping(prev => ({ ...prev, platform_account_name: e.target.value }))}
                      placeholder="ex: Minha Conta Facebook"
                      className="input-dark"
                    />
                  </div>
                </div>
                <Button onClick={saveMapping} className="btn-primary-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Salvar Mapeamento
                </Button>
              </CardContent>
            </Card>

            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Mapeamentos Configurados</CardTitle>
                <CardDescription className="card-description-dark">
                  {mappings.length} mapeamento(s) configurado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mappings.map((mapping) => (
                    <div key={mapping.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {mapping.company_name} - {mapping.platform}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {mapping.platform_account_name || mapping.platform_account_id}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Conta: {mapping.windsor_accounts?.windsor_account_name} ({mapping.windsor_accounts?.windsor_plan})
                          </p>
                        </div>
                        <Badge variant={mapping.enabled ? "default" : "secondary"}>
                          {mapping.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMapping(mapping)}
                        className="btn-outline-dark"
                      >
                        {mapping.enabled ? <Stop className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: COLETA */}
          <TabsContent value="collect" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Coleta de Dados</CardTitle>
                <CardDescription className="card-description-dark">
                  Execute coletas manuais de dados Windsor.ai
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => collectData()}
                    disabled={collecting}
                    className="btn-primary-dark"
                  >
                    {collecting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    Coletar Todas as Empresas
                  </Button>
                  
                  {companies.map((company) => (
                    <Button
                      key={company.value}
                      onClick={() => collectData(company.value)}
                      disabled={collecting}
                      variant="outline"
                      className="btn-outline-dark"
                    >
                      {collecting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Coletar {company.label}
                    </Button>
                  ))}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A coleta automática é executada diariamente às 9h da manhã.
                    Use esta opção para coletas manuais ou testes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: LOGS */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Logs do Sistema</CardTitle>
                <CardDescription className="card-description-dark">
                  Últimos 50 logs do sistema Windsor.ai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-shrink-0">
                        {log.level === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                        {log.level === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                        {log.level === 'info' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.event_type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {log.message}
                        </p>
                        {log.company_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Empresa: {log.company_name}
                            {log.platform && ` | Plataforma: ${log.platform}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 