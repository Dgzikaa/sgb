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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useBar } from '@/contexts/BarContext';
import {
  Smartphone,
  Settings,
  TestTube,
  Save,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  Bell,
} from 'lucide-react';

interface WhatsAppConfig {
  enabled: boolean;
  evolution_api_url: string;
  api_key: string;
  instance_name: string;
  webhook_url: string;
  auto_reply: boolean;
  notifications_enabled: boolean;
}

export default function WhatsAppPage() {
  const { toast } = useToast();
  const { selectedBar } = useBar();
  const [config, setConfig] = useState<WhatsAppConfig>({
    enabled: false,
    evolution_api_url: '',
    api_key: '',
    instance_name: '',
    webhook_url: '',
    auto_reply: false,
    notifications_enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!selectedBar?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/configuracoes/integracoes/whatsapp?bar_id=${selectedBar.id}`);
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao carregar configuração',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
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
      loadConfig();
    }
  }, [selectedBar?.id, loadConfig]);

  const saveConfig = async () => {
    if (!selectedBar?.id) return;

    try {
      setSaving(true);

      const response = await fetch('/api/configuracoes/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          action: 'save',
          config,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Configuração salva!',
          description: 'Configuração do WhatsApp salva com sucesso.',
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

  const testConnection = async () => {
    if (!config.evolution_api_url || !config.api_key) {
      toast({
        title: '❌ Configuração incompleta',
        description: 'Configure a URL da API e a chave antes de testar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(true);

      const response = await fetch('/api/configuracoes/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evolution_api_url: config.evolution_api_url,
          api_key: config.api_key,
          bar_id: selectedBar?.id,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Conexão testada!',
          description: 'Conexão com Evolution API estabelecida com sucesso.',
        });
      } else {
        const error = await response.json();
        toast({
          title: '❌ Erro na conexão',
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
      setTesting(false);
    }
  };

  const copyWebhookUrl = async () => {
    const webhookUrl = `${window.location.origin}/api/configuracoes/whatsapp/webhook`;
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

  if (!selectedBar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container-modern py-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Selecione um bar para configurar o WhatsApp.
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
            <h1 className="section-title">WhatsApp</h1>
            <p className="section-subtitle">
              Configure a integração com WhatsApp via Evolution API
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              className={`badge-status ${config.enabled ? 'active' : 'inactive'}`}
            >
              {config.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>

        {/* Configuração Principal */}
        <Card className="card-integration">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="icon-integration bg-gradient-to-br from-teal-500 to-teal-600">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Configuração Evolution API
                </CardTitle>
                <CardDescription>
                  Configure a conexão com a Evolution API para WhatsApp
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status da Integração */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={checked =>
                    setConfig(prev => ({ ...prev, enabled: checked }))
                  }
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Ativar Integração
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Habilita a integração com WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Configurações da API */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="evolution_api_url">URL da Evolution API</Label>
                <Input
                  id="evolution_api_url"
                  value={config.evolution_api_url}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      evolution_api_url: e.target.value,
                    }))
                  }
                  placeholder="https://sua-evolution-api.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL base da sua instância Evolution API
                </p>
              </div>

              <div>
                <Label htmlFor="api_key">Chave da API</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={config.api_key}
                  onChange={e =>
                    setConfig(prev => ({ ...prev, api_key: e.target.value }))
                  }
                  placeholder="Sua chave da API"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Chave de autenticação da Evolution API
                </p>
              </div>

              <div>
                <Label htmlFor="instance_name">Nome da Instância</Label>
                <Input
                  id="instance_name"
                  value={config.instance_name}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      instance_name: e.target.value,
                    }))
                  }
                  placeholder="sgb-whatsapp"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Nome identificador da instância WhatsApp
                </p>
              </div>
            </div>

            {/* Webhook URL */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Webhook URL
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure esta URL no painel da Evolution API
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyWebhookUrl}
                  className="action-icon"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border font-mono text-sm">
                {`${window.location.origin}/api/configuracoes/whatsapp/webhook`}
              </div>
            </div>

            {/* Configurações Adicionais */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.auto_reply}
                    onCheckedChange={checked =>
                      setConfig(prev => ({ ...prev, auto_reply: checked }))
                    }
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Resposta Automática
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ativa respostas automáticas para mensagens
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.notifications_enabled}
                    onCheckedChange={checked =>
                      setConfig(prev => ({
                        ...prev,
                        notifications_enabled: checked,
                      }))
                    }
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Notificações
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recebe notificações de mensagens no sistema
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="actions-group">
              <Button
                onClick={testConnection}
                disabled={
                  testing || !config.evolution_api_url || !config.api_key
                }
                className="action-secondary"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Testando...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>

              <Button
                onClick={saveConfig}
                disabled={saving}
                className="action-primary"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="card-gradient mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="icon-integration bg-gradient-to-br from-blue-500 to-blue-600">
                <Settings className="h-5 w-5" />
              </div>
              Como Configurar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    1. Evolution API:
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li>• Instale a Evolution API em seu servidor</li>
                    <li>• Configure uma instância WhatsApp</li>
                    <li>• Obtenha a URL da API e chave de acesso</li>
                    <li>• Configure o webhook URL no painel</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    2. SGB:
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li>• Cole a URL da Evolution API</li>
                    <li>• Insira a chave da API</li>
                    <li>• Configure o nome da instância</li>
                    <li>• Teste a conexão</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
