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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBar } from '@/contexts/BarContext';
import {
  Database,
  Settings,
  Save,
  TestTube,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  BarChart3,
  Calendar,
  Download,
  Upload,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface ContaHubConfig {
  api_url: string;
  api_key: string;
  company_id: string;
  sync_accounts: boolean;
  sync_transactions: boolean;
  sync_reports: boolean;
  auto_sync: boolean;
  sync_interval: number;
  last_sync?: string;
  status: 'active' | 'inactive' | 'error';
}

export default function ContaHubPage() {
  const { toast } = useToast();
  const { selectedBar } = useBar();
  const [config, setConfig] = useState<ContaHubConfig>({
    api_url: '',
    api_key: '',
    company_id: '',
    sync_accounts: true,
    sync_transactions: true,
    sync_reports: false,
    auto_sync: false,
    sync_interval: 60,
    status: 'inactive',
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!selectedBar?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/configuracoes/integracoes/contahub?bar_id=${selectedBar.id}`);
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
    try {
      setLoading(true);
      const response = await fetch('/api/configuracoes/credenciais/contahub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar?.id,
          config: config,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Configuração do ContaHub salva com sucesso',
        });
        await loadConfig();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração ContaHub:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a configuração do ContaHub',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/configuracoes/integracoes/contahub/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar?.id,
          config: config,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Conexão Testada',
          description: data.success
            ? 'Conexão com ContaHub estabelecida com sucesso'
            : data.error,
        });
      } else {
        throw new Error('Erro no teste');
      }
    } catch (error) {
      console.error('Erro ao testar conexão ContaHub:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível testar a conexão com o ContaHub',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const manualSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/configuracoes/integracoes/contahub/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar?.id,
          config: config,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Sincronização',
          description: data.success
            ? 'Sincronização manual iniciada com sucesso'
            : data.error,
        });
        if (data.success) {
          setConfig(prev => ({ ...prev, last_sync: new Date().toISOString() }));
        }
      } else {
        throw new Error('Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização ContaHub:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a sincronização manual',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="badge-status active">Ativo</Badge>;
      case 'error':
        return <Badge className="badge-status error">Erro</Badge>;
      default:
        return <Badge className="badge-status inactive">Inativo</Badge>;
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
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-modern py-6">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="section-title">ContaHub - Sincronização Contábil</h1>
            <p className="section-subtitle">
              Configure a integração com o ContaHub para sincronização
              automática de dados contábeis
            </p>
          </div>
          <div className="flex items-center gap-4">
            {getStatusIcon(config.status)}
            {getStatusBadge(config.status)}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuração Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credenciais */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="icon-integration bg-gradient-to-br from-blue-500 to-blue-600">
                    <Database className="h-5 w-5" />
                  </div>
                  Credenciais da API
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Configure as credenciais de acesso à API do ContaHub
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="api_url"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      URL da API
                    </Label>
                    <Input
                      id="api_url"
                      value={config.api_url}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          api_url: e.target.value,
                        }))
                      }
                      placeholder="https://api.contahub.com.br"
                      className="input-dark"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="api_key"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        API Key
                      </Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={config.api_key}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            api_key: e.target.value,
                          }))
                        }
                        placeholder="Digite sua API Key"
                        className="input-dark"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="company_id"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Company ID
                      </Label>
                      <Input
                        id="company_id"
                        value={config.company_id}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            company_id: e.target.value,
                          }))
                        }
                        placeholder="Digite o Company ID"
                        className="input-dark"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Sincronização */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="icon-integration bg-gradient-to-br from-green-500 to-green-600">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  Configurações de Sincronização
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Defina quais dados serão sincronizados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Contas
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sincronizar plano de contas e saldos
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.sync_accounts}
                      onCheckedChange={checked =>
                        setConfig(prev => ({ ...prev, sync_accounts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Transações
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sincronizar lançamentos e movimentações
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.sync_transactions}
                      onCheckedChange={checked =>
                        setConfig(prev => ({
                          ...prev,
                          sync_transactions: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Relatórios
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sincronizar relatórios contábeis
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.sync_reports}
                      onCheckedChange={checked =>
                        setConfig(prev => ({ ...prev, sync_reports: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Sincronização Automática
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Executar sincronização em intervalos regulares
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.auto_sync}
                      onCheckedChange={checked =>
                        setConfig(prev => ({ ...prev, auto_sync: checked }))
                      }
                    />
                  </div>

                  {config.auto_sync && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="sync_interval"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Intervalo de Sincronização (minutos)
                      </Label>
                      <Input
                        id="sync_interval"
                        type="number"
                        value={config.sync_interval}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            sync_interval: parseInt(e.target.value) || 60,
                          }))
                        }
                        min="15"
                        max="1440"
                        className="input-dark"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Intervalo em minutos (mínimo: 15, máximo: 1440)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status e Ações */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Ações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={saveConfig}
                  disabled={loading}
                  className="w-full btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Configuração'}
                </Button>

                <Button
                  onClick={testConnection}
                  disabled={testing || !config.api_key}
                  variant="outline"
                  className="w-full"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </Button>

                <Button
                  onClick={manualSync}
                  disabled={syncing || config.status !== 'active'}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {syncing ? 'Sincronizando...' : 'Sincronização Manual'}
                </Button>

                <Button
                  onClick={() =>
                    window.open('https://contahub.com.br', '_blank')
                  }
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Acessar ContaHub
                </Button>
              </CardContent>
            </Card>

            {/* Informações */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Status
                    </span>
                    {getStatusBadge(config.status)}
                  </div>

                  {config.last_sync && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Última Sincronização
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(config.last_sync).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Sincronização Automática
                    </span>
                    <Badge
                      className={
                        config.auto_sync
                          ? 'badge-status active'
                          : 'badge-status inactive'
                      }
                    >
                      {config.auto_sync ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  {config.auto_sync && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Intervalo
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {config.sync_interval} min
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recursos */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Recursos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronização automática
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Importação de dados
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Relatórios integrados
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentação */}
        <div className="mt-8">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="icon-integration bg-gradient-to-br from-purple-500 to-purple-600">
                  <FileText className="h-5 w-5" />
                </div>
                Como Configurar o ContaHub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-gray-600 dark:text-gray-400">
                <p className="text-base leading-relaxed">
                  O ContaHub é uma plataforma de sincronização contábil que
                  permite integrar dados de diferentes sistemas contábeis. Para
                  configurar a integração, você precisará das credenciais de
                  acesso à API do ContaHub.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Passos para Configuração
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <span className="text-sm">
                          Acesse sua conta no ContaHub e vá para as
                          configurações de API
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <span className="text-sm">
                          Gere uma nova API Key e anote o Company ID
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <span className="text-sm">
                          Configure as opções de sincronização desejadas
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <span className="text-sm">
                          Teste a conexão e inicie a sincronização
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dados Sincronizados
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm">
                          Plano de contas e saldos
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm">Lançamentos contábeis</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm">
                          Relatórios DRE e Balanço
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm">Centros de custo</span>
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
