'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { 
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Target,
  Activity,
  ArrowRight,
  Eye,
  PieChart,
  LineChart
} from 'lucide-react'
import Link from 'next/link'

interface VisaoGeralItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  status: 'active' | 'beta' | 'coming_soon'
  badge?: string
  color: string
}

const visaoGeralItems: VisaoGeralItem[] = [
  {
    id: 'marketing-360',
    title: 'Marketing 360°',
    description: 'Visão completa das campanhas e métricas de marketing digital',
    icon: Target,
    href: '/visao-geral/marketing-360',
    status: 'active',
    badge: 'Popular',
    color: 'purple'
  },
  {
    id: 'financeiro-mensal',
    title: 'Financeiro Mensal',
    description: 'Análise detalhada do desempenho financeiro mensal',
    icon: DollarSign,
    href: '/visao-geral/financeiro-mensal',
    status: 'active',
    color: 'green'
  },
  {
    id: 'comparativo',
    title: 'Análise Comparativa',
    description: 'Compare períodos e identifique tendências de crescimento',
    icon: BarChart3,
    href: '/visao-geral/comparativo',
    status: 'active',
    color: 'blue'
  },
  {
    id: 'metrica-evolucao',
    title: 'Evolução de Métricas',
    description: 'Acompanhe a evolução das principais métricas ao longo do tempo',
    icon: TrendingUp,
    href: '/visao-geral/metrica-evolucao',
    status: 'active',
    color: 'orange'
  },
  {
    id: 'diario',
    title: 'Visão Diária',
    description: 'Análise detalhada do desempenho diário do negócio',
    icon: Calendar,
    href: '/visao-geral/diario',
    status: 'active',
    color: 'cyan'
  },
  {
    id: 'semanal',
    title: 'Relatório Semanal',
    description: 'Consolidado semanal com insights e recomendações',
    icon: Activity,
    href: '/visao-geral/semanal',
    status: 'active',
    color: 'red'
  },
  {
    id: 'garcons',
    title: 'Performance Garçons',
    description: 'Análise de desempenho e produtividade dos garçons',
    icon: Users,
    href: '/visao-geral/garcons',
    status: 'active',
    color: 'indigo'
  },
  {
    id: 'metricas-barras',
    title: 'Métricas em Barras',
    description: 'Visualização em gráficos de barras das principais métricas',
    icon: PieChart,
    href: '/visao-geral/metricas-barras',
    status: 'active',
    color: 'pink'
  }
]

export default function VisaoGeralPage() {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Visão Geral')
    return () => setPageTitle('')
  }, [setPageTitle])

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      cyan: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">Ativo</span>
      case 'beta':
        return <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full">Beta</span>
      case 'coming_soon':
        return <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 px-2 py-1 rounded-full">Em Breve</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Visão Geral
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Acesse relatórios detalhados, análises comparativas e insights estratégicos 
              para tomada de decisões baseada em dados
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Relatórios</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">100%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Funcionais</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">Real-time</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <LineChart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24/7</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monitoramento</p>
              </CardContent>
            </Card>
          </div>

          {/* Relatórios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visaoGeralItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${getColorClasses(item.color)} rounded-xl flex items-center justify-center shadow-md`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(item.status)}
                        {item.badge && (
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <Link href={item.href}>
                      <Button 
                        className="w-full group-hover:translate-x-1 transition-transform duration-200"
                        variant="outline"
                        disabled={item.status === 'coming_soon'}
                      >
                        <span>Acessar Relatório</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Footer Info */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  📊 Análises Inteligentes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Todos os relatórios são atualizados em tempo real e conectados 
                  às suas integrações ativas (ContaAzul, Meta, WhatsApp). 
                  Use os filtros de período para análises customizadas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 