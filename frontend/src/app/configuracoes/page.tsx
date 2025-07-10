'use client'

import { useState, useEffect, Suspense, Component, ReactNode } from 'react'
import { useBar } from '@/contexts/BarContext'
import { useFavicon } from '@/hooks/useFavicon'
import { usePermissions } from '@/hooks/usePermissions'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { PageBase, PageHeader, PageContent, PageCard, PageText } from '@/components/ui/page-base'
import { getSupabaseClient } from '@/lib/supabase'
import MetaAPIConfig from '@/components/configuracoes/MetaAPIConfig'
import ContaAzulOAuth from '@/components/configuracoes/ContaAzulOAuth'
import { 
  Settings, 
  Users, 
  Target, 
  User, 
  Mail, 
  Shield, 
  Edit3, 
  Trash2, 
  Link, 
  Power, 
  UserPlus,
  XCircle,
  Crown,
  UserCog,
  Eye,
  BarChart3,
  UserCheck,
  Puzzle,
  Search
} from 'lucide-react'

// Interfaces
interface MetasConfig {
  // === METAS DIÁRIAS ===
  faturamentoDiario: number
  clientesDiario: number
  ticketMedioTarget: number
  reservasDiarias: number
  tempoSaidaCozinhaDiario: number    // em minutos
  tempoSaidaBarDiario: number         // em minutos
  tempoMedioAtendimentoDiario: number // em minutos
  
  // === METAS SEMANAIS ===
  faturamentoSemanal: number
  clientesSemanais: number
  reservasSemanais: number
  tempoSaidaCozinhaSemanal: number
  tempoSaidaBarSemanal: number
  tempoMedioAtendimentoSemanal: number
  checklistConclusaoSemanal: number  // % de conclusão
  
  // === METAS MENSAIS ===
  metaMensalFaturamento: number
  metaMensalClientes: number
  reservasMensais: number
  tempoSaidaCozinhaMensal: number
  tempoSaidaBarMensal: number
  tempoMedioAtendimentoMensal: number
  metaEficienciaProducao: number     // % eficiência
  checklistConclusaoMensal: number   // % de conclusão
  
  // === METAS DE MARKETING ===
  metaPostsInstagram: number          // Número de Posts IG
  metaAlcanceInstagram: number        // Alcance IG
  metaInteracaoInstagram: number      // Interação IG
  metaCompartilhamentoInstagram: number // Compartilhamento IG
  metaEngajamentoInstagram: number    // Engajamento IG
  metaStoriesInstagram: number        // Número Stories IG
  metaVisuStoriesInstagram: number    // Visualizações Stories IG
  metaValorInvestido: number          // Valor Investido Marketing
  metaFrequenciaMarketing: number     // Frequência
  metaCPM: number                     // Custo por Mil Visualizações
  metaCliquesMarketing: number        // Cliques
  metaCTR: number                     // Taxa de Clique (%)
  metaCustoClique: number             // Custo por Clique
  metaConversasIniciadas: number      // Conversas Iniciadas
}

interface Usuario {
  id?: number
  bar_id: number
  user_id: string
  email: string
  nome: string
  role: 'admin' | 'manager' | 'funcionario'
  modulos_permitidos: string[]
  ativo: boolean
  criado_em?: string
  atualizado_em?: string
}

interface NovoUsuario {
  email: string
  nome: string
  password: string
  role: 'admin' | 'manager' | 'funcionario'
  modulos_permitidos: string[]
}

interface ModuloPermissao {
  id: string
  nome: string
  descricao: string
  categoria: 'checklists' | 'reservas' | 'dashboards' | 'gestao' | 'relatorios' | 'marketing' | 'administracao'
}

const MODULOS_SISTEMA: ModuloPermissao[] = [
  // 📋 CHECKLISTS & OPERAÇÕES BÁSICAS
  { id: 'operacoes', nome: 'Checklists Administrativos', descricao: 'Admin checklists, templates e relatórios', categoria: 'checklists' },
  { id: 'receitas_insumos', nome: 'Receitas & Insumos', descricao: 'Gerenciar receitas e insumos', categoria: 'checklists' },
  { id: 'terminal_producao', nome: 'Terminal de Produção', descricao: 'Acesso ao terminal de produção', categoria: 'checklists' },
  { id: 'relatorio_producoes', nome: 'Relatório Produções', descricao: 'Relatórios de produção', categoria: 'checklists' },
  
  // 🎫 RESERVAS & PLANEJAMENTO
  { id: 'recorrencia', nome: 'Recorrência Clientes', descricao: 'Análise de recorrência de clientes', categoria: 'reservas' },
  { id: 'planejamento', nome: 'Planejamento', descricao: 'Ferramentas de planejamento', categoria: 'reservas' },
  
  // 📦 CONTAHUB - DASHBOARDS & ANÁLISES
  { id: 'dashboard_diario', nome: 'Dashboard Diário', descricao: 'Métricas e análises diárias', categoria: 'dashboards' },
  { id: 'dashboard_semanal', nome: 'Dashboard Semanal', descricao: 'Métricas e análises semanais', categoria: 'dashboards' },
  { id: 'dashboard_financeiro_mensal', nome: 'Financeiro Mensal', descricao: 'Dashboard financeiro mensal', categoria: 'dashboards' },
  { id: 'dashboard_metrica_evolucao', nome: 'Evolução Métricas', descricao: 'Evolução das métricas ao longo do tempo', categoria: 'dashboards' },
  { id: 'dashboard_metricas_barras', nome: 'Métricas Mensais', descricao: 'Métricas mensais em formato de barras', categoria: 'dashboards' },
  { id: 'dashboard_comparativo', nome: 'Dashboard Comparativo', descricao: 'Comparações e análises comparativas', categoria: 'dashboards' },
  { id: 'dashboard_garcons', nome: 'Análise Garçons', descricao: 'Performance e análise de garçons', categoria: 'dashboards' },
  
  // 📦 CONTAHUB - GESTÃO & CONTROLES
  { id: 'produtos', nome: 'Gestão Produtos', descricao: 'Gerenciar produtos e categorias', categoria: 'gestao' },
  { id: 'tempo', nome: 'Tempos Médios', descricao: 'Análise e controle de tempos médios', categoria: 'gestao' },
  { id: 'periodo', nome: 'Gestão de Período', descricao: 'Controles de período e sazonalidade', categoria: 'gestao' },
  
  // 📊 RELATÓRIOS & DADOS
  { id: 'relatorio_produtos', nome: 'Relatório Produtos & ContaAzul', descricao: 'Relatórios de produtos e integração ContaAzul', categoria: 'relatorios' },
  { id: 'analitico', nome: 'Relatório Analítico', descricao: 'Relatórios analíticos detalhados', categoria: 'relatorios' },
  { id: 'fatporhora', nome: 'Faturamento por Hora', descricao: 'Análise de faturamento por hora', categoria: 'relatorios' },
  { id: 'nfs', nome: 'Notas Fiscais', descricao: 'Relatórios de notas fiscais', categoria: 'relatorios' },
  { id: 'pagamentos', nome: 'Relatório Pagamentos', descricao: 'Relatórios de formas de pagamento', categoria: 'relatorios' },
  
  // 📱 MARKETING & REDES SOCIAIS
  { id: 'marketing_360', nome: 'Marketing 360°', descricao: 'Ferramentas completas de marketing e redes sociais', categoria: 'marketing' },
  
  // ⚙️ ADMINISTRAÇÃO & CONFIGURAÇÕES
  { id: 'configuracoes', nome: 'Configurações Gerais', descricao: 'Configurações do sistema, metas e integrações', categoria: 'administracao' }
]

const ROLES_SISTEMA: Record<'admin' | 'manager' | 'funcionario', {
  nome: string
  descricao: string
  cor: string
  modulos_default: string[]
}> = {
  admin: {
    nome: 'Administrador',
    descricao: 'Acesso total ao sistema',
    cor: 'bg-red-100 text-red-800',
    modulos_default: MODULOS_SISTEMA.map(m => m.id)
  },
  manager: {
    nome: 'Gerente',
    descricao: 'Acesso a dashboards, gestão, reservas e relatórios',
    cor: 'bg-blue-100 text-blue-800',
    modulos_default: [
      // ContaHub - Dashboards & Análises
      'dashboard_diario', 'dashboard_semanal', 'dashboard_financeiro_mensal', 
      'dashboard_metrica_evolucao', 'dashboard_metricas_barras', 'dashboard_comparativo', 'dashboard_garcons',
      // ContaHub - Gestão & Controles
      'produtos', 'tempo', 'periodo',
      // Reservas & Planejamento
      'recorrencia', 'planejamento',
      // Operações básicas
      'receitas_insumos', 'relatorio_producoes',
      // Relatórios & Dados
      'relatorio_produtos', 'analitico', 'fatporhora', 'nfs', 'pagamentos',
      // Marketing
      'marketing_360'
    ]
  },
  funcionario: {
    nome: 'Funcionário',
    descricao: 'Acesso básico para operações diárias',
    cor: 'bg-green-100 text-green-800',
    modulos_default: [
      'terminal_producao',
      'dashboard_diario'
    ]
  }
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔥 Erro no componente:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ops! Algo deu errado</h3>
            <p className="text-gray-600 mb-4">Encontramos um erro inesperado nesta seção.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function ConfiguracoesContent() {
  const { selectedBar } = useBar()
  const { hasPermission, isRole } = usePermissions()
  const [activeTab, setActiveTab] = useState('metas')

  // Suportar parâmetro tab na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabFromUrl = urlParams.get('tab')
    if (tabFromUrl && ['metas', 'usuarios', 'atribuicoes', 'integracoes', 'marketing'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [])

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)
  const [operandoUsuario, setOperandoUsuario] = useState<number | null>(null)
  const [buscaUsuario, setBuscaUsuario] = useState('')
  
  // Estados para usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string | null>(null)
  const [modalUsuario, setModalUsuario] = useState(false)
  const [modalPermissoes, setModalPermissoes] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null)
  const [usuarioPermissoes, setUsuarioPermissoes] = useState<any>(null)
  const [permissoesAlteradas, setPermissoesAlteradas] = useState(false)
  const [novoUsuario, setNovoUsuario] = useState({
    email: '',
    nome: '',
    password: '',
    role: 'funcionario',
    modulos_permitidos: ['terminal_producao']
  })
  
  // Estados para Metas
  const [metas, setMetas] = useState({
    // === METAS DIÁRIAS ===
    faturamentoDiario: 37000,
    clientesDiario: 500,
    ticketMedioTarget: 93,
    reservasDiarias: 133,
    tempoSaidaCozinhaDiario: 12,    // em minutos
    tempoSaidaBarDiario: 4,         // em minutos
    tempoMedioAtendimentoDiario: 15, // em minutos
    
    // === METAS SEMANAIS ===
    faturamentoSemanal: 250000,
    clientesSemanais: 3500,
    reservasSemanais: 800,
    tempoSaidaCozinhaSemanal: 12,
    tempoSaidaBarSemanal: 4,
    tempoMedioAtendimentoSemanal: 15,
    checklistConclusaoSemanal: 95,  // % de conclusão
    
    // === METAS MENSAIS ===
    metaMensalFaturamento: 1000000,
    metaMensalClientes: 10000,
    reservasMensais: 3200,
    tempoSaidaCozinhaMensal: 12,
    tempoSaidaBarMensal: 4,
    tempoMedioAtendimentoMensal: 15,
    metaEficienciaProducao: 85,     // % eficiência
    checklistConclusaoMensal: 98,   // % de conclusão
    
    // === METAS DE MARKETING ===
    metaPostsInstagram: 0,          // Número de Posts IG
    metaAlcanceInstagram: 0,        // Alcance IG
    metaInteracaoInstagram: 0,      // Interação IG
    metaCompartilhamentoInstagram: 0, // Compartilhamento IG
    metaEngajamentoInstagram: 0,    // Engajamento IG
    metaStoriesInstagram: 0,        // Número Stories IG
    metaVisuStoriesInstagram: 0,    // Visualizações Stories IG
    metaValorInvestido: 0,          // Valor Investido Marketing
    metaFrequenciaMarketing: 0,     // Frequência
    metaCPM: 0,                     // Custo por Mil Visualizações
    metaCliquesMarketing: 0,        // Cliques
    metaCTR: 0,                     // Taxa de Clique (%)
    metaCustoClique: 0,             // Custo por Clique
    metaConversasIniciadas: 0       // Conversas Iniciadas
  })

  // Carregar usuários quando necessário
  useEffect(() => {
    if (activeTab === 'usuarios' && selectedBar?.id) {
      carregarUsuarios()
    }
  }, [activeTab, selectedBar?.id])

  const carregarUsuarios = async () => {
    if (!selectedBar?.id) return
    
    setCarregandoUsuarios(true)
    try {
      const response = await fetch(`/api/admin/usuarios?bar_id=${selectedBar.id}`)
      const data = await response.json()
      
      if (data.success) {
        setUsuarios(data.usuarios || [])
      } else {
        console.error('Erro ao carregar usuários:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setCarregandoUsuarios(false)
    }
  }

  const alternarPermissaoModulo = async (usuarioId: number, moduloId: string) => {
    try {
      const usuario = usuarios.find(u => u.id === usuarioId)
      if (!usuario) return

      const modulosAtuais = Array.isArray(usuario.modulos_permitidos) ? usuario.modulos_permitidos : []
      const novasPermissoes = modulosAtuais.includes(moduloId)
        ? modulosAtuais.filter(id => id !== moduloId)
        : [...modulosAtuais, moduloId]

      // Atualizar localmente primeiro
      setUsuarios(prev => prev.map(u => 
        u.id === usuarioId 
          ? { ...u, modulos_permitidos: novasPermissoes }
          : u
      ))

      // Enviar para a API
      const response = await fetch('/api/admin/usuarios/permissoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          bar_id: selectedBar?.id,
          modulos_permitidos: novasPermissoes
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar permissões')
      }

      console.log(`✅ Permissões atualizadas para ${usuario.nome}`)
    } catch (error) {
      console.error('❌ Erro ao alterar permissão:', error)
      // Reverter mudança local em caso de erro
      carregarUsuarios()
    }
  }

  const updateMeta = (field: any, value: number) => {
    setMetas(prev => ({ ...prev, [field]: value }))
  }

  const salvarMetas = async () => {
    if (!selectedBar?.id) return
    setLoading(true)
    try {
      const response = await fetch('/api/admin/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: selectedBar.id, ...metas })
      })
      if (response.ok) {
        setSaved(true)
        alert('Metas salvas com sucesso!')
        setTimeout(() => setSaved(false), 3000)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar metas')
      }
    } catch (error) {
      console.error('Erro ao salvar metas:', error)
      alert('Erro ao salvar metas')
    } finally {
      setLoading(false)
    }
  }

  // Usuarios options for SelectWithSearch
  const usuariosOptions = usuarios.map(usuario => ({
    value: usuario.id?.toString() || '',
    label: `${usuario.nome} (${usuario.email})`,
    searchTerms: [usuario.nome, usuario.email, usuario.role].filter(Boolean)
  }))

  const usuarioAtual = usuarios.find(u => u.id?.toString() === usuarioSelecionado)

  // Placeholder functions
  const abrirEdicaoUsuario = (usuario: any) => {
    setUsuarioEditando(usuario)
    setNovoUsuario({
      email: usuario.email,
      nome: usuario.nome,
      password: '',
      role: usuario.role,
      modulos_permitidos: usuario.modulos_permitidos || []
    })
    setModalUsuario(true)
  }

  const gerarLinkRedefinicao = async (usuario: any) => {
    try {
      // Simular geração de link (em um sistema real, seria via API)
      const linkRedefini = `${window.location.origin}/redefinir-senha?token=${Math.random().toString(36).substring(7)}&email=${usuario.email}`
      navigator.clipboard.writeText(linkRedefini)
      alert(`Link de redefinição copiado para área de transferência!\n\n${linkRedefini}`)
    } catch (error) {
      alert('Erro ao gerar link de redefinição')
    }
  }

  const alternarStatusUsuario = async (usuario: any) => {
    if (!selectedBar?.id || !usuario.id || operandoUsuario === usuario.id) return
    
    setOperandoUsuario(usuario.id)
    try {
      const novoStatus = !usuario.ativo
      const response = await fetch('/api/admin/usuarios/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          bar_id: selectedBar.id,
          ativo: novoStatus
        })
      })

      if (response.ok) {
        // Atualizar lista local
        setUsuarios(prev => prev.map(u => 
          u.id === usuario.id ? { ...u, ativo: novoStatus } : u
        ))
        alert(`Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
      } else {
        throw new Error('Erro na resposta da API')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status do usuário')
    } finally {
      setOperandoUsuario(null)
    }
  }

  const excluirUsuario = async (usuario: any) => {
    if (operandoUsuario === usuario.id) return
    
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?\n\nEsta ação não pode ser desfeita.`)) {
      return
    }

    setOperandoUsuario(usuario.id)
    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          bar_id: selectedBar?.id
        })
      })

      if (response.ok) {
        // Remover da lista local
        setUsuarios(prev => prev.filter(u => u.id !== usuario.id))
        alert('Usuário excluído com sucesso!')
      } else {
        throw new Error('Erro na resposta da API')
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário')
    } finally {
      setOperandoUsuario(null)
    }
  }

  const aplicarRoleDefault = (role: string) => {
    const modulosDefault = ROLES_SISTEMA[role as keyof typeof ROLES_SISTEMA]?.modulos_default || ['terminal_producao']
    setNovoUsuario(prev => ({ ...prev, role, modulos_permitidos: modulosDefault }))
  }

  const salvarUsuario = async () => {
    if (!selectedBar?.id) return
    
    // Validações
    if (!novoUsuario.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }
    if (!novoUsuario.email.trim()) {
      alert('Email é obrigatório')
      return
    }
    if (!novoUsuario.password.trim()) {
      alert('Senha é obrigatória')
      return
    }

    setSalvandoUsuario(true)
    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ...novoUsuario
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Adicionar à lista local
        setUsuarios(prev => [...prev, data.usuario])
        setModalUsuario(false)
        limparFormularioUsuario()
        alert('Usuário criado com sucesso!')
      } else {
        alert(data.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário')
    } finally {
      setSalvandoUsuario(false)
    }
  }

  const atualizarUsuario = async () => {
    if (!selectedBar?.id || !usuarioEditando?.id) return
    
    // Validações
    if (!novoUsuario.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }
    if (!novoUsuario.email.trim()) {
      alert('Email é obrigatório')
      return
    }

    setSalvandoUsuario(true)
    try {
      const updateData: any = {
        usuario_id: usuarioEditando.id,
        bar_id: selectedBar.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        role: novoUsuario.role,
        modulos_permitidos: novoUsuario.modulos_permitidos
      }

      // Só incluir senha se foi alterada
      if (novoUsuario.password.trim()) {
        updateData.password = novoUsuario.password
      }

      const response = await fetch('/api/admin/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      
      if (response.ok) {
        // Atualizar lista local
        setUsuarios(prev => prev.map(u => 
          u.id === usuarioEditando.id ? { ...u, ...data.usuario } : u
        ))
        setModalUsuario(false)
        setUsuarioEditando(null)
        limparFormularioUsuario()
        alert('Usuário atualizado com sucesso!')
      } else {
        alert(data.error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('Erro ao atualizar usuário')
    } finally {
      setSalvandoUsuario(false)
    }
  }

  const alternarPermissao = (moduloId: string) => {
    if (!usuarioPermissoes) return
    const modulosAtuais = Array.isArray(usuarioPermissoes.modulos_permitidos) ? usuarioPermissoes.modulos_permitidos : []
    const novasPermissoes = modulosAtuais.includes(moduloId)
      ? modulosAtuais.filter((id: string) => id !== moduloId)
      : [...modulosAtuais, moduloId]
    
    setUsuarioPermissoes((prev: any) => ({ ...prev, modulos_permitidos: novasPermissoes }))
    setPermissoesAlteradas(true)
  }

  const salvarPermissoes = async () => {
    alert('Função em desenvolvimento')
  }

  const agruparModulosPorCategoria = () => {
    return MODULOS_SISTEMA.reduce((acc, modulo) => {
      if (!acc[modulo.categoria]) acc[modulo.categoria] = []
      acc[modulo.categoria].push(modulo)
      return acc
    }, {} as Record<string, ModuloPermissao[]>)
  }

  const limparFormularioUsuario = () => {
    setNovoUsuario({
      email: '',
      nome: '',
      password: '',
      role: 'funcionario',
      modulos_permitidos: ['terminal_producao']
    })
    setUsuarioEditando(null)
  }

  // Filtrar usuários baseado na busca
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (!buscaUsuario.trim()) return true
    
    const termoBusca = buscaUsuario.toLowerCase()
  return (
      usuario.nome.toLowerCase().includes(termoBusca) ||
      usuario.email.toLowerCase().includes(termoBusca) ||
      usuario.role.toLowerCase().includes(termoBusca)
    )
  })

  // Verificar quais abas mostrar baseado nas permissões
  const showUsersTab = isRole('admin')
  const showIntegracoesTab = isRole('admin')
  const showMarketingTab = hasPermission('marketing_360')

  return (
    <PageBase className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <PageHeader title="⚙️ Configurações" />
      <PageText className="mb-6 text-gray-600">
        Gerencie todas as configurações do {selectedBar?.nome || 'bar selecionado'}
      </PageText>
      
      <PageContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="metas" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Metas & KPIs</span>
              <span className="sm:hidden">Metas</span>
            </TabsTrigger>

            {showUsersTab && (
            <TabsTrigger 
              value="usuarios" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Users</span>
            </TabsTrigger>
            )}



            {showIntegracoesTab && (
              <TabsTrigger 
                value="integracoes" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Puzzle className="w-4 h-4" />
                <span className="hidden sm:inline">Integrações</span>
                <span className="sm:hidden">API</span>
              </TabsTrigger>
            )}

            {showMarketingTab && (
            <TabsTrigger 
              value="marketing" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Marketing</span>
                <span className="sm:hidden">Social</span>
            </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="metas">
            <PageCard title="Configuração de Metas" className="minimal-card">
              <div className="flex gap-2 mb-6">
                <Button onClick={salvarMetas} disabled={loading} className={`minimal-button ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
                  {loading ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar Metas'}
                </Button>
              </div>

              <div className="space-y-8">
                {/* === METAS DIÁRIAS === */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <PageText variant="subtitle" className="text-blue-700 border-b border-blue-300 pb-3 mb-6 font-bold text-lg">📅 Metas Diárias</PageText>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-3">
                    <Label htmlFor="faturamentoDiario" className="text-gray-700 font-medium">Faturamento Diário (R$)</Label>
                    <Input
                      id="faturamentoDiario"
                      type="number"
                      value={metas.faturamentoDiario}
                      onChange={(e) => updateMeta('faturamentoDiario', Number(e.target.value))}
                      placeholder="37000"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                    <div className="space-y-3">
                    <Label htmlFor="clientesDiario" className="text-gray-700 font-medium">Clientes por Dia</Label>
                    <Input
                      id="clientesDiario"
                      type="number"
                      value={metas.clientesDiario}
                      onChange={(e) => updateMeta('clientesDiario', Number(e.target.value))}
                      placeholder="500"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                    <div className="space-y-3">
                    <Label htmlFor="ticketMedioTarget" className="text-gray-700 font-medium">Ticket Médio Alvo (R$)</Label>
                    <Input
                      id="ticketMedioTarget"
                      type="number"
                      value={metas.ticketMedioTarget}
                      onChange={(e) => updateMeta('ticketMedioTarget', Number(e.target.value))}
                      placeholder="93"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                    <div className="space-y-3">
                      <Label htmlFor="reservasDiarias" className="text-gray-700 font-medium">Reservas Diárias</Label>
                      <Input
                        id="reservasDiarias"
                        type="number"
                        value={metas.reservasDiarias}
                        onChange={(e) => updateMeta('reservasDiarias', Number(e.target.value))}
                        placeholder="133"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <PageText className="text-blue-700 font-medium mb-3">⏱️ Tempos (em minutos)</PageText>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="tempoSaidaCozinhaDiario" className="text-gray-700 font-medium">Tempo Saída Cozinha</Label>
                        <Input
                          id="tempoSaidaCozinhaDiario"
                          type="number"
                          value={metas.tempoSaidaCozinhaDiario}
                          onChange={(e) => updateMeta('tempoSaidaCozinhaDiario', Number(e.target.value))}
                          placeholder="12"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="tempoSaidaBarDiario" className="text-gray-700 font-medium">Tempo Saída Bar</Label>
                        <Input
                          id="tempoSaidaBarDiario"
                          type="number"
                          value={metas.tempoSaidaBarDiario}
                          onChange={(e) => updateMeta('tempoSaidaBarDiario', Number(e.target.value))}
                          placeholder="4"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="tempoMedioAtendimentoDiario" className="text-gray-700 font-medium">Tempo Médio Atendimento</Label>
                        <Input
                          id="tempoMedioAtendimentoDiario"
                          type="number"
                          value={metas.tempoMedioAtendimentoDiario}
                          onChange={(e) => updateMeta('tempoMedioAtendimentoDiario', Number(e.target.value))}
                          placeholder="15"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* === METAS SEMANAIS === */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <PageText variant="subtitle" className="text-green-700 border-b border-green-300 pb-3 mb-6 font-bold text-lg">📊 Metas Semanais</PageText>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="faturamentoSemanal" className="text-gray-700 font-medium">Faturamento Semanal (R$)</Label>
                      <Input
                        id="faturamentoSemanal"
                        type="number"
                        value={metas.faturamentoSemanal}
                        onChange={(e) => updateMeta('faturamentoSemanal', Number(e.target.value))}
                        placeholder="250000"
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="clientesSemanais" className="text-gray-700 font-medium">Clientes por Semana</Label>
                      <Input
                        id="clientesSemanais"
                        type="number"
                        value={metas.clientesSemanais}
                        onChange={(e) => updateMeta('clientesSemanais', Number(e.target.value))}
                        placeholder="3500"
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="reservasSemanais" className="text-gray-700 font-medium">Reservas Semanais</Label>
                      <Input
                        id="reservasSemanais"
                        type="number"
                        value={metas.reservasSemanais}
                        onChange={(e) => updateMeta('reservasSemanais', Number(e.target.value))}
                        placeholder="800"
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <PageText className="text-green-700 font-medium mb-3">⏱️ Tempos (em minutos)</PageText>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-3">
                            <Label htmlFor="tempoSaidaCozinhaSemanal" className="text-gray-700 font-medium">Tempo Saída Cozinha</Label>
                            <Input
                              id="tempoSaidaCozinhaSemanal"
                              type="number"
                              value={metas.tempoSaidaCozinhaSemanal}
                              onChange={(e) => updateMeta('tempoSaidaCozinhaSemanal', Number(e.target.value))}
                              placeholder="12"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="tempoSaidaBarSemanal" className="text-gray-700 font-medium">Tempo Saída Bar</Label>
                            <Input
                              id="tempoSaidaBarSemanal"
                              type="number"
                              value={metas.tempoSaidaBarSemanal}
                              onChange={(e) => updateMeta('tempoSaidaBarSemanal', Number(e.target.value))}
                              placeholder="4"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="tempoMedioAtendimentoSemanal" className="text-gray-700 font-medium">Tempo Médio Atendimento</Label>
                            <Input
                              id="tempoMedioAtendimentoSemanal"
                              type="number"
                              value={metas.tempoMedioAtendimentoSemanal}
                              onChange={(e) => updateMeta('tempoMedioAtendimentoSemanal', Number(e.target.value))}
                              placeholder="15"
                              className="border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <PageText className="text-green-700 font-medium mb-3">✅ Checklists</PageText>
                        <div className="space-y-3">
                          <Label htmlFor="checklistConclusaoSemanal" className="text-gray-700 font-medium">% Conclusão Checklists</Label>
                          <Input
                            id="checklistConclusaoSemanal"
                            type="number"
                            min="0"
                            max="100"
                            value={metas.checklistConclusaoSemanal}
                            onChange={(e) => updateMeta('checklistConclusaoSemanal', Number(e.target.value))}
                            placeholder="95"
                            className="border-gray-300 focus:border-green-500 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* === METAS MENSAIS === */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                  <PageText variant="subtitle" className="text-purple-700 border-b border-purple-300 pb-3 mb-6 font-bold text-lg">📈 Metas Mensais</PageText>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-3">
                    <Label htmlFor="metaMensalFaturamento" className="text-gray-700 font-medium">Faturamento Mensal (R$)</Label>
                    <Input
                      id="metaMensalFaturamento"
                      type="number"
                      value={metas.metaMensalFaturamento}
                      onChange={(e) => updateMeta('metaMensalFaturamento', Number(e.target.value))}
                      placeholder="1000000"
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                    />
                  </div>

                    <div className="space-y-3">
                    <Label htmlFor="metaMensalClientes" className="text-gray-700 font-medium">Clientes por Mês</Label>
                    <Input
                      id="metaMensalClientes"
                      type="number"
                      value={metas.metaMensalClientes}
                      onChange={(e) => updateMeta('metaMensalClientes', Number(e.target.value))}
                      placeholder="10000"
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="reservasMensais" className="text-gray-700 font-medium">Reservas Mensais</Label>
                      <Input
                        id="reservasMensais"
                        type="number"
                        value={metas.reservasMensais}
                        onChange={(e) => updateMeta('reservasMensais', Number(e.target.value))}
                        placeholder="3200"
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                    />
                  </div>
                </div>

                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <PageText className="text-purple-700 font-medium mb-3">⏱️ Tempos (em minutos)</PageText>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-3">
                            <Label htmlFor="tempoSaidaCozinhaMensal" className="text-gray-700 font-medium">Tempo Saída Cozinha</Label>
                    <Input
                              id="tempoSaidaCozinhaMensal"
                      type="number"
                              value={metas.tempoSaidaCozinhaMensal}
                              onChange={(e) => updateMeta('tempoSaidaCozinhaMensal', Number(e.target.value))}
                      placeholder="12"
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                    />
                  </div>

                          <div className="space-y-3">
                            <Label htmlFor="tempoSaidaBarMensal" className="text-gray-700 font-medium">Tempo Saída Bar</Label>
                    <Input
                              id="tempoSaidaBarMensal"
                      type="number"
                              value={metas.tempoSaidaBarMensal}
                              onChange={(e) => updateMeta('tempoSaidaBarMensal', Number(e.target.value))}
                      placeholder="4"
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                    />
                  </div>

                          <div className="space-y-3">
                            <Label htmlFor="tempoMedioAtendimentoMensal" className="text-gray-700 font-medium">Tempo Médio Atendimento</Label>
                            <Input
                              id="tempoMedioAtendimentoMensal"
                              type="number"
                              value={metas.tempoMedioAtendimentoMensal}
                              onChange={(e) => updateMeta('tempoMedioAtendimentoMensal', Number(e.target.value))}
                              placeholder="15"
                              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <PageText className="text-purple-700 font-medium mb-3">🏭 Eficiência</PageText>
                            <div className="space-y-3">
                    <Label htmlFor="metaEficienciaProducao" className="text-gray-700 font-medium">Eficiência Produção (%)</Label>
                    <Input
                      id="metaEficienciaProducao"
                      type="number"
                      min="0"
                      max="100"
                      value={metas.metaEficienciaProducao}
                      onChange={(e) => updateMeta('metaEficienciaProducao', Number(e.target.value))}
                      placeholder="85"
                                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                              />
                            </div>
                          </div>

                          <div>
                            <PageText className="text-purple-700 font-medium mb-3">✅ Checklists</PageText>
                            <div className="space-y-3">
                              <Label htmlFor="checklistConclusaoMensal" className="text-gray-700 font-medium">% Conclusão Checklists</Label>
                              <Input
                                id="checklistConclusaoMensal"
                                type="number"
                                min="0"
                                max="100"
                                value={metas.checklistConclusaoMensal}
                                onChange={(e) => updateMeta('checklistConclusaoMensal', Number(e.target.value))}
                                placeholder="98"
                                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* === METAS DE MARKETING === */}
                <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-6 border border-pink-200">
                  <PageText variant="subtitle" className="text-pink-700 border-b border-pink-300 pb-3 mb-6 font-bold text-lg">🚀 Metas de Marketing</PageText>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Instagram Organic */}
                    <div>
                      <PageText className="text-pink-700 font-medium mb-4">📱 Instagram Orgânico</PageText>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="metaPostsInstagram" className="text-gray-700 font-medium">Nº de Posts</Label>
                          <Input
                            id="metaPostsInstagram"
                            type="number"
                            value={metas.metaPostsInstagram}
                            onChange={(e) => updateMeta('metaPostsInstagram', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaAlcanceInstagram" className="text-gray-700 font-medium">Alcance</Label>
                          <Input
                            id="metaAlcanceInstagram"
                            type="number"
                            value={metas.metaAlcanceInstagram}
                            onChange={(e) => updateMeta('metaAlcanceInstagram', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaInteracaoInstagram" className="text-gray-700 font-medium">Interação</Label>
                          <Input
                            id="metaInteracaoInstagram"
                            type="number"
                            value={metas.metaInteracaoInstagram}
                            onChange={(e) => updateMeta('metaInteracaoInstagram', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaCompartilhamentoInstagram" className="text-gray-700 font-medium">Compartilhamento</Label>
                          <Input
                            id="metaCompartilhamentoInstagram"
                            type="number"
                            value={metas.metaCompartilhamentoInstagram}
                            onChange={(e) => updateMeta('metaCompartilhamentoInstagram', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaEngajamentoInstagram" className="text-gray-700 font-medium">Engajamento</Label>
                          <Input
                            id="metaEngajamentoInstagram"
                            type="number"
                            value={metas.metaEngajamentoInstagram}
                            onChange={(e) => updateMeta('metaEngajamentoInstagram', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaStoriesInstagram" className="text-gray-700 font-medium">Nº Stories</Label>
                          <Input
                            id="metaStoriesInstagram"
                            type="number"
                            value={metas.metaStoriesInstagram}
                            onChange={(e) => updateMeta('metaStoriesInstagram', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3 md:col-span-2">
                          <Label htmlFor="metaVisuStoriesInstagram" className="text-gray-700 font-medium">Visualizações Stories</Label>
                          <Input
                            id="metaVisuStoriesInstagram"
                            type="number"
                            value={metas.metaVisuStoriesInstagram}
                            onChange={(e) => updateMeta('metaVisuStoriesInstagram', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Marketing Pago */}
                    <div>
                      <PageText className="text-pink-700 font-medium mb-4">💰 Marketing Pago</PageText>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="metaValorInvestido" className="text-gray-700 font-medium">Valor Investido (R$)</Label>
                          <Input
                            id="metaValorInvestido"
                            type="number"
                            value={metas.metaValorInvestido}
                            onChange={(e) => updateMeta('metaValorInvestido', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaFrequenciaMarketing" className="text-gray-700 font-medium">Frequência</Label>
                          <Input
                            id="metaFrequenciaMarketing"
                            type="number"
                            value={metas.metaFrequenciaMarketing}
                            onChange={(e) => updateMeta('metaFrequenciaMarketing', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaCPM" className="text-gray-700 font-medium">CPM (Custo por Mil)</Label>
                          <Input
                            id="metaCPM"
                            type="number"
                            value={metas.metaCPM}
                            onChange={(e) => updateMeta('metaCPM', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaCliquesMarketing" className="text-gray-700 font-medium">Cliques</Label>
                          <Input
                            id="metaCliquesMarketing"
                            type="number"
                            value={metas.metaCliquesMarketing}
                            onChange={(e) => updateMeta('metaCliquesMarketing', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaCTR" className="text-gray-700 font-medium">CTR (Taxa de Clique %)</Label>
                          <Input
                            id="metaCTR"
                            type="number"
                            value={metas.metaCTR}
                            onChange={(e) => updateMeta('metaCTR', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="metaCustoClique" className="text-gray-700 font-medium">Custo por Clique (R$)</Label>
                          <Input
                            id="metaCustoClique"
                            type="number"
                            value={metas.metaCustoClique}
                            onChange={(e) => updateMeta('metaCustoClique', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3 md:col-span-2">
                          <Label htmlFor="metaConversasIniciadas" className="text-gray-700 font-medium">Conversas Iniciadas</Label>
                          <Input
                            id="metaConversasIniciadas"
                            type="number"
                            value={metas.metaConversasIniciadas}
                            onChange={(e) => updateMeta('metaConversasIniciadas', Number(e.target.value))}
                            placeholder="0"
                            className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          </TabsContent>

          {showUsersTab && (
          <TabsContent value="usuarios">
              <PageCard title="Gerenciar Usuários & Permissões" className="minimal-card">
              <div className="flex items-center justify-between mb-6">
                  <div>
                    <PageText className="text-gray-600">
                      Configure os módulos que cada usuário pode acessar no sistema
                    </PageText>
                    <PageText className="text-sm text-gray-500 mt-1">
                      {buscaUsuario ? `${usuariosFiltrados.length} de ${usuarios.length}` : usuarios.length} usuários encontrados
                    </PageText>
                  </div>
                  <Button onClick={() => setModalUsuario(true)} className="minimal-button">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </div>
              
                {/* Informações dos Perfis/Roles */}
                <div className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <UserCheck className="w-5 h-5 text-blue-600 mr-2" />
                    <PageText variant="subtitle" className="text-gray-900">Perfis e Permissões Disponíveis</PageText>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(ROLES_SISTEMA).map(([key, role]) => (
                      <div key={key} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${role.cor}`}>
                            <span className="mr-1">
                              {key === 'admin' ? '👑' : key === 'manager' ? '👨‍💼' : '👤'}
                            </span>
                            {role.nome}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{role.descricao}</p>
                        <p className="text-xs text-gray-500">{role.modulos_default.length} de {MODULOS_SISTEMA.length} módulos permitidos</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campo de busca */}
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Buscar usuários por nome, email ou perfil..."
                        value={buscaUsuario}
                        onChange={(e) => setBuscaUsuario(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white"
                      />
                      {buscaUsuario && (
                        <button
                          onClick={() => setBuscaUsuario('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {buscaUsuario && (
                      <p className="text-sm text-gray-500 mt-2">
                        {usuariosFiltrados.length} de {usuarios.length} usuários encontrados
                      </p>
                    )}
                  </div>
                </div>
                
                {carregandoUsuarios ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <PageText className="text-gray-600">Carregando usuários...</PageText>
                  </div>
                ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                    <PageText variant="title" className="mb-2 text-gray-900">
                      {buscaUsuario ? 'Nenhum usuário encontrado' : 'Nenhum usuário encontrado'}
                    </PageText>
                    <PageText className="mb-4 text-gray-600">
                      {buscaUsuario 
                        ? `Nenhum usuário corresponde à busca "${buscaUsuario}". Tente alterar os termos da busca.`
                        : 'Comece adicionando usuários ao sistema para gerenciar permissões.'
                      }
                    </PageText>
              </div>
                ) : (
                  <div className="space-y-6">
                    {usuariosFiltrados.map((usuario) => (
                      <div key={usuario.id} className="minimal-card p-6 border border-gray-200 rounded-lg bg-gradient-to-r from-white to-blue-50">
                        {/* Header do Usuário */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                              <span className="text-white text-lg font-bold">
                                {usuario.role === 'admin' ? '👑' : usuario.role === 'manager' ? '👨‍💼' : '👤'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{usuario.nome}</h3>
                              <p className="text-gray-600 font-medium">{usuario.email}</p>
                              <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                                {ROLES_SISTEMA[usuario.role as keyof typeof ROLES_SISTEMA]?.nome || usuario.role}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-2 mb-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirEdicaoUsuario(usuario)}
                                className="minimal-button-secondary"
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => alternarStatusUsuario(usuario)}
                                disabled={operandoUsuario === usuario.id}
                                className={`minimal-button-secondary ${
                                  usuario.ativo 
                                    ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                                    : 'hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                                }`}
                              >
                                {operandoUsuario === usuario.id ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                                ) : (
                                  <Power className="w-3 h-3 mr-1" />
                                )}
                                {operandoUsuario === usuario.id ? 'Processando...' : (usuario.ativo ? 'Desativar' : 'Ativar')}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => gerarLinkRedefinicao(usuario)}
                                disabled={operandoUsuario === usuario.id}
                                className="minimal-button-secondary hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                              >
                                <Link className="w-3 h-3 mr-1" />
                                Link Reset
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => excluirUsuario(usuario)}
                                disabled={operandoUsuario === usuario.id}
                                className="minimal-button-secondary hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                              >
                                {operandoUsuario === usuario.id ? (
                                  <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                                ) : (
                                  <Trash2 className="w-3 h-3 mr-1" />
                                )}
                                {operandoUsuario === usuario.id ? 'Excluindo...' : 'Excluir'}
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2 justify-end">
                              <Badge variant={usuario.ativo ? 'default' : 'secondary'} 
                                className={usuario.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                                {usuario.ativo ? '✅ Ativo' : '❌ Inativo'}
                              </Badge>
                              {usuario.role === 'admin' && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {(usuario.modulos_permitidos || []).length} de {MODULOS_SISTEMA.length} módulos
                            </p>
                          </div>
                        </div>

                        {/* Grid de Módulos por Categoria */}
                        <div className="space-y-6">
                          {Object.entries(agruparModulosPorCategoria()).map(([categoria, modulos]) => (
                            <div key={categoria} className="space-y-3">
                              <h4 className="font-bold text-lg text-gray-800 bg-gradient-to-r from-gray-100 to-blue-100 px-4 py-2 rounded-lg border-l-4 border-blue-500">
                                {categoria === 'checklists' ? '📋 Checklists & Operações' :
                                 categoria === 'reservas' ? '🎫 Reservas & Planejamento' :
                                 categoria === 'dashboards' ? '📦 ContaHub - Dashboards & Análises' :
                                 categoria === 'gestao' ? '📦 ContaHub - Gestão & Controles' :
                                 categoria === 'relatorios' ? '📊 Relatórios & Dados' :
                                 categoria === 'marketing' ? '📱 Marketing & Redes Sociais' :
                                 categoria === 'administracao' ? '⚙️ Administração & Configurações' : categoria}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {modulos.map((modulo) => {
                                  const modulosUsuario = Array.isArray(usuario.modulos_permitidos) ? usuario.modulos_permitidos : []
                                  const temPermissao = modulosUsuario.includes(modulo.id)
                                  
                                  return (
                                    <div key={modulo.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-semibold text-gray-900 text-sm">{modulo.nome}</h5>
                                        <Switch
                                          checked={temPermissao}
                                          onCheckedChange={() => alternarPermissaoModulo(usuario.id!, modulo.id)}
                                          className="data-[state=checked]:bg-emerald-500"
                                        />
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">{modulo.descricao}</p>
                                      <Badge 
                                        variant={temPermissao ? 'default' : 'secondary'} 
                                        className={`text-xs ${temPermissao ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                                      >
                                        {temPermissao ? '✅ Permitido' : '❌ Bloqueado'}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </PageCard>
          </TabsContent>
          )}



          {showIntegracoesTab && (
            <TabsContent value="integracoes">
              <PageCard title="Integrações Externas" className="minimal-card">
                <div className="mb-6">
                  <PageText className="text-gray-600">
                    Configure suas integrações com sistemas externos como ContaAzul, sistemas de pagamento e outras APIs
                  </PageText>
                </div>
                
                <div className="space-y-6">
                  {/* ContaAzul OAuth Integration */}
                  <ErrorBoundary fallback={
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Erro no ContaAzul</h3>
                      <p className="text-red-700 mb-4">
                        Ocorreu um erro ao carregar a integração do ContaAzul. 
                        Isso pode ser um problema temporário.
                      </p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🔄 Recarregar Página
                      </button>
                    </div>
                  }>
                    <ContaAzulOAuth />
                  </ErrorBoundary>

                  {/* Placeholder for other integrations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                      <div className="text-center py-8">
                        <Puzzle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Sistema de Pagamentos</p>
                        <p className="text-xs text-gray-500">Em breve</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                      <div className="text-center py-8">
                        <Puzzle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">ERP Externo</p>
                        <p className="text-xs text-gray-500">Em breve</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PageCard>
            </TabsContent>
          )}

          {showMarketingTab && (
          <TabsContent value="marketing">
              <PageCard title="Marketing & Redes Sociais" className="minimal-card">
              <div className="mb-4">
                <PageText className="text-gray-600">
                  Configure suas integrações Facebook/Instagram para coleta automática de métricas de marketing
                </PageText>
              </div>
              
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                }>
                  <MetaAPIConfig />
                </Suspense>
              </ErrorBoundary>
            </PageCard>
          </TabsContent>
          )}
        </Tabs>
      </PageContent>

      {/* Modal Usuário */}
      <Dialog open={modalUsuario} onOpenChange={(open) => {
        setModalUsuario(open)
        if (!open) {
          setUsuarioEditando(null)
          limparFormularioUsuario()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center space-x-2">
              <span className="text-2xl">{usuarioEditando ? '✏️' : '👤'}</span>
              <span>{usuarioEditando ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {usuarioEditando 
                ? 'Altere as informações do usuário conforme necessário'
                : 'Preencha os dados para criar um novo usuário no sistema'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informações Básicas</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-gray-700 font-medium">Nome Completo *</Label>
                  <Input
                    id="nome"
                    type="text"
                    value={novoUsuario.nome}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: João Silva"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
          </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={novoUsuario.email}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Ex: joao@empresa.com"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    {usuarioEditando ? 'Nova Senha (deixe vazio para manter atual)' : 'Senha *'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={novoUsuario.password}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-700 font-medium">Perfil de Acesso</Label>
                  <Select 
                    value={novoUsuario.role} 
                    onValueChange={(value) => aplicarRoleDefault(value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLES_SISTEMA).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {key === 'admin' ? '👑' : key === 'manager' ? '👨‍💼' : '👤'}
                            </span>
                            <div>
                              <div className="font-medium">{role.nome}</div>
                              <div className="text-xs text-gray-500">{role.descricao}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Permissões e Módulos */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Permissões e Módulos</span>
              </h3>
              
              <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      Perfil Selecionado: {ROLES_SISTEMA[novoUsuario.role as keyof typeof ROLES_SISTEMA]?.nome}
                    </p>
                    <p className="text-sm text-green-600">
                      {novoUsuario.modulos_permitidos.length} de {MODULOS_SISTEMA.length} módulos permitidos
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    {((novoUsuario.modulos_permitidos.length / MODULOS_SISTEMA.length) * 100).toFixed(0)}% dos módulos
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(agruparModulosPorCategoria()).map(([categoria, modulos]) => (
                  <div key={categoria} className="space-y-3">
                                         <h4 className="font-bold text-lg text-gray-800 bg-gradient-to-r from-gray-100 to-green-100 px-4 py-2 rounded-lg border-l-4 border-green-500">
                       {categoria === 'checklists' ? '📋 Checklists & Operações' :
                        categoria === 'reservas' ? '🎫 Reservas & Planejamento' :
                        categoria === 'dashboards' ? '📦 ContaHub - Dashboards & Análises' :
                        categoria === 'gestao' ? '📦 ContaHub - Gestão & Controles' :
                        categoria === 'relatorios' ? '📊 Relatórios & Dados' :
                        categoria === 'marketing' ? '📱 Marketing & Redes Sociais' :
                        categoria === 'administracao' ? '⚙️ Administração & Configurações' : categoria}
                     </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {modulos.map((modulo) => {
                        const temPermissao = novoUsuario.modulos_permitidos.includes(modulo.id)
                        
                        return (
                          <div key={modulo.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 text-sm">{modulo.nome}</h5>
                              <Switch
                                checked={temPermissao}
                                onCheckedChange={() => {
                                  const novosModulos = temPermissao
                                    ? novoUsuario.modulos_permitidos.filter(id => id !== modulo.id)
                                    : [...novoUsuario.modulos_permitidos, modulo.id]
                                  setNovoUsuario(prev => ({ ...prev, modulos_permitidos: novosModulos }))
                                }}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{modulo.descricao}</p>
                            <Badge 
                              variant={temPermissao ? 'default' : 'secondary'} 
                              className={`text-xs ${temPermissao ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {temPermissao ? '✅ Permitido' : '❌ Bloqueado'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

                     <DialogFooter className="space-x-2">
             <Button 
               variant="outline" 
               onClick={() => setModalUsuario(false)} 
               disabled={salvandoUsuario}
               className="minimal-button-secondary"
             >
               <XCircle className="w-4 h-4 mr-2" />
               Cancelar
            </Button>
             {usuarioEditando ? (
               <Button 
                 onClick={atualizarUsuario} 
                 disabled={salvandoUsuario}
                 className="minimal-button bg-blue-600 hover:bg-blue-700"
               >
                 {salvandoUsuario ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                     Atualizando...
                   </>
                 ) : (
                   <>
                     <Edit3 className="w-4 h-4 mr-2" />
                     Atualizar Usuário
                   </>
                 )}
               </Button>
             ) : (
               <Button 
                 onClick={salvarUsuario} 
                 disabled={salvandoUsuario}
                 className="minimal-button bg-green-600 hover:bg-green-700"
               >
                 {salvandoUsuario ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                     Criando...
                   </>
                 ) : (
                   <>
                     <UserPlus className="w-4 h-4 mr-2" />
                     Criar Usuário
                   </>
                 )}
               </Button>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageBase>
  )
}

export default function ConfiguracoesPage() {
  return <ConfiguracoesContent />
} 
