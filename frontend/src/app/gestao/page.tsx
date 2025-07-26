'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Target,
  Clock,
  Award,
  Settings,
  CheckCircle,
  Search,
  Activity,
  Star,
  Zap,
  Shield,
} from 'lucide-react';

interface GestaoCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  badge?: string;
  features: string[];
}

const gestaoCards: GestaoCard[] = [
  {
    title: 'Tabela de Desempenho',
    description: 'Acompanhe o desempenho da equipe com métricas detalhadas, rankings e análises de produtividade.',
    icon: TrendingUp,
    href: '/gestao/desempenho',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    badge: 'Novo',
    features: [
      'Métricas de Faturamento',
      'Ticket Médio',
      'CMV e CMO',
      'Clientes Atendidos',
      'Avaliações de Qualidade',
      'Performance de Produtos',
      'Resultados de Marketing',
      'Análise de Investimentos'
    ]
  },
  {
    title: 'Calendário de Eventos',
    description: 'Gerencie eventos, agendamentos e planejamento da equipe com visualização em calendário.',
    icon: Calendar,
    href: '/gestao/calendario',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    badge: 'Em Breve',
    features: [
      'Visualização Mensal e Semanal',
      'CRUD de Eventos',
      'Artistas e Gêneros',
      'Gestão de Reservas',
      'Planejamento Diário',
      'Integração com Metas'
    ]
  },
];

export default function GestaoPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCards = gestaoCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ProtectedRoute requiredModule="gestao">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Gestão
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Centralize o controle e acompanhamento dos principais indicadores do seu negócio.
              </p>
            </div>
          </div>
        </div>

        <Input
          type="text"
          placeholder="Buscar funcionalidades de gestão..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-lg mb-4 sm:mb-6"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredCards.map((card, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
            >
              <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color.split(' ')[1].replace('bg-', 'text-').replace('dark:bg-', 'dark:text-')}`} />
                  <span className="break-words">{card.title}</span>
                </CardTitle>
                {card.badge && (
                  <Badge className={`${card.color} text-xs sm:text-sm`}>{card.badge}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {card.description}
                </p>
                <div className="space-y-2 mb-4">
                  {card.features.slice(0, 4).map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{feature}</span>
                    </div>
                  ))}
                  {card.features.length > 4 && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      +{card.features.length - 4} mais funcionalidades
                    </div>
                  )}
                </div>
                <Link href={card.href} passHref>
                  <Button className="w-full group-hover:bg-primary-dark transition-colors duration-300 text-sm sm:text-base">
                    Acessar {card.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma funcionalidade encontrada para "{searchTerm}".
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Funcionários Ativos
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    12
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Meta Mensal
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    85%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Tempo Médio
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    45min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Score Médio
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    92%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg mt-6 sm:mt-8">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit mx-auto mb-3 sm:mb-4">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Área de Gestão
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Esta seção oferece ferramentas avançadas para administradores
                gerenciarem o desempenho da equipe e o planejamento operacional.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-xs">
                  Admin Only
                </Badge>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 text-xs">
                  Dados em Tempo Real
                </Badge>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-xs">
                  Relatórios Avançados
                </Badge>
                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-xs">
                  Gestão de Equipe
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
