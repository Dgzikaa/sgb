'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';

interface DadosDesempenho {
  id: number;
  bar_id: number;
  ano: number;
  numero_semana: number;
  data_inicio: string;
  data_fim: string;
  faturamento_total: number;
  faturamento_entrada: number;
  faturamento_bar: number;
  clientes_atendidos: number;
  reservas_totais: number;
  reservas_presentes: number;
  ticket_medio: number;
  cmv_teorico: number;
  cmv_limpo: number;
  meta_semanal: number;
  observacoes?: string;
}

interface EditarDesempenhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dados: DadosDesempenho | null;
  onSave: (dados: Partial<DadosDesempenho>) => Promise<void>;
}

export function EditarDesempenhoModal({
  isOpen,
  onClose,
  dados,
  onSave,
}: EditarDesempenhoModalProps) {
  const [formData, setFormData] = useState<Partial<DadosDesempenho>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dados) {
      setFormData({
        faturamento_total: dados.faturamento_total,
        faturamento_entrada: dados.faturamento_entrada,
        faturamento_bar: dados.faturamento_bar,
        clientes_atendidos: dados.clientes_atendidos,
        reservas_totais: dados.reservas_totais,
        reservas_presentes: dados.reservas_presentes,
        cmv_teorico: dados.cmv_teorico,
        cmv_limpo: dados.cmv_limpo,
        meta_semanal: dados.meta_semanal,
        observacoes: dados.observacoes || '',
      });
    }
  }, [dados]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Calcular ticket médio automaticamente
      const ticketMedio = formData.clientes_atendidos && formData.faturamento_total
        ? formData.faturamento_total / formData.clientes_atendidos
        : 0;

      await onSave({
        ...formData,
        ticket_medio: ticketMedio,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof DadosDesempenho, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'observacoes' ? value : Number(value),
    }));
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (!dados) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Editar Semana {dados.numero_semana}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              <span>
                {dados.data_inicio} até {dados.data_fim}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Faturamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Faturamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="faturamento_total" className="text-gray-700 dark:text-gray-300">
                  Faturamento Total
                </Label>
                <Input
                  id="faturamento_total"
                  type="number"
                  step="0.01"
                  value={formData.faturamento_total || 0}
                  onChange={(e) => handleChange('faturamento_total', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="faturamento_entrada" className="text-gray-700 dark:text-gray-300">
                  Faturamento Entrada
                </Label>
                <Input
                  id="faturamento_entrada"
                  type="number"
                  step="0.01"
                  value={formData.faturamento_entrada || 0}
                  onChange={(e) => handleChange('faturamento_entrada', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="faturamento_bar" className="text-gray-700 dark:text-gray-300">
                  Faturamento Bar
                </Label>
                <Input
                  id="faturamento_bar"
                  type="number"
                  step="0.01"
                  value={formData.faturamento_bar || 0}
                  onChange={(e) => handleChange('faturamento_bar', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Atendimento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atendimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="clientes_atendidos" className="text-gray-700 dark:text-gray-300">
                  Clientes Atendidos
                </Label>
                <Input
                  id="clientes_atendidos"
                  type="number"
                  value={formData.clientes_atendidos || 0}
                  onChange={(e) => handleChange('clientes_atendidos', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reservas_totais" className="text-gray-700 dark:text-gray-300">
                  Reservas Totais
                </Label>
                <Input
                  id="reservas_totais"
                  type="number"
                  value={formData.reservas_totais || 0}
                  onChange={(e) => handleChange('reservas_totais', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reservas_presentes" className="text-gray-700 dark:text-gray-300">
                  Reservas Presentes
                </Label>
                <Input
                  id="reservas_presentes"
                  type="number"
                  value={formData.reservas_presentes || 0}
                  onChange={(e) => handleChange('reservas_presentes', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Custos e Metas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Custos e Metas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cmv_teorico" className="text-gray-700 dark:text-gray-300">
                  CMV Teórico (%)
                </Label>
                <Input
                  id="cmv_teorico"
                  type="number"
                  step="0.01"
                  value={formData.cmv_teorico || 0}
                  onChange={(e) => handleChange('cmv_teorico', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cmv_limpo" className="text-gray-700 dark:text-gray-300">
                  CMV Limpo (%)
                </Label>
                <Input
                  id="cmv_limpo"
                  type="number"
                  step="0.01"
                  value={formData.cmv_limpo || 0}
                  onChange={(e) => handleChange('cmv_limpo', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="meta_semanal" className="text-gray-700 dark:text-gray-300">
                  Meta Semanal
                </Label>
                <Input
                  id="meta_semanal"
                  type="number"
                  step="0.01"
                  value={formData.meta_semanal || 0}
                  onChange={(e) => handleChange('meta_semanal', e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes" className="text-gray-700 dark:text-gray-300">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Adicione observações sobre esta semana..."
            />
          </div>

          {/* Resumo */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resumo
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Ticket Médio:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formData.clientes_atendidos && formData.faturamento_total
                    ? formatarMoeda(formData.faturamento_total / formData.clientes_atendidos)
                    : 'R$ 0,00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Atingimento da Meta:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formData.meta_semanal && formData.faturamento_total
                    ? `${((formData.faturamento_total / formData.meta_semanal) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
