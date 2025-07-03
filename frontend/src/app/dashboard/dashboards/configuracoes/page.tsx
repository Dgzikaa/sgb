'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getSupabaseClient } from '@/lib/supabase'

// Interfaces
interface MetasConfig {
  // Metas Financeiras Diárias
  faturamentoDiario: number
  clientesDiario: number
  ticketMedioTarget: number
  
  // Metas Financeiras Mensais
  metaMensalFaturamento: number
  metaMensalClientes: number
  
  // Metas de Reservas
  reservasDiarias: number
  reservasSemanais: number
  reservasMensais: number
  
  // Metas de Tempo de Produção
  tempoSaidaCozinha: number  // em minutos
  tempoSaidaBar: number      // em minutos
  tempoMedioAtendimento: number // em minutos
  
  // Metas de Eficiência
  metaEficienciaProducao: number // percentual
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
  categoria: 'dashboards' | 'dados' | 'terminal' | 'configuracao'
}

const MODULOS_SISTEMA: ModuloPermissao[] = [
  // Dashboards
  { id: 'dashboard_diario', nome: 'Dashboard Diário', descricao: 'Visualizar métricas diárias', categoria: 'dashboards' },
  { id: 'dashboard_semanal', nome: 'Dashboard Semanal', descricao: 'Visualizar métricas semanais', categoria: 'dashboards' },
  { id: 'dashboard_mensal', nome: 'Dashboard Mensal', descricao: 'Visualizar métricas mensais', categoria: 'dashboards' },
  { id: 'dashboard_garcons', nome: 'Dashboard Garçons', descricao: 'Visualizar performance de garçons', categoria: 'dashboards' },
  
  // Dados
  { id: 'produtos', nome: 'Produtos', descricao: 'Gerenciar produtos e categorias', categoria: 'dados' },
  { id: 'receitas_insumos', nome: 'Receitas & Insumos', descricao: 'Gerenciar receitas e insumos', categoria: 'dados' },
  
  // Terminal
  { id: 'terminal_producao', nome: 'Terminal de Produção', descricao: 'Acesso ao terminal de produção', categoria: 'terminal' },
  
  // Configuração
  { id: 'configuracoes', nome: 'Configurações', descricao: 'Acessar configurações do sistema', categoria: 'configuracao' }
]

const ROLES_SISTEMA = {
  admin: {
    nome: 'Administrador',
    descricao: 'Acesso total ao sistema',
    cor: 'bg-red-100 text-red-800',
    modulos_default: MODULOS_SISTEMA.map(m => m.id)
  },
  manager: {
    nome: 'Gerente',
    descricao: 'Acesso a dashboards e dados',
    cor: 'bg-blue-100 text-blue-800',
    modulos_default: ['dashboard_diario', 'dashboard_semanal', 'dashboard_mensal', 'dashboard_garcons', 'produtos', 'receitas_insumos']
  },
  funcionario: {
    nome: 'Funcionário',
    descricao: 'Acesso apenas ao terminal de produção',
    cor: 'bg-green-100 text-green-800',
    modulos_default: ['terminal_producao']
  }
}

export default function ConfiguracoesPage() {
  const { selectedBar } = useBar()
  const [activeTab, setActiveTab] = useState('metas')
  
  // Estados para Metas
  const [metas, setMetas] = useState<MetasConfig>({
    // Metas Financeiras Diárias
    faturamentoDiario: 37000,
    clientesDiario: 500,
    ticketMedioTarget: 93,
    
    // Metas Financeiras Mensais
    metaMensalFaturamento: 1000000,
    metaMensalClientes: 10000,
    
    // Metas de Reservas
    reservasDiarias: 133,
    reservasSemanais: 800,
    reservasMensais: 3200,
    
    // Metas de Tempo de Produção
    tempoSaidaCozinha: 12,      // minutos
    tempoSaidaBar: 4,           // minutos
    tempoMedioAtendimento: 15,  // minutos
    
    // Metas de Eficiência
    metaEficienciaProducao: 85  // percentual
  })
  
  // Estados para Usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [modalUsuario, setModalUsuario] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuario>({
    email: '',
    nome: '',
    password: '',
    role: 'funcionario',
    modulos_permitidos: ['terminal_producao']
  })
  
  // Estados para Permissões
  const [usuarioPermissoes, setUsuarioPermissoes] = useState<Usuario | null>(null)
  const [modalPermissoes, setModalPermissoes] = useState(false)
  
  // Estados gerais
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    if (selectedBar?.id) {
      carregarMetas()
      carregarUsuarios()
    }
  }, [selectedBar?.id])

  // Funções para Metas
  const carregarMetas = async () => {
    if (!selectedBar?.id) return
    
    try {
      const response = await fetch(`/api/admin/metas?bar_id=${selectedBar.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.metas) {
          setMetas(data.metas)
          console.log('✅ Metas carregadas do banco:', data.metas)
        }
      } else {
        console.log('⚠️ Nenhuma meta encontrada, usando padrões')
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
      // Fallback para localStorage se API falhar
      const savedMetas = localStorage.getItem(`metas-config-${selectedBar?.id}`)
      if (savedMetas) {
        setMetas(JSON.parse(savedMetas))
      }
    }
  }

  const salvarMetas = async () => {
    if (!selectedBar?.id) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          ...metas
        })
      })

      if (response.ok) {
        console.log('✅ Metas salvas no banco de dados')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        throw new Error('Erro na API')
      }
    } catch (error) {
      console.error('Erro ao salvar metas:', error)
      // Fallback para localStorage se API falhar
      localStorage.setItem(`metas-config-${selectedBar?.id}`, JSON.stringify(metas))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      alert('⚠️ Metas salvas localmente (erro na sincronização com servidor)')
    } finally {
      setLoading(false)
    }
  }

  const importarMetasExistentes = async () => {
    if (!selectedBar?.id) return

    setLoading(true)
    try {
      // Buscar metas diretamente do Supabase (sistema de métricas)
      const supabase = await getSupabaseClient()
      if (!supabase) {
        alert('❌ Erro ao conectar com banco de dados')
        return
      }

      const { data: metasExistentes, error } = await supabase
        .from('metas_bar')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar metas existentes:', error)
        alert('❌ Erro ao buscar metas existentes')
        return
      }

      if (metasExistentes) {
        // Mesclar com as metas atuais, mantendo valores existentes no sistema de métricas
        setMetas(prev => ({
          ...prev,
          faturamentoDiario: metasExistentes.faturamento_diario || prev.faturamentoDiario,
          clientesDiario: metasExistentes.clientes_diario || prev.clientesDiario,
          ticketMedioTarget: metasExistentes.ticket_medio_target || prev.ticketMedioTarget,
          reservasDiarias: metasExistentes.reservas_diarias || prev.reservasDiarias,
          tempoSaidaCozinha: metasExistentes.tempo_cozinha || prev.tempoSaidaCozinha,
          tempoSaidaBar: metasExistentes.tempo_bar || prev.tempoSaidaBar
        }))
        alert('✅ Metas importadas do sistema de métricas!')
      } else {
        alert('⚠️ Nenhuma meta encontrada no sistema de métricas')
      }
    } catch (error) {
      console.error('Erro ao importar metas:', error)
      alert('❌ Erro ao importar metas')
    } finally {
      setLoading(false)
    }
  }

  const resetarMetasPadrao = () => {
    if (!confirm('Tem certeza que deseja resetar todas as metas para os valores padrão?')) return

    setMetas({
      // Metas Financeiras Diárias
      faturamentoDiario: 37000,
      clientesDiario: 500,
      ticketMedioTarget: 93,
      
      // Metas Financeiras Mensais
      metaMensalFaturamento: 1000000,
      metaMensalClientes: 10000,
      
      // Metas de Reservas
      reservasDiarias: 133,
      reservasSemanais: 800,
      reservasMensais: 3200,
      
      // Metas de Tempo de Produção
      tempoSaidaCozinha: 12,
      tempoSaidaBar: 4,
      tempoMedioAtendimento: 15,
      
             // Metas de Eficiência
       metaEficienciaProducao: 85
    })
    
    alert('✅ Metas resetadas para valores padrão!')
  }

  // Funções para Usuários
  const carregarUsuarios = async () => {
    try {
      const response = await fetch(`/api/admin/usuarios?bar_id=${selectedBar?.id}`)
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data.usuarios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const salvarUsuario = async () => {
    setLoading(true)
    try {
      const dadosUsuario = {
        ...novoUsuario,
        bar_id: selectedBar?.id
      }

      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosUsuario)
      })

      if (response.ok) {
        alert('✅ Usuário criado com sucesso!')
        setModalUsuario(false)
        limparFormularioUsuario()
        carregarUsuarios()
      } else {
        const error = await response.json()
        alert('❌ Erro: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      alert('❌ Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  const atualizarUsuario = async () => {
    if (!usuarioEditando) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${usuarioEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioEditando)
      })

      if (response.ok) {
        alert('✅ Usuário atualizado com sucesso!')
        setModalUsuario(false)
        setUsuarioEditando(null)
        carregarUsuarios()
      } else {
        const error = await response.json()
        alert('❌ Erro: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('❌ Erro ao atualizar usuário')
    } finally {
      setLoading(false)
    }
  }

  const excluirUsuario = async (usuario: Usuario) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('✅ Usuário excluído com sucesso!')
        carregarUsuarios()
      } else {
        const error = await response.json()
        alert('❌ Erro: ' + (error.message || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('❌ Erro ao excluir usuário')
    } finally {
      setLoading(false)
    }
  }

  const alternarStatusUsuario = async (usuario: Usuario) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...usuario, ativo: !usuario.ativo })
      })

      if (response.ok) {
        carregarUsuarios()
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const limparFormularioUsuario = () => {
    setNovoUsuario({
      email: '',
      nome: '',
      password: '',
      role: 'funcionario',
      modulos_permitidos: ['terminal_producao']
    })
  }

  const abrirModalPermissoes = (usuario: Usuario) => {
    // Garantir que modulos_permitidos seja sempre um array
    const usuarioComPermissoes = {
      ...usuario,
      modulos_permitidos: Array.isArray(usuario.modulos_permitidos) 
        ? usuario.modulos_permitidos 
        : []
    }
    setUsuarioPermissoes(usuarioComPermissoes)
    setModalPermissoes(true)
  }

  const alternarPermissao = (moduloId: string) => {
    if (!usuarioPermissoes) return
    
    // Garantir que seja um array
    const permissoesAtuais = Array.isArray(usuarioPermissoes.modulos_permitidos) 
      ? usuarioPermissoes.modulos_permitidos 
      : []
    
    const novasPermissoes = permissoesAtuais.includes(moduloId)
      ? permissoesAtuais.filter(p => p !== moduloId)
      : [...permissoesAtuais, moduloId]
    
    setUsuarioPermissoes({
      ...usuarioPermissoes,
      modulos_permitidos: novasPermissoes
    })
  }

  const salvarPermissoes = async () => {
    if (!usuarioPermissoes) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${usuarioPermissoes.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioPermissoes)
      })

      if (response.ok) {
        alert('✅ Permissões atualizadas com sucesso!')
        setModalPermissoes(false)
        setUsuarioPermissoes(null)
        carregarUsuarios()
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      alert('❌ Erro ao salvar permissões')
    } finally {
      setLoading(false)
    }
  }

  const aplicarRoleDefault = (role: keyof typeof ROLES_SISTEMA) => {
    setNovoUsuario(prev => ({
      ...prev,
      role,
      modulos_permitidos: ROLES_SISTEMA[role].modulos_default
    }))
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">⚙️ Configurações</h1>
        <p className="text-gray-700">Gerencie metas, usuários e permissões do {selectedBar.nome}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metas">🎯 Metas</TabsTrigger>
          <TabsTrigger value="usuarios">👥 Usuários ({usuarios.length})</TabsTrigger>
          <TabsTrigger value="permissoes">🔒 Roles & Permissões</TabsTrigger>
        </TabsList>

        {/* Tab Metas */}
        <TabsContent value="metas" className="space-y-6">
          {/* Metas Financeiras Diárias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">💰 Metas Financeiras Diárias</CardTitle>
              <p className="text-sm text-gray-600">Objetivos de faturamento e atendimento por dia</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-black font-semibold">Faturamento Diário (R$)</Label>
                  <Input
                    type="number"
                    value={metas.faturamentoDiario}
                    onChange={(e) => setMetas(prev => ({ ...prev, faturamentoDiario: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 37000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Meta de receita por dia de funcionamento</p>
                </div>
                <div>
                  <Label className="text-black font-semibold">Clientes Diários</Label>
                  <Input
                    type="number"
                    value={metas.clientesDiario}
                    onChange={(e) => setMetas(prev => ({ ...prev, clientesDiario: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número de pessoas atendidas por dia</p>
                </div>
                <div>
                  <Label className="text-black font-semibold">Ticket Médio Target (R$)</Label>
                  <Input
                    type="number"
                    value={metas.ticketMedioTarget}
                    onChange={(e) => setMetas(prev => ({ ...prev, ticketMedioTarget: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 93"
                  />
                  <p className="text-xs text-gray-500 mt-1">Valor médio gasto por cliente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metas Financeiras Mensais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">📊 Metas Financeiras Mensais</CardTitle>
              <p className="text-sm text-gray-600">Objetivos consolidados do mês</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold">Faturamento Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={metas.metaMensalFaturamento}
                    onChange={(e) => setMetas(prev => ({ ...prev, metaMensalFaturamento: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 1000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Meta de receita total do mês</p>
                </div>
                <div>
                  <Label className="text-black font-semibold">Clientes Mensais</Label>
                  <Input
                    type="number"
                    value={metas.metaMensalClientes}
                    onChange={(e) => setMetas(prev => ({ ...prev, metaMensalClientes: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total de pessoas atendidas no mês</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metas de Reservas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">📅 Metas de Reservas</CardTitle>
              <p className="text-sm text-gray-600">Objetivos de ocupação e reservas</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-black font-semibold">Reservas Diárias (pessoas)</Label>
                  <Input
                    type="number"
                    value={metas.reservasDiarias}
                    onChange={(e) => setMetas(prev => ({ ...prev, reservasDiarias: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 133"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pessoas com reserva por dia</p>
                </div>
                <div>
                  <Label className="text-black font-semibold">Reservas Semanais (pessoas)</Label>
                  <Input
                    type="number"
                    value={metas.reservasSemanais}
                    onChange={(e) => setMetas(prev => ({ ...prev, reservasSemanais: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 800"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total semanal de reservas</p>
                </div>
                <div>
                  <Label className="text-black font-semibold">Reservas Mensais (pessoas)</Label>
                  <Input
                    type="number"
                    value={metas.reservasMensais}
                    onChange={(e) => setMetas(prev => ({ ...prev, reservasMensais: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 3200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total mensal de reservas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metas de Tempo de Produção */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">⏱️ Metas de Tempo de Produção</CardTitle>
              <p className="text-sm text-gray-600">Objetivos de eficiência operacional</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-black font-semibold">Tempo Saída Cozinha (min)</Label>
                  <Input
                    type="number"
                    value={metas.tempoSaidaCozinha}
                    onChange={(e) => setMetas(prev => ({ ...prev, tempoSaidaCozinha: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 12"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tempo máximo para preparo de pratos</p>
                </div>
                <div>
                  <Label className="text-black font-semibold">Tempo Saída Bar (min)</Label>
                  <Input
                    type="number"
                    value={metas.tempoSaidaBar}
                    onChange={(e) => setMetas(prev => ({ ...prev, tempoSaidaBar: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 4"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tempo máximo para preparo de bebidas</p>
                </div>
                <div>
                  <Label className="text-black font-semibold">Tempo Médio Atendimento (min)</Label>
                  <Input
                    type="number"
                    value={metas.tempoMedioAtendimento}
                    onChange={(e) => setMetas(prev => ({ ...prev, tempoMedioAtendimento: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tempo médio desde pedido até entrega</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metas de Eficiência */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">📈 Metas de Eficiência</CardTitle>
              <p className="text-sm text-gray-600">Indicadores de performance operacional</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-black font-semibold">Eficiência Produção (%)</Label>
                  <Input
                    type="number"
                    value={metas.metaEficienciaProducao}
                    onChange={(e) => setMetas(prev => ({ ...prev, metaEficienciaProducao: parseFloat(e.target.value) || 0 }))}
                    className="text-black font-medium"
                    placeholder="Ex: 85"
                    max="100"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">% de receitas produzidas dentro do esperado</p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Ações das Metas */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                onClick={importarMetasExistentes}
                disabled={loading}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Importar Existentes
              </Button>
              <Button
                onClick={resetarMetasPadrao}
                disabled={loading}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Resetar Padrão
              </Button>
            </div>
            <Button
              onClick={salvarMetas}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              {loading ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Metas'}
            </Button>
          </div>
        </TabsContent>

        {/* Tab Usuários */}
        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-black font-semibold">Usuários do Sistema</CardTitle>
              <Button
                onClick={() => {
                  limparFormularioUsuario()
                  setUsuarioEditando(null)
                  setModalUsuario(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Novo Usuário
              </Button>
            </CardHeader>
            <CardContent>
              {usuarios.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum usuário cadastrado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {usuarios.map((usuario) => (
                    <div key={usuario.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold text-black">{usuario.nome}</h3>
                            <p className="text-sm text-gray-600">{usuario.email}</p>
                          </div>
                          <Badge className={ROLES_SISTEMA[usuario.role as keyof typeof ROLES_SISTEMA]?.cor}>
                            {ROLES_SISTEMA[usuario.role as keyof typeof ROLES_SISTEMA]?.nome}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => alternarStatusUsuario(usuario)}
                              disabled={loading}
                              className={`
                                px-3 py-1 rounded-lg font-medium text-xs transition-all duration-200 min-w-[60px]
                                ${usuario.ativo 
                                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm' 
                                  : 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                            >
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => abrirModalPermissoes(usuario)}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                          >
                            Permissões
                          </Button>
                          <Button
                            onClick={() => {
                              setUsuarioEditando(usuario)
                              setModalUsuario(true)
                            }}
                            variant="outline"
                            size="sm"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-800"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => excluirUsuario(usuario)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-800"
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">
                          Módulos permitidos: {Array.isArray(usuario.modulos_permitidos) ? usuario.modulos_permitidos.length : 0} de {MODULOS_SISTEMA.length}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Permissões */}
        <TabsContent value="permissoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-semibold">Sistema de Roles & Permissões</CardTitle>
              <p className="text-gray-600 text-sm">
                Visualize a estrutura de permissões do sistema. Para alterar permissões individuais, use o botão "Permissões" na aba de usuários.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Resumo Geral */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                  <h3 className="font-bold text-black mb-2">Resumo do Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{usuarios.length}</div>
                      <div className="text-sm text-gray-600">Usuários Totais</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{Object.keys(ROLES_SISTEMA).length}</div>
                      <div className="text-sm text-gray-600">Roles Disponíveis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{MODULOS_SISTEMA.length}</div>
                      <div className="text-sm text-gray-600">Módulos do Sistema</div>
                    </div>
                  </div>
                </div>

                {/* Detalhamento dos Roles */}
                {Object.entries(ROLES_SISTEMA).map(([roleKey, roleData]) => {
                  const usuariosDoRole = usuarios.filter(u => u.role === roleKey)
                  
                  return (
                    <div key={roleKey} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header do Role */}
                      <div className="bg-gray-50 p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={roleData.cor} variant="default">
                              {roleData.nome}
                            </Badge>
                            <div>
                              <h3 className="font-semibold text-black">{roleData.nome}</h3>
                              <p className="text-sm text-gray-600">{roleData.descricao}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-black">
                              {usuariosDoRole.length}
                            </div>
                            <div className="text-xs text-gray-500">usuário(s)</div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Usuários */}
                      {usuariosDoRole.length > 0 && (
                        <div className="p-4 bg-blue-50">
                          <h4 className="font-medium text-black mb-2">Usuários com este role:</h4>
                          <div className="flex flex-wrap gap-2">
                            {usuariosDoRole.map(user => (
                              <div key={user.id} className="bg-white px-3 py-1 rounded-full border text-sm">
                                <span className="font-medium">{user.nome}</span>
                                <span className="text-gray-500 ml-1">({user.email})</span>
                                {!user.ativo && <span className="text-red-500 ml-1">●</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Permissões do Role */}
                      <div className="p-4">
                        <h4 className="font-medium text-black mb-3">
                          Módulos permitidos ({roleData.modulos_default.length}/{MODULOS_SISTEMA.length}):
                        </h4>
                        
                        {/* Agrupado por categoria */}
                        {[
                          { id: 'dashboards', nome: 'Dashboards', cor: 'bg-blue-100 text-blue-800' },
                          { id: 'dados', nome: 'Dados', cor: 'bg-green-100 text-green-800' },
                          { id: 'terminal', nome: 'Terminal', cor: 'bg-orange-100 text-orange-800' },
                          { id: 'configuracao', nome: 'Config', cor: 'bg-purple-100 text-purple-800' }
                        ].map(categoria => {
                          const modulosCategoria = MODULOS_SISTEMA.filter(m => 
                            m.categoria === categoria.id && roleData.modulos_default.includes(m.id)
                          )
                          
                          if (modulosCategoria.length === 0) return null
                          
                          return (
                            <div key={categoria.id} className="mb-3">
                              <Badge variant="outline" className={`${categoria.cor} mb-2`}>
                                {categoria.nome}
                              </Badge>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                                {modulosCategoria.map(modulo => (
                                  <div key={modulo.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm">
                                    <span className="text-green-600">✓</span>
                                    <span className="text-gray-700">{modulo.nome}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Nota Informativa */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-black mb-2">
                    Como alterar permissões
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• <strong>Permissões individuais</strong>: Vá na aba "Usuários" e clique em "Permissões" no usuário desejado</p>
                    <p>• <strong>Role do usuário</strong>: Use o botão "Editar" para alterar a função e permissões padrão</p>
                    <p>• <strong>Admins</strong> têm acesso total automaticamente, independente das permissões configuradas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Usuário */}
      <Dialog open={modalUsuario} onOpenChange={setModalUsuario}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-black">
              {usuarioEditando ? `Editar - ${usuarioEditando.nome}` : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações Pessoais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-black mb-4">
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold mb-2 block">Nome Completo *</Label>
                  <Input
                    value={usuarioEditando ? usuarioEditando.nome : novoUsuario.nome}
                    onChange={(e) => {
                      if (usuarioEditando) {
                        setUsuarioEditando({ ...usuarioEditando, nome: e.target.value })
                      } else {
                        setNovoUsuario(prev => ({ ...prev, nome: e.target.value }))
                      }
                    }}
                    placeholder="Ex: João Silva"
                    className="text-black font-medium h-11"
                  />
                </div>
                <div>
                  <Label className="text-black font-semibold mb-2 block">Email de Acesso *</Label>
                  <Input
                    type="email"
                    value={usuarioEditando ? usuarioEditando.email : novoUsuario.email}
                    onChange={(e) => {
                      if (usuarioEditando) {
                        setUsuarioEditando({ ...usuarioEditando, email: e.target.value })
                      } else {
                        setNovoUsuario(prev => ({ ...prev, email: e.target.value }))
                      }
                    }}
                    placeholder="joao@empresa.com"
                    className="text-black font-medium h-11"
                  />
                </div>
              </div>
            </div>

            {/* Senha (apenas para novos usuários) */}
            {!usuarioEditando && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-black mb-4">
                  Senha de Acesso
                </h3>
                <div>
                  <Label className="text-black font-semibold mb-2 block">Senha Inicial *</Label>
                  <Input
                    type="password"
                    value={novoUsuario.password}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite uma senha segura"
                    className="text-black font-medium h-11"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    O usuário poderá alterar a senha no primeiro acesso
                  </p>
                </div>
              </div>
            )}

            {/* Nível de Acesso */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-black mb-4">
                Nível de Acesso
              </h3>
              <div>
                <Label className="text-black font-semibold mb-2 block">Função no Sistema</Label>
                <Select
                  value={usuarioEditando ? usuarioEditando.role : novoUsuario.role}
                  onValueChange={(value) => {
                    const role = value as keyof typeof ROLES_SISTEMA
                    if (usuarioEditando) {
                      setUsuarioEditando({ 
                        ...usuarioEditando, 
                        role,
                        modulos_permitidos: ROLES_SISTEMA[role].modulos_default
                      })
                    } else {
                      aplicarRoleDefault(role)
                    }
                  }}
                >
                  <SelectTrigger className="text-black font-medium h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES_SISTEMA).map(([key, role]) => (
                      <SelectItem key={key} value={key} className="py-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={role.cor} variant="outline">
                            {role.nome}
                          </Badge>
                          <span className="text-gray-600">- {role.descricao}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-2">
                  As permissões serão aplicadas automaticamente baseadas na função escolhida
                </p>
              </div>
            </div>

            {/* Preview das Permissões */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-black mb-4">
                Módulos que terá acesso:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {(usuarioEditando 
                  ? ROLES_SISTEMA[usuarioEditando.role as keyof typeof ROLES_SISTEMA]?.modulos_default || []
                  : ROLES_SISTEMA[novoUsuario.role as keyof typeof ROLES_SISTEMA]?.modulos_default || []
                ).map(moduloId => {
                  const modulo = MODULOS_SISTEMA.find(m => m.id === moduloId)
                  return modulo ? (
                    <div key={modulo.id} className="flex items-center space-x-2 p-2 bg-white rounded border shadow-sm">
                      <span className="text-xs text-green-600">✓</span>
                      <span className="text-xs font-medium text-gray-700">{modulo.nome}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setModalUsuario(false)} className="text-gray-700 border-gray-300 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button
              onClick={usuarioEditando ? atualizarUsuario : salvarUsuario}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Salvando...' : usuarioEditando ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Permissões */}
      {modalPermissoes && (
        <Dialog open={modalPermissoes} onOpenChange={setModalPermissoes}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold text-black">
                Permissões - {usuarioPermissoes?.nome}
              </DialogTitle>
            </DialogHeader>
          
          {usuarioPermissoes && (
            <div className="space-y-4">
              {/* Seleção de Permissões por Categoria */}
              {[
                { id: 'dashboards', nome: 'Dashboards', cor: 'bg-blue-50 border-blue-200' },
                { id: 'dados', nome: 'Gestão de Dados', cor: 'bg-green-50 border-green-200' },
                { id: 'terminal', nome: 'Terminal de Produção', cor: 'bg-orange-50 border-orange-200' },
                { id: 'configuracao', nome: 'Configurações', cor: 'bg-purple-50 border-purple-200' }
              ].map(categoria => (
                <div key={categoria.id} className={`${categoria.cor} p-4 rounded-lg border`}>
                  <h3 className="font-semibold text-black mb-4">
                    {categoria.nome}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MODULOS_SISTEMA
                      .filter(modulo => modulo.categoria === categoria.id)
                      .map(modulo => {
                        const isChecked = Array.isArray(usuarioPermissoes.modulos_permitidos) 
                          ? usuarioPermissoes.modulos_permitidos.includes(modulo.id)
                          : false
                        
                        return (
                          <div key={modulo.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                            <button
                              onClick={() => alternarPermissao(modulo.id)}
                              className={`
                                px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 min-w-[80px]
                                ${isChecked 
                                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
                                  : 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                                }
                              `}
                            >
                              {isChecked ? 'Ativo' : 'Inativo'}
                            </button>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-black">{modulo.nome}</p>
                              <p className="text-xs text-gray-600">{modulo.descricao}</p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}

              {/* Resumo das Permissões */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-black mb-3">
                  Resumo das Permissões
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">
                      Total de módulos liberados:
                    </span>
                    <Badge variant="outline" className="text-lg font-bold bg-white">
                      {Array.isArray(usuarioPermissoes.modulos_permitidos) 
                        ? usuarioPermissoes.modulos_permitidos.length 
                        : 0} de {MODULOS_SISTEMA.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Array.isArray(usuarioPermissoes.modulos_permitidos) 
                          ? usuarioPermissoes.modulos_permitidos.length 
                          : 0}
                      </div>
                      <div className="text-xs text-green-700 font-medium">Ativos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {MODULOS_SISTEMA.length - (Array.isArray(usuarioPermissoes.modulos_permitidos) 
                          ? usuarioPermissoes.modulos_permitidos.length 
                          : 0)}
                      </div>
                      <div className="text-xs text-red-700 font-medium">Inativos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setModalPermissoes(false)} className="text-gray-700 border-gray-300 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button
              onClick={salvarPermissoes}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
} 