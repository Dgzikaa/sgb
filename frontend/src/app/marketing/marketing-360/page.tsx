'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  TrendingUp,
  Construction,
  Calendar,
  Clock,
  Users,
  BarChart3,
  MessageSquare,
  Smartphone,
  Globe,
  Mail,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

export default function Marketing360Page() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Marketing 360°
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Estratégia completa de marketing digital
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
            >
              Em Construção
            </Badge>
          </div>
        </div>

        {/* Status de Construção */}
        <Card className="card-dark mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Construction className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <CardTitle className="card-title-dark">
                  Página em Desenvolvimento
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Esta funcionalidade está sendo desenvolvida e estará
                  disponível em breve
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Design Finalizado
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Desenvolvimento
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Testes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades Planejadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Campanhas</CardTitle>
                  <CardDescription className="card-description-dark">
                    Gestão de campanhas promocionais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Criação de campanhas personalizadas</li>
                <li>• Segmentação de público</li>
                <li>• Acompanhamento de performance</li>
                <li>• Relatórios detalhados</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">WhatsApp</CardTitle>
                  <CardDescription className="card-description-dark">
                    Marketing via WhatsApp Business
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Envio de mensagens em massa</li>
                <li>• Automação de respostas</li>
                <li>• Integração com CRM</li>
                <li>• Métricas de engajamento</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Analytics</CardTitle>
                  <CardDescription className="card-description-dark">
                    Métricas e análises avançadas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Dashboard em tempo real</li>
                <li>• Análise de conversão</li>
                <li>• ROI por canal</li>
                <li>• Relatórios personalizados</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">
                    Redes Sociais
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Gestão de redes sociais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Agendamento de posts</li>
                <li>• Monitoramento de menções</li>
                <li>• Análise de engajamento</li>
                <li>• Gestão de comentários</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Mail className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">
                    Email Marketing
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Campanhas por email
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Templates personalizados</li>
                <li>• Segmentação de lista</li>
                <li>• A/B testing</li>
                <li>• Métricas de abertura</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Share2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Influencer</CardTitle>
                  <CardDescription className="card-description-dark">
                    Marketing de influenciadores
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Busca de influenciadores</li>
                <li>• Gestão de parcerias</li>
                <li>• Análise de alcance</li>
                <li>• ROI de campanhas</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Card className="card-dark">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold card-title-dark mb-2">
                Quer ser notificado quando estiver pronto?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Deixe seu email para receber atualizações sobre o lançamento
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Notificar-me
                </Button>
                <Link href="/marketing">
                  <Button
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Voltar ao Marketing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
