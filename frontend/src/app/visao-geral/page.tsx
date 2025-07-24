'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { 
  Calendar,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  Eye,
  PieChart,
  TrendingUp,
  Target
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
    icon: PieChart,
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
    icon: PieChart,
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
    icon: Activity,
    href: '/visao-geral/metricas-barras',
    status: 'active',
    color: 'pink'
  },
  {
    id: 'instagram-tracking',
    title: 'Instagram Tracking',
    description: 'Análise detalhada e variações diárias do Instagram',
    icon: Users,
    href: '/visao-geral/instagram-tracking',
    status: 'active',
    badge: 'Novo',
    color: 'purple'
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
            <h1 className="card-title-dark text-3xl mb-2">
              Visão Geral
            </h1>
            <p className="card-description-dark text-lg max-w-2xl mx-auto">
              Acesse relatórios detalhados, análises comparativas e insights estratégicos 
              para tomada de decisões baseada em dados
            </p>
          </div>

          {/* Relatórios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visaoGeralItems.map((item) => {
              const IconComponent = item.icon
              return (
                <div key={item.id} className="card-dark hover:shadow-lg transition-shadow duration-300 group">
                  <div className="p-6 pb-3">
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
                    
                    <h3 className="card-title-dark text-lg mb-2">{item.title}</h3>
                    <p className="card-description-dark text-sm">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="px-6 pb-6">
                    <Link href={item.href}>
                      <Button 
                        className="w-full group-hover:translate-x-1 transition-transform duration-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                        variant="outline"
                        disabled={item.status === 'coming_soon'}
                      >
                        <span>Acessar Relatório</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Info */}
          <div className="card-dark p-6">
            <div className="text-center">
              <h3 className="card-title-dark text-lg mb-2">
                📊 Análises Inteligentes
              </h3>
              <p className="card-description-dark max-w-2xl mx-auto">
                Todos os relatórios são atualizados em tempo real e conectados 
                às suas integrações ativas (Windsor.ai, NIBO, WhatsApp). 
                Use os filtros de período para análises customizadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
