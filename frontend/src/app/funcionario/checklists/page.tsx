'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import PhotoUpload from '@/components/uploads/PhotoUpload'
import CameraCapture from '@/components/uploads/CameraCapture'
import SignaturePad from '@/components/uploads/SignaturePad'
import { useFileUpload } from '@/hooks/useFileUpload'
import { safeNavigator } from '@/lib/client-utils'
import { 
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  Upload,
  PenTool,
  Calendar,
  Coffee,
  ChefHat,
  Utensils,
  Truck,
  Shield,
  FileText,
  Send,
  Share2,
  Timer
} from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useForceDarkMode } from '@/hooks/useForceDarkMode'

interface ChecklistFuncionario {
  id: string
  nome: string
  setor: string
  tipo: string
  descricao: string
  tempo_estimado: number
  responsavel: string
  deadline?: string
  status: 'pendente' | 'atrasado' | 'em_andamento' | 'concluido'
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  secoes: {
    id: string
    nome: string
    cor: string
    itens: ChecklistItem[]
  }[]
}

interface ChecklistItem {
  id: string
  titulo: string
  descricao?: string
  tipo: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao'
  obrigatorio: boolean
  valor?: any
  observacoes?: string
  status: 'pendente' | 'preenchido'
  condicional?: {
    dependeDe: string
    valor
  }
  opcoes?: {
    placeholder?: string
    min?: number
    max?: number
  }
}

const setoresConfig = [
  { id: 'cozinha', nome: 'Cozinha', icon: ChefHat, cor: 'bg-orange-500' },
  { id: 'bar', nome: 'Bar', icon: Coffee, cor: 'bg-blue-500' },
  { id: 'salao', nome: 'Sal·£o', icon: Utensils, cor: 'bg-green-500' },
  { id: 'recebimento', nome: 'Recebimento', icon: Truck, cor: 'bg-purple-500' },
  { id: 'seguranca', nome: 'Seguran·ßa', icon: Shield, cor: 'bg-red-500' },
  { id: 'administrativo', nome: 'Administrativo', icon: FileText, cor: 'bg-gray-500' }
]

export default function ChecklistsFuncionario() {
  // Force dark mode on all elements
  useForceDarkMode()
  
  const { setPageTitle } = usePageTitle()
  
  // Mock user data - em produ·ß·£o vir·° do contexto
  const usuario = {
    id: 'user-joao-silva-mock',
    nome: 'Jo·£o Silva',
    cargo: 'Cozinheiro',
    setor: 'cozinha'
  }
  
  const [checklists, setChecklists] = useState<ChecklistFuncionario[]>([])
  const [checklistAtivo, setChecklistAtivo] = useState<ChecklistFuncionario | null>(null)
  const [loading, setLoading] = useState(false)
  const [tempoInicio, setTempoInicio] = useState<Date | null>(null)
  
  // Estados para visualiza·ß·£o
  const [aba, setAba] = useState<'pendentes' | 'realizados'>('pendentes')
  const [checklistsRealizados, setChecklistsRealizados] = useState<any[]>([])
  const [loadingRealizados, setLoadingRealizados] = useState(false)
  
  // Estados para c·¢mera/foto
  const [cameraAberta, setCameraAberta] = useState(false)
  const [itemFotoAtual, setItemFotoAtual] = useState<{secaoId: string, itemId: string} | null>(null)
  
  // Estados para assinatura
  const [assinaturaPadAberto, setAssinaturaPadAberto] = useState(false)
  const [itemAssinaturaAtual, setItemAssinaturaAtual] = useState<{secaoId: string, itemId: string} | null>(null)
  
  // Hook de upload
  const { uploadFile } = useFileUpload()

  // Mock data - filtrado por usu·°rio
  const checklistsMock: ChecklistFuncionario[] = [
    {
      id: '1',
      nome: 'Abertura Cozinha',
      setor: 'cozinha',
      tipo: 'abertura',
      descricao: 'Checklist de abertura da cozinha - procedimentos obrigat·≥rios',
      tempo_estimado: 45,
      responsavel: 'Jo·£o Silva',
      deadline: '07:00',
      status: 'pendente',
      prioridade: 'alta',
      secoes: [
        {
          id: 'equipamentos',
          nome: 'Equipamentos',
          cor: 'bg-orange-500',
          itens: [
            {
              id: 'temp_freezer',
              titulo: 'Temperatura do freezer',
              descricao: 'Verificar se est·° entre -18∞C e -15∞C',
              tipo: 'numero',
              obrigatorio: true,
              status: 'pendente',
              opcoes: { min: -25, max: 0, placeholder: '∞C' }
            },
            {
              id: 'fogao_ok',
              titulo: 'Fog·£o funcionando',
              descricao: 'Testar todas as bocas do fog·£o',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'foto_equipamentos',
              titulo: 'Foto dos equipamentos',
              descricao: 'Tirar foto geral dos equipamentos ligados',
              tipo: 'foto_camera',
              obrigatorio: false,
              status: 'pendente',
              condicional: { dependeDe: 'fogao_ok', valor: true }
            }
          ]
        },
        {
          id: 'limpeza',
          nome: 'Limpeza',
          cor: 'bg-green-500',
          itens: [
            {
              id: 'bancadas',
              titulo: 'Bancadas sanitizadas',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'qualidade_limpeza',
              titulo: 'Qualidade da limpeza',
              descricao: 'Como voc·™ avalia a limpeza geral?',
              tipo: 'avaliacao',
              obrigatorio: false,
              status: 'pendente'
            },
            {
              id: 'assinatura',
              titulo: 'Assinatura do respons·°vel',
              tipo: 'assinatura',
              obrigatorio: true,
              status: 'pendente'
            }
          ]
        }
      ]
    },
    {
      id: '2',
      nome: 'Limpeza Semanal',
      setor: 'cozinha',
      tipo: 'limpeza',
      descricao: 'Limpeza profunda semanal da cozinha',
      tempo_estimado: 90,
      responsavel: 'Jo·£o Silva',
      status: 'atrasado',
      prioridade: 'media',
      secoes: [
        {
          id: 'limpeza_profunda',
          nome: 'Limpeza Profunda',
          cor: 'bg-blue-500',
          itens: [
            {
              id: 'exaustor',
              titulo: 'Limpeza do exaustor',
              descricao: 'Limpar filtros e parte interna do exaustor',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'geladeira_freezer',
              titulo: 'Descongelamento e limpeza de geladeiras/freezers',
              descricao: 'Descongelar e higienizar internamente',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'foto_exaustor',
              titulo: 'Foto do exaustor limpo',
              descricao: 'Tirar foto do exaustor ap·≥s limpeza',
              tipo: 'foto_camera',
              obrigatorio: false,
              status: 'pendente',
              condicional: { dependeDe: 'exaustor', valor: true }
            }
          ]
        },
        {
          id: 'areas_especiais',
          nome: '·Åreas Especiais',
          cor: 'bg-purple-500',
          itens: [
            {
              id: 'estoque_seco',
              titulo: 'Organiza·ß·£o do estoque seco',
              descricao: 'Verificar validades e organizar produtos',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'qualidade_limpeza_semanal',
              titulo: 'Avalia·ß·£o geral da limpeza',
              descricao: 'Como voc·™ avalia a limpeza semanal?',
              tipo: 'avaliacao',
              obrigatorio: false,
              status: 'pendente'
            },
            {
              id: 'observacoes_gerais',
              titulo: 'Observa·ß·µes gerais',
              descricao: 'Alguma observa·ß·£o sobre a limpeza semanal?',
              tipo: 'texto',
              obrigatorio: false,
              status: 'pendente',
              opcoes: { placeholder: 'Digite suas observa·ß·µes...' }
            },
            {
              id: 'assinatura_supervisor',
              titulo: 'Assinatura do supervisor',
              descricao: 'Confirme a inspe·ß·£o da limpeza semanal',
              tipo: 'assinatura',
              obrigatorio: true,
              status: 'pendente'
            }
                     ]
         }
       ]
     },
     {
      id: '3',
      nome: 'Seguran·ßa Semanal',
      setor: 'seguranca',
      tipo: 'seguranca',
      descricao: 'Verifica·ß·µes de seguran·ßa e preven·ß·£o de inc·™ndios',
      tempo_estimado: 60,
      responsavel: 'Jo·£o Silva',
      status: 'pendente',
      prioridade: 'alta',
      secoes: [
        {
          id: 'prevencao_incendio',
          nome: 'Preven·ß·£o de Inc·™ndios',
          cor: 'bg-red-500',
          itens: [
            {
              id: 'extintores',
              titulo: 'Verifica·ß·£o dos extintores',
              descricao: 'Conferir press·£o e validade dos extintores',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'saidas_emergencia',
              titulo: 'Sa·≠das de emerg·™ncia desobstru·≠das',
              descricao: 'Verificar se as sa·≠das est·£o livres',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'foto_extintores',
              titulo: 'Foto dos extintores',
              descricao: 'Fotografar os extintores verificados',
              tipo: 'foto_camera',
              obrigatorio: true,
              status: 'pendente'
            }
          ]
        },
        {
          id: 'equipamentos_gas',
          nome: 'Equipamentos de G·°s',
          cor: 'bg-yellow-500',
          itens: [
            {
              id: 'vazamentos_gas',
              titulo: 'Verifica·ß·£o de vazamentos',
              descricao: 'Usar detector ou ·°gua com sab·£o',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'valvulas_gas',
              titulo: 'Funcionamento das v·°lvulas',
              descricao: 'Testar abertura e fechamento das v·°lvulas',
              tipo: 'sim_nao',
              obrigatorio: true,
              status: 'pendente'
            },
            {
              id: 'assinatura_responsavel_seguranca',
              titulo: 'Assinatura do respons·°vel',
              descricao: 'Confirme as verifica·ß·µes de seguran·ßa',
              tipo: 'assinatura',
              obrigatorio: true,
              status: 'pendente'
            }
          ]
        }
      ]
    }
   ]

  useEffect(() => {
    setPageTitle('üìã Meus Checklists')
    
    return () => {
      setPageTitle(null)
    }
  }, [setPageTitle])

  useEffect(() => {
    carregarChecklists()
    if (aba === 'realizados') {
      carregarChecklistsRealizados()
    }
  }, [aba])



  const carregarChecklists = async () => {
    setLoading(true)
    // TODO: Filtrar pelo usu·°rio logado
    const checklistsUsuario = checklistsMock.filter((c) => 
      c.responsavel === usuario.nome || c.setor === usuario.setor
    )
    setChecklists(checklistsUsuario)
    setLoading(false)
  }

  const carregarChecklistsRealizados = async () => {
    setLoadingRealizados(true)
    
    try {
      const response = await fetch(`/api/checklist-execucoes?bar_id=1&responsavel_id=${usuario.id}&limit=20`)
      
      if (response.ok) {
        const data = await response.json()
        setChecklistsRealizados(data.execucoes || [])
        console.log('üìä Checklists realizados carregados:', data.execucoes?.length || 0)
      } else {
        console.error('ùå Erro ao carregar checklists realizados')
        setChecklistsRealizados([])
      }
    } catch (error) {
      console.error('ùå Erro ao carregar checklists realizados:', error)
      setChecklistsRealizados([])
    } finally {
      setLoadingRealizados(false)
    }
  }

  const iniciarChecklist = (checklist: ChecklistFuncionario) => {
    setChecklistAtivo(checklist)
    setTempoInicio(new Date())
  }

  const atualizarItem = (secaoId: string, itemId: string, valor, observacoes?: string) => {
    if (!checklistAtivo) return

    const novoChecklist = { ...checklistAtivo }
    const secao = novoChecklist.secoes.find((s) => s.id === secaoId)
    if (!secao) return

    const item = secao.itens.find((i) => i.id === itemId)
    if (!item) return

    item.valor = valor
    item.observacoes = observacoes
    item.status = 'preenchido'

    setChecklistAtivo(novoChecklist)
  }

  const verificarItemVisivel = (item: ChecklistItem): boolean => {
    if (!item.condicional || !checklistAtivo) return true

    const secaoReferencia = checklistAtivo.secoes.find((s) => 
      s.itens.some(i => i.id === item.condicional!.dependeDe)
    )
    
    if (!secaoReferencia) return true

    const itemReferencia = secaoReferencia.itens.find((i) => i.id === item.condicional!.dependeDe)
    if (!itemReferencia) return true

    return itemReferencia.valor === item.condicional.valor
  }

  const calcularProgresso = (): number => {
    if (!checklistAtivo) return 0

    const todosItens = checklistAtivo.secoes.flatMap(s => s.itens)
    const itensVisiveis = todosItens.filter(verificarItemVisivel)
    const itensObrigatorios = itensVisiveis.filter((i) => i.obrigatorio)
    const itensPreenchidos = itensObrigatorios.filter((i) => i.status === 'preenchido')

    return itensObrigatorios.length > 0 ? (itensPreenchidos.length / itensObrigatorios.length) * 100 : 0
  }

  const podeEnviar = (): boolean => {
    return calcularProgresso() === 100
  }

  const enviarChecklist = async () => {
    if (!checklistAtivo || !podeEnviar()) return

    setLoading(true)
    
    try {
      const tempoExecucao = tempoInicio ? Math.round((new Date().getTime() - tempoInicio.getTime()) / 60000) : 0
      
      // Preparar dados da execu·ß·£o
      const executionData = {
        checklist_id: checklistAtivo.id,
        responsavel_id: usuario.id || 'user-mock-id', // TODO: pegar do contexto real
        tempo_execucao: tempoExecucao,
        total_itens: checklistAtivo.secoes.flatMap(s => s.itens).length,
        itens_ok: checklistAtivo.secoes.flatMap(s => s.itens).filter((i) => i.status === 'preenchido').length,
        itens_problema: 0, // TODO: implementar l·≥gica de problemas
        itens_na: 0,
        observacoes_gerais: `Checklist realizado em ${tempoExecucao} minutos`,
        bar_id: 1, // TODO: pegar do contexto real
        respostas: checklistAtivo.secoes.flatMap(secao => 
          secao.itens
            .filter((item) => item.valor !== undefined)
            .map((item) => ({
              item_id: item.id,
              valor: item.valor,
              observacoes: item.observacoes || null,
              arquivos: typeof item.valor === 'string' && item.valor.startsWith('http') ? [item.valor] : [],
              status: 'ok'
            }))
        )
      }

      console.log('üì§ Enviando checklist para API...', executionData)

      // Enviar para API real
      const response = await fetch('/api/checklist-execucoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(executionData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar checklist')
      }

      console.log('úÖ Checklist enviado com sucesso:', result)
      
      // Redirecionar para p·°gina de sucesso ou hist·≥rico
      alert('úÖ Checklist enviado com sucesso!')
      
      // Voltar para lista e recarregar
      setChecklistAtivo(null)
      setTempoInicio(null)
      carregarChecklists()
      
      // Recarregar checklists realizados tamb·©m
      if (aba === 'realizados') {
        carregarChecklistsRealizados()
      }
      
    } catch (error) {
      console.error('ùå Erro ao enviar checklist:', error)
      alert('ùå Erro ao enviar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const compartilharChecklist = async () => {
    if (!checklistAtivo) return
    
    // TODO: Implementar compartilhamento (WhatsApp, etc.)
    const url = `${window.location.origin}/checklist/${checklistAtivo.id}`
    
    const shared = await safeNavigator.share({
      title: `Checklist: ${checklistAtivo.nome}`,
      text: `Checklist ${checklistAtivo.nome} foi preenchido por ${usuario.nome}`,
      url: url
    })

    if (!shared) {
      // Fallback - copiar para clipboard
      const copied = await safeNavigator.clipboard.writeText(url)
      if (copied) {
        alert('üìã Link copiado para a ·°rea de transfer·™ncia!')
      } else {
        alert('ùå Erro ao compartilhar ou copiar link')
      }
    }
  }

  // Fun·ß·£o para abrir c·¢mera
  const abrirCamera = (secaoId: string, itemId: string) => {
    setItemFotoAtual({ secaoId, itemId })
    setCameraAberta(true)
  }

  // Fun·ß·£o para processar foto capturada
  const handleFotoCapturada = async (blob: Blob) => {
    if (!itemFotoAtual) return

    try {
      // Criar URL tempor·°ria para preview imediato
      const previewUrl = URL.createObjectURL(blob)
      atualizarItem(itemFotoAtual.secaoId, itemFotoAtual.itemId, previewUrl)
      
      // Converter blob para File
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `checklist-foto-${timestamp}.jpg`
      const file = new File([blob], filename, { type: 'image/jpeg' })
      
      console.log('üì∏ Fazendo upload da foto...', file.name)
      
      // Fazer upload real para Supabase
      const result = await uploadFile(file, {
        folder: 'checklist_photos',
        compress: true,
        maxWidth: 1920,
        quality: 0.8
      })
      
      // Atualizar com URL final do Supabase
      atualizarItem(itemFotoAtual.secaoId, itemFotoAtual.itemId, result.url)
      
      console.log('úÖ Foto salva no Supabase:', result.url)
      
    } catch (error) {
      console.error('ùå Erro ao salvar foto:', error)
      alert('Erro ao salvar foto. Tente novamente.')
    } finally {
      // Fechar c·¢mera
      setCameraAberta(false)
      setItemFotoAtual(null)
    }
  }

  // Fun·ß·£o para processar upload de foto
  const handleFotoUpload = (secaoId: string, itemId: string, result) => {
    atualizarItem(secaoId, itemId, result.url || result.filename)
    console.log('üì∑ Foto enviada:', result)
  }

  // Fun·ß·£o para abrir pad de assinatura
  const abrirAssinaturaPad = (secaoId: string, itemId: string) => {
    console.log('üñäÔ∏è Abrindo pad de assinatura', { secaoId, itemId })
    setItemAssinaturaAtual({ secaoId, itemId })
    setAssinaturaPadAberto(true)
    console.log('úÖ Estados atualizados', { assinaturaPadAberto: true, itemAssinaturaAtual: { secaoId, itemId } })
  }

  // Fun·ß·£o para processar assinatura capturada
  const handleAssinaturaCapturada = (result) => {
    console.log('üéØ handleAssinaturaCapturada chamada', { result, itemAssinaturaAtual })
    
    if (!itemAssinaturaAtual) {
      console.error('ùå itemAssinaturaAtual ·© null!')
      return
    }

    console.log('üìù Atualizando item com assinatura', { 
      secaoId: itemAssinaturaAtual.secaoId, 
      itemId: itemAssinaturaAtual.itemId, 
      url: result.url || result.filename 
    })
    
    atualizarItem(itemAssinaturaAtual.secaoId, itemAssinaturaAtual.itemId, result.url || result.filename)
    console.log('úçÔ∏è Assinatura salva:', result)
    
    // Fechar pad
    setAssinaturaPadAberto(false)
    setItemAssinaturaAtual(null)
    console.log('üîí Modal de assinatura fechado')
  }

  // Fun·ß·£o para cancelar assinatura
  const handleAssinaturaCancelada = () => {
    setAssinaturaPadAberto(false)
    setItemAssinaturaAtual(null)
  }

  const renderCampoItem = (item: ChecklistItem, secaoId: string) => {
    const atualizar = (valor, obs?: string) => atualizarItem(secaoId, item.id, valor, obs)

    return (
      <div className="space-y-3">
        {/* Campo principal */}
        <div>
          {item.tipo === 'texto' && (
            <Input
              value={item.valor || ''}
              onChange={(e) => atualizar(e.target.value)}
              placeholder={item.opcoes?.placeholder || 'Digite aqui...'}
              className="text-base text-gray-900 border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 p-3 min-h-[48px] touch-manipulation"
            />
          )}

          {item.tipo === 'numero' && (
            <Input
              type="number"
              value={item.valor || ''}
              onChange={(e) => atualizar(parseFloat(e.target.value) || 0)}
              placeholder={item.opcoes?.placeholder || '0'}
              min={item.opcoes?.min}
              max={item.opcoes?.max}
              className="text-base text-gray-900 border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 p-3 min-h-[48px] touch-manipulation"
            />
          )}

          {item.tipo === 'sim_nao' && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={item.valor === true ? 'default' : 'outline'}
                onClick={() => atualizar(true)}
                className={`p-4 text-lg font-medium border-2 transition-all min-h-[56px] touch-manipulation ${
                  item.valor === true 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                    : 'border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 bg-white'
                }`}
              >
                úÖ Sim
              </Button>
              <Button
                variant={item.valor === false ? 'default' : 'outline'}
                onClick={() => atualizar(false)}
                className={`p-4 text-lg font-medium border-2 transition-all min-h-[56px] touch-manipulation ${
                  item.valor === false 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                    : 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 bg-white'
                }`}
              >
                ùå N·£o
              </Button>
            </div>
          )}

          {item.tipo === 'avaliacao' && (
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => atualizar(rating)}
                  className={`text-5xl p-3 rounded-lg transition-all min-h-[64px] min-w-[64px] touch-manipulation ${
                    item.valor === rating ? 'bg-yellow-100 scale-110 ring-2 ring-yellow-400' : 'hover:bg-gray-100'
                  }`}
                >
                  {rating === 1 ? 'üòû' : rating === 2 ? 'üòê' : rating === 3 ? 'üôÇ' : rating === 4 ? 'üòä' : 'üòç'}
                </button>
              ))}
            </div>
          )}

          {item.tipo === 'foto_camera' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => abrirCamera(secaoId, item.id)}
                className={`w-full p-6 border-2 border-dashed font-medium transition-all min-h-[60px] touch-manipulation text-lg ${
                  item.valor 
                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-400'
                }`}
              >
                <Camera className="w-6 h-6 mr-2" />
                {item.valor ? 'Foto Capturada úÖ' : 'Tirar Foto'}
              </Button>
              
              {item.valor && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center space-y-2">
                  <p className="text-green-700 font-medium">üì∑ Foto salva com sucesso</p>
                  {typeof item.valor === 'string' && (item.valor.startsWith('blob:') || item.valor.startsWith('http')) && (
                    <div className="space-y-2">
                      <img 
                        src={item.valor} 
                        alt="Foto capturada" 
                        className="max-w-full h-32 mx-auto rounded border object-cover shadow-sm"
                      />
                      {item.valor.startsWith('blob:') && (
                        <p className="text-xs text-blue-600">è≥ Fazendo upload...</p>
                      )}
                      {item.valor.startsWith('http') && (
                        <p className="text-xs text-green-600">òÅÔ∏è Salvo na nuvem</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {item.tipo === 'foto_upload' && (
            <div className="space-y-3">
              <PhotoUpload
                onUploadComplete={(result) => handleFotoUpload(secaoId, item.id, result)}
                onError={(error) => alert('ùå Erro no upload: ' + error)}
                folder="checklist_photos"
                compress={true}
                maxWidth={1920}
                quality={0.8}
                showPreview={true}
                multiple={false}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4"
              />
            </div>
          )}

          {item.tipo === 'assinatura' && (
            <div className="space-y-3">
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                item.valor 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }`}>
                {item.valor ? (
                  <div>
                    <PenTool className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-green-600 font-medium">Assinatura capturada úÖ</p>
                  </div>
                ) : (
                  <div>
                    <PenTool className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-gray-700 font-medium">Toque para assinar</p>
                  </div>
                )}
              </div>
              
              {!item.valor && (
                <Button
                  onClick={() => {
                    console.log('üñäÔ∏è Bot·£o "Capturar Assinatura" clicado', { secaoId, itemId: item.id, tipo: item.tipo })
                    abrirAssinaturaPad(secaoId, item.id)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium min-h-[52px] touch-manipulation text-lg"
                >
                  <PenTool className="w-5 h-5 mr-2" />
                  Capturar Assinatura
                </Button>
              )}
              
              {item.valor && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center space-y-2">
                  <p className="text-green-700 font-medium">úçÔ∏è Assinatura salva com sucesso</p>
                  {typeof item.valor === 'string' && item.valor.startsWith('http') && (
                    <div className="space-y-2">
                      <img 
                        src={item.valor} 
                        alt="Assinatura capturada" 
                        className="max-w-full h-20 mx-auto rounded border object-contain shadow-sm bg-white"
                      />
                      <p className="text-xs text-green-600">òÅÔ∏è Salvo na nuvem</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Campo de observa·ß·µes */}
        <div>
          <label className="text-base text-gray-700 font-medium mb-2 block">Observa·ß·µes (opcional):</label>
          <Textarea
            value={item.observacoes || ''}
            onChange={(e) => atualizar(item.valor, e.target.value)}
            placeholder="Adicione observa·ß·µes se necess·°rio..."
            rows={3}
            className="text-base text-gray-900 border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400 p-3 touch-manipulation resize-none"
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Carregando checklists...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto carregamos seus dados
          </p>
        </div>
      </div>
    )
  }

  if (checklistAtivo) {
    const progresso = calcularProgresso()
    const tempoDecorrido = tempoInicio ? Math.round((new Date().getTime() - tempoInicio.getTime()) / 60000) : 0

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Fixo */}
        <div className="sticky top-0 bg-white shadow-sm border-b z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{checklistAtivo.nome}</h1>
                <p className="text-sm text-gray-700">{checklistAtivo.descricao}</p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setChecklistAtivo(null)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium min-h-[44px] touch-manipulation"
              >
                Üê Voltar
              </Button>
            </div>

            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Progresso: {progresso.toFixed(0)}%</span>
                <span className="text-gray-700 font-medium">Tempo: {tempoDecorrido}min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conte·∫do */}
        <div className="p-4 pb-24 space-y-6">
          {checklistAtivo.secoes.map((secao) => (
            <Card key={secao.id}>
              <CardHeader className={`${secao.cor} text-white rounded-t-lg`}>
                <CardTitle className="text-lg">{secao.nome}</CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 space-y-6">
                {secao.itens.filter(verificarItemVisivel).map((item) => (
                  <div key={item.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-base text-gray-900">{item.titulo}</h3>
                        {item.obrigatorio && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Obrigat·≥rio</Badge>
                        )}
                        {item.status === 'preenchido' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      
                      {item.descricao && (
                        <p className="text-sm text-gray-700">{item.descricao}</p>
                      )}
                    </div>

                    {renderCampoItem(item, secao.id)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Fixo */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="flex gap-3">
            <Button
              onClick={compartilharChecklist}
              variant="outline"
              disabled={progresso === 0}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 font-medium min-h-[52px] touch-manipulation text-base"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar
            </Button>
            
            <Button
              onClick={enviarChecklist}
              disabled={!podeEnviar() || loading}
              className="flex-2 bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] touch-manipulation text-base"
            >
              <Send className="w-5 h-5 mr-2" />
              {loading ? 'Enviando...' : `Enviar (${progresso.toFixed(0)}%)`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

      return (
      <ProtectedRoute requiredModule="checklists">
        <div className="main-content min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ol·°, <strong className="text-gray-800 dark:text-gray-200">{usuario.nome}</strong>
            </p>
            {/* Abas */}
            <div className="flex border-b">
              <button
                onClick={() => setAba('pendentes')}
                className={`px-6 py-3 text-base font-medium border-b-2 transition-colors touch-manipulation min-h-[48px] ${
                  aba === 'pendentes'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                üìù Pendentes ({checklists.length})
              </button>
              <button
                onClick={() => setAba('realizados')}
                className={`px-6 py-3 text-base font-medium border-b-2 transition-colors touch-manipulation min-h-[48px] ${
                  aba === 'realizados'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                úÖ Realizados ({checklistsRealizados.length})
              </button>
            </div>
          </div>
        </div>

        {/* Conte·∫do das Abas */}
        <div className="p-4 space-y-4">
          {aba === 'pendentes' ? (
            checklists.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum checklist pendente</h3>
                <p className="text-gray-600">Voc·™ est·° em dia com suas verifica·ß·µes! üéâ</p>
              </div>
            ) : (
              checklists.map((checklist) => {
              const setor = setoresConfig.find((s) => s.id === checklist.setor)
              const SetorIcon = setor?.icon || FileText

              return (
                <Card key={checklist.id} className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* ·çcone do Setor */}
                      <div className={`p-3 rounded-lg ${setor?.cor} text-white flex-shrink-0`}>
                        <SetorIcon className="w-6 h-6" />
                      </div>

                      {/* Informa·ß·µes */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">{checklist.nome}</h3>
                          
                          {checklist.status === 'atrasado' && (
                            <Badge className="bg-red-100 text-red-800 flex-shrink-0 border border-red-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Atrasado
                            </Badge>
                          )}
                          
                          {checklist.prioridade === 'alta' && (
                            <Badge className="bg-orange-100 text-orange-800 flex-shrink-0 border border-orange-200">
                              Prioridade Alta
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{checklist.descricao}</p>

                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            ~{checklist.tempo_estimado}min
                          </div>
                          {checklist.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              At·© {checklist.deadline}
                            </div>
                          )}
                        </div>

                        <Button 
                          onClick={() => iniciarChecklist(checklist)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all hover:shadow-md min-h-[48px] touch-manipulation text-base"
                        >
                          {checklist.status === 'em_andamento' ? 'Continuar' : 'Iniciar'} Checklist
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
            )
          ) : (
            // Aba Realizados
            loadingRealizados ? (
              <div className="text-center py-12">
                <Timer className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-700 font-medium">Carregando checklists realizados...</p>
              </div>
            ) : checklistsRealizados.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum checklist realizado</h3>
                <p className="text-gray-600">Complete alguns checklists para v·™-los aqui üìä</p>
              </div>
            ) : (
              checklistsRealizados.map((execucao) => (
                <Card key={execucao.id} className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className="p-3 rounded-lg bg-green-500 text-white flex-shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>

                      {/* Informa·ß·µes */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {execucao.checklists?.nome || 'Checklist'}
                          </h3>
                          <Badge className="bg-green-100 text-green-800 flex-shrink-0 border border-green-200">
                            úÖ Conclu·≠do
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">
                          {execucao.checklists?.descricao || 'Sem descri·ß·£o'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {execucao.tempo_execucao || 0} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {new Date(execucao.concluido_em).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-green-50 p-2 rounded text-center">
                            <div className="font-medium text-green-700">{execucao.itens_ok || 0}</div>
                            <div className="text-green-600">OK</div>
                          </div>
                          <div className="bg-red-50 p-2 rounded text-center">
                            <div className="font-medium text-red-700">{execucao.itens_problema || 0}</div>
                            <div className="text-red-600">Problemas</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded text-center">
                            <div className="font-medium text-gray-700">{execucao.total_itens || 0}</div>
                            <div className="text-gray-600">Total</div>
                          </div>
                        </div>

                        {execucao.observacoes_gerais && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                            <strong>Obs:</strong> {execucao.observacoes_gerais}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          )}
        </div>

        {/* Componente de C·¢mera */}
        <CameraCapture
          isOpen={cameraAberta}
          onCapture={handleFotoCapturada}
          onClose={() => {
            setCameraAberta(false)
            setItemFotoAtual(null)
          }}
          title="Capturar Foto para Checklist"
        />

        {/* Modal de Assinatura */}
        {assinaturaPadAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="bg-blue-600 text-white p-4">
                <h2 className="text-lg font-semibold">úçÔ∏è Assinatura Digital</h2>
                <p className="text-sm opacity-90">Assine no espa·ßo abaixo para confirmar</p>
              </div>
              
              <div className="p-4">
                <SignaturePad
                  onSignatureComplete={handleAssinaturaCapturada}
                  onSignatureCancel={handleAssinaturaCancelada}
                  onError={(error) => {
                    console.error('üö® Erro na assinatura:', error)
                    alert('ùå Erro na assinatura: ' + error)
                  }}
                  width={350}
                  height={200}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 
