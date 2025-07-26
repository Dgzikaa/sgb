'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

interface ChecklistTemplate {
  id: string;
  nome: string;
  setor: string;
  descricao: string;
  tipo: string;
  frequencia: string;
  tempo_estimado: number;
  responsavel_padrao: string;
  ativo: boolean;
  ultima_edicao: string;
}

export default function ChecklistsPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Dados mockados para demonstração
  useEffect(() => {
    const checklistsMock: ChecklistTemplate[] = [
      {
        id: '1',
        nome: 'Abertura do Bar',
        setor: 'operacoes',
        descricao: 'Checklist para abertura diária do estabelecimento',
        tipo: 'Operacional',
        frequencia: 'Diária',
        tempo_estimado: 30,
        responsavel_padrao: 'Gerente',
        ativo: true,
        ultima_edicao: '2025-01-15'
      },
      {
        id: '2',
        nome: 'Limpeza Geral',
        setor: 'limpeza',
        descricao: 'Checklist de limpeza completa do ambiente',
        tipo: 'Limpeza',
        frequencia: 'Semanal',
        tempo_estimado: 120,
        responsavel_padrao: 'Equipe de Limpeza',
        ativo: true,
        ultima_edicao: '2025-01-14'
      },
      {
        id: '3',
        nome: 'Inventário de Estoque',
        setor: 'estoque',
        descricao: 'Verificação e contagem do estoque de bebidas e alimentos',
        tipo: 'Controle',
        frequencia: 'Mensal',
        tempo_estimado: 90,
        responsavel_padrao: 'Almoxarife',
        ativo: true,
        ultima_edicao: '2025-01-13'
      }
    ];

    setTimeout(() => {
      setChecklists(checklistsMock);
      setLoading(false);
    }, 1000);
  }, []);

  const checklistsFiltrados = checklists.filter(checklist =>
    checklist.nome.toLowerCase().includes(busca.toLowerCase()) ||
    checklist.setor.toLowerCase().includes(busca.toLowerCase())
  );

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        Ativo
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        Inativo
      </Badge>
    );
  };

  const getFrequenciaBadge = (frequencia: string) => {
    const cores = {
      'Diária': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Semanal': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Mensal': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    
    return (
      <Badge className={cores[frequencia as keyof typeof cores] || 'bg-gray-100 text-gray-800'}>
        {frequencia}
      </Badge>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute requiredModule="configuracoes">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando checklists...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredModule="configuracoes">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <Settings className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gerenciar Checklists
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Criar, editar e gerenciar checklists por setor
              </p>
            </div>
          </div>

          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Checklist
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Checklists</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{checklists.length}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Checklists Ativos</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {checklists.filter(c => c.ativo).length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tempo Médio</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(checklists.reduce((acc, c) => acc + c.tempo_estimado, 0) / checklists.length)}min
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar checklists..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Checklists */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Checklists ({checklistsFiltrados.length})</span>
              <Badge variant="outline">{checklistsFiltrados.length} encontrados</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checklistsFiltrados.map((checklist) => (
                <div
                  key={checklist.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {checklist.nome}
                      </h3>
                      {getStatusBadge(checklist.ativo)}
                      {getFrequenciaBadge(checklist.frequencia)}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {checklist.descricao}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>Setor: {checklist.setor}</span>
                      <span>Tipo: {checklist.tipo}</span>
                      <span>Tempo: {checklist.tempo_estimado}min</span>
                      <span>Responsável: {checklist.responsavel_padrao}</span>
                      <span>Editado: {checklist.ultima_edicao}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Copy className="w-3 h-3" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}

              {checklistsFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    Nenhum checklist encontrado
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {busca ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro checklist'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
