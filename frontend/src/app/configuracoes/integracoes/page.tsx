'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useBar } from '@/contexts/BarContext';
import { useUser } from '@/contexts/UserContext';
import {
  Building2,
  CreditCard,
  Database,
  Webhook,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  Bell,
  Calendar,
  Users,
  BarChart3,
  Clock,
  Smartphone,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'error' | 'not-configured' | 'pending';
  route: string;
  externalUrl?: string;
  features: string[];
  category: string;
  hasCredentials?: boolean;
  hasWebhook?: boolean;
  webhookCount?: number;
}

export default function IntegracoesPage() {
  const router = useRouter();
  const { selectedBar, isLoading: barLoading, availableBars } = useBar();
  const {
    user,
    loading: userLoading,
    isInitialized: userInitialized,
  } = useUser();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const updateIntegrationsWithStatus = useCallback((statusData: any) => {
    setIntegrations(prevIntegrations =>
      prevIntegrations.map(integration => {
        const status = statusData[integration.id];
        if (status) {
          return {
            ...integration,
            status: status.status,
            hasCredentials: status.hasCredentials,
            hasWebhook: status.hasWebhook,
            webhookCount: status.activeWebhooks || 0,
          };
        }
        return integration;
      })
    );
  }, []);

  const loadIntegrationsStatus = useCallback(async () => {
    try {
      console.log('🔄 Iniciando carregamento de integrações...');
      console.log('👤 Usuário:', user?.nome);
      console.log('🏪 Bar selecionado:', selectedBar?.id);

      setLoading(true);

      // Sempre definir as integrações padrão primeiro
      setDefaultIntegrations();

      console.log('📡 Fazendo requisição para /api/configuracoes/integracoes/status...');
      const response = await fetch('/api/configuracoes/integracoes/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user)),
        },
        body: JSON.stringify({ bar_id: selectedBar?.id }),
      });

      console.log(
        '📊 Status da resposta:',
        response.status,
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        updateIntegrationsWithStatus(data.integrations);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar status das integrações:', error);
      // As integrações padrão já foram definidas acima
    } finally {
      console.log('🏁 Finalizando carregamento...');
      setLoading(false);
    }
  }, [user, selectedBar?.id, updateIntegrationsWithStatus]);

  const setDefaultIntegrations = () => {
    const defaultIntegrations: Integration[] = [
      {
        id: 'inter',
        name: 'Banco Inter',
        description:
          'Integração com o Banco Inter para receber notificações de pagamentos PIX e boletos',
        icon: <Building2 className="h-6 w-6" />,
        status: 'not-configured',
        route: '/configuracoes/integracoes/inter-webhook',
        externalUrl: 'https://cdpj.partners.bancointer.com.br/',
        category: 'financeiro',
        features: [
          'Webhook para PIX recebidos',
          'Webhook para PIX enviados',
          'Webhook para boletos vencidos',
          'Webhook para boletos pagos',
          'Autenticação automática',
        ],
      },
      {
        id: 'discord',
        name: 'Discord',
        description:
          'Configuração de webhooks do Discord para notificações automáticas',
        icon: <MessageSquare className="h-6 w-6" />,
        status: 'not-configured',
        route: '/configuracoes/integracoes/discord',
        externalUrl: 'https://discord.com/developers/applications',
        category: 'notificacoes',
        features: [
          'Webhooks para PIX recebidos',
          'Webhooks para boletos',
          'Notificações de checklists',
          'Alertas do sistema',
          'Relatórios automáticos',
        ],
      },
      {
        id: 'nibo',
        name: 'NIBO',
        description: 'Integração com o NIBO para gestão contábil',
        icon: <CreditCard className="h-6 w-6" />,
        status: 'not-configured',
        route: '/configuracoes/integracoes/nibo',
        category: 'contabil',
        features: [
          'API de dados contábeis',
          'Sincronização de lançamentos',
          'Relatórios contábeis',
        ],
      },
      {
        id: 'contahub',
        name: 'ContaHub',
        description:
          'Integração com o ContaHub para sincronização de dados contábeis',
        icon: <Database className="h-6 w-6" />,
        status: 'not-configured',
        route: '/configuracoes/integracoes/contahub',
        category: 'contabil',
        features: [
          'Sincronização automática',
          'Importação de dados',
          'Relatórios integrados',
        ],
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Integração com WhatsApp via Evolution API',
        icon: <Smartphone className="h-6 w-6" />,
        status: 'not-configured',
        route: '/configuracoes/integracoes/whatsapp',
        category: 'comunicacao',
        features: [
          'Envio de mensagens',
          'Recebimento de mensagens',
          'Automação de respostas',
          'Integração com checklists',
        ],
      },
      {
        id: 'windsor',
        name: 'Windsor.AI',
        description: 'Plataforma de analytics e inteligência artificial',
        icon: <BarChart3 className="h-6 w-6" />,
        status: 'pending',
        route: '/configuracoes/integracoes/windsor',
        category: 'analytics',
        features: [
          'Analytics avançado',
          'Inteligência artificial',
          'Relatórios preditivos',
          'Automação de insights',
        ],
      },
    ];
    setIntegrations(defaultIntegrations);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="badge-status active">Ativo</Badge>;
      case 'inactive':
        return <Badge className="badge-status inactive">Inativo</Badge>;
      case 'error':
        return <Badge className="badge-status error">Erro</Badge>;
      case 'not-configured':
        return <Badge className="badge-status warning">Não Configurado</Badge>;
      case 'pending':
        return <Badge className="badge-status pending">Em Construção</Badge>;
      default:
        return <Badge className="badge-status inactive">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case 'error':
        return (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return (
          <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financeiro':
        return 'from-green-500 to-green-600';
      case 'contabil':
        return 'from-blue-500 to-blue-600';
      case 'notificacoes':
        return 'from-purple-500 to-purple-600';
      case 'comunicacao':
        return 'from-teal-500 to-teal-600';
      case 'analytics':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'financeiro':
        return 'Financeiro';
      case 'contabil':
        return 'Contábil';
      case 'notificacoes':
        return 'Notificações';
      case 'comunicacao':
        return 'Comunicação';
      case 'analytics':
        return 'Analytics';
      default:
        return 'Geral';
    }
  };

  useEffect(() => {
    if (selectedBar?.id && user && !barLoading && !userLoading && userInitialized) {
      loadIntegrationsStatus();
    }
  }, [selectedBar?.id, user, barLoading, userLoading, userInitialized, loadIntegrationsStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container-modern py-6">
          <div className="section-header">
            <div>
              <h1 className="section-title">Integrações</h1>
              <p className="section-subtitle">
                Carregando status das integrações...
              </p>
            </div>
          </div>
          <div className="grid-integrations">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card-integration animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-modern py-6">
        {/* Header da Seção */}
        <div className="section-header">
          <div>
            <h1 className="section-title">Integrações</h1>
            <p className="section-subtitle">
              Gerencie as integrações com serviços externos e APIs
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="badge-status active">
              {integrations.filter(i => i.status === 'active').length} Ativas
            </Badge>
            <Badge className="badge-status warning">
              {integrations.filter(i => i.status === 'not-configured').length}{' '}
              Pendentes
            </Badge>
          </div>
        </div>

        {/* Grid de Integrações */}
        <div className="grid-integrations">
          {integrations.map(integration => (
            <Card
              key={integration.id}
              className="card-integration group hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`icon-integration bg-gradient-to-br ${getCategoryColor(integration.category)} shadow-lg`}
                    >
                      {integration.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {integration.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusIcon(integration.status)}
                        {getStatusBadge(integration.status)}
                        <Badge className="badge-status inactive text-xs">
                          {getCategoryName(integration.category)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                  {integration.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Status Details */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    {integration.hasCredentials && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Credenciais</span>
                      </div>
                    )}
                    {integration.hasWebhook && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Webhook className="h-4 w-4" />
                        <span className="text-sm font-medium">Webhook</span>
                      </div>
                    )}
                    {integration.webhookCount &&
                      integration.webhookCount > 0 && (
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Bell className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {integration.webhookCount} webhooks
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Features List */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Funcionalidades
                  </h4>
                  <ul className="features-list">
                    {integration.features.map((feature, index) => (
                      <li key={index} className="feature-item">
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="actions-group">
                  <Button
                    onClick={() => router.push(integration.route)}
                    className="action-primary shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={integration.status === 'pending'}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {integration.status === 'pending'
                      ? 'Em Breve'
                      : 'Configurar'}
                  </Button>

                  {integration.externalUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        window.open(integration.externalUrl, '_blank')
                      }
                      className="action-icon hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Abrir site externo"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seção de Informações */}
        <div className="mt-12">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="icon-integration bg-gradient-to-br from-purple-500 to-purple-600">
                  <Webhook className="h-5 w-5" />
                </div>
                Sobre Integrações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-gray-600 dark:text-gray-400">
                <p className="text-base leading-relaxed">
                  As integrações permitem conectar o SGB com serviços externos
                  para automatizar processos e sincronizar dados. Cada
                  integração pode ter diferentes níveis de configuração e
                  funcionalidades.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Status das Integrações
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Badge className="badge-status active">Ativo</Badge>
                        <span className="text-sm">
                          Funcionando corretamente
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Badge className="badge-status warning">
                          Não Configurado
                        </Badge>
                        <span className="text-sm">Precisa de configuração</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Badge className="badge-status inactive">Inativo</Badge>
                        <span className="text-sm">Configurado mas inativo</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <Badge className="badge-status error">Erro</Badge>
                        <span className="text-sm">Problema na integração</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Badge className="badge-status pending">
                          Em Construção
                        </Badge>
                        <span className="text-sm">
                          Funcionalidade em desenvolvimento
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Como Configurar
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <span className="text-sm">
                          Clique em &quot;Configurar&quot; na integração
                          desejada
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <span className="text-sm">
                          Siga as instruções específicas de cada serviço
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <span className="text-sm">
                          Teste a integração para verificar se está funcionando
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <span className="text-sm">
                          Monitore o status regularmente
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
