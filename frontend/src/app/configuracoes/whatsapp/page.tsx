'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  MessageSquare,
  Phone,
  CheckCircle,
  XCircle,
  Send,
  Settings,
  RefreshCw,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string;
  apiKey: string;
  webhookUrl: string;
  status: 'connected' | 'disconnected' | 'error';
  lastMessage?: string;
  messagesCount: number;
}

export default function WhatsAppPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig>({
    enabled: true,
    phoneNumber: '+5511999999999',
    apiKey: 'wapp_key_example_123456789',
    webhookUrl: 'https://api.exemplo.com/webhook/whatsapp',
    status: 'connected',
    lastMessage: '2024-01-15T10:30:00Z',
    messagesCount: 1247,
  });
  const [testMessage, setTestMessage] = useState('');
  const [testNumber, setTestNumber] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Simular carregamento da configuração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aqui você faria a requisição real para a API
      // const response = await fetch('/api/configuracoes/whatsapp/config');
      // const data = await response.json();
      // setConfig(data.config);
      
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Erro ao carregar configurações do WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aqui você faria a requisição real para a API
      // const response = await fetch('/api/configuracoes/whatsapp/config', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config),
      // });
      
      toast({
        title: '✅ Configurações salvas',
        description: 'As configurações do WhatsApp foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui você faria a requisição real para testar a conexão
      // const response = await fetch('/api/configuracoes/whatsapp/test-connection');
      
      setConfig(prev => ({ ...prev, status: 'connected' }));
      
      toast({
        title: '✅ Conexão testada',
        description: 'WhatsApp conectado com sucesso!',
      });
    } catch (error) {
      setConfig(prev => ({ ...prev, status: 'error' }));
      toast({
        title: '❌ Teste falhou',
        description: 'Erro ao conectar com o WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testMessage || !testNumber) {
      toast({
        title: '⚠️ Campos obrigatórios',
        description: 'Preencha o número e a mensagem de teste.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simular envio de mensagem
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aqui você faria a requisição real para enviar a mensagem
      // const response = await fetch('/api/configuracoes/whatsapp/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ number: testNumber, message: testMessage }),
      // });
      
      toast({
        title: '✅ Mensagem enviada',
        description: `Mensagem de teste enviada para ${testNumber}`,
      });
      
      setTestMessage('');
      setTestNumber('');
    } catch (error) {
      toast({
        title: '❌ Erro no envio',
        description: 'Erro ao enviar mensagem de teste',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro de Conexão';
      default:
        return 'Desconhecido';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '📋 Copiado',
      description: 'Texto copiado para a área de transferência',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/configuracoes')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    WhatsApp Business
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configure notificações e mensagens automáticas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge 
                className={`${getStatusColor(config.status)} border text-sm font-medium`}
                variant="outline"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.status)}
                  {getStatusText(config.status)}
                </div>
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuração Básica */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configuração Básica
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Configure as informações básicas da integração WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-white">
                      Ativar WhatsApp
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Habilitar notificações via WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-900 dark:text-white">
                    Número do WhatsApp Business
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={config.phoneNumber}
                      onChange={(e) => setConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+55 11 99999-9999"
                      className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(config.phoneNumber)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-sm font-medium text-gray-900 dark:text-white">
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Sua API Key do WhatsApp Business"
                      className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(config.apiKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl" className="text-sm font-medium text-gray-900 dark:text-white">
                    Webhook URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhookUrl"
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://api.exemplo.com/webhook/whatsapp"
                      className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(config.webhookUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing || !config.enabled}
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Testar Conexão
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teste de Mensagem */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Teste de Mensagem
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Envie uma mensagem de teste para verificar a integração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testNumber" className="text-sm font-medium text-gray-900 dark:text-white">
                    Número de Teste
                  </Label>
                  <Input
                    id="testNumber"
                    type="tel"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testMessage" className="text-sm font-medium text-gray-900 dark:text-white">
                    Mensagem de Teste
                  </Label>
                  <Textarea
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Digite sua mensagem de teste aqui..."
                    rows={3}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <Button
                  onClick={handleSendTestMessage}
                  disabled={!config.enabled || !testMessage || !testNumber}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem de Teste
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas e Status */}
          <div className="space-y-6">
            {/* Status da Conexão */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Status da Conexão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(config.status)}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {getStatusText(config.status)}
                  </div>
                  {config.lastMessage && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Última mensagem: {new Date(config.lastMessage).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {config.messagesCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mensagens Enviadas
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    98.5%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Taxa de Entrega
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentação */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Documentação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open('https://developers.facebook.com/docs/whatsapp', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  API WhatsApp Business
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open('/docs/whatsapp-integration', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Guia de Integração
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
