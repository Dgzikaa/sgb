'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useBar } from '@/contexts/BarContext'
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

// Interfaces
interface Usuario {
  id: number
  nome: string
  email: string
  perfil: 'admin' | 'gerente' | 'funcionario'
  ativo: boolean
  ultimo_acesso?: string
}

interface Permissao {
  modulo: string
  admin: boolean
  gerente: boolean
  funcionario: boolean
}

interface Meta {
  id: number
  tipo: 'faturamento' | 'pessoas' | 'ticket_medio'
  periodo: 'diario' | 'semanal' | 'mensal'
  valor_meta: number
  ativa: boolean
}

interface ImportacaoStats {
  produtos: number
  insumos: number
  receitas: number
}

export default function ConfiguracaoPage() {
  const { selectedBar } = useBar()
  const [activeTab, setActiveTab] = useState('usuarios')
  
  // Estados para usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 1, nome: 'Rodrigo Oliveira', email: 'rodrigo@grupomenosemais.com.br', perfil: 'admin', ativo: true, ultimo_acesso: '2025-01-01 14:30' },
    { id: 2, nome: 'Maria Silva', email: 'maria@bar.com', perfil: 'gerente', ativo: true, ultimo_acesso: '2025-01-01 12:15' },
    { id: 3, nome: 'João Santos', email: 'joao@bar.com', perfil: 'funcionario', ativo: false, ultimo_acesso: '2024-12-30 18:45' }
  ])
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [novoUsuario, setNovoUsuario] = useState<Partial<Usuario>>({})

  // Estados para permissões
  const [permissoes, setPermissoes] = useState<Permissao[]>([
    { modulo: 'Dashboard Principal', admin: true, gerente: true, funcionario: true },
    { modulo: 'Dashboard Analítico', admin: true, gerente: true, funcionario: false },
    { modulo: 'Gestão de Produtos', admin: true, gerente: true, funcionario: false },
    { modulo: 'Relatórios Financeiros', admin: true, gerente: true, funcionario: false },
    { modulo: 'Configurações', admin: true, gerente: false, funcionario: false },
    { modulo: 'Gestão de Usuários', admin: true, gerente: false, funcionario: false },
    { modulo: 'Terminal de Produção', admin: true, gerente: true, funcionario: true },
    { modulo: 'Planejamento e Metas', admin: true, gerente: true, funcionario: false }
  ])

  // Estados para metas
  const [metas, setMetas] = useState<Meta[]>([
    { id: 1, tipo: 'faturamento', periodo: 'diario', valor_meta: 2500, ativa: true },
    { id: 2, tipo: 'pessoas', periodo: 'diario', valor_meta: 80, ativa: true },
    { id: 3, tipo: 'ticket_medio', periodo: 'mensal', valor_meta: 35, ativa: true },
    { id: 4, tipo: 'faturamento', periodo: 'mensal', valor_meta: 75000, ativa: false }
  ])
  const [editandoMeta, setEditandoMeta] = useState<Meta | null>(null)
  const [novaMeta, setNovaMeta] = useState<Partial<Meta>>({})

  // Estados para importação
  const [urlGoogleSheets, setUrlGoogleSheets] = useState('')
  const [importandoDados, setImportandoDados] = useState(false)
  const [resultadoImportacao, setResultadoImportacao] = useState<any>(null)
  const [statsImportacao, setStatsImportacao] = useState<ImportacaoStats | null>(null)

  // Funções para usuários
  const salvarUsuario = () => {
    if (editandoUsuario) {
      setUsuarios(prev => prev.map(u => u.id === editandoUsuario.id ? editandoUsuario : u))
      setEditandoUsuario(null)
    } else if (novoUsuario.nome && novoUsuario.email && novoUsuario.perfil) {
      const id = Math.max(...usuarios.map(u => u.id)) + 1
      setUsuarios(prev => [...prev, { 
        id, 
        nome: novoUsuario.nome!, 
        email: novoUsuario.email!, 
        perfil: novoUsuario.perfil!, 
        ativo: true 
      }])
      setNovoUsuario({})
    }
  }

  const excluirUsuario = (id: number) => {
    setUsuarios(prev => prev.filter(u => u.id !== id))
  }

  // Funções para permissões
  const alterarPermissao = (modulo: string, perfil: keyof Omit<Permissao, 'modulo'>, valor: boolean) => {
    setPermissoes(prev => prev.map(p => 
      p.modulo === modulo ? { ...p, [perfil]: valor } : p
    ))
  }

  // Funções para metas
  const salvarMeta = () => {
    if (editandoMeta) {
      setMetas(prev => prev.map(m => m.id === editandoMeta.id ? editandoMeta : m))
      setEditandoMeta(null)
    } else if (novaMeta.tipo && novaMeta.periodo && novaMeta.valor_meta) {
      const id = Math.max(...metas.map(m => m.id)) + 1
      setMetas(prev => [...prev, { 
        id, 
        tipo: novaMeta.tipo!, 
        periodo: novaMeta.periodo!, 
        valor_meta: novaMeta.valor_meta!, 
        ativa: true 
      }])
      setNovaMeta({})
    }
  }

  const excluirMeta = (id: number) => {
    setMetas(prev => prev.filter(m => m.id !== id))
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
        // Recarregar estatísticas
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-black mb-2">
          Configurações do Sistema
        </h1>
        <p className="text-gray-700 font-medium">
          Gerencie usuários, permissões, metas e importações de dados
        </p>
      </div>

      {/* Tabs de Configuração */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="importacao" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Importação
          </TabsTrigger>
        </TabsList>

        {/* Aba Usuários */}
        <TabsContent value="usuarios" className="space-y-6">
          {/* Formulário Novo Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <Plus className="w-5 h-5" />
                Adicionar Novo Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="nome" className="text-black font-semibold">Nome</Label>
                  <Input
                    id="nome"
                    value={novoUsuario.nome || ''}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-black font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={novoUsuario.email || ''}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="text-black font-medium border-2 border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="perfil" className="text-black font-semibold">Perfil</Label>
                  <Select value={novoUsuario.perfil} onValueChange={(value) => setNovoUsuario(prev => ({ ...prev, perfil: value as any }))}>
                    <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="funcionario">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={salvarUsuario} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-bold">Usuários Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usuarios.map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                    {editandoUsuario?.id === usuario.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                        <Input
                          value={editandoUsuario.nome}
                          onChange={(e) => setEditandoUsuario(prev => prev ? { ...prev, nome: e.target.value } : null)}
                          className="text-black font-medium border-2 border-gray-300"
                        />
                        <Input
                          value={editandoUsuario.email}
                          onChange={(e) => setEditandoUsuario(prev => prev ? { ...prev, email: e.target.value } : null)}
                          className="text-black font-medium border-2 border-gray-300"
                        />
                        <Select value={editandoUsuario.perfil} onValueChange={(value) => setEditandoUsuario(prev => prev ? { ...prev, perfil: value as any } : null)}>
                          <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="funcionario">Funcionário</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={salvarUsuario}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditandoUsuario(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-bold text-black">{usuario.nome}</h3>
                              <p className="text-sm text-gray-700 font-medium">{usuario.email}</p>
                              {usuario.ultimo_acesso && (
                                <p className="text-xs text-gray-600 font-medium">Último acesso: {usuario.ultimo_acesso}</p>
                              )}
                            </div>
                            <Badge variant={usuario.perfil === 'admin' ? 'default' : usuario.perfil === 'gerente' ? 'secondary' : 'outline'}>
                              {usuario.perfil === 'admin' ? 'Administrador' : usuario.perfil === 'gerente' ? 'Gerente' : 'Funcionário'}
                            </Badge>
                            <div className="flex items-center gap-2">
                              {usuario.ativo ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Inativo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditandoUsuario(usuario)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => excluirUsuario(usuario.id)}
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

        {/* Aba Permissões */}
        <TabsContent value="permissoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-black font-bold">Controle de Permissões por Perfil</CardTitle>
              <p className="text-sm text-gray-700 font-medium">
                Defina quais módulos cada perfil de usuário pode acessar
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 font-bold text-black border-b-2 border-gray-300 pb-2">
                  <div>Módulo</div>
                  <div className="text-center">Administrador</div>
                  <div className="text-center">Gerente</div>
                  <div className="text-center">Funcionário</div>
                </div>
                {permissoes.map((permissao) => (
                  <div key={permissao.modulo} className="grid grid-cols-4 gap-4 items-center py-2">
                    <div className="font-semibold text-black">{permissao.modulo}</div>
                    <div className="flex justify-center">
                      <Switch
                        checked={permissao.admin}
                        onCheckedChange={(checked) => alterarPermissao(permissao.modulo, 'admin', checked)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={permissao.gerente}
                        onCheckedChange={(checked) => alterarPermissao(permissao.modulo, 'gerente', checked)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={permissao.funcionario}
                        onCheckedChange={(checked) => alterarPermissao(permissao.modulo, 'funcionario', checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                  <Select value={novaMeta.tipo} onValueChange={(value) => setNovaMeta(prev => ({ ...prev, tipo: value as any }))}>
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
                  <Select value={novaMeta.periodo} onValueChange={(value) => setNovaMeta(prev => ({ ...prev, periodo: value as any }))}>
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
                    onChange={(e) => setNovaMeta(prev => ({ ...prev, valor_meta: parseFloat(e.target.value) }))}
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
                        <Select value={editandoMeta.tipo} onValueChange={(value) => setEditandoMeta(prev => prev ? { ...prev, tipo: value as any } : null)}>
                          <SelectTrigger className="text-black font-medium border-2 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="faturamento">Faturamento</SelectItem>
                            <SelectItem value="pessoas">Pessoas</SelectItem>
                            <SelectItem value="ticket_medio">Ticket Médio</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={editandoMeta.periodo} onValueChange={(value) => setEditandoMeta(prev => prev ? { ...prev, periodo: value as any } : null)}>
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
                          onChange={(e) => setEditandoMeta(prev => prev ? { ...prev, valor_meta: parseFloat(e.target.value) } : null)}
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
      </Tabs>
    </div>
  )
} 