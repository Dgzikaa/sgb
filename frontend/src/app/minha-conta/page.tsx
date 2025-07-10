'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import ProfilePhotoUpload from '@/components/uploads/ProfilePhotoUpload'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Shield, 
  Key,
  Save,
  AlertCircle,
  CheckCircle,
  Building,
  CreditCard,
  FileText
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

interface PerfilUsuario {
  id: number
  nome: string
  email: string
  role: string
  foto_perfil?: string
  celular?: string
  telefone?: string
  cpf?: string
  data_nascimento?: string
  endereco?: string
  cep?: string
  cidade?: string
  estado?: string
  bio?: string
  cargo?: string
  departamento?: string
  data_contratacao?: string
  conta_verificada: boolean
  criado_em: string
  ultima_atividade?: string
  bar?: {
    id: number
    nome: string
  }
}

const estadosBrasil = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function MinhaContaPage() {
  const { user } = usePermissions()
  
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  // Estados para edição de perfil
  const [dadosEdicao, setDadosEdicao] = useState<Partial<PerfilUsuario>>({})

  // Estados para troca de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    carregarPerfil()
  }, [])

  const carregarPerfil = async () => {
    try {
      setCarregando(true)
      const response = await fetch('/api/usuario/perfil')
      const data = await response.json()

      if (data.success) {
        setPerfil(data.perfil)
        setDadosEdicao(data.perfil)
      } else {
        setMensagem({ tipo: 'error', texto: data.error || 'Erro ao carregar perfil' })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar perfil' })
    } finally {
      setCarregando(false)
    }
  }

  const salvarPerfil = async () => {
    try {
      setSalvandoPerfil(true)
      const response = await fetch('/api/usuario/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEdicao)
      })

      const data = await response.json()

      if (data.success) {
        setPerfil(data.perfil)
        setEditandoPerfil(false)
        setMensagem({ tipo: 'success', texto: 'Perfil atualizado com sucesso!' })
      } else {
        setMensagem({ tipo: 'error', texto: data.error || 'Erro ao salvar perfil' })
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      setMensagem({ tipo: 'error', texto: 'Erro ao salvar perfil' })
    } finally {
      setSalvandoPerfil(false)
    }
  }

  const trocarSenha = async () => {
    try {
      setSalvandoSenha(true)
      const response = await fetch('/api/usuario/trocar-senha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
          confirmarSenha
        })
      })

      const data = await response.json()

      if (data.success) {
        setMensagem({ tipo: 'success', texto: data.message })
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarSenha('')
        
        // Se requer relogin, redirecionar após um tempo
        if (data.require_relogin) {
          setTimeout(() => {
            localStorage.clear()
            window.location.href = '/login'
          }, 3000)
        }
      } else {
        setMensagem({ tipo: 'error', texto: data.error || 'Erro ao trocar senha' })
      }
    } catch (error) {
      console.error('Erro ao trocar senha:', error)
      setMensagem({ tipo: 'error', texto: 'Erro ao trocar senha' })
    } finally {
      setSalvandoSenha(false)
    }
  }

  const formatarCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`
    }
    return cleaned
  }

  const formatarTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 11) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
      if (match) return `(${match[1]}) ${match[2]}-${match[3]}`
    } else if (cleaned.length === 10) {
      const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/)
      if (match) return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return cleaned
  }

  const formatarCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{5})(\d{3})$/)
    if (match) {
      return `${match[1]}-${match[2]}`
    }
    return cleaned
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar perfil</h2>
        <p className="text-gray-600 mb-4">Não foi possível carregar os dados do seu perfil.</p>
        <Button onClick={carregarPerfil}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de feedback */}
      {mensagem && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          mensagem.tipo === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensagem.tipo === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        {/* Tab do Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Informações Pessoais</span>
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas informações pessoais e foto de perfil
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {perfil.conta_verificada && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {perfil.role === 'admin' ? 'Administrador' : 
                     perfil.role === 'manager' ? 'Gerente' : 'Funcionário'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center space-y-4">
                <ProfilePhotoUpload
                  currentPhoto={editandoPerfil ? dadosEdicao.foto_perfil : perfil.foto_perfil}
                  onPhotoChange={(foto) => setDadosEdicao(prev => ({ ...prev, foto_perfil: foto }))}
                  disabled={!editandoPerfil}
                />
              </div>

              <Separator />

              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    value={editandoPerfil ? dadosEdicao.nome || '' : perfil.nome}
                    onChange={(e) => setDadosEdicao(prev => ({ ...prev, nome: e.target.value }))}
                    disabled={!editandoPerfil}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={perfil.email}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">O e-mail não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    value={editandoPerfil ? dadosEdicao.celular || '' : formatarTelefone(perfil.celular || '')}
                    onChange={(e) => setDadosEdicao(prev => ({ ...prev, celular: e.target.value }))}
                    disabled={!editandoPerfil}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone fixo</Label>
                  <Input
                    id="telefone"
                    value={editandoPerfil ? dadosEdicao.telefone || '' : formatarTelefone(perfil.telefone || '')}
                    onChange={(e) => setDadosEdicao(prev => ({ ...prev, telefone: e.target.value }))}
                    disabled={!editandoPerfil}
                    placeholder="(11) 3333-4444"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={editandoPerfil ? dadosEdicao.cpf || '' : formatarCPF(perfil.cpf || '')}
                    onChange={(e) => setDadosEdicao(prev => ({ ...prev, cpf: e.target.value }))}
                    disabled={!editandoPerfil}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={editandoPerfil ? dadosEdicao.data_nascimento || '' : perfil.data_nascimento || ''}
                    onChange={(e) => setDadosEdicao(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    disabled={!editandoPerfil}
                  />
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Endereço</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereço completo</Label>
                    <Input
                      id="endereco"
                      value={editandoPerfil ? dadosEdicao.endereco || '' : perfil.endereco || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, endereco: e.target.value }))}
                      disabled={!editandoPerfil}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={editandoPerfil ? dadosEdicao.cep || '' : formatarCEP(perfil.cep || '')}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, cep: e.target.value }))}
                      disabled={!editandoPerfil}
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={editandoPerfil ? dadosEdicao.cidade || '' : perfil.cidade || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, cidade: e.target.value }))}
                      disabled={!editandoPerfil}
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={editandoPerfil ? dadosEdicao.estado || '' : perfil.estado || ''}
                      onValueChange={(value) => setDadosEdicao(prev => ({ ...prev, estado: value }))}
                      disabled={!editandoPerfil}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosBrasil.map(estado => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informações profissionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Informações Profissionais</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={editandoPerfil ? dadosEdicao.cargo || '' : perfil.cargo || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, cargo: e.target.value }))}
                      disabled={!editandoPerfil}
                      placeholder="Seu cargo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      value={editandoPerfil ? dadosEdicao.departamento || '' : perfil.departamento || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, departamento: e.target.value }))}
                      disabled={!editandoPerfil}
                      placeholder="Seu departamento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_contratacao">Data de contratação</Label>
                    <Input
                      id="data_contratacao"
                      type="date"
                      value={editandoPerfil ? dadosEdicao.data_contratacao || '' : perfil.data_contratacao || ''}
                      onChange={(e) => setDadosEdicao(prev => ({ ...prev, data_contratacao: e.target.value }))}
                      disabled={!editandoPerfil}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bar">Estabelecimento</Label>
                    <Input
                      id="bar"
                      value={perfil.bar?.nome || 'Não informado'}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia/Descrição</Label>
                  <Textarea
                    id="bio"
                    value={editandoPerfil ? dadosEdicao.bio || '' : perfil.bio || ''}
                    onChange={(e) => setDadosEdicao(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!editandoPerfil}
                    placeholder="Conte um pouco sobre você..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-3 pt-4">
                {editandoPerfil ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditandoPerfil(false)
                        setDadosEdicao(perfil)
                      }}
                      disabled={salvandoPerfil}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={salvarPerfil}
                      disabled={salvandoPerfil}
                      className="flex items-center space-x-2"
                    >
                      {salvandoPerfil ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{salvandoPerfil ? 'Salvando...' : 'Salvar alterações'}</span>
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditandoPerfil(true)}>
                    Editar perfil
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Segurança da Conta</span>
              </CardTitle>
              <CardDescription>
                Gerencie sua senha e configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trocar senha */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Alterar senha</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senhaAtual">Senha atual</Label>
                    <Input
                      id="senhaAtual"
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Sua senha atual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="novaSenha">Nova senha</Label>
                    <Input
                      id="novaSenha"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Nova senha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={trocarSenha}
                    disabled={salvandoSenha || !senhaAtual || !novaSenha || !confirmarSenha}
                    className="flex items-center space-x-2"
                  >
                    {salvandoSenha ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    <span>{salvandoSenha ? 'Alterando...' : 'Alterar senha'}</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Informações da conta */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações da conta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Conta criada em:</span>
                    <span className="font-medium">
                      {new Date(perfil.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {perfil.ultima_atividade && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600">Última atividade:</span>
                      <span className="font-medium">
                        {new Date(perfil.ultima_atividade).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Status da conta:</span>
                    <Badge variant={perfil.conta_verificada ? "default" : "secondary"}>
                      {perfil.conta_verificada ? "Verificada" : "Não verificada"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Nível de acesso:</span>
                    <Badge variant="outline">
                      {perfil.role === 'admin' ? 'Administrador' : 
                       perfil.role === 'manager' ? 'Gerente' : 'Funcionário'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 