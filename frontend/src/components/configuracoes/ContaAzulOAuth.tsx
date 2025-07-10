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
import { Loader2, Settings, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
  const [processando, setProcessando] = useState(false);
  
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

  const handleColetarDados = async () => {
    if (!selectedBar) {
      console.error('❌ selectedBar não está definido!');
      toast({
        title: "Erro",
        description: "Nenhum bar selecionado. Selecione um bar primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('🚀 selectedBar:', selectedBar);
    console.log('🚀 selectedBar.id:', selectedBar.id);
    
    setProcessando(true);
    try {
      console.log('🚀 Iniciando coleta com detalhes (fluxo correto)...');
      
      const response = await fetch('/api/contaazul/coletar-com-detalhes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bar_id: selectedBar.id,
          // Período amplo para capturar todos os dados históricos
          data_inicio: '2024-01-01',
          data_fim: '2027-01-01'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const resultado = data.resultado;
        const totalProcessados = resultado.receitas.processadas + resultado.despesas.processadas;
        const totalAuxiliares = resultado.dados_auxiliares.categorias + resultado.dados_auxiliares.centros_custo + resultado.dados_auxiliares.contas;
        
        toast({
          title: "✅ Coleta Concluída!",
          description: `${totalProcessados} registros processados (${resultado.receitas.processadas} receitas, ${resultado.despesas.processadas} despesas) + ${totalAuxiliares} dados auxiliares com categoria e centro de custo!`
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao coletar dados",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao coletar dados com detalhes",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  const handleProcessarDados = async () => {
    if (!selectedBar) return;
    
    setProcessando(true);
    try {
      const response = await fetch('/api/contaazul/processar-dados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Dados processados com sucesso! ${data.summary?.total_processado || 0} registros`
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao processar dados",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar dados",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  // NOVOS HANDLERS PARA EDGE FUNCTIONS OTIMIZADAS (MCP)
  const handleColetaRapidaEdgeFunction = async () => {
    if (!selectedBar) {
      toast({
        title: "Erro",
        description: "Nenhum bar selecionado. Selecione um bar primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessando(true);
    try {
      console.log('🚀 Iniciando coleta RÁPIDA via Edge Function...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contaazul-coleta-rapida`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          barId: selectedBar.id,
          competenciaInicio: '2024-01-01',
          competenciaFim: '2027-01-01',
          batchSize: 100
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const stats = data.stats;
        
        toast({
          title: "🚀 Coleta Rápida Concluída!",
          description: `${stats.totalSalvo} parcelas salvas em ${Math.round(stats.tempoExecucao / 1000)}s. Pronto para processamento!`
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro na coleta rápida",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na coleta rápida:', error);
      toast({
        title: "Erro",
        description: "Erro na coleta rápida via Edge Function",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  const handleProcessarParcelasEdgeFunction = async () => {
    if (!selectedBar) return;
    
    setProcessando(true);
    try {
      console.log('🔄 Iniciando processamento via Edge Function...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contaazul-processar-parcelas`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          barId: selectedBar.id,
          batchSize: 50,
          maxBatches: 10
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const stats = data.stats;
        
        toast({
          title: "🔄 Processamento Concluído!",
          description: `${stats.totalSucesso} parcelas processadas, ${stats.totalErro} erros em ${Math.round(stats.tempoExecucao / 1000)}s. ${stats.batchesProcessados} lotes processados.`
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro no processamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro no processamento:', error);
      toast({
        title: "Erro",
        description: "Erro no processamento via Edge Function",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  const handleColetarDadosRaw = async () => {
    if (!selectedBar) {
      toast({
        title: "Erro",
        description: "Nenhum bar selecionado. Selecione um bar primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessando(true);
    try {
      console.log('⚡ Iniciando coleta RAW rápida...');
      
      const response = await fetch('/api/contaazul/coletar-dados-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bar_id: selectedBar.id,
          data_inicio: '2024-01-01',
          data_fim: '2027-01-01'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const resultado = data.resultado;
        const totalRaw = resultado.receitas.total + resultado.despesas.total;
        const totalAuxiliares = resultado.dados_auxiliares.categorias + resultado.dados_auxiliares.centros_custo + resultado.dados_auxiliares.contas;
        
        toast({
          title: "⚡ Coleta RAW Concluída!",
          description: `${totalRaw} parcelas coletadas rapidamente (${resultado.receitas.total} receitas, ${resultado.despesas.total} despesas) + ${totalAuxiliares} dados auxiliares. Tempo: ${Math.round(data.tempo_execucao_ms / 1000)}s`
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao coletar dados RAW",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao coletar dados RAW",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  const handleProcessarDadosRaw = async () => {
    if (!selectedBar) return;
    
    setProcessando(true);
    try {
      console.log('🔄 Iniciando processamento de dados RAW...');
      
      const response = await fetch('/api/contaazul/processar-dados-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          lote_size: 50
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const lote = data.resultado.lote_processado;
        
        toast({
          title: "🔄 Processamento Concluído!",
          description: `${lote.processadas} parcelas processadas com detalhes (${lote.erros} erros). ${lote.processadas > 0 ? 'Execute novamente para próximo lote.' : 'Todos os dados foram processados!'}`
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao processar dados RAW",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar dados RAW",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
    }
  };

  const handleTesteUltraRapido = async () => {
    if (!selectedBar) {
      toast({
        title: "Erro",
        description: "Nenhum bar selecionado. Selecione um bar primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessando(true);
    try {
      console.log('🧪 Iniciando teste ultra-rápido...');
      
      const response = await fetch('/api/contaazul/coletar-dados-teste-rapido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bar_id: selectedBar.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const resultado = data.resultado;
        const totalTeste = resultado.receitas.total + resultado.despesas.total;
        
        toast({
          title: "🧪 Teste Ultra-Rápido Concluído!",
          description: `${totalTeste} parcelas coletadas em ${Math.round(data.tempo_execucao_ms / 1000)}s (${resultado.receitas.total} receitas, ${resultado.despesas.total} despesas). Batch insert funcionou!`
        });
        loadStatus();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro no teste ultra-rápido",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro no teste ultra-rápido",
        variant: "destructive"
      });
    } finally {
      setProcessando(false);
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
                {/* NOVA ABORDAGEM COM EDGE FUNCTIONS - RECOMENDADA */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 w-full">
                  <p className="text-xs text-emerald-700 font-medium mb-2">🚀 NOVA ABORDAGEM - EDGE FUNCTIONS (SEM TIMEOUT)</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleColetaRapidaEdgeFunction}
                      disabled={processando}
                      variant="outline"
                      size="sm"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    >
                      {processando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      🚀 1. Coleta Rápida (Edge)
                    </Button>
                    
                    <Button 
                      onClick={handleProcessarParcelasEdgeFunction}
                      disabled={processando}
                      variant="outline"
                      size="sm"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    >
                      {processando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      🔄 2. Processar Lotes (Edge)
                    </Button>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    Edge Functions do Supabase - 100% sem timeout! Coleta dados brutos → Processa em lotes controlados
                  </p>
                </div>

                {/* ABORDAGEM EM 2 ETAPAS - API ROUTES (PODE DAR TIMEOUT) */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full">
                  <p className="text-xs text-green-700 font-medium mb-2">✅ ABORDAGEM API ROUTES (PODE DAR TIMEOUT)</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleColetarDadosRaw}
                      disabled={processando}
                      variant="outline"
                      size="sm"
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      {processando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      ⚡ 1. Coletar RAW (Rápido)
                    </Button>
                    
                    <Button 
                      onClick={handleTesteUltraRapido}
                      disabled={processando}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      {processando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      🧪 Teste Ultra-Rápido
                    </Button>
                    
                    <Button 
                      onClick={handleProcessarDadosRaw}
                      disabled={processando}
                      variant="outline"
                      size="sm"
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      {processando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      🔄 2. Processar Detalhes
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    API Routes - 1º Coleta dados em 500/página → 2º Processa em lotes (ainda pode dar timeout)
                  </p>
                </div>

                {/* ABORDAGEM ANTIGA - PODE DAR TIMEOUT */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full">
                  <p className="text-xs text-yellow-700 font-medium mb-2">⚠️ ABORDAGEM ANTIGA (PODE DAR TIMEOUT)</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleColetarDados}
                      disabled={processando}
                      variant="outline"
                      size="sm"
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                    >
                      {processando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      📥 Coletar Tudo Junto
                    </Button>
                    
                    <Button 
                      onClick={handleProcessarDados}
                      disabled={processando}
                      variant="outline"
                      size="sm"
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                    >
                      {processando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      🔄 Processar Dados
                    </Button>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Processa tudo em tempo real (750+ chamadas individuais = timeout no Vercel)
                  </p>
                </div>
                
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