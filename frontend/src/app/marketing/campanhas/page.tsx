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
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
} from 'lucide-react';
import Link from 'next/link';

export default function CampanhasPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Campanhas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gestão de campanhas promocionais e marketing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
              >
                Em Construção
              </Badge>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </div>
          </div>
        </div>

        {/* Status de Construção */}
        <Card className="card-dark mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Construction className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <CardTitle className="card-title-dark">
                  Sistema de Campanhas
                </CardTitle>
                <CardDescription className="card-description-dark">
                  O sistema de gestão de campanhas está sendo desenvolvido e
                  estará disponível em breve
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Lançamento
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
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">
                    Criar Campanha
                  </CardTitle>
                  <CardDescription className="card-description-dark">
                    Crie campanhas promocionais personalizadas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Templates de campanha</li>
                <li>• Segmentação de público</li>
                <li>• Definição de objetivos</li>
                <li>• Orçamento e cronograma</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Segmentação</CardTitle>
                  <CardDescription className="card-description-dark">
                    Defina seu público-alvo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Por demografia</li>
                <li>• Por comportamento</li>
                <li>• Por localização</li>
                <li>• Por interesse</li>
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
                    Acompanhe o desempenho
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Métricas de conversão</li>
                <li>• ROI por campanha</li>
                <li>• Relatórios detalhados</li>
                <li>• A/B testing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Agendamento</CardTitle>
                  <CardDescription className="card-description-dark">
                    Programe suas campanhas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Agendamento automático</li>
                <li>• Calendário de campanhas</li>
                <li>• Lembretes e notificações</li>
                <li>• Otimização de horários</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Canais</CardTitle>
                  <CardDescription className="card-description-dark">
                    Múltiplos canais de marketing
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• WhatsApp Business</li>
                <li>• Email marketing</li>
                <li>• Redes sociais</li>
                <li>• SMS marketing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-dark">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="card-title-dark">Automação</CardTitle>
                  <CardDescription className="card-description-dark">
                    Automatize suas campanhas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Workflows automáticos</li>
                <li>• Gatilhos personalizados</li>
                <li>• Sequências de email</li>
                <li>• Integração com CRM</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Exemplo de Campanhas (Preview) */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold card-title-dark mb-6">
            Preview: Campanhas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-dark">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="card-title-dark">
                      Black Friday
                    </CardTitle>
                    <CardDescription className="card-description-dark">
                      Campanha promocional
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    Ativa
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Início:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      25/11/2024
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Fim:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      30/11/2024
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Orçamento:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      R$ 5.000
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Conversões:
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      1.234
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="card-title-dark">
                      Fidelização
                    </CardTitle>
                    <CardDescription className="card-description-dark">
                      Programa de pontos
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    Pausada
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Início:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      01/12/2024
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Fim:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      31/12/2024
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Orçamento:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      R$ 3.500
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Conversões:
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      567
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Play className="w-4 h-4 mr-1" />
                    Ativar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-dark">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="card-title-dark">Natal</CardTitle>
                    <CardDescription className="card-description-dark">
                      Campanha sazonal
                    </CardDescription>
                  </div>
                  <Badge className="bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300">
                    Rascunho
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Início:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      15/12/2024
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Fim:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      25/12/2024
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Orçamento:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      R$ 7.500
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Não iniciada
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Publicar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Card className="card-dark">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold card-title-dark mb-2">
                Quer ser notificado quando estiver pronto?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Deixe seu email para receber atualizações sobre o lançamento do
                sistema de campanhas
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
