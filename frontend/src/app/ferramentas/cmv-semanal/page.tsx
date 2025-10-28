'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Plus,
  Save,
  Trash2,
  RefreshCcw,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit,
  DollarSign,
  Package
} from 'lucide-react';
import { useBar } from '@/contexts/BarContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface CMVSemanal {
  id?: number;
  bar_id: number;
  ano: number;
  semana: number;
  data_inicio: string;
  data_fim: string;
  vendas_brutas: number;
  vendas_liquidas: number;
  estoque_inicial: number;
  compras_periodo: number;
  estoque_final: number;
  cmv_calculado?: number;
  cmv_percentual?: number;
  cmv_bebidas: number;
  cmv_alimentos: number;
  cmv_descartaveis: number;
  cmv_outros: number;
  status: 'rascunho' | 'fechado' | 'auditado';
  responsavel?: string;
  observacoes?: string;
}

export default function CMVSemanalPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [cmvs, setCmvs] = useState<CMVSemanal[]>([]);
  const [anoFiltro, setAnoFiltro] = useState(() => new Date().getFullYear());
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  
  // Modal de adicionar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState<CMVSemanal | null>(null);
  const [formData, setFormData] = useState<Partial<CMVSemanal>>({
    vendas_brutas: 0,
    vendas_liquidas: 0,
    estoque_inicial: 0,
    compras_periodo: 0,
    estoque_final: 0,
    cmv_bebidas: 0,
    cmv_alimentos: 0,
    cmv_descartaveis: 0,
    cmv_outros: 0,
    status: 'rascunho'
  });

  // Função para calcular número da semana
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  };

  // Carregar dados
  const carregarCMVs = useCallback(async () => {
    if (!selectedBar || !user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        bar_id: selectedBar.id.toString(),
        ano: anoFiltro.toString()
      });

      if (statusFiltro !== 'TODOS') {
        params.append('status', statusFiltro);
      }

      const response = await fetch(`/api/cmv-semanal?${params}`, {
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar CMVs');

      const data = await response.json();
      setCmvs(data.data || []);

    } catch (error) {
      console.error('Erro ao carregar CMVs:', error);
      toast({
        title: "Erro ao carregar CMVs",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBar, user, anoFiltro, statusFiltro, toast]);

  // Abrir modal para adicionar
  const abrirModalAdicionar = () => {
    const hoje = new Date();
    const semanaAtual = getWeekNumber(hoje);
    
    // Calcular data de início e fim da semana
    const primeiroDiaSemana = new Date(hoje);
    primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const ultimoDiaSemana = new Date(primeiroDiaSemana);
    ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);

    setItemEditando(null);
    setFormData({
      ano: anoFiltro,
      semana: semanaAtual,
      data_inicio: primeiroDiaSemana.toISOString().split('T')[0],
      data_fim: ultimoDiaSemana.toISOString().split('T')[0],
      vendas_brutas: 0,
      vendas_liquidas: 0,
      estoque_inicial: 0,
      compras_periodo: 0,
      estoque_final: 0,
      cmv_bebidas: 0,
      cmv_alimentos: 0,
      cmv_descartaveis: 0,
      cmv_outros: 0,
      status: 'rascunho',
      responsavel: user?.nome || ''
    });
    setModalAberto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (item: CMVSemanal) => {
    setItemEditando(item);
    setFormData(item);
    setModalAberto(true);
  };

  // Salvar item
  const salvarItem = async () => {
    if (!selectedBar || !formData.ano || !formData.semana) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha ano, semana e datas",
        variant: "destructive"
      });
      return;
    }

    try {
      const registro = {
        ...formData,
        bar_id: selectedBar.id,
        responsavel: user?.nome || ''
      };

      const response = await fetch('/api/cmv-semanal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          registro
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      toast({
        title: "Sucesso",
        description: "CMV salvo com sucesso"
      });

      setModalAberto(false);
      carregarCMVs();

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o CMV",
        variant: "destructive"
      });
    }
  };

  // Excluir item
  const excluirItem = async (id: number) => {
    if (!confirm('Deseja realmente excluir este CMV?')) return;

    try {
      const response = await fetch(`/api/cmv-semanal?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        }
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast({
        title: "Sucesso",
        description: "CMV excluído com sucesso"
      });

      carregarCMVs();

    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o CMV",
        variant: "destructive"
      });
    }
  };

  // Atualizar status
  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      const response = await fetch('/api/cmv-semanal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': encodeURIComponent(JSON.stringify(user))
        },
        body: JSON.stringify({ id, status: novoStatus })
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');

      toast({
        title: "Status atualizado",
        description: "Status do CMV foi atualizado"
      });

      carregarCMVs();

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    setPageTitle('📊 CMV Semanal');
  }, [setPageTitle]);

  useEffect(() => {
    if (selectedBar && user) {
      carregarCMVs();
    }
  }, [selectedBar, user, anoFiltro, statusFiltro, carregarCMVs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando CMVs...</p>
        </div>
      </div>
    );
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              CMV Semanal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Custo de Mercadoria Vendida calculado semanalmente
            </p>
          </div>
          <Button
            onClick={abrirModalAdicionar}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar CMV
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Ano</Label>
                <Select value={anoFiltro.toString()} onValueChange={(value) => setAnoFiltro(parseInt(value))}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                    <SelectItem value="auditado">Auditado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={carregarCMVs}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de CMVs */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              CMVs Registrados ({cmvs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Semana</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Período</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Vendas Líq.</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">CMV Calc.</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">CMV %</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cmvs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          Nenhum CMV encontrado
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Adicione CMVs para começar o controle
                        </p>
                      </td>
                    </tr>
                  ) : (
                    cmvs.map((cmv) => (
                      <tr
                        key={cmv.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {cmv.ano} - S{cmv.semana}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(cmv.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                          {new Date(cmv.data_fim).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatarMoeda(cmv.vendas_liquidas)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatarMoeda(cmv.cmv_calculado || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`${
                              (cmv.cmv_percentual || 0) <= 33
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300'
                                : (cmv.cmv_percentual || 0) <= 40
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300'
                            }`}
                          >
                            {(cmv.cmv_percentual || 0).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`cursor-pointer ${
                              cmv.status === 'auditado'
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300'
                                : cmv.status === 'fechado'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300'
                            }`}
                            onClick={() => {
                              const proximoStatus =
                                cmv.status === 'rascunho'
                                  ? 'fechado'
                                  : cmv.status === 'fechado'
                                  ? 'auditado'
                                  : 'rascunho';
                              atualizarStatus(cmv.id!, proximoStatus);
                            }}
                          >
                            {cmv.status === 'auditado' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {cmv.status === 'fechado' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {cmv.status.charAt(0).toUpperCase() + cmv.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirModalEditar(cmv)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => excluirItem(cmv.id!)}
                              className="h-8 w-8 p-0"
                              disabled={cmv.status === 'auditado'}
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Adicionar/Editar */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {itemEditando ? 'Editar CMV' : 'Adicionar CMV Semanal'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do CMV da semana
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Identificação */}
              <div className="md:col-span-2 border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Identificação da Semana
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ano *</Label>
                    <Input
                      type="number"
                      value={formData.ano || ''}
                      onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Semana *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="53"
                      value={formData.semana || ''}
                      onChange={(e) => setFormData({ ...formData, semana: parseInt(e.target.value) })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Data Início *</Label>
                    <Input
                      type="date"
                      value={formData.data_inicio || ''}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Data Fim *</Label>
                    <Input
                      type="date"
                      value={formData.data_fim || ''}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Vendas */}
              <div className="md:col-span-2 border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Vendas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vendas Brutas</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.vendas_brutas || 0}
                      onChange={(e) => setFormData({ ...formData, vendas_brutas: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Vendas Líquidas</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.vendas_liquidas || 0}
                      onChange={(e) => setFormData({ ...formData, vendas_liquidas: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Estoque */}
              <div className="md:col-span-2 border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Estoque e Compras
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Estoque Inicial</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.estoque_inicial || 0}
                      onChange={(e) => setFormData({ ...formData, estoque_inicial: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Compras do Período</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.compras_periodo || 0}
                      onChange={(e) => setFormData({ ...formData, compras_periodo: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Estoque Final</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.estoque_final || 0}
                      onChange={(e) => setFormData({ ...formData, estoque_final: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    <strong>CMV Calculado:</strong> {formatarMoeda(
                      (formData.estoque_inicial || 0) + 
                      (formData.compras_periodo || 0) - 
                      (formData.estoque_final || 0)
                    )}
                    {formData.vendas_liquidas && formData.vendas_liquidas > 0 && (
                      <span className="ml-2">
                        ({((((formData.estoque_inicial || 0) + (formData.compras_periodo || 0) - (formData.estoque_final || 0)) / formData.vendas_liquidas) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Detalhamento por Categoria */}
              <div className="md:col-span-2 border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Detalhamento por Categoria (Opcional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CMV Bebidas</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cmv_bebidas || 0}
                      onChange={(e) => setFormData({ ...formData, cmv_bebidas: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>CMV Alimentos</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cmv_alimentos || 0}
                      onChange={(e) => setFormData({ ...formData, cmv_alimentos: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>CMV Descartáveis</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cmv_descartaveis || 0}
                      onChange={(e) => setFormData({ ...formData, cmv_descartaveis: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label>CMV Outros</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cmv_outros || 0}
                      onChange={(e) => setFormData({ ...formData, cmv_outros: parseFloat(e.target.value) || 0 })}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                  className="bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarItem}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

