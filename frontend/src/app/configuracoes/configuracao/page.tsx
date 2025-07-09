'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useBar } from '@/contexts/BarContext'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Users, 
  Shield, 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Download,
  Upload,
  RefreshCw,
  Database
} from 'lucide-react'

export default function ConfiguracaoPage() {
  const { selectedBar } = useBar()
  const { updateUserPermissions } = usePermissions()
  const [activeTab, setActiveTab] = useState('usuarios')
  
  // Estados para usuários
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [editandoUsuario, setEditandoUsuario] = useState<any | null>(null)
  const [novoUsuario, setNovoUsuario] = useState<any>({})
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)
  
  // Estados para modais
  const [modalEditarUsuario, setModalEditarUsuario] = useState(false)
  const [modalPermissoesUsuario, setModalPermissoesUsuario] = useState(false)
  const [usuarioPermissoes, setUsuarioPermissoes] = useState<any | null>(null)

  // Lista de módulos disponíveis - ATUALIZADA COM TODOS OS MÓDULOS
  const modulosDisponiveis = [
    // Dashboards - Visão Geral
    { id: 'dashboard_diario', nome: 'Dashboard Diário', descricao: 'Visualizar métricas diárias' },
    { id: 'dashboard_semanal', nome: 'Dashboard Semanal', descricao: 'Visualizar métricas semanais' },
    { id: 'dashboard_mensal', nome: 'Dashboard Mensal', descricao: 'Visualizar métricas mensais' },
    { id: 'dashboard_garcons', nome: 'Dashboard Garçons', descricao: 'Visualizar performance de garçons' },
    
    // Operações
    { id: 'produtos', nome: 'Produtos', descricao: 'Gerenciar produtos e categorias' },
    { id: 'recorrencia', nome: 'Recorrência Clientes', descricao: 'Análise de recorrência de clientes' },
    { id: 'planejamento', nome: 'Planejamento', descricao: 'Ferramentas de planejamento' },
    { id: 'tempo', nome: 'Tempos Médios', descricao: 'Análise de tempos médios' },
    { id: 'periodo', nome: 'Período', descricao: 'Gestão de períodos' },
    
    // Produção
    { id: 'receitas_insumos', nome: 'Receitas & Insumos', descricao: 'Gerenciar receitas e insumos' },
    { id: 'terminal_producao', nome: 'Terminal de Produção', descricao: 'Acesso ao terminal de produção' },
    { id: 'relatorio_producoes', nome: 'Relatório de Produções', descricao: 'Relatórios de produção' },
    
    // Relatórios
    { id: 'relatorio_produtos', nome: 'Relatório de Produtos', descricao: 'Relatório de produtos' },
    { id: 'analitico', nome: 'Analítico', descricao: 'Relatórios analíticos' },
    { id: 'fatporhora', nome: 'Faturamento por Hora', descricao: 'Faturamento por hora' },
    { id: 'nfs', nome: 'Notas Fiscais', descricao: 'Relatório de notas fiscais' },
    { id: 'pagamentos', nome: 'Pagamentos', descricao: 'Relatórios de pagamentos' },
    
    // Configurações
    { id: 'configuracoes', nome: 'Configurações', descricao: 'Configurações gerais do sistema' },
    { id: 'integracoes', nome: 'Integrações', descricao: 'Integrações com sistemas externos' }
  ]

  // Estados para metas
  const [metas, setMetas] = useState<any[]>([
    { id: 1, tipo: 'faturamento', periodo: 'diario', valor_meta: 2500, ativa: true },
    { id: 2, tipo: 'pessoas', periodo: 'diario', valor_meta: 80, ativa: true },
    { id: 3, tipo: 'ticket_medio', periodo: 'mensal', valor_meta: 35, ativa: true },
    { id: 4, tipo: 'faturamento', periodo: 'mensal', valor_meta: 75000, ativa: false }
  ])
  const [editandoMeta, setEditandoMeta] = useState<any | null>(null)
  const [novaMeta, setNovaMeta] = useState<any>({})

  // Estados para importação
  const [urlGoogleSheets, setUrlGoogleSheets] = useState('')
  const [importandoDados, setImportandoDados] = useState(false)
  const [resultadoImportacao, setResultadoImportacao] = useState<any>(null)
  const [statsImportacao, setStatsImportacao] = useState<any | null>(null)

  // useEffect para carregar dados
  useEffect(() => {
    if (selectedBar?.id) {
      carregarUsuarios()
      carregarStatsImportacao()
    }
  }, [selectedBar?.id])

  // Carregar usuários do banco
  const carregarUsuarios = async () => {
    if (!selectedBar?.id) return
    
    setCarregandoUsuarios(true)
    try {
      console.log('📡 Carregando usuários para bar:', selectedBar.id)
      const response = await fetch(`/api/admin/usuarios?bar_id=${selectedBar.id}`)
      
      if (response.ok) {
        const data = await response.json()
        const usuariosCarregados = data.usuarios || []
        
        console.log('📊 Dados brutos recebidos da API:', data)
        console.log('👥 Usuários processados:', usuariosCarregados.map((u: any) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          role: u.role,
          modulos_permitidos: u.modulos_permitidos,
          total_modulos: (u.modulos_permitidos || []).length
        })))
        
        setUsuarios(usuariosCarregados)
        console.log('✅ Usuários carregados com sucesso:', usuariosCarregados.length)
      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('❌ Detalhes do erro:', errorText)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error)
    } finally {
      setCarregandoUsuarios(false)
    }
  }

  // Atualizar permissões de um usuário
  const atualizarPermissoesUsuario = async (usuarioId: number, modulosPermitidos: string[]) => {
    try {
      console.log('🔄 Atualizando permissões:', { usuarioId, modulosPermitidos })
      
      const response = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulos_permitidos: modulosPermitidos
        })
      })

      if (response.ok) {
        // Atualizar estado local
        setUsuarios((prev: any[]) => prev.map(u => 
          u.id === usuarioId 
            ? { ...u, modulos_permitidos: modulosPermitidos }
            : u
        ))
        
        // 🚀 NOVO: Verificar se o usuário está editando suas próprias permissões
        const currentUserData = localStorage.getItem('sgb_user')
        if (currentUserData) {
          const currentUser = JSON.parse(currentUserData)
          
          console.log('🔍 Verificando se é o usuário atual:', {
            currentUserId: currentUser.id,
            currentUserUserId: currentUser.user_id,
            editingUserId: usuarioId,
            currentUserName: currentUser.nome
          })
          
          // Verificar por id ou user_id (dependendo de como está armazenado)
          const isCurrentUser = currentUser.id === usuarioId || currentUser.user_id === usuarioId
          
          if (isCurrentUser) {
            console.log('🔄 Usuário está editando suas próprias permissões, atualizando sidebar...')
            
            // Usar a função do hook para atualizar as permissões
            // Isso vai automaticamente atualizar o localStorage e o sidebar
            updateUserPermissions(modulosPermitidos)
            
            console.log('✅ Sidebar será atualizado automaticamente!')
          } else {
            console.log('ℹ️ Usuário está editando permissões de outro usuário, sidebar não será afetado')
          }
        }
        
        console.log('✅ Permissões atualizadas com sucesso')
        return true
      } else {
        console.error('❌ Erro ao atualizar permissões')
        return false
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      return false
    }
  }

  // Alternar permissão de módulo específico
  const alternarPermissaoModulo = async (usuarioId: number, moduloId: string) => {
    console.log('🔄 Alternando permissão:', { usuarioId, moduloId })
    
    const usuario = usuarios.find(u => u.id === usuarioId)
    if (!usuario) {
      console.error('❌ Usuário não encontrado:', usuarioId)
      return
    }

    const modulosAtuais = Array.isArray(usuario.modulos_permitidos) ? usuario.modulos_permitidos : []
    const temPermissao = modulosAtuais.includes(moduloId)
    
    console.log('📊 Estado atual:', { 
      modulosAtuais, 
      temPermissao, 
      moduloId,
      usuarioNome: usuario.nome 
    })
    
    let novosModulos
    if (temPermissao) {
      // Remover permissão
      novosModulos = modulosAtuais.filter((m: string) => m !== moduloId)
      console.log('➖ Removendo permissão. Novos módulos:', novosModulos)
    } else {
      // Adicionar permissão
      novosModulos = [...modulosAtuais, moduloId]
      console.log('➕ Adicionando permissão. Novos módulos:', novosModulos)
    }

    // Atualizar estado local imediatamente para feedback visual
    setUsuarios((prev: any[]) => prev.map(u => 
      u.id === usuarioId 
        ? { ...u, modulos_permitidos: novosModulos }
        : u
    ))

    // Então fazer a chamada para API
    const sucesso = await atualizarPermissoesUsuario(usuarioId, novosModulos)
    
    if (!sucesso) {
      // Se falhou, reverter o estado local
      console.warn('⚠️ Falha na API, revertendo estado local')
      setUsuarios((prev: any[]) => prev.map(u => 
        u.id === usuarioId 
          ? { ...u, modulos_permitidos: modulosAtuais }
          : u
      ))
      alert('Erro ao atualizar permissões. Tente novamente.')
    } else {
      console.log('✅ Permissão alternada com sucesso!')
    }
  }

  // Funções para usuários
  const salvarUsuario = () => {
    if (editandoUsuario) {
      setUsuarios((prev: any[]) => prev.map(u => u.id === editandoUsuario.id ? editandoUsuario : u))
      setEditandoUsuario(null)
    } else if (novoUsuario.nome && novoUsuario.email && novoUsuario.role) {
      const id = Math.max(...usuarios.map(u => u.id)) + 1
      setUsuarios((prev: any[]) => [...prev, { 
        id, 
        nome: novoUsuario.nome, 
        email: novoUsuario.email, 
        role: novoUsuario.role, 
        ativo: true,
        modulos_permitidos: []
      }])
      setNovoUsuario({})
    }
  }

  const excluirUsuario = (id: number) => {
    setUsuarios((prev: any[]) => prev.filter(u => u.id !== id))
  }

  // Funções para metas
  const salvarMeta = () => {
    if (editandoMeta) {
      setMetas((prev: any[]) => prev.map(m => m.id === editandoMeta.id ? editandoMeta : m))
      setEditandoMeta(null)
    } else if (novaMeta.tipo && novaMeta.periodo && novaMeta.valor_meta) {
      const id = Math.max(...metas.map(m => m.id)) + 1
      setMetas((prev: any[]) => [...prev, { 
        id, 
        tipo: novaMeta.tipo, 
        periodo: novaMeta.periodo, 
        valor_meta: novaMeta.valor_meta, 
        ativa: true 
      }])
      setNovaMeta({})
    }
  }

  const excluirMeta = (id: number) => {
    setMetas((prev: any[]) => prev.filter(m => m.id !== id))
  }

  // Funções para importação
  const importarGoogleSheets = async () => {
    if (!urlGoogleSheets.trim()) {
      alert('Digite a URL do Google Sheets')
      return
    }

    setImportandoDados(true)
    setResultadoImportacao(null)

    try {
      const response = await fetch('/api/admin/importar-google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_sheets_url: urlGoogleSheets,
          bar_id: selectedBar?.id
        })
      })

      const resultado = await response.json()
      
      if (resultado.success) {
        setResultadoImportacao(resultado)
        console.log('✅ Importação realizada:', resultado)
        carregarStatsImportacao()
      } else {
        throw new Error(resultado.error)
      }

    } catch (error) {
      console.error('❌ Erro na importação:', error)
      alert('Erro na importação: ' + (error as Error).message)
    } finally {
      setImportandoDados(false)
    }
  }

  const carregarStatsImportacao = async () => {
    try {
      const response = await fetch(`/api/admin/importar-google-sheets?bar_id=${selectedBar?.id}`)
      const data = await response.json()
      
      if (data.success) {
        setStatsImportacao(data.estatisticas)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
    }
  }

  // Formatação auxiliar
  const formatarTipoMeta = (tipo: string) => {
    switch (tipo) {
      case 'faturamento': return 'Faturamento'
      case 'pessoas': return 'Pessoas'
      case 'ticket_medio': return 'Ticket Médio'
      default: return tipo
    }
  }

  const formatarPeriodo = (periodo: string) => {
    switch (periodo) {
      case 'diario': return 'Diário'
      case 'semanal': return 'Semanal'
      case 'mensal': return 'Mensal'
      default: return periodo
    }
  }

  const formatarValorMeta = (tipo: string, valor: number) => {
    switch (tipo) {
      case 'faturamento':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
      case 'pessoas':
        return `${valor} pessoas`
      case 'ticket_medio':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
      default:
        return valor.toString()
    }
  }

  // Função para agrupar módulos por categoria
  const agruparModulosPorCategoria = () => {
    const dashboards = modulosDisponiveis.filter(m => m.id.startsWith('dashboard_'))
    const operacoes = modulosDisponiveis.filter(m => ['produtos', 'recorrencia', 'planejamento', 'tempo', 'periodo'].includes(m.id))
    const producao = modulosDisponiveis.filter(m => ['receitas_insumos', 'terminal_producao', 'relatorio_producoes'].includes(m.id))
    const relatorios = modulosDisponiveis.filter(m => ['relatorio_produtos', 'analitico', 'fatporhora', 'nfs', 'pagamentos'].includes(m.id))
    const configuracoes = modulosDisponiveis.filter(m => ['configuracoes', 'integracoes'].includes(m.id))
    
    return {
      'dashboards': dashboards,
      'operacoes': operacoes,
      'producao': producao,
      'relatorios': relatorios,
      'configuracao': configuracoes
    }
  }

  if (!selectedBar?.id) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium">⚠️ Selecione um bar primeiro</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-black mb-2">
          Configurações do Sistema
        </h1>
        <p className="text-gray-700 font-medium">
          Gerencie usuários, permissões, metas e importações de dados - {selectedBar.nome}
        </p>
      </div>

      {/* Tabs de Configuração */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários & Permissões
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Metas & KPIs
          </TabsTrigger>
          <TabsTrigger value="importacao" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Importação
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Aba Usuários & Permissões */}
        <TabsContent value="usuarios" className="space-y-6">
          {/* Seção de Permissões por Usuário */}
          <Card className="h-[80vh] flex flex-col">
            <CardHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
              <CardTitle className="text-black font-bold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Gerenciar Permissões - {usuarios.length} usuários
              </CardTitle>
              <p className="text-sm text-gray-700 font-medium">
                Configure os módulos que cada usuário pode acessar no sistema
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              {carregandoUsuarios ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600">Carregando usuários...</p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {usuarios.map((usuario) => (
                    <div key={usuario.id} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-white to-blue-50 shadow-sm">
                      {/* Header do Usuário */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-bold">
                              {usuario.role === 'admin' ? '👑' : usuario.role === 'gerente' ? '👨‍💼' : '👤'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-black text-lg">{usuario.nome}</h3>
                            <p className="text-gray-600 font-medium">{usuario.email}</p>
                            <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                              {usuario.role === 'admin' ? 'Administrador' : usuario.role === 'gerente' ? 'Gerente' : 'Funcionário'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-2 mb-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditandoUsuario({ ...usuario })
                                setModalEditarUsuario(true)
                              }}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUsuarioPermissoes({ ...usuario })
                                setModalPermissoesUsuario(true)
                              }}
                              className="border-green-300 text-green-600 hover:bg-green-50"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Permissões
                            </Button>
                          </div>
                          <Badge variant={usuario.ativo ? 'default' : 'secondary'} className={usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {usuario.ativo ? (
                              <>
                                <Unlock className="w-3 h-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Inativo
                              </>
                            )}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {(usuario.modulos_permitidos || []).length} de {modulosDisponiveis.length} módulos ativos
                          </p>
                        </div>
                      </div>

                      {/* Grid de Módulos Agrupados por Categoria */}
                      <div className="space-y-6">
                        {Object.entries(agruparModulosPorCategoria()).map(([categoria, modulos]) => (
                          <div key={categoria} className="space-y-3">
                            <h4 className="font-bold text-lg text-gray-800 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-blue-100 px-4 py-2 rounded-lg border-l-4 border-blue-500">
                              {categoria === 'dashboards' ? '📊 Dashboards & Análises' :
                               categoria === 'operacoes' ? '⚙️ Operações & Gestão' :
                               categoria === 'producao' ? '🏭 Produção & Terminal' :
                               categoria === 'relatorios' ? '📈 Relatórios & Análises' :
                               categoria === 'configuracao' ? '🔧 Configurações' : categoria}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {modulos.map((modulo) => {
                                const modulosUsuario = Array.isArray(usuario.modulos_permitidos) ? usuario.modulos_permitidos : []
                                const temPermissao = modulosUsuario.includes(modulo.id)
                                
                                // Debug específico para cada módulo
                                if (usuario.id === 1) { // Só para o primeiro usuário para não fazer spam
                                  console.log(`🔍 Verificando módulo ${modulo.id}:`, {
                                    moduloId: modulo.id,
                                    moduloNome: modulo.nome,
                                    modulosUsuario,
                                    temPermissao,
                                    usuarioNome: usuario.nome
                                  })
                                }
                                
                                return (
                                  <div key={modulo.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-semibold text-black text-sm">{modulo.nome}</h5>
                                      <Switch
                                        checked={temPermissao}
                                        onCheckedChange={() => {
                                          console.log(`🎯 Clique no switch: ${modulo.nome} (${modulo.id}) para usuário ${usuario.nome}`)
                                          alternarPermissaoModulo(usuario.id, modulo.id)
                                        }}
                                        className="data-[state=checked]:bg-green-500"
                                      />
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{modulo.descricao}</p>
                                    <div>
                                      <Badge 
                                        variant={temPermissao ? 'default' : 'secondary'} 
                                        className={`text-xs ${temPermissao ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                      >
                                        {temPermissao ? '✅ Ativo' : '❌ Inativo'}
                                      </Badge>
                                    </div>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Metas */}
        <TabsContent value="metas" className="space-y-6">
          {/* Formulário Nova Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <Plus className="w-5 h-5" />
                Adicionar Nova Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="tipo" className="text-black font-semibold">Tipo de Meta</Label>
                  <Select value={novaMeta.tipo} onValueChange={(value) => setNovaMeta((prev: any) => ({ ...prev, tipo: value }))}>
                    <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faturamento">Faturamento</SelectItem>
                      <SelectItem value="pessoas">Pessoas</SelectItem>
                      <SelectItem value="ticket_medio">Ticket Médio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="periodo" className="text-black font-semibold">Período</Label>
                  <Select value={novaMeta.periodo} onValueChange={(value) => setNovaMeta((prev: any) => ({ ...prev, periodo: value }))}>
                    <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="valor" className="text-black font-semibold">Valor da Meta</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={novaMeta.valor_meta || ''}
                    onChange={(e) => setNovaMeta((prev: any) => ({ ...prev, valor_meta: parseFloat(e.target.value) }))}
                    placeholder="Digite o valor"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={salvarMeta} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Metas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-bold">Metas Configuradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metas.map((meta) => (
                  <div key={meta.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    {editandoMeta?.id === meta.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                        <Select value={editandoMeta.tipo} onValueChange={(value) => setEditandoMeta((prev: any) => prev ? { ...prev, tipo: value } : null)}>
                          <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="faturamento">Faturamento</SelectItem>
                            <SelectItem value="pessoas">Pessoas</SelectItem>
                            <SelectItem value="ticket_medio">Ticket Médio</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={editandoMeta.periodo} onValueChange={(value) => setEditandoMeta((prev: any) => prev ? { ...prev, periodo: value } : null)}>
                          <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diario">Diário</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={editandoMeta.valor_meta}
                          onChange={(e) => setEditandoMeta((prev: any) => prev ? { ...prev, valor_meta: parseFloat(e.target.value) } : null)}
                          className="text-black font-medium border-2 border-gray-300"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={salvarMeta}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditandoMeta(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-bold text-black">
                                {formatarTipoMeta(meta.tipo)} - {formatarPeriodo(meta.periodo)}
                              </h3>
                              <p className="text-sm text-gray-700 font-medium">
                                Meta: {formatarValorMeta(meta.tipo, meta.valor_meta)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {meta.ativa ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Inativa
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditandoMeta(meta)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => excluirMeta(meta.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Importação */}
        <TabsContent value="importacao" className="space-y-6">
          {/* Estatísticas Atuais */}
          {statsImportacao && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 font-bold flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Dados Atualmente no Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-800">{statsImportacao.produtos}</p>
                    <p className="text-sm text-blue-600 font-medium">Produtos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-800">{statsImportacao.insumos}</p>
                    <p className="text-sm text-blue-600 font-medium">Insumos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-800">{statsImportacao.receitas}</p>
                    <p className="text-sm text-blue-600 font-medium">Receitas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Importar do Google Sheets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                Importar do Google Sheets
              </CardTitle>
              <p className="text-sm text-gray-700 font-medium">
                Importe produtos e insumos diretamente da sua planilha do Google Sheets
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url-sheets" className="text-black font-semibold">URL do Google Sheets (formato CSV)</Label>
                <Input
                  id="url-sheets"
                  value={urlGoogleSheets}
                  onChange={(e) => setUrlGoogleSheets(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=0"
                  className="text-black font-medium border-2 border-gray-300"
                />
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Cole aqui a URL da sua planilha configurada para exportação CSV
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={importarGoogleSheets}
                  disabled={importandoDados || !urlGoogleSheets.trim()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {importandoDados ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {importandoDados ? 'Importando...' : 'Importar Dados'}
                </Button>

                <Button 
                  onClick={carregarStatsImportacao}
                  variant="outline"
                  className="flex items-center gap-2 border-2 text-black font-bold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar Estatísticas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Importação */}
          {resultadoImportacao && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 font-bold flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Importação Concluída!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-green-700 font-semibold">
                    <strong>Linhas processadas:</strong> {resultadoImportacao.estatisticas.linhas_processadas}
                  </p>
                  <p className="text-green-700 font-semibold">
                    <strong>Produtos inseridos:</strong> {resultadoImportacao.estatisticas.produtos_inseridos}
                  </p>
                  <p className="text-green-700 font-semibold">
                    <strong>Insumos inseridos:</strong> {resultadoImportacao.estatisticas.insumos_inseridos}
                  </p>
                  <p className="text-green-700 font-semibold">
                    <strong>Total inserido:</strong> {resultadoImportacao.estatisticas.total_inseridos} registros
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 font-bold">📝 Como Configurar a Planilha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-yellow-700 font-medium">
                <p><strong>1.</strong> Configure sua planilha com colunas: codigo, nome, grupo, tipo, preco_venda, custo_producao, etc.</p>
                <p><strong>2.</strong> Vá em Arquivo → Compartilhar → Compartilhar com outras pessoas</p>
                <p><strong>3.</strong> Altere para "Qualquer pessoa com o link pode visualizar"</p>
                <p><strong>4.</strong> Substitua "/edit#gid=0" por "/export?format=csv&gid=0" na URL</p>
                <p><strong>5.</strong> Cole a URL modificada acima e clique em "Importar Dados"</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Sistema */}
        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-bold">Configurações do Sistema</CardTitle>
              <p className="text-sm text-gray-700 font-medium">
                Configurações gerais e backup
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configurações do sistema em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Usuário */}
      <Dialog open={modalEditarUsuario} onOpenChange={setModalEditarUsuario}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✏️</span>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  Editar Usuário
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Altere as informações do usuário ou gerencie suas permissões.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            {editandoUsuario && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    👤 Informações do Usuário
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        📝 Nome *
                      </Label>
                      <Input
                        value={editandoUsuario.nome || ''}
                        onChange={(e) => setEditandoUsuario((prev: any) => prev ? { ...prev, nome: e.target.value } : null)}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        📧 Email *
                      </Label>
                      <Input
                        value={editandoUsuario.email || ''}
                        onChange={(e) => setEditandoUsuario((prev: any) => prev ? { ...prev, email: e.target.value } : null)}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900"
                        placeholder="email@empresa.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        🏷️ Função
                      </Label>
                      <Select 
                        value={editandoUsuario.role} 
                        onValueChange={(value) => setEditandoUsuario((prev: any) => prev ? { ...prev, role: value } : null)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">👑 Administrador</SelectItem>
                          <SelectItem value="gerente">👨‍💼 Gerente</SelectItem>
                          <SelectItem value="funcionario">👤 Funcionário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2 mb-2">
                        🔒 Status
                      </Label>
                      <div className="flex items-center space-x-3 mt-2">
                        <Switch
                          checked={editandoUsuario.ativo}
                          onCheckedChange={(checked) => setEditandoUsuario((prev: any) => prev ? { ...prev, ativo: checked } : null)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Label className="text-gray-700 font-medium">
                          {editandoUsuario.ativo ? '✅ Usuário Ativo' : '❌ Usuário Inativo'}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🛡️ Resumo de Permissões
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-800">{(editandoUsuario.modulos_permitidos || []).length}</p>
                        <p className="text-sm text-blue-600 font-medium">Módulos Ativos</p>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-800">{modulosDisponiveis.length - (editandoUsuario.modulos_permitidos || []).length}</p>
                        <p className="text-sm text-green-600 font-medium">Módulos Disponíveis</p>
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-800">{editandoUsuario.role === 'admin' ? '👑' : editandoUsuario.role === 'gerente' ? '👨‍💼' : '👤'}</p>
                        <p className="text-sm text-purple-600 font-medium">{editandoUsuario.role === 'admin' ? 'Admin' : editandoUsuario.role === 'gerente' ? 'Gerente' : 'Funcionário'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 text-lg">💡</span>
                      <div>
                        <p className="text-blue-800 font-medium text-sm">Dica</p>
                        <p className="text-blue-700 text-sm">
                          Use o botão "Gerenciar Permissões" para configurar detalhadamente quais módulos este usuário pode acessar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50 flex-shrink-0">
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => setModalEditarUsuario(false)}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Salvar usuário
                  setModalEditarUsuario(false)
                }}
                className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-2 ml-auto"
              >
                💾 Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Permissões do Usuário */}
      <Dialog open={modalPermissoesUsuario} onOpenChange={setModalPermissoesUsuario}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🛡️</span>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  Gerenciar Permissões - {usuarioPermissoes?.nome}
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Configure os módulos que este usuário pode acessar no sistema.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            {usuarioPermissoes && (
              <div className="space-y-6">
                {/* Header do Usuário */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">
                        {usuarioPermissoes.role === 'admin' ? '👑' : usuarioPermissoes.role === 'gerente' ? '👨‍💼' : '👤'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-xl">{usuarioPermissoes.nome}</h3>
                      <p className="text-gray-600 font-medium">{usuarioPermissoes.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={usuarioPermissoes.role === 'admin' ? 'default' : 'secondary'}>
                          {usuarioPermissoes.role === 'admin' ? 'Administrador' : usuarioPermissoes.role === 'gerente' ? 'Gerente' : 'Funcionário'}
                        </Badge>
                        <Badge variant={usuarioPermissoes.ativo ? 'default' : 'secondary'} className={usuarioPermissoes.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {usuarioPermissoes.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        {(usuarioPermissoes.modulos_permitidos || []).length} de {modulosDisponiveis.length}
                      </p>
                      <p className="text-sm text-gray-600">módulos ativos</p>
                    </div>
                  </div>
                </div>

                {/* Grid de Módulos */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    🔧 Configurar Módulos
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modulosDisponiveis.map((modulo) => {
                      const temPermissao = (usuarioPermissoes.modulos_permitidos || []).includes(modulo.id)
                      return (
                        <div key={modulo.id} className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-black text-base">{modulo.nome}</h4>
                            <Switch
                              checked={temPermissao}
                              onCheckedChange={() => {
                                const modulosAtuais = usuarioPermissoes.modulos_permitidos || []
                                let novosModulos
                                if (temPermissao) {
                                  novosModulos = modulosAtuais.filter((m: string) => m !== modulo.id)
                                } else {
                                  novosModulos = [...modulosAtuais, modulo.id]
                                }
                                setUsuarioPermissoes((prev: any) => prev ? { ...prev, modulos_permitidos: novosModulos } : null)
                              }}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{modulo.descricao}</p>
                          <div>
                            <Badge 
                              variant={temPermissao ? 'default' : 'secondary'} 
                              className={`text-sm ${temPermissao ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {temPermissao ? '✅ Ativo' : '❌ Inativo'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-green-500 text-lg">✅</span>
                      <div>
                        <p className="text-green-800 font-medium text-sm">Alterações em Tempo Real</p>
                        <p className="text-green-700 text-sm">
                          As permissões são salvas automaticamente quando você altera os switches. O usuário verá as mudanças imediatamente no próximo login.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50 flex-shrink-0">
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => setModalPermissoesUsuario(false)}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-300"
              >
                Fechar
              </Button>
              <Button
                onClick={async () => {
                  if (usuarioPermissoes) {
                    await atualizarPermissoesUsuario(usuarioPermissoes.id, usuarioPermissoes.modulos_permitidos || [])
                    setUsuarios((prev: any[]) => prev.map(u => 
                      u.id === usuarioPermissoes.id 
                        ? { ...u, modulos_permitidos: usuarioPermissoes.modulos_permitidos }
                        : u
                    ))
                    setModalPermissoesUsuario(false)
                  }
                }}
                className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-2 ml-auto"
              >
                💾 Salvar Permissões
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 