'use client'

import Link from 'next/link'
import { Wallet, Tag, Receipt, BarChart3, Plug, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const menuItems = [
  {
    title: 'Contas',
    description: 'Gerencie suas contas bancárias e cartões',
    icon: Wallet,
    href: '/fp/contas',
    color: 'bg-blue-500',
    available: true
  },
  {
    title: 'Categorias',
    description: 'Organize suas transações por categoria',
    icon: Tag,
    href: '/fp/categorias',
    color: 'bg-purple-500',
    available: true
  },
  {
    title: 'Transações',
    description: 'Registre receitas e despesas',
    icon: Receipt,
    href: '/fp/transacoes',
    color: 'bg-green-500',
    available: true
  },
  {
    title: 'Dashboard',
    description: 'Visualize seus dados financeiros',
    icon: BarChart3,
    href: '/fp/dashboard',
    color: 'bg-orange-500',
    available: true
  },
  {
    title: 'Conexões',
    description: 'Conecte suas contas via Open Finance',
    icon: Plug,
    href: '/fp/pluggy',
    color: 'bg-pink-500',
    available: true
  },
]

export default function FinanceiroPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Link href="/home" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-lg">Voltar ao Início</span>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💰 Finanças Pessoais
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Controle completo das suas finanças
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            
            if (!item.available) {
              return (
                <Card key={item.title} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                          {item.title}
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            Em breve
                          </span>
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            }

            return (
              <Link key={item.title} href={item.href}>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-gray-900 dark:text-white">
                        {item.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🚀 Módulo em Desenvolvimento
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            Estamos construindo um sistema completo de controle financeiro pessoal.
            As funcionalidades serão liberadas progressivamente.
          </p>
        </div>
      </div>
    </div>
  )
}
