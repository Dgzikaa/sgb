'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBar } from '@/contexts/BarContext';
import {
  Webhook,
  TestTube,
  Settings,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface WebhookStatus {
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastTest?: string;
  events: string[];
}

export default function InterWebhookPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBar } = useBar();
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook-inter-banking`;

  useEffect(() => {
    if (selectedBar?.id) {
      loadWebhookStatus();
    }
  }, [selectedBar?.id]);

  const loadWebhookStatus = async () => {
    if (!selectedBar?.id) return;

    try {
      setLoading(true);
      const response = await fetch('/api/configuracoes/credenciais/inter/webhook-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: selectedBar.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setWebhookStatus(data.webhook);
      }
    } catch (error) {
      console.error('Erro ao carregar status do webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    if (!selectedBar?.id) return;

    try {
      setTesting(true);
      const response = await fetch('/api/configuracoes/webhooks/inter-banking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user)),
        },
        body: JSON.stringify({
          evento: 'PIX_RECEBIDO',
          data: {
            txid: 'test_' + Date.now(),
            valor: 10.5,
            pagador: {
              nome: 'Teste Pagador',
              cpf: '123.456.789-00',
            },
          },
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Webhook testado com sucesso!',
          description: 'O webhook está funcionando corretamente.',
        });
      } else {
        const error = await response.json();
        toast({
          title: '❌ Erro no teste do webhook',
          description: error.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erro no teste do webhook',
        description: 'Erro de conexão ou servidor',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({
        title: '✅ URL copiada!',
        description: 'Webhook URL copiada para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: '❌ Erro ao copiar',
        description: 'Não foi possível copiar a URL.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="badge-status active">Ativo</Badge>;
      case 'inactive':
        return <Badge className="badge-status inactive">Inativo</Badge>;
      case 'error':
        return <Badge className="badge-status error">Erro</Badge>;
      default:
        return <Badge className="badge-status warning">Desconhecido</Badge>;
    }
  };

  if (!selectedBar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container-modern py-6">
          <Card className="card-dark">
            <CardContent className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Selecione um bar para configurar o webhook.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header Moderno */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-2xl">
                  <Webhook className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Webhook Banco Inter
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
                    Configure e teste o webhook para receber notificações do
                    Banco Inter
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
                Configuração
              </Badge>
            </div>
          </div>
        </div>

        {/* Grid Moderno */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Status do Webhook */}
          <Card className="card-modern-advanced">
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="icon-modern">
                  <Webhook className="h-5 w-5 text-white" />
                </div>
                Status do Webhook
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Informações sobre o webhook configurado no Banco Inter
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="loading-modern"></div>
                </div>
              ) : webhookStatus ? (
                <div className="space-y-6">
                  <div className="status-container">
                    <span className="status-label">Status:</span>
                    {getStatusBadge(webhookStatus.status)}
                  </div>

                  {webhookStatus.lastTest && (
                    <div className="status-container">
                      <span className="status-label">Último teste:</span>
                      <span className="status-value">
                        {new Date(webhookStatus.lastTest).toLocaleString(
                          'pt-BR'
                        )}
                      </span>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <span className="status-label mb-3 block">
                      Eventos configurados:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {webhookStatus.events.map((event, index) => (
                        <Badge key={index} className="badge-modern">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="error-state-modern">
                  <div className="error-icon-modern">
                    <AlertCircle className="h-16 w-16 text-yellow-500" />
                  </div>
                  <p className="error-text-modern">
                    Webhook não configurado no Banco Inter
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* URL do Webhook */}
          <Card className="card-modern-advanced">
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="icon-modern-blue">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                URL do Webhook
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configure esta URL no painel do Banco Inter
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="space-y-4">
                <Label
                  htmlFor="webhook-url"
                  className="text-gray-900 dark:text-white font-medium"
                >
                  URL do Webhook
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="input-modern"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyWebhookUrl}
                    title="Copiar URL"
                    className="btn-gradient-copy"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={testWebhook}
                  disabled={testing}
                  className="btn-gradient-primary"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Webhook
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      'https://cdpj.partners.bancointer.com.br/',
                      '_blank'
                    )
                  }
                  className="btn-gradient-secondary"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Painel Inter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card className="card-modern-advanced">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                📋 Como Configurar
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Siga estes passos para configurar o webhook no Banco Inter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Acesse o Painel do Inter
                    </p>
                    <p>Acesse o painel de desenvolvedores do Banco Inter</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Configure o Webhook
                    </p>
                    <p>
                      Adicione a URL do webhook e selecione os eventos desejados
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Teste a Configuração
                    </p>
                    <p>
                      Use o botão &quot;Testar Webhook&quot; para verificar se
                      está funcionando
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Pronto!
                    </p>
                    <p>O webhook está configurado e funcionando</p>
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
