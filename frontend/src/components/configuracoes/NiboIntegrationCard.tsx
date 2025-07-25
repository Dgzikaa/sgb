'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useBar } from '@/contexts/BarContext';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Wrench,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Users,
  Calendar,
  Building2,
  Wallet,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface NiboIntegrationData {
  status: string;
  ultima_sincronizacao?: string;
  total_registros?: number;
  erros?: string[];
  configuracao?: Record<string, unknown>;
}

interface NiboIntegrationCardProps {
  selectedBar: unknown;
}

export default function NiboIntegrationCard({
  selectedBar,
}: NiboIntegrationCardProps) {
  const { toast } = useToast();
  const { selectedBar: barContext } = useBar();
  const [niboStatus, setNiboStatus] = useState<NiboIntegrationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form states
  const [apiKey, setApiKey] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  const barId = selectedBar?.id || barContext?.id;

  const loadNiboStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/configuracoes/credenciais/nibo-status?barId=${barId}`
      );
      const data = await response.json();
      setNiboStatus(data);
    } catch (error) {
      console.error('Erro ao carregar status NIBO:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar status da integração NIBO',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [barId, toast]);

  useEffect(() => {
    if (barId) {
      loadNiboStatus();
    }
  }, [loadNiboStatus]);

  const handleConnect = async () => {
    if (!apiKey || !organizationId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setConnecting(true);
      const response = await fetch('/api/configuracoes/credenciais/nibo-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, organizationId, barId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'NIBO conectado com sucesso!',
        });
        setShowConnectDialog(false);
        setApiKey('');
        setOrganizationId('');
        await loadNiboStatus();
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao conectar NIBO',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao conectar NIBO:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno ao conectar NIBO',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/configuracoes/credenciais/nibo-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Sincronização iniciada com sucesso!',
        });
        // Aguardar um pouco e recarregar status
        setTimeout(() => loadNiboStatus(), 2000);
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao sincronizar dados',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao sincronizar NIBO:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno ao sincronizar dados',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (connected: boolean) => {
    if (connected) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Conectado
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          Desconectado
        </Badge>
      );
    }
  };

  const getStatusIcon = (connected: boolean) => {
    if (connected) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">NIBO</CardTitle>
              <CardDescription>Sistema de Gestão Financeira</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Carregando status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">NIBO</CardTitle>
              <CardDescription>Sistema de Gestão Financeira</CardDescription>
            </div>
            <div className="ml-auto">
              {niboStatus && getStatusBadge(niboStatus.status === 'connected')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {niboStatus?.status === 'connected' ? (
            // Status Conectado
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(true)}
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    Conectado
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConnectDialog(true)}
                >
                  Reconfigurar
                </Button>
              </div>

              {/* API Key */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      API Key:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {showApiKey
                        ? niboStatus.configuracao?.apiKeyMasked
                        : '••••••••••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              {niboStatus.configuracao && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {niboStatus.configuracao.stakeholders?.toLocaleString() ||
                        '0'}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">
                      Stakeholders
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <Calendar className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">
                      {niboStatus.configuracao.agendamentos?.toLocaleString() ||
                        '0'}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-300">
                      Lançamentos
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <Building2 className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                      {niboStatus.configuracao.categorias?.toLocaleString() ||
                        '0'}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-300">
                      Categorias
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                    <Users className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
                      {niboStatus.configuracao.usuarios?.toLocaleString() ||
                        '0'}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-300">
                      Usuários
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-center">
                    <Wallet className="h-6 w-6 text-cyan-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-cyan-800 dark:text-cyan-200">
                      {niboStatus.configuracao.contasBancarias?.toLocaleString() ||
                        '0'}
                    </div>
                    <div className="text-xs text-cyan-600 dark:text-cyan-300">
                      Contas
                    </div>
                  </div>
                </div>
              )}

              {/* Última sincronização */}
              {niboStatus.ultima_sincronizacao && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Última sincronização:{' '}
                  {new Date(niboStatus.ultima_sincronizacao).toLocaleString(
                    'pt-BR'
                  )}
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {syncing ? 'Sincronizando...' : 'Sincronizar Dados'}
                </Button>

                <Button
                  onClick={loadNiboStatus}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar Status
                </Button>
              </div>
            </div>
          ) : (
            // Status Desconectado
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(false)}
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Desconectado
                  </span>
                </div>
                <Button
                  onClick={() => setShowConnectDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  Conectar NIBO
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-700">
                <div className="flex items-center gap-4">
                  <Wrench className="h-8 w-8 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Conecte sua conta NIBO
                    </h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      {niboStatus?.message ||
                        'Configure sua API key para começar a sincronizar dados financeiros'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Conexão */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar NIBO</DialogTitle>
            <DialogDescription>
              Configure sua API key e Organization ID do NIBO para sincronizar
              dados financeiros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key NIBO</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Digite sua API key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input
                id="organizationId"
                placeholder="Digite o Organization ID"
                value={organizationId}
                onChange={e => setOrganizationId(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConnectDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                'Conectar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
