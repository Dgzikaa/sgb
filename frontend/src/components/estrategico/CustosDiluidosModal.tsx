'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustoDiluido {
  id?: number;
  descricao: string;
  valor_total: number;
  parcela_atual?: number;
  total_parcelas?: number;
  tipo_diluicao: 'dias_uteis' | 'dias_evento' | 'semanas' | 'mensal';
  observacoes?: string;
}

interface CustosDiluidosModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  ano: number;
  barId: number;
  onSave: () => void;
}

export function CustosDiluidosModal({ isOpen, onClose, mes, ano, barId, onSave }: CustosDiluidosModalProps) {
  const { toast } = useToast();
  const [custos, setCustos] = useState<CustoDiluido[]>([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<CustoDiluido | null>(null);

  // Form state
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelaAtual, setParcelaAtual] = useState('');
  const [totalParcelas, setTotalParcelas] = useState('');
  const [tipoDiluicao, setTipoDiluicao] = useState<'dias_uteis' | 'dias_evento' | 'semanas' | 'mensal'>('dias_evento');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) {
      carregarCustos();
    }
  }, [isOpen, mes, ano]);

  const carregarCustos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/custos-diluidos?mes=${mes}&ano=${ano}&bar_id=${barId}`);
      const data = await response.json();
      
      if (data.success) {
        setCustos(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar custos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os custos diluídos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const limparForm = () => {
    setDescricao('');
    setValorTotal('');
    setParcelaAtual('');
    setTotalParcelas('');
    setTipoDiluicao('dias_evento');
    setObservacoes('');
    setEditando(null);
  };

  const handleSalvar = async () => {
    if (!descricao || !valorTotal) {
      toast({
        title: 'Atenção',
        description: 'Preencha descrição e valor',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        bar_id: barId,
        mes,
        ano,
        descricao,
        valor_total: parseFloat(valorTotal),
        parcela_atual: parcelaAtual ? parseInt(parcelaAtual) : null,
        total_parcelas: totalParcelas ? parseInt(totalParcelas) : null,
        tipo_diluicao: tipoDiluicao,
        observacoes
      };

      const method = editando ? 'PUT' : 'POST';
      const url = '/api/custos-diluidos';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando ? { ...payload, id: editando.id } : payload)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: editando ? 'Custo atualizado' : 'Custo adicionado',
        });
        limparForm();
        carregarCustos();
        onSave();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o custo',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (custo: CustoDiluido) => {
    setEditando(custo);
    setDescricao(custo.descricao);
    setValorTotal(custo.valor_total.toString());
    setParcelaAtual(custo.parcela_atual?.toString() || '');
    setTotalParcelas(custo.total_parcelas?.toString() || '');
    setTipoDiluicao(custo.tipo_diluicao);
    setObservacoes(custo.observacoes || '');
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Deseja realmente excluir este custo?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/custos-diluidos?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Custo excluído',
        });
        carregarCustos();
        onSave();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o custo',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoDiluicaoLabel = (tipo: string) => {
    const labels = {
      'dias_evento': 'Dias com Evento',
      'dias_uteis': 'Dias Úteis',
      'semanas': 'Por Semana',
      'mensal': 'Mensal (fixo)'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Custos Diluídos - {mes}/{ano}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Gerencie custos mensais que serão diluídos proporcionalmente nos dias/semanas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {editando ? 'Editar Custo' : 'Adicionar Novo Custo'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="descricao" className="text-gray-700 dark:text-gray-300">Descrição *</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Parcela Tenda"
                  className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="valor" className="text-gray-700 dark:text-gray-300">Valor Total *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  placeholder="2400.00"
                  className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="tipo" className="text-gray-700 dark:text-gray-300">Tipo de Diluição *</Label>
                <Select value={tipoDiluicao} onValueChange={(value: any) => setTipoDiluicao(value)}>
                  <SelectTrigger className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dias_evento">Dias com Evento</SelectItem>
                    <SelectItem value="dias_uteis">Dias Úteis (Seg-Sáb)</SelectItem>
                    <SelectItem value="semanas">Por Semana</SelectItem>
                    <SelectItem value="mensal">Mensal (valor fixo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="parcela_atual" className="text-gray-700 dark:text-gray-300">Parcela Atual</Label>
                <Input
                  id="parcela_atual"
                  type="number"
                  value={parcelaAtual}
                  onChange={(e) => setParcelaAtual(e.target.value)}
                  placeholder="1"
                  className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="total_parcelas" className="text-gray-700 dark:text-gray-300">Total de Parcelas</Label>
                <Input
                  id="total_parcelas"
                  type="number"
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  placeholder="5"
                  className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="observacoes" className="text-gray-700 dark:text-gray-300">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais..."
                  className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSalvar}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {editando ? 'Atualizar' : 'Adicionar'}
              </Button>
              {editando && (
                <Button
                  onClick={limparForm}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Lista de Custos */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Custos Cadastrados ({custos.length})
            </h3>

            {loading && custos.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Carregando...</p>
            ) : custos.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhum custo cadastrado para este mês
              </p>
            ) : (
              <div className="space-y-2">
                {custos.map((custo) => (
                  <div
                    key={custo.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {custo.descricao}
                        </h4>
                        {custo.parcela_atual && custo.total_parcelas && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            {custo.parcela_atual}/{custo.total_parcelas}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(custo.valor_total)}
                        </span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                          {getTipoDiluicaoLabel(custo.tipo_diluicao)}
                        </span>
                      </div>
                      {custo.observacoes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {custo.observacoes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditar(custo)}
                        className="border-gray-300 dark:border-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExcluir(custo.id!)}
                        className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {custos.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">Total do Mês:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(custos.reduce((sum, c) => sum + c.valor_total, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


