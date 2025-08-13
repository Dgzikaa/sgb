'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBar } from '@/contexts/BarContext';
import {
  MessageSquare,
  Settings,
  TestTube,
  Save,
  Copy,
  ExternalLink,
  CheckCircle,
  Bell,
  Zap,
  Database,
  CreditCard,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface DiscordWebhook {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  webhook_url: string;
  enabled: boolean;
  category: string;
  test_url?: string;
}

export default function DiscordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBar } = useBar();
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const defaultWebhooks: DiscordWebhook[] = [
    {
      id: 'geral',
      name: 'Geral',
      description: 'Notificações gerais do sistema',
      icon: <Bell className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'sistema',
    },
    {
      id: 'inter',
      name: 'Banco Inter',
      description:
        'Todas as notificações do Banco Inter (PIX, boletos, pagamentos)',
      icon: <Zap className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'financeiro',
    },
    {
      id: 'nibo',
      name: 'NIBO',
      description:
        'Todas as notificações do NIBO (sincronização, status, etc.)',
      icon: <CreditCard className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'contabil',
    },
    {
      id: 'checklist',
      name: 'Checklists',
      description: 'Notificações de checklists e tarefas',
      icon: <CheckCircle className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'operacional',
    },
    {
      id: 'contahub',
      name: 'ContaHub',
      description: 'Notificações de sincronização ContaHub',
      icon: <Database className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'integracao',
    },
    {
      id: 'sympla',
      name: 'Sympla',
      description: 'Notificações de eventos e vendas Sympla',
      icon: <Calendar className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'eventos',
    },
    {
      id: 'yuzer',
      name: 'Yuzer',
      description: 'Notificações de eventos e reservas Yuzer',
      icon: <Calendar className="h-5 w-5" />,
      webhook_url: '',
      enabled: true,
      category: 'eventos',
    },
  ];

  const loadWebhooks = useCallback(async () => {
    if (!selectedBar?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/configuracoes/integracoes/discord/webhooks?bar_id=${selectedBar.id}`);
      const data = await response.json();

      if (data.success) {
        setWebhooks(data.webhooks || []);
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao carregar webhooks',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao conectar com o servidor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar?.id, toast]);

  useEffect(() => {
    if (selectedBar?.id) {
      loadWebhooks();
    }
  }, [selectedBar?.id, loadWebhooks]);

  const saveWebhooks = async () => {
    if (!selectedBar?.id) return;

    try {
      setSaving(true);

      // Preparar dados para salvar
      const webhooksToSave = webhooks.map(webhook => ({
        id: webhook.id,
        webhook_url: webhook.webhook_url,
        enabled: webhook.enabled,
        name: webhook.name,
        category: webhook.category,
      }));

      const response = await fetch('/api/configuracoes/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          action: 'save',
          webhooks: webhooksToSave,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Configurações salvas!',
          description: 'Webhooks do Discord configurados com sucesso.',
        });
      } else {
        const error = await response.json();
        toast({
          title: '❌ Erro ao salvar',
          description: error.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erro ao salvar',
        description: 'Erro de conexão ou servidor',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook || !webhook.webhook_url) {
      toast({
        title: '❌ Webhook não configurado',
        description: 'Configure a URL do webhook primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(webhookId);

      const response = await fetch('/api/configuracoes/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhook.webhook_url,
          webhook_type: webhookId,
          bar_id: selectedBar?.id,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Teste realizado!',
          description: `Webhook ${webhook.name} testado com sucesso.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: '❌ Erro no teste',
          description: error.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erro no teste',
        description: 'Erro de conexão ou servidor',
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  };

  const copyWebhookUrl = async (webhookUrl: string) => {
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

  const updateWebhook = (
    webhookId: string,
    field: 'webhook_url' | 'enabled',
    value: string | boolean
  ) => {
    setWebhooks(prev =>
      prev.map(webhook =>
        webhook.id === webhookId ? { ...webhook, [field]: value } : webhook
      )
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sistema':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'financeiro':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'operacional':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'integracao':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'rh':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'eventos':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'analytics':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const categories = [
    { id: 'sistema', name: 'Sistema', icon: <Settings className="h-4 w-4" /> },
    {
      id: 'financeiro',
      name: 'Financeiro',
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: 'operacional',
      name: 'Operacional',
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      id: 'integracao',
      name: 'Integrações',
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: 'contabil',
      name: 'Contábil',
      icon: <CreditCard className="h-4 w-4" />,
    },
    { id: 'eventos', name: 'Eventos', icon: <Calendar className="h-4 w-4" /> },
  ];

  if (!selectedBar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container-modern py-6">
          <Card className="card-dark">
            <CardContent className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Selecione um bar para configurar os webhooks do Discord.
              </p>
            </CardContent>
          </Card>
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
            <button
              onClick={() => router.push('/configuracoes/integracoes')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Integrações
            </button>
            <h1 className="section-title">Discord Webhooks</h1>
            <p className="section-subtitle">
              Configure webhooks do Discord para receber notificações
              automáticas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="badge-status warning">Configuração</Badge>
          </div>
        </div>

        {/* Webhooks */}
        <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
          {webhooks.map(webhook => (
            <Card
              key={webhook.id}
              className="card-dark group hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`icon-integration bg-gradient-to-br ${getCategoryColor(webhook.category)} shadow-lg`}
                    >
                      {webhook.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {webhook.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                        {webhook.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="badge-status inactive text-xs">
                      {categories.find(c => c.id === webhook.category)?.name}
                    </Badge>
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={checked =>
                        updateWebhook(webhook.id, 'enabled', checked)
                      }
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label
                    htmlFor={`webhook-${webhook.id}`}
                    className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    URL do Webhook
                  </Label>
                  <div className="flex gap-4">
                    <Input
                      id={`webhook-${webhook.id}`}
                      value={webhook.webhook_url}
                      onChange={e =>
                        updateWebhook(webhook.id, 'webhook_url', e.target.value)
                      }
                      placeholder="https://discord.com/api/webhooks/..."
                      className="font-mono text-sm flex-1 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-lg"
                    />
                    <Button
                      onClick={() => copyWebhookUrl(webhook.webhook_url)}
                      title="Copiar URL"
                      disabled={!webhook.webhook_url}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-4 rounded-xl"
                    >
                      <Copy className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => testWebhook(webhook.id)}
                      title="Testar webhook"
                      disabled={!webhook.webhook_url || testing === webhook.id}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-4 rounded-xl"
                    >
                      {testing === webhook.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <TestTube className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="mt-12 flex gap-6">
          <Button
            onClick={saveWebhooks}
            disabled={saving}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-3" />
                Salvar Configurações
              </>
            )}
          </Button>

          <Button
            onClick={() =>
              window.open(
                'https://discord.com/developers/applications',
                '_blank'
              )
            }
            className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-lg"
          >
            <ExternalLink className="h-5 w-5 mr-3" />
            Discord Developer Portal
          </Button>
        </div>

        {/* Instruções */}
        <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-2xl mt-12 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <CardTitle className="flex items-center gap-4 text-gray-900 dark:text-white text-xl">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              Como Configurar Webhooks do Discord
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8 text-gray-600 dark:text-gray-400">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      1
                    </div>
                    Criar Webhook no Discord
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Acesse o Discord Developer Portal
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Crie uma nova aplicação
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Vá em &quot;Webhooks&quot;
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Clique em &quot;New Webhook&quot;
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Copie a URL do webhook
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      2
                    </div>
                    Configurar no SGB
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Cole a URL do webhook no campo correspondente
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Ative o webhook usando o switch
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Teste o webhook para verificar se está funcionando
                      </span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-medium">
                        Salve as configurações
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
  );
}
