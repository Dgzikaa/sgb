'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Clock,
  Zap,
  Brain,
  TrendingUp,
  Lightbulb,
  ExternalLink
} from 'lucide-react'

export default function WindsorPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-modern py-6">
        {/* Header da Seção */}
        <div className="section-header">
          <div>
            <h1 className="section-title">Windsor.AI</h1>
            <p className="section-subtitle">
              Plataforma de analytics e inteligência artificial
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="badge-status pending">Em Construção</Badge>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="card-integration">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-integration bg-gradient-to-br from-orange-500 to-orange-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Windsor.AI - Em Desenvolvimento</CardTitle>
                <CardDescription>
                  Integração com plataforma de analytics avançado e IA
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Funcionalidade em Desenvolvimento</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta integração está sendo desenvolvida e estará disponível em breve.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Funcionalidades Planejadas
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h5 className="font-medium text-gray-900 dark:text-white">Inteligência Artificial</h5>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Análise preditiva e insights automáticos baseados em IA
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h5 className="font-medium text-gray-900 dark:text-white">Analytics Avançado</h5>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Métricas detalhadas e relatórios personalizados
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <h5 className="font-medium text-gray-900 dark:text-white">Automação de Insights</h5>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Descoberta automática de padrões e oportunidades
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h5 className="font-medium text-gray-900 dark:text-white">Relatórios Preditivos</h5>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Previsões de vendas e comportamento do cliente
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cronograma de Desenvolvimento
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">Fase 1 - Configuração Base</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Integração básica com API do Windsor.AI
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">Fase 2 - Analytics</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Implementação de dashboards e relatórios
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">Fase 3 - IA e Automação</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Funcionalidades de inteligência artificial
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="actions-group">
              <Button
                onClick={() => window.open('https://windsor.ai', '_blank')}
                className="action-secondary"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visitar Windsor.AI
              </Button>

              <Button
                disabled
                className="action-primary opacity-50 cursor-not-allowed"
              >
                <Clock className="h-4 w-4 mr-2" />
                Em Breve
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="card-gradient mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="icon-integration bg-gradient-to-br from-blue-500 to-blue-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              Sobre Windsor.AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p className="text-base leading-relaxed">
                Windsor.AI é uma plataforma de analytics avançado que combina inteligência artificial 
                com análise de dados para fornecer insights preditivos e automatizados. A integração 
                permitirá que o SGB aproveite recursos de IA para otimizar operações e melhorar 
                a tomada de decisões.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Benefícios:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Análise preditiva de vendas</li>
                    <li>• Otimização de estoque</li>
                    <li>• Insights de comportamento do cliente</li>
                    <li>• Automação de relatórios</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tecnologias:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Machine Learning</li>
                    <li>• Análise de Big Data</li>
                    <li>• APIs RESTful</li>
                    <li>• Dashboards interativos</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 