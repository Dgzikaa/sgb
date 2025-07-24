'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target,
  RefreshCw,
  BarChart3,
  Award,
  AlertTriangle,
  Download
} from 'lucide-react';

interface CompetenciaMensal {
  id: number;
  bar_id: number;
  ano: number;
  mes: number;
  nome_mes: string;
  faturamento_total_mes: number;
  faturamento_entrada_mes: number;
  faturamento_bar_mes: number;
  clientes_total_mes: number;
  reservas_totais_mes: number;
  reservas_presentes_mes: number;
  ticket_medio_mes: number;
  cmv_teorico_mes: number;
  cmv_limpo_mes: number;
  meta_faturamento_mes: number;
  meta_clientes_mes: number;
  meta_ticket_medio_mes: number;
  atingimento_faturamento: number;
  atingimento_clientes: number;
  atingimento_ticket: number;
  total_semanas: number;
  melhor_semana: number;
  pior_semana: number;
  variacao_semanal: number;
  crescimento_faturamento: number;
  crescimento_clientes: number;
  crescimento_ticket: number;
  status: string;
  observacoes: string;
  ultima_atualizacao: string;
  criado_em: string;
}

export default function CompetenciaPage() {
  const { setPageTitle } = usePageTitle();
  const [competencias, setCompetencias] = useState<CompetenciaMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [filtroAno, setFiltroAno] = useState<string>('');
  const [filtroMes, setFiltroMes] = useState<string>('');

  const barId = 1; // TODO: Pegar do contexto
  const anosDisponiveis = Array.from(new Set(competencias.map(c => c.ano))).sort((a, b) => b - a);
  const mesesDisponiveis = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const carregarCompetencias = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        bar_id: barId.toString(),
        ...(filtroAno && { ano: filtroAno }),
        ...(filtroMes && { mes: filtroMes })
      });

      const response = await fetch(`/api/desempenho/competencia-mensal?${params}`);
      const data = await response.json();

      if (data.error) {
        alert(`Erro: ${data.error}`);
        return;
      }

      setCompetencias(data.competencias || []);
    } catch {
      alert("Erro ao carregar competências");
    } finally {
      setLoading(false);
    }
  }, [filtroAno, filtroMes]);

  const recalcularCompetencia = async (ano: number, mes: number) => {
    try {
      setRecalculando(true);
          const response = await fetch('/api/desempenho/competencia-mensal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bar_id: barId,
        ano,
        mes
      })
    });

      const data = await response.json();

      if (data.error) {
        alert(`Erro: ${data.error}`);
        return;
      }

      alert("Competência recalculada com sucesso");
      carregarCompetencias();
    } catch {
      alert("Erro ao recalcular competência");
    } finally {
      setRecalculando(false);
    }
  };

  const recalcularTodas = async () => {
    try {
      setRecalculando(true);
          const response = await fetch('/api/desempenho/competencia-mensal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bar_id: barId,
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        recalcular_todos: true
      })
    });

      const data = await response.json();

      if (data.error) {
        alert(`Erro: ${data.error}`);
        return;
      }

      alert("Todas as competências foram recalculadas");
      carregarCompetencias();
    } catch {
      alert("Erro ao recalcular todas as competências");
    } finally {
      setRecalculando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const getStatusColor = (atingimento: number) => {
    if (atingimento >= 100) return 'bg-green-500';
    if (atingimento >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getVariacaoIcon = (valor: number) => {
    if (valor > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (valor < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  useEffect(() => {
    setPageTitle('Competência Mensal');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    carregarCompetencias();
  }, [carregarCompetencias]);

  const competenciaAtual = competencias.find(c => 
    c.ano === new Date().getFullYear() && c.mes === new Date().getMonth() + 1
  );

  const melhorMes = competencias.reduce((best, current) => 
    !best || current.faturamento_total_mes > best.faturamento_total_mes ? current : best
  , null as CompetenciaMensal | null);

  const totalAnual = competencias
    .filter(c => c.ano === new Date().getFullYear())
    .reduce((sum, c) => sum + c.faturamento_total_mes, 0);

  return (
    <div className="space-y-6">
      {/* Informações e Ações */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            Análise agregada dos dados semanais por mês
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={recalcularTodas}
            disabled={recalculando}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculando ? 'animate-spin' : ''}`} />
            Recalcular Todas
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os anos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mes">Mês</Label>
              <Select value={filtroMes} onValueChange={setFiltroMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os meses</SelectItem>
                  {mesesDisponiveis.map((mes, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Anual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totalAnual)}</div>
            <p className="text-xs text-muted-foreground">
              {competencias.filter(c => c.ano === new Date().getFullYear()).length} meses com dados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Mês</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {melhorMes ? melhorMes.nome_mes : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {melhorMes ? formatarMoeda(melhorMes.faturamento_total_mes) : 'Sem dados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mês Atual</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {competenciaAtual ? formatarPercentual(competenciaAtual.atingimento_faturamento) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Atingimento da meta mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competências */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Competências Mensais</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competencias.map((competencia) => (
              <Card key={competencia.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {competencia.nome_mes} {competencia.ano}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {competencia.total_semanas} semanas
                      </p>
                    </div>
                    <Badge variant={competencia.status === 'ativo' ? 'default' : 'secondary'}>
                      {competencia.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Faturamento */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Faturamento Total</span>
                      <span className="font-semibold">
                        {formatarMoeda(competencia.faturamento_total_mes)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Meta</span>
                      <span>{formatarMoeda(competencia.meta_faturamento_mes)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Atingimento</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(competencia.atingimento_faturamento)}`}></div>
                        <span className="text-sm font-medium">
                          {formatarPercentual(competencia.atingimento_faturamento)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clientes */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Clientes
                      </span>
                      <span className="font-semibold">
                        {competencia.clientes_total_mes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ticket Médio</span>
                      <span>{formatarMoeda(competencia.ticket_medio_mes)}</span>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Melhor Semana</span>
                      <span>#{competencia.melhor_semana}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pior Semana</span>
                      <span>#{competencia.pior_semana}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Variação</span>
                      <div className="flex items-center gap-1">
                        {getVariacaoIcon(competencia.variacao_semanal)}
                        <span>{formatarPercentual(competencia.variacao_semanal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => recalcularCompetencia(competencia.ano, competencia.mes)}
                      disabled={recalculando}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${recalculando ? 'animate-spin' : ''}`} />
                      Recalcular
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && competencias.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma competência encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Não há dados de competência para os filtros selecionados
              </p>
              <Button onClick={recalcularTodas} disabled={recalculando}>
                <RefreshCw className={`h-4 w-4 mr-2 ${recalculando ? 'animate-spin' : ''}`} />
                Calcular Competências
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
