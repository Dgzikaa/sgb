'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  Target,
  MessageSquare,
  BarChart3,
  Zap,
  Users,
  Calendar,
  DollarSign,
  Lightbulb,
  Construction,
  Rocket,
} from 'lucide-react';

export default function Marketing360Page() {
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const upcomingFeatures = [
    {
      id: 'campanhas',
      title: 'Gestão de Campanhas',
      description: 'Crie e gerencie campanhas de marketing integradas',
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      status: 'Em desenvolvimento',
      eta: 'Q1 2024',
    },
    {
      id: 'whatsapp',
      title: 'Marketing via WhatsApp',
      description: 'Automação e gestão de campanhas no WhatsApp',
      icon: MessageSquare,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      status: 'Em desenvolvimento',
      eta: 'Q1 2024',
    },
    {
      id: 'analytics',
      title: 'Analytics Avançado',
      description: 'Métricas detalhadas e relatórios de performance',
      icon: BarChart3,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      status: 'Em desenvolvimento',
      eta: 'Q2 2024',
    },
    {
      id: 'automacao',
      title: 'Automação Inteligente',
      description: 'Fluxos automatizados de marketing baseados em IA',
      icon: Zap,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      status: 'Em planejamento',
      eta: 'Q2 2024',
    },
    {
      id: 'audiencia',
      title: 'Segmentação de Audiência',
      description: 'Análise e segmentação avançada de público',
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      status: 'Em planejamento',
      eta: 'Q3 2024',
    },
    {
      id: 'agendamento',
      title: 'Agendamento Inteligente',
      description: 'Agendamento automático de campanhas',
      icon: Calendar,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
      status: 'Em planejamento',
      eta: 'Q3 2024',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em desenvolvimento':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Em planejamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/marketing')}
                  className="text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Marketing 360</h1>
                    <p className="text-pink-100 mt-1">
                      Plataforma completa de marketing em desenvolvimento
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-white/30">
                  <Construction className="w-3 h-3 mr-1" />
                  Em Construção
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Construction className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              Status do Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Construction className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Em Desenvolvimento
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  3 funcionalidades em desenvolvimento ativo
                </p>
              </div>

              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Lightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Em Planejamento
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  3 funcionalidades em fase de planejamento
                </p>
              </div>

              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Lançamento
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Primeira versão em Q1 2024
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Funcionalidades em Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingFeatures.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105 ${
                      selectedFeature === feature.id
                        ? 'border-blue-300 dark:border-blue-600 shadow-lg'
                        : `${feature.borderColor} ${feature.bgColor}`
                    }`}
                    onClick={() => setSelectedFeature(feature.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                        <IconComponent className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <Badge className={getStatusColor(feature.status)}>
                        {feature.status}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        ETA: {feature.eta}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          Em desenvolvimento
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Roadmap de Lançamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Q1 2024 - Lançamento Inicial
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gestão de Campanhas, Marketing via WhatsApp e Analytics Básico
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  Em andamento
                </Badge>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Q2 2024 - Automação
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analytics Avançado e Automação Inteligente
                  </p>
                </div>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                  Planejado
                </Badge>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Q3 2024 - Segmentação
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Segmentação de Audiência e Agendamento Inteligente
                  </p>
                </div>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                  Planejado
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Lightbulb className="w-10 h-10 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Tem uma sugestão?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Estamos sempre abertos a feedback e sugestões para melhorar nossa plataforma de marketing. 
              Entre em contato conosco para compartilhar suas ideias!
            </p>
            <Button
              onClick={() => router.push('/configuracoes')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar Sugestão
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 