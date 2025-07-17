'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings, 
  Shield, 
  Users, 
  MessageSquare,
  Target,
  CheckSquare,
  FileText,
  Zap,
  BarChart3,
  Smartphone,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react'

interface ConfigSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  route: string
  status: 'active' | 'inactive' | 'warning'
  badge?: string
  color: string
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { setPageTitle } = usePageTitle()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeIntegrations: 0,
    systemHealth: 'good'
  })

  useEffect(() => {
    setPageTitle('š™ï¸ Configuraá§áµes')
    loadSystemStats()
    return () => setPageTitle('')
  }, [setPageTitle])

  const loadSystemStats = async () => {
    try {
      setLoading(true)
      // Simular carregamento de estatá­sticas
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStats({
        totalUsers: 12,
        activeIntegrations: 6,
        systemHealth: 'good'
      })
    } catch (error) {
      console.error('Erro ao carregar estatá­sticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const configSections: ConfigSection[] = [
    {
      id: 'users',
      title: 'Gerenciamento de Usuá¡rios',
      description: 'Gerencie usuá¡rios, permissáµes e controle de acesso',
      icon: <Users className="w-6 h-6" />,
      route: '/configuracoes/usuarios',
      status: 'active',
      badge: `${stats.totalUsers} usuá¡rios`,
      color: 'blue'
    },
    {
      id: 'security', 
      title: 'Seguraná§a',
      description: 'Monitor de seguraná§a, logs e auditoria do sistema',
      icon: <Shield className="w-6 h-6" />,
      route: '/configuracoes/seguranca',
      status: 'active',
      badge: 'Monitorado',
      color: 'green'
    },
    {
      id: 'integrations',
      title: 'Integraá§áµes',
      description: 'Configure Discord, WhatsApp, Meta e outras integraá§áµes',
      icon: <Zap className="w-6 h-6" />,
      route: '/configuracoes/integracoes',
      status: 'active',
      badge: `${stats.activeIntegrations} ativas`,
      color: 'purple'
    },
    {
      id: 'checklists',
      title: 'Checklists',
      description: 'Configure templates, itens e automaá§áµes de checklists',
      icon: <CheckSquare className="w-6 h-6" />,
      route: '/configuracoes/checklists',
      status: 'active',
      badge: 'Configurado',
      color: 'emerald'
    },
    {
      id: 'metas',
      title: 'Metas e KPIs',
      description: 'Defina metas de performance e indicadores de sucesso',
      icon: <Target className="w-6 h-6" />,
      route: '/configuracoes/metas',
      status: 'active',
      badge: 'Ativo',
      color: 'orange'
    },
    {
      id: 'contahub',
      title: 'ContaHub Automá¡tico',
      description: 'Configure coleta automá¡tica de dados financeiros',
      icon: <BarChart3 className="w-6 h-6" />,
      route: '/configuracoes/contahub-automatico',
      status: 'active',
      badge: 'Automá¡tico',
      color: 'cyan'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'inactive':
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      cyan: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
    }
    return colorMap[color] || colorMap.blue
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando configuraá§áµes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Moderno */}
        <div className="relative">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Settings className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Central de Configuraá§áµes</h1>
                  <p className="text-blue-100 mt-1">Gerencie todas as configuraá§áµes do seu sistema</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-blue-200">Status do Sistema</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Usuá¡rios Ativos</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Contas registradas</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Integraá§áµes</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeIntegrations}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Serviá§os conectados</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status Sistema</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">Saudá¡vel</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Todos os serviá§os</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Configuraá§áµes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configSections.map((section) => (
            <Card 
              key={section.id}
              className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
              onClick={() => router.push(section.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getColorClasses(section.color)} text-white transition-all duration-300 group-hover:scale-105`}>
                    {section.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(section.status)}
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs font-medium">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {section.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Clique para configurar
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seá§á£o de Informaá§áµes Adicionais */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Informaá§áµes do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uptime</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitoramento</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">Seg</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Backup Diá¡rio</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">v2.0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Versá£o SGB</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
