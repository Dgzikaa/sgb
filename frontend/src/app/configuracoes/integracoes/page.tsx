'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Settings, 
  CheckCircle, 
  Link, 
  Clock, 
  Shield, 
  AlertCircle,
  Wrench,
  Database,
  Zap,
  Globe,
  MessageSquare,
  Calendar,
  BarChart3,
  CreditCard,
  Building2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import NiboIntegrationCard from '@/components/configuracoes/NiboIntegrationCard'

export default function IntegracoesPage() {
  const router = useRouter()
  const [selectedBar, setSelectedBar] = useState<unknown>(null)
  const [activeTab, setActiveTab] = useState('discord')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBarInfo()
  }, [])

  const loadBarInfo = async () => {
    try {
      const response = await fetch('/api/bars/current')
      const data = await response.json()
      setSelectedBar(data.bar)
    } catch (error) {
      console.error('Erro ao carregar informações do bar:', error)
    } finally {
      setLoading(false)
    }
  }

  const integrations = [
    {
      id: 'discord',
      name: 'Discord',
      description: 'Notificações automáticas',
      icon: MessageSquare,
      color: 'bg-blue-500',
      status: 'active',
      category: 'communication'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Integração Business API',
      icon: MessageSquare,
      color: 'bg-green-500',
      status: 'active',
      category: 'communication'
    },
    {
      id: 'windsor',
      name: 'Windsor.ai',
      description: 'Marketing Analytics & Attribution',
      icon: BarChart3,
      color: 'bg-purple-500',
      status: 'construction',
      category: 'analytics'
    },
    {
      id: 'nibo',
      name: 'NIBO',
      description: 'Gestão Financeira',
      icon: CreditCard,
      color: 'bg-orange-500',
      status: 'construction',
      category: 'finance'
    },
    {
      id: 'getin',
      name: 'GetIn',
      description: 'Gestão de Eventos',
      icon: Calendar,
      color: 'bg-emerald-500',
      status: 'active',
      category: 'events'
    },
    {
      id: 'eventos',
      name: 'Eventos',
      description: 'Sistema de Eventos',
      icon: Calendar,
      color: 'bg-indigo-500',
      status: 'active',
      category: 'events'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativo</Badge>
      case 'construction':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Em Construção</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Inativo</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Desconhecido</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'construction':
        return <Wrench className="h-4 w-4 text-yellow-600" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Integrações</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure todas as integrações do seu estabelecimento</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">Ativas</p>
                  <p className="text-sm text-green-600 dark:text-green-300">4 integrações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Link className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-200">Conectadas</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Discord, WhatsApp</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">Em Construção</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">2 integrações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-800 dark:text-purple-200">Seguras</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">100% protegidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {integrations.map((integration) => (
              <TabsTrigger 
                key={integration.id} 
                value={integration.id}
                className="flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${integration.color}`}></div>
                {integration.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Discord Tab */}
          <TabsContent value="discord" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Discord Webhooks</CardTitle>
                    <CardDescription>Configure notificações automáticas para o Discord</CardDescription>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge('active')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon('active')}
                    <span className="text-green-800 dark:text-green-200 font-medium">Configurado</span>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WhatsApp Business API</CardTitle>
                    <CardDescription>Integração com WhatsApp Business</CardDescription>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge('active')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon('active')}
                    <span className="text-green-800 dark:text-green-200 font-medium">Configurado</span>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Windsor.ai Tab */}
          <TabsContent value="windsor" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Windsor.ai</CardTitle>
                    <CardDescription>Marketing Analytics & Attribution Platform</CardDescription>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge('construction')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-700">
                  <div className="flex items-center gap-4">
                    <Wrench className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Em Construção</h3>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        Integração com Windsor.ai está sendo desenvolvida
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Funcionalidades Planejadas:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Marketing Attribution</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Globe className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Multi-Channel Analytics</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Real-time Data</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Database className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Data Integration</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NIBO Tab */}
          <TabsContent value="nibo" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">NIBO</CardTitle>
                    <CardDescription>Sistema de Gestão Financeira</CardDescription>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge('construction')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-700">
                  <div className="flex items-center gap-4">
                    <Wrench className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Em Construção</h3>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        Integração com NIBO está sendo desenvolvida
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Funcionalidades Planejadas:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Gestão Financeira</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Contabilidade</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Relatórios</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Database className="h-5 w-5 text-orange-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Sincronização</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GetIn Tab */}
          <TabsContent value="getin" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">GetIn</CardTitle>
                    <CardDescription>Gestão de Eventos e Reservas</CardDescription>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge('active')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon('active')}
                    <span className="text-green-800 dark:text-green-200 font-medium">Configurado</span>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eventos Tab */}
          <TabsContent value="eventos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sistema de Eventos</CardTitle>
                    <CardDescription>Gestão interna de eventos</CardDescription>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge('active')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon('active')}
                    <span className="text-green-800 dark:text-green-200 font-medium">Configurado</span>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 
