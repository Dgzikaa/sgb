'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/layouts/PageHeader';
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
      <div className="container mx-auto px-6 py-8 space-y-8">
        <PageHeader
          title="Gestão"
          description="Centralize o controle e acompanhamento dos principais indicadores do seu negócio"
        />

        {/* Busca */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar funcionalidades de gestão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-dark"
            />
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCards.map((card, index) => (
            <Card 
              key={index} 
              className="card-dark hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1"
            >
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      {card.title}
                    </CardTitle>
                  </div>
                  {card.badge && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      {card.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {card.description}
                </p>
                <div className="space-y-2 mb-6">
                  {card.features.slice(0, 4).map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {card.features.length > 4 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{card.features.length - 4} mais funcionalidades
                    </div>
                  )}
                </div>
                <Link href={card.href} passHref>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Acessar {card.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma funcionalidade encontrada para &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
