'use client'

import { useState } from 'react'
import { ModernModal, ModalField, ChecklistModal } from '@/components/ui/modern-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  User, 
  FileText, 
  Clock, 
  Building, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit
} from 'lucide-react'

export default function ModalExamples() {
  const [basicModal, setBasicModal] = useState(false)
  const [userModal, setUserModal] = useState(false)
  const [checklistModal, setChecklistModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎨 Modais Profissionais - SGB
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Exemplos de modais modernos e profissionais com design consistente,
          dark mode completo e UX otimizada.
        </p>
      </div>

      {/* Botões para abrir modais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          onClick={() => setBasicModal(true)}
          className="modal-button-primary"
        >
          <Settings className="w-4 h-4 mr-2" />
          Modal Básico
        </Button>

        <Button 
          onClick={() => setUserModal(true)}
          className="modal-button-secondary"
        >
          <User className="w-4 h-4 mr-2" />
          Modal de Usuário
        </Button>

        <Button 
          onClick={() => setChecklistModal(true)}
          className="modal-button-primary"
        >
          <FileText className="w-4 h-4 mr-2" />
          Modal Checklist
        </Button>

        <Button 
          onClick={() => setConfirmModal(true)}
          className="modal-button-danger"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Modal Confirmação
        </Button>
      </div>

      {/* Modal Básico */}
      <ModernModal
        open={basicModal}
        onOpenChange={setBasicModal}
        title="Configurações Gerais"
        description="Ajuste as configurações básicas do sistema"
        icon={Settings}
        onSave={() => {
          console.log('Salvando configurações...')
          setBasicModal(false)
        }}
      >
        <div className="modal-form-grid">
          <ModalField label="Nome do Sistema" required icon={Building}>
            <Input 
              placeholder="SGB - Sistema de Gestão de Bares"
              className="modal-input"
            />
          </ModalField>

          <ModalField label="Timezone" icon={Clock}>
            <Select defaultValue="america-sao_paulo">
              <SelectTrigger className="modal-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="modal-select-content">
                <SelectItem value="america-sao_paulo" className="modal-select-item">
                  América/São Paulo
                </SelectItem>
                <SelectItem value="america-new_york" className="modal-select-item">
                  América/Nova York
                </SelectItem>
              </SelectContent>
            </Select>
          </ModalField>

          <ModalField 
            label="Descrição" 
            fullWidth 
            description="Uma breve descrição do estabelecimento"
          >
            <Textarea 
              placeholder="Sistema completo para gestão de bares e restaurantes..."
              className="modal-textarea"
            />
          </ModalField>

          <ModalField label="Modo Manutenção">
            <div className="flex items-center space-x-3">
              <Switch />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ativar modo manutenção
              </span>
            </div>
          </ModalField>

          <ModalField label="Status">
            <div className="flex gap-2">
              <Badge className="modal-badge modal-badge-success">
                <CheckCircle className="w-3 h-3" />
                Online
              </Badge>
              <Badge className="modal-badge modal-badge-info">
                Atualizado
              </Badge>
            </div>
          </ModalField>
        </div>
      </ModernModal>

      {/* Modal de Usuário */}
      <ModernModal
        open={userModal}
        onOpenChange={setUserModal}
        title="Novo Usuário"
        description="Adicione um novo usuário ao sistema"
        icon={User}
        onSave={() => {
          console.log('Criando usuário...')
          setUserModal(false)
        }}
        saveText="Criar Usuário"
      >
        <div className="modal-form-grid">
          <ModalField label="Nome Completo" required icon={User}>
            <Input 
              placeholder="João Silva"
              className="modal-input"
            />
          </ModalField>

          <ModalField label="Email" required>
            <Input 
              type="email"
              placeholder="joao@exemplo.com"
              className="modal-input"
            />
          </ModalField>

          <ModalField label="Telefone">
            <Input 
              placeholder="(11) 99999-9999"
              className="modal-input"
            />
          </ModalField>

          <ModalField label="Função">
            <Select>
              <SelectTrigger className="modal-select-trigger">
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent className="modal-select-content">
                <SelectItem value="admin" className="modal-select-item">
                  Administrador
                </SelectItem>
                <SelectItem value="gerente" className="modal-select-item">
                  Gerente
                </SelectItem>
                <SelectItem value="funcionario" className="modal-select-item">
                  Funcionário
                </SelectItem>
              </SelectContent>
            </Select>
          </ModalField>

          <ModalField 
            label="Observações" 
            fullWidth
            description="Informações adicionais sobre o usuário"
          >
            <Textarea 
              placeholder="Informações relevantes..."
              className="modal-textarea"
            />
          </ModalField>
        </div>
      </ModernModal>

      {/* Modal Checklist */}
      <ChecklistModal
        open={checklistModal}
        onOpenChange={setChecklistModal}
        mode="create"
        onSave={(data) => {
          console.log('Criando checklist:', data)
          setChecklistModal(false)
        }}
      />

      {/* Modal de Confirmação */}
      <ModernModal
        open={confirmModal}
        onOpenChange={setConfirmModal}
        title="Excluir Item"
        description="Esta ação não pode ser desfeita"
        icon={AlertTriangle}
        onSave={() => {
          console.log('Item excluído')
          setConfirmModal(false)
        }}
        saveText="Sim, Excluir"
        cancelText="Cancelar"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Tem certeza que deseja excluir?
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            O checklist "Abertura da Cozinha" será removido permanentemente. 
            Todos os dados associados serão perdidos.
          </p>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Itens:</span>
              <span className="font-medium text-gray-900 dark:text-white">12</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Execuções:</span>
              <span className="font-medium text-gray-900 dark:text-white">45</span>
            </div>
          </div>
        </div>
      </ModernModal>
    </div>
  )
} 