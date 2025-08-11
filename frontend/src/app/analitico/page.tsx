'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import Link from 'next/link'

export default function AnaliticoPage() {
  const cards = [
    {
      title: 'Clientes',
      description: 'Análise de clientes mais recorrentes',
      icon: Users,
      href: '/analitico/clientes',
      color: 'bg-blue-500',
      implemented: true
    },
    {
      title: 'Produtos',
      description: 'Análise de produtos mais vendidos',
      icon: BarChart3,
      href: '/analitico/produtos',
      color: 'bg-green-500',
      implemented: false
    },
    {
      title: 'Vendas',
      description: 'Análise de padrões de vendas',
      icon: TrendingUp,
      href: '/analitico/vendas',
      color: 'bg-purple-500',
      implemented: false
    },
    {
      title: 'Categorias',
      description: 'Análise por categorias de produtos',
      icon: PieChart,
      href: '/analitico/categorias',
      color: 'bg-orange-500',
      implemented: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="card-title-dark">Dashboard Analítico</h1>
              <p className="card-description-dark">
                Análises detalhadas do seu negócio com insights baseados em dados
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => {
              const IconComponent = card.icon
              
              if (card.implemented) {
                return (
                  <Link key={card.title} href={card.href}>
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                            <IconComponent className={`h-6 w-6 text-white`} style={{color: card.color.replace('bg-', '').replace('-500', '')}} />
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Implementado" />
                        </div>
                        <CardTitle className="text-gray-900 dark:text-white">
                          {card.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {card.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                )
              }

              return (
                <Card key={card.title} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700`}>
                        <IconComponent className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Em desenvolvimento" />
                    </div>
                    <CardTitle className="text-gray-500 dark:text-gray-400">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-400 dark:text-gray-500">
                      {card.description}
                    </CardDescription>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      Em desenvolvimento
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Sobre o Dashboard Analítico
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Este dashboard fornece insights detalhados sobre o comportamento dos seus clientes, 
              padrões de vendas e performance dos produtos. Use essas análises para tomar decisões 
              estratégicas baseadas em dados reais do seu negócio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
