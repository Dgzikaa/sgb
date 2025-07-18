import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿'use client'

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBar } from '@/contexts/BarContext';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { Calendar, TrendingUp, DollarSign, Award, ChevronDown, ChevronRight, Download } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { saveAs } from 'file-saver';
// 1. Importar libs extras
import * as XLSX from 'xlsx';

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

const CATEGORIA_ICONS: Record<string, unknown> = {
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

// 2. Spinner para exportação
function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin align-middle" aria-label="Carregando" />;
}

// 3. Modal de drilldown
function DrilldownModal({ open, onClose, categoria, grupo, dados }: { open: boolean, onClose: () => void, categoria?: string, grupo?: string, dados: unknown[] }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 dark:text-gray-300" onClick={onClose} aria-label="Fechar">×</button>
        <h2 className="card-title-dark mb-2">Detalhes: {categoria} ({grupo})</h2>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">Descrição</th>
                <th className="text-right">Valor</th>
                <th className="text-right">Data</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((l, i: number) => (
                <tr key={i}>
                  <td>{l.descricao || '-'}</td>
                  <td className="text-right">{l.valor ? l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                  <td className="text-right">{l.data_vencimento || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TabelaDesempenhoPage() {
  const { selectedBar } = useBar();
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [periodo, setPeriodo] = useState('all');
  const [metas, setMetas] = useState<any>({});
  const [expandedGroups, setExpandedGroups] = useState<{ [grupo: string]: boolean }>({});
  const [mesSelecionado, setMesSelecionado] = useState<string>('all');
  const [exportando, setExportando] = useState(false);
  const [drilldown, setDrilldown] = useState<{ open: boolean, categoria: string, grupo: string } | null>(null);

  useEffect(() => {
    setPageTitle('Tabela de Desempenho');
    fetchMetas();
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
      // const body = {
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
      const body: unknown = {
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

  async function fetchMetas() {
    try {
      const res = await fetch('/api/bars/metas?bar_id=3');
      const json = await res.json();
      if (json.success) {
        setMetas(json.metas || {});
      } else {
        setMetas({});
      }
    } catch {
      setMetas({});
    }
  }

  function getPercent(valor: number, total: number) {
    if (!total || total === 0) return '-';
    return ((valor / total) * 100).toFixed(1) + '%';
  }

  // Memoização de totais
  const totalGeral = useMemo(() => dados.reduce((sum, linha) => sum + (typeof linha.valor === 'number' ? linha.valor : 0), 0), [dados]);
  const gruposUnicos = useMemo(() => Array.from(new Set(dados.map((l) => l.grupo))), [dados]);
  const dadosPorGrupo = useMemo(() => {
    const out: Record<string, any[]> = {};
    gruposUnicos.forEach(grupo => {
      out[grupo] = dados.filter((l) => l.grupo === grupo);
    });
    return out;
  }, [dados, gruposUnicos]);
  function getSubtotalGrupo(grupo: string) {
    return useMemo(() => dadosPorGrupo[grupo].reduce((sum, linha) => sum + (typeof linha.valor === 'number' ? linha.valor : 0), 0), [dadosPorGrupo, grupo]);
  }
  // Exportação CSV/XLSX
  function exportarCSVXLSX(tipo: 'csv' | 'xlsx') {
    setExportando(true);
    setTimeout(() => {
      const header = ['Grupo', 'Categoria', 'Valor Real', 'Meta', '% do Total'];
      const rows: unknown[] = [];
      gruposUnicos.forEach(grupo => {
        dadosPorGrupo[grupo].forEach(linha => {
          if (mesesSelecionados.length && !mesesSelecionados.includes('all') && !mesesSelecionados.includes(linha.mes_ano)) return;
          const valor = typeof linha.valor === 'number' ? linha.valor : 0;
          const meta = metas[linha.categoria] || '';
          const percent = getPercent(valor, totalGeral);
          rows.push([
            grupo,
            linha.categoria,
            valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-',
            meta ? meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-',
            percent
          ]);
        });
      });
      if (tipo === 'csv') {
        let csv = header.join(';') + '\n';
        csv += rows.map((r: unknown) => r.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'tabela_desempenho.csv');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Desempenho');
        XLSX.writeFile(wb, 'tabela_desempenho.xlsx');
      }
      setExportando(false);
    }, 300);
  }
  // Multi-select de meses
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>([]);
  const mesesDisponiveis = useMemo(() => {
    const meses = Array.from(new Set(dados.map((l) => l.mes_ano))).filter(Boolean);
    return [{ label: 'Todo Período', value: 'all' }, ...meses.map((m) => ({ label: m, value: m }))];
  }, [dados]);

  // Responsividade: sticky só em desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <DrilldownModal open={!!drilldown} onClose={() => setDrilldown(null)} categoria={drilldown?.categoria} grupo={drilldown?.grupo} dados={dados.filter((l) => l.categoria === drilldown?.categoria && l.grupo === drilldown?.grupo)} />
      <div className="container mx-auto px-2 sm:px-4 py-4 flex-1 flex flex-col">
        <Card className="card-dark w-full max-w-5xl mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Tabela de Desempenho</CardTitle>
            <div className="card-description-dark mt-1">Acompanhe o desempenho financeiro do bar, agrupado por categoria, com visual premium e filtros rápidos.</div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4 items-center">
              {/* Multi-select de mês/ano */}
              <select
                className="input-dark px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm"
                multiple
                value={mesesSelecionados.length ? mesesSelecionados : ['all']}
                onChange={e => {
                  const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setMesesSelecionados(opts.includes('all') ? [] : opts);
                }}
                aria-label="Filtrar por mês/ano"
              >
                {mesesDisponiveis.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <Button
                aria-label="Exportar tabela para CSV"
                variant="outline"
                className="btn-outline-dark flex gap-1 items-center text-xs px-2 py-1"
                onClick={() => exportarCSVXLSX('csv')}
                disabled={exportando}
              >
                {exportando ? <Spinner /> : <Download className="w-4 h-4" />} Exportar CSV
              </Button>
              <Button
                aria-label="Exportar tabela para Excel"
                variant="outline"
                className="btn-outline-dark flex gap-1 items-center text-xs px-2 py-1"
                onClick={() => exportarCSVXLSX('xlsx')}
                disabled={exportando}
              >
                {exportando ? <Spinner /> : <Download className="w-4 h-4" />} Exportar XLSX
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros premium */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4 items-end">
              {PERIODOS.map((p) => (
                <Button
                  key={p.value}
                  variant={periodo === p.value ? 'default' : 'outline'}
                  className={periodo === p.value ? 'btn-primary-dark' : 'btn-outline-dark'}
                  onClick={() => { setPage(1); setPeriodo(p.value); }}
                  aria-label={`Filtrar por ${p.label}`}
                >
                  <Calendar className="w-4 h-4 mr-1" /> {p.label}
                </Button>
              ))}
              <div className="flex-1" />
              <div className="flex gap-2 items-center">
                <Button variant="outline" className="btn-outline-dark" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} aria-label="Página anterior">Anterior</Button>
                <span className="card-description-dark">Página {page}</span>
                <Button variant="outline" className="btn-outline-dark" onClick={() => setPage(p => p + 1)} disabled={loading} aria-label="Próxima página">Próxima</Button>
              </div>
            </div>
            {/* Tabela premium responsiva */}
            <div className="overflow-x-auto rounded-lg shadow-inner">
              <Table className="table-dark w-full text-xs sm:text-sm min-w-[600px]">
                <TableHeader>
                  <TableRow className={`border-b border-slate-200 dark:border-gray-700 ${!isMobile ? 'sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm' : ''}`}> {/* sticky só desktop */}
                    <TableHead className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm sticky left-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>Grupo</span>
                            </TooltipTrigger>
                            <TooltipContent>Macrogrupo financeiro (ex: Receitas, Custos, Mão-de-Obra...)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>Categoria</span>
                            </TooltipTrigger>
                            <TooltipContent>Categoria detalhada do lançamento financeiro</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>Valor Real</span>
                            </TooltipTrigger>
                            <TooltipContent>Valor consolidado da categoria no período</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">
                        Meta
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1"><Award className="w-4 h-4 text-yellow-500 dark:text-yellow-300 inline" /></span>
                            </TooltipTrigger>
                            <TooltipContent>Meta definida para o indicador (configurada em Configurações &gt; Metas)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right py-3 px-2 sm:px-4 font-semibold text-slate-700 dark:text-white text-xs sm:text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>% do Total</span>
                            </TooltipTrigger>
                            <TooltipContent>Percentual do valor em relação ao total geral</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gruposUnicos.map((grupo) => (
                    <Fragment key={grupo}>
                      <TableRow
                        className={`bg-gray-100 dark:bg-gray-800/80 ${!isMobile ? 'sticky top-0 z-10' : ''}`}
                      >
                        <TableCell
                          colSpan={5}
                          className="py-2 px-2 sm:px-4 text-slate-900 dark:text-white font-bold cursor-pointer select-none flex items-center gap-2"
                          onClick={() => setExpandedGroups(g => ({ ...g, [grupo]: !g[grupo] }))}
                          tabIndex={0}
                          aria-label={`Expandir ou recolher grupo ${grupo}`}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpandedGroups(g => ({ ...g, [grupo]: !g[grupo] })); }}
                          style={{ transition: 'background 0.2s' }}
                        >
                          {expandedGroups[grupo] !== false ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {grupo}
                          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">Subtotal: {getSubtotalGrupo(grupo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </TableCell>
                      </TableRow>
                      <tr style={{ height: expandedGroups[grupo] !== false ? 'auto' : 0, overflow: 'hidden', transition: 'height 0.3s' }}>
                        <td colSpan={5} className="p-0">
                          <div style={{ maxHeight: expandedGroups[grupo] !== false ? 9999 : 0, overflow: 'hidden', transition: 'max-height 0.3s' }}>
                            {expandedGroups[grupo] !== false && dadosPorGrupo[grupo].map((linha, idx) => {
                              const valor = typeof linha.valor === 'number' ? linha.valor : 0;
                              const meta = metas[linha.categoria] || null;
                              const atingiuMeta = meta && valor >= meta;
                              const zebra = idx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-900/60' : '';
                              if (mesesSelecionados.length && !mesesSelecionados.includes('all') && !mesesSelecionados.includes(linha.mes_ano)) return null;
                              return (
                                <TableRow key={grupo + '-' + linha.categoria} className={`border-b border-slate-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${zebra}`}> 
                                  <TableCell className="py-3 px-2 sm:px-4 text-slate-800 dark:text-gray-100 align-top sticky left-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                    <Badge className="badge-primary text-xs px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 font-semibold">
                                      {linha.grupo}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 px-2 sm:px-4 text-slate-800 dark:text-gray-100 align-top flex items-center gap-2 cursor-pointer underline decoration-dotted" onClick={() => setDrilldown({ open: true, categoria: linha.categoria, grupo })} aria-label={`Ver detalhes de ${linha.categoria}`}>{CATEGORIA_ICONS[linha.categoria] || <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />} {linha.categoria}</TableCell>
                                  <TableCell className={`py-3 px-2 sm:px-4 text-right align-top font-semibold ${valor >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</TableCell>
                                  <TableCell className="py-3 px-2 sm:px-4 text-right align-top">
                                    {meta ? (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${atingiuMeta ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                                              {meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                              {atingiuMeta ? <Award className="w-4 h-4 text-green-500 dark:text-green-300" /> : <Award className="w-4 h-4 text-red-500 dark:text-red-300" />}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>Meta definida em <b>Configurações &gt; Metas</b>. Altere lá para ajustar este valor.</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : <span className="text-gray-400 dark:text-gray-600">-</span>}
                                  </TableCell>
                                  <TableCell className="py-3 px-2 sm:px-4 text-right align-top">{getPercent(valor, totalGeral)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                  {/* Totalizador geral */}
                  {dados.length > 0 && (
                    <TableRow className="font-bold bg-gray-100 dark:bg-gray-800/80 sticky bottom-0 z-20">
                      <TableCell colSpan={2} className="py-3 px-2 sm:px-4 text-slate-900 dark:text-white text-right">Total Geral</TableCell>
                      <TableCell className="py-3 px-2 sm:px-4 text-right text-slate-900 dark:text-white">
                        {totalGeral ? totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                  {/* Nenhum dado encontrado */}
                  {dados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <TrendingUp className="w-8 h-8 text-gray-300" />
                          <p>Nenhum dado encontrado para o período selecionado.</p>
                          <p className="text-xs mt-2">Tente ajustar os filtros de período ou mês/ano para visualizar dados.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {/* Legenda de badges/metas */}
          <div className="flex flex-wrap gap-4 mt-4 items-center text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"><Award className="w-4 h-4 text-green-500 dark:text-green-300" />Meta atingida</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"><Award className="w-4 h-4 text-red-500 dark:text-red-300" />Meta não atingida</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200"><ChevronDown className="w-4 h-4" />Expandir grupo</span>
          </div>
        </Card>
      </div>
    </div>
  );
} 

