'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBar } from '@/contexts/BarContext';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Calendar, TrendingUp, DollarSign, Award } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';

const GRUPOS = [
  {
    nome: 'Receitas',
    categorias: [
      'Stone Crédito', 'Stone Débito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
    ]
  },
  {
    nome: 'Custos Variáveis',
    categorias: [
      'IMPOSTO', 'COMISSÃO 10%', 'TAXA MAQUININHA'
    ]
  },
  {
    nome: 'Custo insumos (CMV)',
    categorias: [
      'Custo Drinks', 'Custo Bebidas', 'Custo Comida', 'Custo Outros'
    ]
  },
  {
    nome: 'Mão-de-Obra',
    categorias: [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAÇÃO', 'ADICIONAIS', 'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA', 'FREELA SEGURANÇA', 'PRO LABORE', 'PROVISÃO TRABALHISTA'
    ]
  },
  {
    nome: 'Despesas Comerciais',
    categorias: [
      'Marketing', 'Atrações Programação', 'Produção Eventos'
    ]
  },
  {
    nome: 'Despesas Administrativas',
    categorias: [
      'Administrativo Ordinário', 'Escritório Central', 'Recursos Humanos'
    ]
  },
  {
    nome: 'Despesas Operacionais',
    categorias: [
      'Materiais Operação', 'Materiais de Limpeza e Descartáveis', 'Utensílios', 'Estorno', 'Outros Operação'
    ]
  },
  {
    nome: 'Despesas de Ocupação (Contas)',
    categorias: [
      'ALUGUEL/CONDOMÍNIO/IPTU', 'ÁGUA', 'MANUTENÇÃO', 'INTERNET', 'GÁS', 'LUZ'
    ]
  },
  {
    nome: 'Não Operacionais',
    categorias: [
      'Contratos'
    ]
  }
];

const CATEGORIA_ICONS: Record<string, any> = {
  'Stone Crédito': <DollarSign className="w-4 h-4 text-blue-500 dark:text-blue-300" />,
  'Stone Débito': <DollarSign className="w-4 h-4 text-blue-400 dark:text-blue-200" />,
  'Stone Pix': <DollarSign className="w-4 h-4 text-green-500 dark:text-green-300" />,
  'Pix Direto na Conta': <DollarSign className="w-4 h-4 text-green-400 dark:text-green-200" />,
  'Dinheiro': <DollarSign className="w-4 h-4 text-yellow-500 dark:text-yellow-300" />,
  'Receita de Eventos': <Award className="w-4 h-4 text-purple-500 dark:text-purple-300" />,
  'Outras Receitas': <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-300" />,
};

const PERIODOS = [
  { label: 'Todo Período', value: 'all' },
  { label: 'Semana', value: 'week' },
  { label: 'Ano', value: 'year' },
];

function getPeriodoRange(periodo: string) {
  const hoje = new Date();
  if (periodo === 'week') {
    const fim = hoje.toISOString().split('T')[0];
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 6);
    return { data_inicio: inicio.toISOString().split('T')[0], data_fim: fim };
  }
  if (periodo === 'year') {
    const fim = hoje.toISOString().split('T')[0];
    const inicio = new Date(hoje.getFullYear(), 0, 1);
    return { data_inicio: inicio.toISOString().split('T')[0], data_fim: fim };
  }
  // all
  return { data_inicio: null, data_fim: null };
}

// Mapeamento de categoria da meta para categoria da tabela
const MAP_META_TO_CATEGORIA = {
  'Faturamento Total': 'Stone Crédito', // Exemplo, ajustar conforme real
  // ...adicionar outros se necessário
};

export default function TabelaDesempenhoPage() {
  const { selectedBar } = useBar();
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [periodo, setPeriodo] = useState('all');

  useEffect(() => {
    setPageTitle('Tabela de Desempenho');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    if (selectedBar?.id) {
      fetchTabela();
    }
    // eslint-disable-next-line
  }, [selectedBar?.id, page, periodo]);

  async function fetchTabela() {
    setLoading(true);
    try {
      // DEBUG: Forçar bar_id=3 para garantir dados reais
      // const barIdForcado = 3; // Descomente para forçar
      // const { data_inicio, data_fim } = getPeriodoRange(periodo);
      // const body: any = {
      //   bar_id: barIdForcado,
      //   page,
      //   pageSize,
      // };
      // if (data_inicio !== null && data_inicio !== undefined) body.data_inicio = data_inicio;
      // if (data_fim !== null && data_fim !== undefined) body.data_fim = data_fim;
      // const res = await fetch('/api/contaazul/tabela-desempenho', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(body)
      // });
      // const json = await res.json();
      // if (json.success) {
      //   setDados(json.tabela);
      // } else {
      //   setDados([]);
      // }
      // return;
      // ---
      if (!selectedBar?.id) return;
      const { data_inicio, data_fim } = getPeriodoRange(periodo);
      const body: any = {
        bar_id: 3, // Forçado para debug/validação
        page,
        pageSize,
      };
      if (data_inicio !== null && data_inicio !== undefined) body.data_inicio = data_inicio;
      if (data_fim !== null && data_fim !== undefined) body.data_fim = data_fim;
      const res = await fetch('/api/contaazul/tabela-desempenho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setDados(json.tabela);
      } else {
        setDados([]);
      }
    } catch (e) {
      setDados([]);
    } finally {
      setLoading(false);
    }
  }

  function getPercent(valor: number, total: number) {
    if (!total || total === 0) return '-';
    return ((valor / total) * 100).toFixed(1) + '%';
  }

  // Calcular total geral para percentuais
  const totalGeral = dados.reduce((sum, linha) => sum + (typeof linha.valor === 'number' ? linha.valor : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-white/20 dark:border-gray-700 shadow-lg w-full max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Tabela de Desempenho</CardTitle>
            <div className="card-description-dark mt-1">Acompanhe o desempenho financeiro do bar, agrupado por categoria, com visual premium e filtros rápidos.</div>
          </CardHeader>
          <CardContent>
            {/* Filtros premium */}
            <div className="flex flex-wrap gap-2 mb-6 items-end">
              {PERIODOS.map(p => (
                <Button
                  key={p.value}
                  variant={periodo === p.value ? 'default' : 'outline'}
                  className={periodo === p.value ? 'btn-primary-dark' : ''}
                  onClick={() => { setPage(1); setPeriodo(p.value); }}
                >
                  <Calendar className="w-4 h-4 mr-1" /> {p.label}
                </Button>
              ))}
              <div className="flex-1" />
              <div className="flex gap-2 items-center">
                <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>Anterior</Button>
                <span className="card-description-dark">Página {page}</span>
                <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={loading}>Próxima</Button>
              </div>
            </div>
            {/* Tabela premium */}
            {loading ? (
              <SkeletonTable rows={6} columns={4} className="mt-2" />
            ) : (
              <div className="table-responsive">
                <Table className="table-mobile">
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 dark:border-gray-700">
                      <TableHead className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">Grupo</TableHead>
                      <TableHead className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">Categoria</TableHead>
                      <TableHead className="text-right py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">Valor Real</TableHead>
                      <TableHead className="text-right py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-12 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <TrendingUp className="w-8 h-8 text-gray-300" />
                            <p>Nenhum dado encontrado para o período selecionado.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {dados.map((linha, idx) => {
                      const valor = typeof linha.valor === 'number' ? linha.valor : 0;
                      return (
                        <TableRow key={linha.grupo + '-' + linha.categoria} className="border-b border-slate-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <TableCell className="py-3 px-2 sm:px-4 text-slate-800 dark:text-gray-100 align-top">
                            {idx === 0 || dados[idx-1].grupo !== linha.grupo ? (
                              <Badge className="badge-primary text-xs px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 font-semibold">
                                {linha.grupo}
                              </Badge>
                            ) : ''}
                          </TableCell>
                          <TableCell className="py-3 px-2 sm:px-4 text-slate-800 dark:text-gray-100 align-top flex items-center gap-2">
                            {CATEGORIA_ICONS[linha.categoria] || <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />} {linha.categoria}
                          </TableCell>
                          <TableCell className={`py-3 px-2 sm:px-4 text-right align-top font-semibold ${valor >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</TableCell>
                          <TableCell className="py-3 px-2 sm:px-4 text-right align-top">{getPercent(valor, totalGeral)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 