'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useChecklistExecution } from '@/hooks/useChecklistExecution'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import PhotoUpload from '@/components/uploads/PhotoUpload'
import SignaturePad from '@/components/uploads/SignaturePad'
import { 
  Save, 
  Check, 
  X, 
  Camera, 
  Upload, 
  Calendar,
  Clock,
  User,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Home,
  Pause,
  Play
} from 'lucide-react'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function ChecklistExecutionPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [currentSection, setCurrentSection] = useState(0)
  const [showFinalizationModal, setShowFinalizationModal] = useState(false)
  const [observacoesFinais, setObservacoesFinais] = useState('')
  const [assinaturaFinal, setAssinaturaFinal] = useState<any>(null)

  const {
    execucao,
    loading,
    saving,
    finalizing,
    error,
    autoSaveEnabled,
    carregarExecucao,
    salvarRespostas,
    finalizarExecucao,
    cancelarExecucao,
    atualizarResposta,
    adicionarAnexo,
    removerAnexo,
    validacao,
    podeSerFinalizada,
    temAlteracoesPendentes,
    proximoItemPendente,
    toggleAutoSave
  } = useChecklistExecution()

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    if (id && typeof id === 'string') {
      carregarExecucao(id)
    }
  }, [id])

  // Auto-scroll para próximo item pendente
  useEffect(() => {
    if (proximoItemPendente) {
      setCurrentSection(proximoItemPendente.secaoIndex)
    }
  }, [proximoItemPendente])

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleSaveManual = async () => {
    const sucesso = await salvarRespostas(false)
    if (sucesso) {
      alert('✅ Respostas salvas com sucesso!')
    }
  }

  const handleFinalizar = async () => {
    if (!podeSerFinalizada) {
      alert('❌ Complete todos os campos obrigatórios antes de finalizar')
      return
    }

    setShowFinalizationModal(true)
  }

  const handleConfirmFinalizar = async () => {
    const sucesso = await finalizarExecucao(observacoesFinais, assinaturaFinal)
    if (sucesso) {
      alert('🎉 Checklist finalizado com sucesso!')
      router.push('/funcionario/checklists')
    }
    setShowFinalizationModal(false)
  }

  const handleCancelar = async () => {
    if (!confirm('❌ Tem certeza que deseja cancelar esta execução?')) return

    const motivo = prompt('Motivo do cancelamento (opcional):') || 'Cancelado pelo funcionário'
    const sucesso = await cancelarExecucao(motivo)
    
    if (sucesso) {
      router.push('/funcionario/checklists')
    }
  }

  const handleItemResponse = (secaoIndex: number, itemIndex: number, valor: any) => {
    atualizarResposta(secaoIndex, itemIndex, valor)
  }

  const handleAddAnexo = (secaoIndex: number, itemIndex: number, anexo: any) => {
    adicionarAnexo(secaoIndex, itemIndex, anexo)
  }

  const handleRemoveAnexo = (secaoIndex: number, itemIndex: number, anexoIndex: number) => {
    removerAnexo(secaoIndex, itemIndex, anexoIndex)
  }

  // =====================================================
  // COMPONENTES
  // =====================================================

  const ProgressHeader = () => {
    if (!execucao) return null

    const progresso = execucao.progresso
    const tempoDecorrido = calcularTempoDecorrido(execucao.iniciado_em)

    return (
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{execucao.checklist.nome}</h1>
              <p className="text-sm text-gray-600">{execucao.checklist.setor}</p>
            </div>
            <Badge variant={execucao.status === 'em_andamento' ? 'default' : 'secondary'}>
              {getStatusLabel(execucao.status)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso geral</span>
              <span>{progresso.itens_respondidos}/{progresso.total_itens} itens</span>
            </div>
            <Progress value={progresso.percentual_completo} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span>Campos obrigatórios</span>
              <span className={progresso.percentual_obrigatorios === 100 ? 'text-green-600' : 'text-red-600'}>
                {progresso.campos_obrigatorios_respondidos}/{progresso.campos_obrigatorios_total}
              </span>
            </div>
            <Progress 
              value={progresso.percentual_obrigatorios} 
              className="h-2"
            />

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Tempo: {tempoDecorrido}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{execucao.funcionario.nome}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const SectionTabs = () => {
    if (!execucao) return null

    return (
      <div className="flex overflow-x-auto gap-2 mb-4 pb-2">
        {execucao.respostas.secoes.map((secao, index) => {
          const itensRespondidos = secao.itens.filter(item => item.respondido).length
          const totalItens = secao.itens.length
          const percentual = totalItens > 0 ? (itensRespondidos / totalItens) * 100 : 0
          const temObrigatoriosPendentes = secao.itens.some(item => item.obrigatorio && !item.respondido)

          return (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`min-w-max px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentSection === index
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-center">
                <div className="flex items-center gap-1">
                  {secao.nome}
                  {temObrigatoriosPendentes && (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                </div>
                <div className="text-xs opacity-75">
                  {itensRespondidos}/{totalItens}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  const ItemRenderer = ({ secao, secaoIndex, item, itemIndex }: any) => {
    const isObrigatorio = item.obrigatorio
    const isRespondido = item.respondido

    const renderInputByType = () => {
      switch (item.tipo) {
        case 'texto':
          return (
            <Textarea
              value={item.valor || ''}
              onChange={(e) => handleItemResponse(secaoIndex, itemIndex, e.target.value)}
              placeholder="Digite sua resposta..."
              className={isObrigatorio && !isRespondido ? 'border-red-300' : ''}
            />
          )

        case 'numero':
          return (
            <Input
              type="number"
              value={item.valor || ''}
              onChange={(e) => handleItemResponse(secaoIndex, itemIndex, e.target.value)}
              placeholder="Digite um número..."
              className={isObrigatorio && !isRespondido ? 'border-red-300' : ''}
            />
          )

        case 'sim_nao':
          return (
            <div className="flex gap-3">
              <Button
                variant={item.valor === true ? 'default' : 'outline'}
                onClick={() => handleItemResponse(secaoIndex, itemIndex, true)}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Sim
              </Button>
              <Button
                variant={item.valor === false ? 'default' : 'outline'}
                onClick={() => handleItemResponse(secaoIndex, itemIndex, false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Não
              </Button>
            </div>
          )

        case 'data':
          return (
            <Input
              type="date"
              value={item.valor || ''}
              onChange={(e) => handleItemResponse(secaoIndex, itemIndex, e.target.value)}
              className={isObrigatorio && !isRespondido ? 'border-red-300' : ''}
            />
          )

        case 'avaliacao':
          return (
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={item.valor === rating ? 'default' : 'outline'}
                  onClick={() => handleItemResponse(secaoIndex, itemIndex, rating)}
                  className="w-12 h-12 text-lg"
                >
                  {getEmojiForRating(rating)}
                </Button>
              ))}
            </div>
          )

        case 'foto_camera':
        case 'foto_upload':
          return (
            <PhotoUpload
              onUploadComplete={(result) => handleAddAnexo(secaoIndex, itemIndex, result)}
              onError={(error) => console.error('Erro no upload:', error)}
              folder="checklist_photos"
              multiple={true}
            />
          )

        case 'assinatura':
          return (
            <SignaturePad
              onSignatureComplete={(result) => handleAddAnexo(secaoIndex, itemIndex, result)}
              onError={(error) => console.error('Erro na assinatura:', error)}
            />
          )

        default:
          return (
            <div className="text-gray-500 text-center py-4">
              Tipo de campo não suportado: {item.tipo}
            </div>
          )
      }
    }

    return (
      <Card key={itemIndex} className={`mb-4 ${isObrigatorio && !isRespondido ? 'border-red-200' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                {item.titulo}
                {isObrigatorio && (
                  <Badge variant="destructive" className="text-xs">
                    Obrigatório
                  </Badge>
                )}
                {isRespondido && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </h3>
              {item.descricao && (
                <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {getFieldTypeIcon(item.tipo)}
            </div>
          </div>

          {renderInputByType()}

          {item.respondido_em && (
            <div className="text-xs text-gray-500 mt-2">
              Respondido em: {new Date(item.respondido_em).toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const CurrentSection = () => {
    if (!execucao || !execucao.respostas.secoes[currentSection]) return null

    const secao = execucao.respostas.secoes[currentSection]

    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{secao.nome}</h2>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
            <span>{secao.itens.length} itens</span>
            <span>
              {secao.itens.filter(item => item.respondido).length} respondidos
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {secao.itens.map((item, itemIndex) => (
            <ItemRenderer
              key={itemIndex}
              secao={secao}
              secaoIndex={currentSection}
              item={item}
              itemIndex={itemIndex}
            />
          ))}
        </div>
      </div>
    )
  }

  const ActionButtons = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
      {/* Auto-save toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={autoSaveEnabled}
            onCheckedChange={toggleAutoSave}
            id="auto-save"
          />
          <Label htmlFor="auto-save" className="text-sm">
            Salvamento automático
          </Label>
        </div>
        {saving && (
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
            Salvando...
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setCurrentSection(Math.min(execucao?.respostas.secoes.length! - 1, currentSection + 1))}
          disabled={!execucao || currentSection >= execucao.respostas.secoes.length - 1}
          className="flex-1"
        >
          Próxima
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Main actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => router.push('/funcionario/checklists')}
          className="flex-1"
        >
          <Home className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Button
          onClick={handleSaveManual}
          disabled={saving || !temAlteracoesPendentes}
          variant="outline"
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>

        <Button
          onClick={handleFinalizar}
          disabled={!podeSerFinalizada || finalizing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-2" />
          {finalizing ? 'Finalizando...' : 'Finalizar'}
        </Button>
      </div>

      {/* Danger actions */}
      <Button
        variant="destructive"
        onClick={handleCancelar}
        className="w-full"
        size="sm"
      >
        <X className="w-4 h-4 mr-2" />
        Cancelar Execução
      </Button>
    </div>
  )

  const FinalizationModal = () => {
    if (!showFinalizationModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Finalizar Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="observacoes-finais">Observações finais (opcional)</Label>
              <Textarea
                id="observacoes-finais"
                value={observacoesFinais}
                onChange={(e) => setObservacoesFinais(e.target.value)}
                placeholder="Adicione observações sobre a execução..."
                rows={3}
              />
            </div>

            <div>
              <Label>Assinatura (opcional)</Label>
              <SignaturePad
                onSignatureComplete={setAssinaturaFinal}
                onSignatureCancel={() => setAssinaturaFinal(null)}
                onError={(error) => console.error('Erro na assinatura:', error)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFinalizationModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmFinalizar}
                disabled={finalizing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {finalizing ? 'Finalizando...' : 'Confirmar Finalização'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando checklist...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erro: {error}</p>
          <Button 
            onClick={() => router.push('/funcionario/checklists')} 
            className="mt-2"
          >
            Voltar para Checklists
          </Button>
        </div>
      </div>
    )
  }

  if (!execucao) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Execução não encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Verifique se você tem permissão para acessar esta execução.
          </p>
          <Button onClick={() => router.push('/funcionario/checklists')}>
            Voltar para Checklists
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      <div className="container mx-auto p-4">
        <ProgressHeader />
        <SectionTabs />
        <CurrentSection />
        
        {/* Validação de campos pendentes */}
        {validacao && validacao.campos_obrigatorios_vazios > 0 && (
          <Card className="mt-4 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">
                  {validacao.campos_obrigatorios_vazios} campo(s) obrigatório(s) pendente(s)
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ActionButtons />
      <FinalizationModal />
    </div>
  )
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'em_andamento': 'Em Andamento',
    'pausado': 'Pausado',
    'completado': 'Completado',
    'cancelado': 'Cancelado'
  }
  return labels[status] || status
}

function getFieldTypeIcon(tipo: string): string {
  const icons: Record<string, string> = {
    'texto': '📝',
    'numero': '🔢',
    'sim_nao': '✅',
    'data': '📅',
    'assinatura': '✍️',
    'foto_camera': '📷',
    'foto_upload': '🖼️',
    'avaliacao': '⭐'
  }
  return icons[tipo] || '📋'
}

function getEmojiForRating(rating: number): string {
  const emojis = ['😞', '😕', '😐', '😊', '😍']
  return emojis[rating - 1] || '😐'
}

function calcularTempoDecorrido(iniciadoEm: string): string {
  const inicio = new Date(iniciadoEm)
  const agora = new Date()
  const minutos = Math.round((agora.getTime() - inicio.getTime()) / 1000 / 60)
  
  if (minutos < 60) {
    return `${minutos}min`
  }
  
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
} 