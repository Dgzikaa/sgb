'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBar } from '@/contexts/BarContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  ChevronLeft, 
  Calendar, 
  Target,
  Trash2,
  Edit,
  Copy,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Organizador {
  id: number;
  bar_id: number;
  ano: number;
  trimestre: number | null;
  tipo: string;
  missao: string | null;
  created_at: string;
  updated_at: string;
}

export default function OrganizadorListaPage() {
  const router = useRouter();
  const { selectedBar } = useBar();
  const { toast } = useToast();
  
  const [organizadores, setOrganizadores] = useState<Organizador[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const carregarOrganizadores = async () => {
    if (!selectedBar) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/organizador?bar_id=${selectedBar.id}`);
      const data = await response.json();
      
      if (data.organizadores) {
        setOrganizadores(data.organizadores);
      }
    } catch (error) {
      console.error('Erro ao carregar organizadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os organizadores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBar) {
      carregarOrganizadores();
    }
  }, [selectedBar]);

  const handleCriarNovo = () => {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    let trimestreAtual = 4;
    if (mesAtual >= 4 && mesAtual <= 6) trimestreAtual = 2;
    else if (mesAtual >= 7 && mesAtual <= 9) trimestreAtual = 3;
    else if (mesAtual >= 10) trimestreAtual = 4;
    
    router.push(`/estrategico/organizador/novo?ano=${anoAtual}&trimestre=${trimestreAtual}`);
  };

  const handleEditar = (id: number) => {
    router.push(`/estrategico/organizador/${id}`);
  };

  const handleDuplicar = async (org: Organizador) => {
    try {
      // Buscar dados completos
      const response = await fetch(`/api/organizador?bar_id=${selectedBar?.id}&id=${org.id}`);
      const data = await response.json();
      
      if (data.organizador) {
        const novoTrimestre = org.trimestre === 4 ? 2 : (org.trimestre || 2) + 1;
        const novoAno = org.trimestre === 4 ? org.ano + 1 : org.ano;
        
        // Criar cópia
        const createResponse = await fetch('/api/organizador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data.organizador,
            id: undefined,
            ano: novoAno,
            trimestre: novoTrimestre,
            okrs: data.okrs?.map((o: any) => ({ ...o, id: undefined })) || []
          })
        });

        if (createResponse.ok) {
          toast({
            title: 'Sucesso!',
            description: `Organizador duplicado para ${novoTrimestre}º Tri ${novoAno}`
          });
          carregarOrganizadores();
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o organizador',
        variant: 'destructive'
      });
    }
  };

  const handleDeletar = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`/api/organizador?id=${deleteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Organizador removido'
        });
        carregarOrganizadores();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o organizador',
        variant: 'destructive'
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getNomePeriodo = (org: Organizador) => {
    if (org.tipo === 'anual' || !org.trimestre) {
      return `Visão Anual ${org.ano}`;
    }
    return `${org.trimestre}º Trimestre ${org.ano}`;
  };

  const getCorTrimestre = (trimestre: number | null) => {
    if (!trimestre) return 'bg-blue-500';
    const cores: Record<number, string> = {
      2: 'bg-green-500',
      3: 'bg-yellow-500',
      4: 'bg-orange-500'
    };
    return cores[trimestre] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/estrategico/visao-geral')}
              className="text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Organizador de Visão
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Planejamento estratégico anual e trimestral
              </p>
            </div>
          </div>
          
          <Button onClick={handleCriarNovo} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Organizador
          </Button>
        </div>

        {/* Lista de Organizadores */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : organizadores.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum organizador criado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Crie seu primeiro Organizador de Visão para começar o planejamento estratégico
              </p>
              <Button onClick={handleCriarNovo} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Organizador
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizadores.map((org) => (
              <Card 
                key={org.id} 
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEditar(org.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getCorTrimestre(org.trimestre)}`} />
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        {getNomePeriodo(org)}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditar(org.id); }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicar(org); }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar para próximo período
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(org.id); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {org.missao || 'Missão não definida'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Atualizado em {new Date(org.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir este organizador? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 dark:border-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletar}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

