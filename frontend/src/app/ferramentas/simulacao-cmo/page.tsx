'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  Plus,
  Trash2,
  RefreshCcw,
  Save,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Edit,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface Funcionario {
  id: string;
  nome: string;
  tipo_contratacao: 'CLT' | 'PJ';
  vt: number;
  area: string;
  salario: number;
  dias_trabalhados: number;
  adicional_bonus: number;
  aviso_previo: number;
}

interface SimulacaoCMO {
  id?: number;
  bar_id: number;
  mes: number;
  ano: number;
  funcionarios: Funcionario[];
  total_folha: number;
  total_encargos: number;
  total_geral: number;
  observacoes?: string;
  criado_por?: string;
  criado_em?: string;
  atualizado_em?: string;
}

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const AREAS = [
  'Salão',
  'Bar',
  'Cozinha',
  'Administrativo',
  'Gerência',
  'Segurança',
  'Limpeza',
  'Outro'
];

export default function SimulacaoCMOPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mesAtual, setMesAtual] = useState(() => new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(() => new Date().getFullYear());
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [historico, setHistorico] = useState<SimulacaoCMO[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [simulacaoAtualId, setSimulacaoAtualId] = useState<number | undefined>();

  // Calcular encargos de um funcionário CLT
  const calcularEncargosCLT = (salario: number, area: string, diasTrabalhados: number): number => {
    const salarioProporcional = (salario / 30) * diasTrabalhados;
    
    const inss = salarioProporcional * 0.20; // INSS Patronal
    const fgts = salarioProporcional * 0.08; // FGTS
    const decimoTerceiro = salarioProporcional / 12;
    const ferias = salarioProporcional / 12;
    
    // Adicional noturno para áreas específicas (20%)
    let adicionalNoturno = 0;
    if (area.toLowerCase().includes('salão') || area.toLowerCase().includes('bar') || area.toLowerCase().includes('cozinha')) {
      adicionalNoturno = salarioProporcional * 0.20;
    }
    
    return inss + fgts + decimoTerceiro + ferias + adicionalNoturno;
  };

  // Calcular custo total de um funcionário
  const calcularCustoFuncionario = (func: Funcionario) => {
    const salarioProporcional = (func.salario / 30) * func.dias_trabalhados;
    const custoBase = salarioProporcional + func.vt + func.adicional_bonus + func.aviso_previo;
    
    let encargos = 0;
    if (func.tipo_contratacao === 'CLT') {
      encargos = calcularEncargosCLT(func.salario, func.area, func.dias_trabalhados);
    }
    
    return {
      custoBase,
      encargos,
      total: custoBase + encargos
    };
  };

  // Calcular totais gerais
  const calcularTotaisGerais = () => {
    let totalFolha = 0;
    let totalEncargos = 0;
    
    funcionarios.forEach(func => {
      const custos = calcularCustoFuncionario(func);
      totalFolha += custos.custoBase;
      totalEncargos += custos.encargos;
    });
    
    return {
      totalFolha,
      totalEncargos,
      totalGeral: totalFolha + totalEncargos
    };
  };

  // Carregar simulação do mês/ano selecionado
  const carregarSimulacao = useCallback(async () => {
    if (!selectedBar) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        bar_id: selectedBar.id.toString(),
        mes: mesAtual.toString(),
        ano: anoAtual.toString()
      });

      const response = await fetch(`/api/operacional/cmo-simulacao?${params}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar simulação');

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        const simulacao = result.data[0];
        setFuncionarios(simulacao.funcionarios || []);
        setObservacoes(simulacao.observacoes || '');
        setSimulacaoAtualId(simulacao.id);
      } else {
        // Limpar se não houver simulação para este mês
        setFuncionarios([]);
        setObservacoes('');
        setSimulacaoAtualId(undefined);
      }

    } catch (error) {
      console.error('Erro ao carregar simulação:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar a simulação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar, user, mesAtual, anoAtual, toast]);

  // Carregar histórico
  const carregarHistorico = useCallback(async () => {
    if (!selectedBar) return;

    try {
      const params = new URLSearchParams({
        bar_id: selectedBar.id.toString()
      });

      const response = await fetch(`/api/operacional/cmo-simulacao?${params}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar histórico');

      const result = await response.json();
      setHistorico(result.data || []);

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, [selectedBar, user]);

  // Salvar simulação
  const salvarSimulacao = async () => {
    if (!selectedBar || funcionarios.length === 0) {
      toast({
        title: "Dados insuficientes",
        description: "Adicione pelo menos um funcionário",
        variant: "destructive"
      });
      return;
    }

    setSalvando(true);

    try {
      const response = await fetch('/api/operacional/cmo-simulacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          mes: mesAtual,
          ano: anoAtual,
          funcionarios,
          observacoes,
          criado_por: user?.nome || ''
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      const result = await response.json();

      toast({
        title: "✅ Sucesso",
        description: result.message || "Simulação salva com sucesso"
      });

      setSimulacaoAtualId(result.data.id);
      carregarHistorico();

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a simulação",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  // Adicionar funcionário
  const adicionarFuncionario = () => {
    const novoFunc: Funcionario = {
      id: `func-${Date.now()}`,
      nome: '',
      tipo_contratacao: 'CLT',
      vt: 0,
      area: 'Salão',
      salario: 0,
      dias_trabalhados: 30,
      adicional_bonus: 0,
      aviso_previo: 0
    };
    setFuncionarios([...funcionarios, novoFunc]);
  };

  // Remover funcionário
  const removerFuncionario = (id: string) => {
    setFuncionarios(funcionarios.filter(f => f.id !== id));
  };

  // Atualizar funcionário
  const atualizarFuncionario = (id: string, campo: keyof Funcionario, valor: any) => {
    setFuncionarios(funcionarios.map(f => 
      f.id === id ? { ...f, [campo]: valor } : f
    ));
  };

  // Carregar simulação do histórico
  const carregarDoHistorico = (simulacao: SimulacaoCMO) => {
    setMesAtual(simulacao.mes);
    setAnoAtual(simulacao.ano);
    setFuncionarios(simulacao.funcionarios);
    setObservacoes(simulacao.observacoes || '');
    setSimulacaoAtualId(simulacao.id);
    setMostrarHistorico(false);
    
    toast({
      title: "Simulação carregada",
      description: `${MESES[simulacao.mes - 1].label}/${simulacao.ano}`
    });
  };

  useEffect(() => {
    setPageTitle('💼 Simulação de CMO');
  }, [setPageTitle]);

  useEffect(() => {
    if (selectedBar && user) {
      carregarSimulacao();
      carregarHistorico();
    }
  }, [selectedBar, user, mesAtual, anoAtual, carregarSimulacao, carregarHistorico]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando simulação...</p>
        </div>
      </div>
    );
  }

  const totais = calcularTotaisGerais();
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              💼 Simulação de CMO
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Custo de Mão de Obra - Simulação mensal com histórico
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setMostrarHistorico(!mostrarHistorico)}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              {mostrarHistorico ? 'Ocultar' : 'Ver'} Histórico
            </Button>
            <Button
              onClick={salvarSimulacao}
              disabled={salvando || funcionarios.length === 0}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              {salvando ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Simulação
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Seleção de Mês/Ano */}
        <Card className="card-dark mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Mês</Label>
                <Select value={mesAtual.toString()} onValueChange={(value) => setMesAtual(parseInt(value))}>
                  <SelectTrigger className="select-dark">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="modal-select-content">
                    {MESES.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value.toString()} className="modal-select-item">
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Ano</Label>
                <Select value={anoAtual.toString()} onValueChange={(value) => setAnoAtual(parseInt(value))}>
                  <SelectTrigger className="select-dark">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="modal-select-content">
                    {[2024, 2025, 2026].map((ano) => (
                      <SelectItem key={ano} value={ano.toString()} className="modal-select-item">
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={adicionarFuncionario}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Funcionário
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico */}
        {mostrarHistorico && (
          <Card className="card-dark mb-6">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <FileText className="h-5 w-5" />
                Histórico de Simulações ({historico.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Período</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Funcionários</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Total Folha</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Total Encargos</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Total Geral</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 font-medium">
                            Nenhuma simulação encontrada
                          </p>
                        </td>
                      </tr>
                    ) : (
                      historico.map((sim) => (
                        <tr
                          key={sim.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            {MESES[sim.mes - 1].label}/{sim.ano}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                            {sim.funcionarios.length}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                            {formatarMoeda(sim.total_folha)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatarMoeda(sim.total_encargos)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-green-600 dark:text-green-400">
                            {formatarMoeda(sim.total_geral)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => carregarDoHistorico(sim)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Funcionários */}
        <Card className="card-dark mb-6">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Users className="h-5 w-5" />
              Funcionários ({funcionarios.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {funcionarios.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                  Nenhum funcionário adicionado
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Clique em "Adicionar Funcionário" para começar
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Nome</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20">Tipo</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20">VT</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20">Área</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20">Salário</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20">Dias Trab.</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20">Adicional/Bônus</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20">Aviso Prévio</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Custo Base</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Encargos</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.map((func) => {
                      const custos = calcularCustoFuncionario(func);
                      return (
                        <tr
                          key={func.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-2 px-4">
                            <Input
                              value={func.nome}
                              onChange={(e) => atualizarFuncionario(func.id, 'nome', e.target.value)}
                              placeholder="Nome do funcionário"
                              className="input-dark text-sm"
                            />
                          </td>
                          <td className="py-2 px-4 bg-orange-50 dark:bg-orange-900/10">
                            <Select
                              value={func.tipo_contratacao}
                              onValueChange={(value) => atualizarFuncionario(func.id, 'tipo_contratacao', value)}
                            >
                              <SelectTrigger className="select-dark text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="modal-select-content">
                                <SelectItem value="CLT" className="modal-select-item">CLT</SelectItem>
                                <SelectItem value="PJ" className="modal-select-item">PJ</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-4 bg-orange-50 dark:bg-orange-900/10">
                            <Input
                              type="number"
                              step="0.01"
                              value={func.vt}
                              onChange={(e) => atualizarFuncionario(func.id, 'vt', parseFloat(e.target.value) || 0)}
                              className="input-dark text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-4 bg-orange-50 dark:bg-orange-900/10">
                            <Select
                              value={func.area}
                              onValueChange={(value) => atualizarFuncionario(func.id, 'area', value)}
                            >
                              <SelectTrigger className="select-dark text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="modal-select-content">
                                {AREAS.map(area => (
                                  <SelectItem key={area} value={area} className="modal-select-item">{area}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-4 bg-orange-50 dark:bg-orange-900/10">
                            <Input
                              type="number"
                              step="0.01"
                              value={func.salario}
                              onChange={(e) => atualizarFuncionario(func.id, 'salario', parseFloat(e.target.value) || 0)}
                              className="input-dark text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-4 bg-orange-50 dark:bg-orange-900/10">
                            <Input
                              type="number"
                              min="1"
                              max="31"
                              value={func.dias_trabalhados}
                              onChange={(e) => atualizarFuncionario(func.id, 'dias_trabalhados', parseInt(e.target.value) || 30)}
                              className="input-dark text-sm text-center"
                            />
                          </td>
                          <td className="py-2 px-4 bg-orange-50 dark:bg-orange-900/10">
                            <Input
                              type="number"
                              step="0.01"
                              value={func.adicional_bonus}
                              onChange={(e) => atualizarFuncionario(func.id, 'adicional_bonus', parseFloat(e.target.value) || 0)}
                              className="input-dark text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-4 bg-orange-50 dark:bg-orange-900/10">
                            <Input
                              type="number"
                              step="0.01"
                              value={func.aviso_previo}
                              onChange={(e) => atualizarFuncionario(func.id, 'aviso_previo', parseFloat(e.target.value) || 0)}
                              className="input-dark text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                            {formatarMoeda(custos.custoBase)}
                          </td>
                          <td className="py-2 px-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatarMoeda(custos.encargos)}
                          </td>
                          <td className="py-2 px-4 text-right text-sm font-bold text-green-600 dark:text-green-400">
                            {formatarMoeda(custos.total)}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerFuncionario(func.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totais */}
        <Card className="card-dark mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Folha</p>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatarMoeda(totais.totalFolha)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Salários + VT + Adicionais
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-3 mb-2">
                  <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Encargos</p>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatarMoeda(totais.totalEncargos)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  INSS + FGTS + 13º + Férias + Adic. Noturno
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border-2 border-green-200 dark:border-green-700">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Geral</p>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatarMoeda(totais.totalGeral)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Custo total de mão de obra
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="card-dark mb-6">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre esta simulação..."
              className="textarea-dark min-h-[100px]"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p><strong>Colunas Laranja:</strong> Campos editáveis que você deve preencher</p>
                <p><strong>Tipo de Contratação:</strong> CLT (com encargos) ou PJ (sem encargos)</p>
                <p><strong>Área:</strong> Salão, Bar e Cozinha recebem adicional noturno de 20%</p>
                <p><strong>Dias Trabalhados:</strong> Ajuste para contratações/demissões no meio do mês ou férias</p>
                <p><strong>Adicional/Bônus:</strong> Valores extras por meta, capitão, craque, etc.</p>
                <p><strong>Aviso Prévio:</strong> Quando indenizado, adicionar aqui</p>
                <p><strong>Encargos CLT:</strong> INSS (20%) + FGTS (8%) + 13º + Férias + Adicional Noturno (quando aplicável)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

