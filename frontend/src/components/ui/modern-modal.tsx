'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { X, Save, AlertCircle, Settings } from 'lucide-react';

interface ModernModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  saveDisabled?: boolean;
  loading?: boolean;
}

export function ModernModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon = Settings,
  children,
  onSave,
  onCancel,
  saveText = 'Salvar',
  cancelText = 'Cancelar',
  saveDisabled = false,
  loading = false,
}: ModernModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl modal-dark">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">{children}</div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel || (() => onOpenChange(false))}
            disabled={loading}
            className="modal-button-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            {cancelText}
          </Button>

          {onSave && (
            <Button
              onClick={onSave}
              disabled={saveDisabled || loading}
              className="modal-button-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : saveText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente de campo de formulário para modais
interface ModalFieldProps {
  label: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  fullWidth?: boolean;
  description?: string;
}

export function ModalField({
  label,
  required = false,
  icon: Icon,
  children,
  fullWidth = false,
  description,
}: ModalFieldProps) {
  return (
    <div className={fullWidth ? 'modal-form-group-full' : 'modal-form-group'}>
      <Label className="modal-label flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

// Exemplo de uso de modal de checklist
interface ChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist?: {
    nome: string;
    setor: string;
    descricao: string;
    tipo: string;
    tempo_estimado: number;
    responsavel_padrao: string;
  };
  onSave: (data: unknown) => void;
  mode: 'create' | 'edit';
}

export function ChecklistModal({
  open,
  onOpenChange,
  checklist,
  onSave,
  mode,
}: ChecklistModalProps) {
  const [formData, setFormData] = React.useState(
    checklist || {
      nome: '',
      setor: '',
      descricao: '',
      tipo: 'abertura',
      tempo_estimado: 30,
      responsavel_padrao: '',
    }
  );

  const isValid = formData.nome.trim() && formData.setor;

  const handleSave = () => {
    if (isValid) {
      onSave(formData);
    }
  };

  return (
    <ModernModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Novo Checklist' : 'Editar Checklist'}
      description={
        mode === 'create'
          ? 'Preencha as informações básicas do checklist'
          : `Editando: ${checklist?.nome}`
      }
      icon={mode === 'create' ? Settings : AlertCircle}
      onSave={handleSave}
      saveDisabled={!isValid}
      saveText={mode === 'create' ? 'Criar Checklist' : 'Salvar Alterações'}
    >
      <div className="modal-form-grid">
        <ModalField
          label="Nome do Checklist"
          required
          fullWidth
          icon={Settings}
        >
          <Input
            value={formData.nome}
            onChange={e => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Checklist de Abertura da Cozinha"
            className="modal-input"
          />
        </ModalField>

        <ModalField label="Setor" required icon={Settings}>
          <Select
            value={formData.setor}
            onValueChange={value => setFormData({ ...formData, setor: value })}
          >
            <SelectTrigger className="modal-select-trigger">
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent className="modal-select-content">
              <SelectItem value="cozinha" className="modal-select-item">
                Cozinha
              </SelectItem>
              <SelectItem value="bar" className="modal-select-item">
                Bar
              </SelectItem>
              <SelectItem value="administrativo" className="modal-select-item">
                Administrativo
              </SelectItem>
            </SelectContent>
          </Select>
        </ModalField>

        <ModalField label="Tipo" required icon={Settings}>
          <Select
            value={formData.tipo}
            onValueChange={value => setFormData({ ...formData, tipo: value })}
          >
            <SelectTrigger className="modal-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="modal-select-content">
              <SelectItem value="abertura" className="modal-select-item">
                Abertura
              </SelectItem>
              <SelectItem value="fechamento" className="modal-select-item">
                Fechamento
              </SelectItem>
              <SelectItem value="manutencao" className="modal-select-item">
                Manutenção
              </SelectItem>
            </SelectContent>
          </Select>
        </ModalField>

        <ModalField
          label="Tempo Estimado (min)"
          icon={Settings}
          description="Tempo médio para completar o checklist"
        >
          <Input
            type="number"
            min="5"
            max="480"
            value={formData.tempo_estimado}
            onChange={e =>
              setFormData({
                ...formData,
                tempo_estimado: parseInt(e.target.value) || 30,
              })
            }
            className="modal-input"
          />
        </ModalField>

        <ModalField
          label="Descrição"
          fullWidth
          icon={Settings}
          description="Breve descrição do checklist"
        >
          <Textarea
            value={formData.descricao}
            onChange={e =>
              setFormData({ ...formData, descricao: e.target.value })
            }
            placeholder="Descreva o propósito e objetivos deste checklist..."
            className="modal-textarea"
          />
        </ModalField>
      </div>
    </ModernModal>
  );
}
