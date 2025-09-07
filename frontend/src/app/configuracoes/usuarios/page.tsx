'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import PageHeader from '@/components/layouts/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { safeLocalStorage } from '@/lib/client-utils';
import { DataTablePro } from '@/components/ui/datatable-pro';

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

function UsuariosPage() {
  const { user: currentUser, refreshUserData } = usePermissions();
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

  const fetchUsuarios = useCallback(async () => {
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
  }, [toast]);

  const fetchModulos = useCallback(async () => {
    try {
      const response = await fetch('/api/configuracoes/permissoes');
      const data = await response.json();
      if (data.modulos) {
        setModulos(data.modulos);
      }
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
    fetchModulos();
  }, []); // Remove as dependências para evitar loop infinito

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
        
        // Se o usuário editou a si mesmo, atualizar localStorage
        if (editingUser && currentUser && editingUser.id === currentUser.id) {
          const updatedUser = {
            ...currentUser,
            ...formData,
            modulos_permitidos: formData.modulos_permitidos
          };
          
          // Atualizar localStorage
          safeLocalStorage.setItem('sgb_user', JSON.stringify(updatedUser));
          
          // Disparar evento para atualizar contexto de permissões
          window.dispatchEvent(new CustomEvent('userDataUpdated'));
          
          // Mostrar notificação adicional
          setTimeout(() => {
            toast({
              title: 'Permissões Atualizadas',
              description: 'Suas permissões foram atualizadas. A sidebar será atualizada automaticamente.',
            });
          }, 500);
        }
        
        // Para qualquer edição de usuário, disparar evento para possível atualização
        // (caso o usuário editado esteja logado em outra aba)
        window.dispatchEvent(new CustomEvent('userPermissionsChanged', {
          detail: { userId: editingUser?.id, email: editingUser?.email }
        }));
        
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
          <PageHeader title="Gestão de Usuários" description="Gerencie usuários do sistema e suas permissões" />
          <div className="flex items-center justify-between mb-6">
            <div />
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }} 
              className="btn-primary-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl">
                <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 -m-6 mb-0 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-sm">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                        {editingUser ? 'Atualize os dados e permissões do usuário selecionado' : 'Preencha os dados para criar um novo usuário no sistema'}
                      </DialogDescription>
                    </div>
                    {editingUser && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {editingUser.id}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Criado: {new Date(editingUser.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[75vh] py-6 px-1">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Dados Básicos */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dados Básicos</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Informações principais do usuário</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="nome" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nome Completo *
                          </Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Digite o nome completo"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="email@exemplo.com"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Função *
                          </Label>
                          <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                              {ROLES_OPCOES.map(role => (
                                <SelectItem key={role.value} value={role.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="celular" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Celular
                          </Label>
                          <Input
                            id="celular"
                            value={formData.celular}
                            onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cpf" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            CPF
                          </Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="data_nascimento" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Data de Nascimento
                          </Label>
                          <Input
                            id="data_nascimento"
                            type="date"
                            value={formData.data_nascimento}
                            onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefone" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Telefone Fixo
                          </Label>
                          <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="(11) 3333-3333"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Endereço</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Informações de localização</p>
                        </div>
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

          {/* Lista de Usuários - DataTablePro v2 */}
          <div className="grid gap-4">
            {filteredUsuarios.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || roleFilter !== 'todos' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              </div>
            ) : (
              <DataTablePro
                toolbarTitle="Colunas"
                data={filteredUsuarios}
                selectableRows
                actions={(
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                      }}
                      className="bg-blue-500/10 border-blue-500 text-blue-400 hover:bg-blue-500/20"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Novo
                    </Button>
                  </div>
                )}
                columns={[
                  { key: 'nome', header: 'Nome', sortable: true },
                  { key: 'email', header: 'Email', sortable: true },
                  { key: 'role', header: 'Função', render: (u: Usuario) => getRoleBadge(u.role) },
                  { key: 'modulos', header: 'Módulos', render: (u: Usuario) => (
                    <Badge variant="outline" className="text-xs">{u.modulos_permitidos?.length || 0} módulos</Badge>
                  ) },
                  { key: 'ativo', header: 'Status', render: (u: Usuario) => (
                    u.ativo ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
                  ) },
                  { key: 'acoes', header: 'Ações', align: 'right', render: (u: Usuario) => (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(u)}
                        className="bg-blue-500/10 border-blue-500 text-blue-400 hover:bg-blue-500/20"
                        aria-label={`Editar usuário ${u.nome}`}
                        title={`Editar usuário ${u.nome}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(u.id)}
                        className="bg-yellow-500/10 border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
                        aria-label={`Redefinir senha do usuário ${u.nome}`}
                        title="Redefinir senha"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20"
                        aria-label={`Excluir usuário ${u.nome}`}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) },
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsuariosPage;