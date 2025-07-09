'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useBarContext } from '@/contexts/BarContext';
import { Loader2, Settings, Shield, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ContaAzulStatus {
  connected: boolean;
  configured: boolean;
  tokenExpired: boolean;
  expiresAt: string;
  empresa: {
    id: string;
    nome: string;
    cnpj: string;
  };
  lastRefresh: string;
  refreshCount: number;
}

export default function ContaAzulOAuth() {
  // Force rebuild - timestamp
  const { toast } = useToast();
  const { selectedBar } = useBarContext();
  
  const [status, setStatus] = useState<ContaAzulStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [fixingUri, setFixingUri] = useState(false);
  
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: 'https://sgb-contaazul.vercel.app/contaazul-callback',
    ambiente: 'producao'
  });

  useEffect(() => {
    if (selectedBar) {
      loadStatus();
    }
  }, [selectedBar]);

  const loadStatus = async () => {
    if (!selectedBar) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/contaazul/auth?action=status&barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar status');
      }
      
      setStatus(data);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    if (!selectedBar) return;
    
    setConfiguring(true);
    try {
      const response = await fetch('/api/contaazul/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'configure',
          barId: selectedBar.id,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao configurar credenciais');
      }
      
      toast({
        title: "Sucesso",
        description: "Credenciais configuradas com sucesso"
      });
      setShowConfig(false);
      loadStatus();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao configurar credenciais",
        variant: "destructive"
      });
    } finally {
      setConfiguring(false);
    }
  };

  const handleAuthorize = async () => {
    if (!selectedBar) return;
    
    setLoading(true);
    try {
      // Armazenar temporariamente o barId para uso no callback
      localStorage.setItem('contaazul_bar_id', selectedBar.id.toString());
      
      const response = await fetch(`/api/contaazul/auth?action=authorize&barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar autorização');
      }
      
      // Redirecionar para a página de autorização da ContaAzul
      window.location.href = data.authUrl;
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao iniciar autorização",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedBar) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/contaazul/auth?action=refresh&barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao renovar token');
      }
      
      toast({
        title: "Sucesso",
        description: "Token renovado com sucesso"
      });
      loadStatus();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao renovar token",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedBar) return;
    
    setTestingConnection(true);
    try {
      const response = await fetch(`/api/contaazul/auth?action=test&barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Conexão testada com sucesso!"
        });
        // Recarregar status para atualizar informações da empresa
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao testar conexão",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar conexão",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedBar) return;
    
    if (!confirm('Tem certeza que deseja desconectar a integração com ContaAzul?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/contaazul/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
          barId: selectedBar.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Integração desconectada com sucesso"
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao desconectar integração",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desconectar integração",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEndpoints = async () => {
    if (!selectedBar) return;
    
    setTestingConnection(true);
    try {
      const response = await fetch(`/api/contaazul/test-endpoints?barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('📊 Resultados dos testes de endpoints:', data);
        const { summary, results } = data;
        
        toast({
          title: "Teste de Endpoints Concluído",
          description: `${summary.successful}/${summary.total} endpoints funcionando. Veja o console para detalhes.`
        });
        
        // Opcional: mostrar resultados em modal ou expandir interface
        alert(`
Resultados dos Testes de Endpoints:
✅ Funcionando: ${summary.successful}/${summary.total}
📊 Com dados: ${summary.withData}

Veja o console (F12) para detalhes completos dos endpoints.
        `);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao testar endpoints",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar endpoints financeiros",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestAdvancedEndpoints = async () => {
    if (!selectedBar) return;
    
    setTestingConnection(true);
    try {
      const response = await fetch(`/api/contaazul/test-endpoints-advanced?barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('🚀 Resultados dos testes AVANÇADOS:', data);
        const { summary, recommendations, dateRange, nextSteps } = data;
        
        toast({
          title: "Teste Avançado Concluído",
          description: `${summary.successful}/${summary.total} endpoints funcionando com parâmetros!`
        });
        
        // Mostrar resultados detalhados
        const workingEndpoints = recommendations.workingEndpoints.length;
        const entriesEndpoints = recommendations.forEntradas.length;
        const expensesEndpoints = recommendations.forSaidas.length;
        
        alert(`
🚀 TESTE AVANÇADO COM PARÂMETROS:
📅 Período: ${dateRange.description} (${dateRange.dataInicio} a ${dateRange.dataFim})

✅ Funcionando: ${summary.successful}/${summary.total}
📊 Com dados: ${summary.withData}
💰 Entradas: ${entriesEndpoints} endpoints
💸 Saídas: ${expensesEndpoints} endpoints

${nextSteps.implementVisaoCompetencia ? '🎯 PRONTO para implementar Visão de Competência!' : '⚠️ Precisa de mais testes'}

Veja o console (F12) para detalhes completos!
        `);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao testar endpoints avançados",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar endpoints avançados",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestOfficialDocs = async () => {
    if (!selectedBar) return;
    
    setTestingConnection(true);
    try {
      const response = await fetch(`/api/contaazul/test-official-docs?barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('📋 Resultados dos testes DOCUMENTAÇÃO OFICIAL:', data);
        const { summary, implementation, dateRange, nextStep } = data;
        
        toast({
          title: "Teste Documentação Oficial Concluído",
          description: `${summary.successful}/${summary.total} endpoints da documentação funcionando!`
        });
        
        // Mostrar resultados detalhados
        const workingEndpoints = implementation.workingEndpoints.length;
        const officialWorking = summary.officialWorking;
        const dataFound = summary.dataFound;
        
        alert(`
📋 TESTE BASEADO NA DOCUMENTAÇÃO OFICIAL:
📅 Período: ${dateRange.description} (${dateRange.dataInicio} a ${dateRange.dataFim})

✅ Funcionando: ${summary.successful}/${summary.total}
📊 Endpoints oficiais: ${officialWorking}
💾 Total de dados: ${dataFound} registros

${implementation.canImplementVisaoCompetencia ? '🎯 ' + nextStep : '⚠️ ' + nextStep}

Detalhes completos no console (F12)!
        `);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao testar documentação oficial",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar documentação oficial",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleVerEstruturaDados = async () => {
    if (!selectedBar) return;
    
    setTestingConnection(true);
    try {
      const response = await fetch(`/api/contaazul/ver-dados-estrutura?barId=${selectedBar.id}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('🔍 ESTRUTURA DOS DADOS REAIS:', data);
        const { dados_encontrados, estruturas_mapeadas, analise_implementacao } = data;
        
        toast({
          title: "Estrutura de Dados Mapeada!",
          description: "Dados reais do ContaAzul analisados. Veja o console!"
        });
        
        // Mostrar resumo dos dados encontrados
        const totalReceitas = dados_encontrados.receitas?.total_encontrado || 0;
        const totalDespesas = dados_encontrados.despesas?.total_encontrado || 0;
        const totalCategorias = dados_encontrados.categorias?.total_encontrado || 0;
        const totalContas = dados_encontrados.contas_financeiras?.total_encontrado || 0;
        
        alert(`
🔍 ESTRUTURA DOS DADOS REAIS MAPEADA:
📅 Período: ${data.periodo_pesquisado.descricao}

📊 DADOS ENCONTRADOS:
💰 Receitas: ${totalReceitas} registros
💸 Despesas: ${totalDespesas} registros  
📋 Categorias: ${totalCategorias} itens
🏦 Contas: ${totalContas} contas

🎯 Status: ${analise_implementacao.pronto_para_sincronizar ? 'PRONTO para sincronizar!' : 'Necessário ajustes'}

💡 Próximo passo: ${analise_implementacao.proximo_passo}

🔍 Veja o console (F12) para a estrutura COMPLETA dos dados!
        `);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao mapear estrutura dos dados",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar estrutura dos dados",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSetupDatabase = async () => {
    if (!selectedBar) return;
    
    setTestingConnection(true);
    try {
      const response = await fetch('/api/contaazul/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barId: selectedBar.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('🏗️ SETUP DO BANCO CONCLUÍDO:', data);
        
        toast({
          title: "Banco Configurado!",
          description: `${data.tabelas_criadas.length} tabelas criadas para Visão de Competência`
        });
        
        alert(`
🏗️ SETUP DO BANCO CONCLUÍDO COM SUCESSO!

📋 TABELAS CRIADAS:
${data.tabelas_criadas.map((tabela: string) => `✅ ${tabela}`).join('\n')}

🎯 ESTRUTURA CRIADA:
• contaazul_financeiro → Dados financeiros normalizados
• contaazul_sincronizacao → Controle de sincronizações  
• contaazul_categorias → Cache de categorias
• contaazul_contas_financeiras → Cache de contas

🚀 PRÓXIMOS PASSOS:
${data.proximos_passos.map((passo: string, i: number) => `${i + 1}. ${passo}`).join('\n')}

✅ Agora pode implementar a sincronização dos dados!
        `);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao configurar banco",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao configurar estrutura do banco",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleFixRedirectUri = async () => {
    if (!selectedBar) return;
    
    setFixingUri(true);
    try {
      const response = await fetch(`/api/admin/fix-redirect-uri?barId=${selectedBar.id}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Redirect URI corrigida para: https://sgbv2.vercel.app/contaazul-callback"
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao corrigir redirect URI",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao corrigir redirect URI",
        variant: "destructive"
      });
    } finally {
      setFixingUri(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    
    if (!status) return <XCircle className="w-5 h-5 text-gray-400" />;
    
    if (status.connected) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (status.configured && status.tokenExpired) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    } else if (status.configured) {
      return <Settings className="w-5 h-5 text-blue-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (loading) return 'Carregando...';
    if (!status) return 'Não configurado';
    
    if (status.connected) {
      return 'Conectado e funcionando';
    } else if (status.configured && status.tokenExpired) {
      return 'Token expirado';
    } else if (status.configured) {
      return 'Configurado - autorização necessária';
    } else {
      return 'Não configurado';
    }
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="outline">Carregando...</Badge>;
    if (!status) return <Badge variant="outline">Não Configurado</Badge>;
    
    if (status.connected) {
      return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
    } else if (status.configured && status.tokenExpired) {
      return <Badge variant="destructive">Token Expirado</Badge>;
    } else if (status.configured) {
      return <Badge variant="secondary">Configurado</Badge>;
    } else {
      return <Badge variant="outline">Não Configurado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CA</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ContaAzul OAuth 2.0</h3>
              <p className="text-sm text-gray-600">Integração financeira e fiscal</p>
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Status da Integração</Label>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm text-gray-600">{getStatusText()}</span>
              </div>
            </div>
            
            {status?.expiresAt && (
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Token Expira Em</Label>
                <p className="text-sm text-gray-600">
                  {new Date(status.expiresAt).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
            
            {status?.empresa?.nome && (
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Empresa Conectada</Label>
                <p className="text-sm text-gray-600">
                  {status.empresa.nome}
                </p>
                <p className="text-xs text-gray-500">
                  CNPJ: {status.empresa.cnpj}
                </p>
              </div>
            )}
            
            {status?.lastRefresh && (
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Último Refresh</Label>
                <p className="text-sm text-gray-600">
                  {new Date(status.lastRefresh).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-gray-500">
                  {status.refreshCount} renovações realizadas
                </p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowConfig(!showConfig)}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showConfig ? 'Ocultar' : 'Configurar'}
            </Button>
            
            {/* Botão temporário para corrigir redirect URI */}
            {status?.configured && !status?.connected && (
              <Button 
                onClick={handleFixRedirectUri}
                disabled={fixingUri}
                variant="outline"
                size="sm"
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
              >
                {fixingUri ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                Corrigir URL
              </Button>
            )}
            
            <Button 
              onClick={handleAuthorize}
              disabled={!status?.configured || loading}
              size="sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Autorizar
            </Button>
            
            {status?.connected && (
              <>
                <Button 
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  variant="outline"
                  size="sm"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Testar
                </Button>
                
                <Button 
                  onClick={handleTestEndpoints}
                  disabled={testingConnection}
                  variant="outline"
                  size="sm"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Testar Endpoints 💰
                </Button>
                
                <Button 
                  onClick={handleTestAdvancedEndpoints}
                  disabled={testingConnection}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Teste Avançado 🚀
                </Button>
                
                <Button 
                  onClick={handleTestOfficialDocs}
                  disabled={testingConnection}
                  variant="outline"
                  size="sm"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  📋 Docs Oficial
                </Button>
                
                <Button 
                  onClick={handleVerEstruturaDados}
                  disabled={testingConnection}
                  variant="outline"
                  size="sm"
                  className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  🔍 Ver Dados
                </Button>
                
                <Button 
                  onClick={handleSetupDatabase}
                  disabled={testingConnection}
                  variant="outline"
                  size="sm"
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  🏗️ Setup Banco
                </Button>
                
                <Button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Renovar
                </Button>
                
                <Button 
                  onClick={handleDisconnect}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  Desconectar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {showConfig && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Configurar Credenciais OAuth 2.0</CardTitle>
            <CardDescription>
              Configure as credenciais da sua aplicação ContaAzul
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={config.clientId}
                onChange={(e) => setConfig({...config, clientId: e.target.value})}
                placeholder="Seu Client ID"
              />
            </div>
            
            <div>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={config.clientSecret}
                onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                placeholder="Seu Client Secret"
              />
            </div>
            
            <div>
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <Input
                id="redirectUri"
                value={config.redirectUri}
                onChange={(e) => setConfig({...config, redirectUri: e.target.value})}
                placeholder="https://seu-dominio.com/contaazul-callback"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure estas credenciais no{' '}
                <a 
                  href="https://developers.contaazul.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Gerenciador de Aplicações da ContaAzul
                </a>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleConfigure}
                disabled={configuring || !config.clientId || !config.clientSecret || !config.redirectUri}
              >
                {configuring ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Salvar Configurações
              </Button>
              <Button 
                onClick={() => setShowConfig(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 