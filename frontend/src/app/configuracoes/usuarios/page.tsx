'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Key,
  Phone,
  Calendar,
  MapPin,
  User,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Usuario {
  id: number;
  email: string;
  nome: string;
  role: string;
  modulos_permitidos: string[];
  ativo: boolean;
  criado_em: string;
  ultima_atividade?: string;
  celular?: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
}

interface Modulo {
  id: string;
  nome: string;
  categoria: string;
}

const ROLES_OPCOES = [
  { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'funcionario', label: 'Funcionário', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'financeiro', label: 'Financeiro', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    role: '',
    modulos_permitidos: [] as string[],
    ativo: true,
    celular: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    endereco: '',
    cep: '',
    cidade: '',
    estado: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchUsuarios();
    fetchModulos();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/configuracoes/usuarios');
      const data = await response.json();
      if (data.usuarios) {
        setUsuarios(data.usuarios);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModulos = async () => {
    try {
      const response = await fetch('/api/configuracoes/permissoes');
      const data = await response.json();
      if (data.modulos) {
        setModulos(data.modulos);
      }
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { ...formData, id: editingUser.id }
        : formData;

      const response = await fetch('/api/configuracoes/usuarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Usuário ${editingUser ? 'atualizado' : 'criado'} com sucesso`,
        });
        setIsDialogOpen(false);
        resetForm();
        fetchUsuarios();
      } else {
        throw new Error('Erro na requisição');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar usuário',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
      modulos_permitidos: usuario.modulos_permitidos || [],
      ativo: usuario.ativo,
      celular: usuario.celular || '',
      telefone: usuario.telefone || '',
      cpf: usuario.cpf || '',
      data_nascimento: usuario.data_nascimento || '',
      endereco: usuario.endereco || '',
      cep: usuario.cep || '',
      cidade: usuario.cidade || '',
      estado: usuario.estado || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return;

    try {
      const response = await fetch(`/api/configuracoes/usuarios?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Usuário desativado com sucesso',
        });
        fetchUsuarios();
      }
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desativar usuário',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      nome: '',
      role: '',
      modulos_permitidos: [],
      ativo: true,
      celular: '',
      telefone: '',
      cpf: '',
      data_nascimento: '',
      endereco: '',
      cep: '',
      cidade: '',
      estado: '',
    });
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm('Tem certeza que deseja redefinir a senha deste usuário?')) return;

    try {
      // Simulação da redefinição de senha
      toast({
        title: 'Sucesso',
        description: 'Nova senha enviada por email para o usuário',
      });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao redefinir senha',
        variant: 'destructive',
      });
    }
  };

  const handleModuloChange = (moduloId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      modulos_permitidos: checked 
        ? [...prev.modulos_permitidos, moduloId]
        : prev.modulos_permitidos.filter(id => id !== moduloId)
    }));
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'todos' || usuario.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES_OPCOES.find(r => r.value === role);
    return roleConfig ? (
      <Badge className={roleConfig.color}>
        {roleConfig.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{role}</Badge>
    );
  };

  const modulosPorCategoria = modulos.reduce((acc, modulo) => {
    if (!acc[modulo.categoria]) {
      acc[modulo.categoria] = [];
    }
    acc[modulo.categoria].push(modulo);
    return acc;
  }, {} as Record<string, Modulo[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Gestão de Usuários</h1>
              <p className="text-gray-300">
                Gerencie usuários do sistema e suas permissões
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="btn-primary-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="border-b border-gray-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-semibold text-white">
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        {editingUser ? 'Atualize os dados e permissões do usuário' : 'Preencha os dados do novo usuário'}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[70vh] py-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados Básicos */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Dados Básicos</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome" className="text-gray-300 mb-2 block">Nome Completo</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="Digite o nome completo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-gray-300 mb-2 block">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="email@exemplo.com"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="role" className="text-gray-300 mb-2 block">Função</Label>
                          <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              {ROLES_OPCOES.map(role => (
                                <SelectItem key={role.value} value={role.value} className="text-white hover:bg-gray-600">
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="celular" className="text-gray-300 mb-2 block">Celular</Label>
                          <Input
                            id="celular"
                            value={formData.celular}
                            onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cpf" className="text-gray-300 mb-2 block">CPF</Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="data_nascimento" className="text-gray-300 mb-2 block">Data de Nascimento</Label>
                          <Input
                            id="data_nascimento"
                            type="date"
                            value={formData.data_nascimento}
                            onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone" className="text-gray-300 mb-2 block">Telefone Fixo</Label>
                          <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="(11) 3333-3333"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Endereço</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="cep" className="text-gray-300 mb-2 block">CEP</Label>
                          <Input
                            id="cep"
                            value={formData.cep}
                            onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="00000-000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cidade" className="text-gray-300 mb-2 block">Cidade</Label>
                          <Input
                            id="cidade"
                            value={formData.cidade}
                            onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="Nome da cidade"
                          />
                        </div>
                        <div>
                          <Label htmlFor="estado" className="text-gray-300 mb-2 block">Estado</Label>
                          <Input
                            id="estado"
                            value={formData.estado}
                            onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            placeholder="SP"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="endereco" className="text-gray-300 mb-2 block">Endereço Completo</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          placeholder="Rua, número, complemento"
                        />
                      </div>
                    </div>

                    {/* Permissões */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">Permissões</h3>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {Object.entries(modulosPorCategoria).map(([categoria, categoriaModulos]) => (
                          <div key={categoria} className="mb-4 last:mb-0">
                            <h4 className="font-medium text-white mb-2 capitalize border-b border-gray-600 pb-1">
                              {categoria.replace('_', ' ')}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {categoriaModulos.map(modulo => (
                                <div key={modulo.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={modulo.id}
                                    checked={formData.modulos_permitidos.includes(modulo.id)}
                                    onCheckedChange={(checked) => handleModuloChange(modulo.id, checked as boolean)}
                                  />
                                  <Label 
                                    htmlFor={modulo.id} 
                                    className="text-sm text-gray-300 cursor-pointer"
                                  >
                                    {modulo.nome}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status e Ações */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="ativo"
                            checked={formData.ativo}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked as boolean }))}
                          />
                          <Label htmlFor="ativo" className="text-gray-300">
                            Usuário ativo no sistema
                          </Label>
                        </div>
                        {editingUser && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleResetPassword(editingUser.id)}
                            className="bg-yellow-500/10 border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Redefinir Senha
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                <DialogFooter className="border-t border-gray-700 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingUser ? 'Atualizar' : 'Criar'} Usuário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-dark pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 w-48">
                <Filter className="w-4 h-4 mr-2 text-blue-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as funções</SelectItem>
                {ROLES_OPCOES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Usuários */}
          <div className="grid gap-4">
            {filteredUsuarios.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || roleFilter !== 'todos' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              </div>
            ) : (
              filteredUsuarios.map(usuario => (
                <Card key={usuario.id} className="card-dark hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {usuario.nome}
                            </h3>
                            {usuario.ativo ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            {usuario.email}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {getRoleBadge(usuario.role)}
                            <Badge variant="outline" className="text-xs">
                              {usuario.modulos_permitidos?.length || 0} módulos
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(usuario)}
                          className="bg-blue-500/10 border-blue-500 text-blue-400 hover:bg-blue-500/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(usuario.id)}
                          className="bg-yellow-500/10 border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
                          title="Redefinir senha"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(usuario.id)}
                          className="bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}