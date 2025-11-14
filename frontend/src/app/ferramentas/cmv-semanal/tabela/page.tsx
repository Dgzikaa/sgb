'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Edit, Calendar, CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface CMVSemanal {
  id: string;
  bar_id: number;
  ano: number;
  semana: number;
  data_inicio: string;
  data_fim: string;
  
  // Vendas
  vendas_brutas: number;
  vendas_liquidas: number;
  
  // Estoque e Compras
  estoque_inicial: number;
  compras_periodo: number;
  estoque_final: number;
  
  // Consumos Internos
  consumo_socios: number;
  consumo_beneficios: number;
  consumo_adm: number;
  consumo_rh: number;
  consumo_artista: number;
  outros_ajustes: number;
  ajuste_bonificacoes: number;
  
  // Cálculos CMV
  cmv_real: number;
  faturamento_cmvivel: number;
  cmv_limpo_percentual: number;
  cmv_teorico_percentual: number;
  gap: number;
  giro_estoque?: number; // Calculado dinamicamente
  
  // Estoque Final Detalhado
  estoque_final_cozinha: number;
  estoque_final_bebidas: number;
  estoque_final_drinks: number;
  
  // Compras Detalhadas
  compras_custo_comida: number;
  compras_custo_bebidas: number;
  compras_custo_drinks: number;
  compras_custo_outros: number;
  
  // Contas Especiais
  total_consumo_socios: number;
  mesa_beneficios_cliente: number;
  mesa_banda_dj: number;
  chegadeira: number;
  mesa_adm_casa: number;
  mesa_rh: number;
  
  status: string;
  responsavel?: string;
  observacoes?: string;
}

export default function CMVSemanalTabelaPage() {
  const [semanas, setSemanas] = useState<CMVSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [semanaAtualIndex, setSemanaAtualIndex] = useState(0);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
  const SEMANAS_POR_PAGINA = 3;

  // Calcular semana atual do ano
  function getSemanaAtual(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  useEffect(() => {
    carregarDados();
  }, [anoFiltro]);

  async function carregarDados() {
    try {
      setLoading(true);
      const response = await fetch('/api/cmv-semanal');
      if (!response.ok) throw new Error('Erro ao carregar dados');
      
      const result = await response.json();
      const data = result.data || [];
      
      // Filtrar por ano e ordenar por semana (crescente)
      const filtrado = data
        .filter((item: CMVSemanal) => item.ano === anoFiltro)
        .sort((a: CMVSemanal, b: CMVSemanal) => a.semana - b.semana);
      
      setSemanas(filtrado);
      
      // Posicionar na última semana disponível (semana anterior ou atual)
      if (filtrado.length > 0) {
        const semanaAtual = getSemanaAtual();
        // Buscar a última semana disponível antes ou igual à semana atual
        let indexMelhor = filtrado.length - 1;
        
        for (let i = filtrado.length - 1; i >= 0; i--) {
          if (filtrado[i].semana <= semanaAtual) {
            indexMelhor = i;
            break;
          }
        }
        
        setSemanaAtualIndex(indexMelhor);
      }
    } catch (error) {
      console.error('Erro ao carregar CMV Semanal:', error);
    } finally {
      setLoading(false);
    }
  }

  // Pegar 3 semanas com a semana atual sendo a ÚLTIMA (3ª) das 3
  const startIndex = Math.max(0, semanaAtualIndex - 2);
  const currentSemanas = semanas.slice(startIndex, startIndex + SEMANAS_POR_PAGINA);
  const semanaExibida = semanas[semanaAtualIndex];

  function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  }

  function formatarData(data: string): string {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, string> = {
      rascunho: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      fechado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      revisao: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return variants[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  function getGapColor(gap: number) {
    if (gap <= 0) return 'text-green-600 dark:text-green-400 font-semibold';
    if (gap <= 5) return 'text-yellow-600 dark:text-yellow-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
  }

  // Calcular Giro de Estoque para cada semana
  function calcularGiroEstoque(semana: CMVSemanal): number {
    const mediaEstoque = (semana.estoque_inicial + semana.estoque_final) / 2;
    if (mediaEstoque === 0) return 0;
    return semana.cmv_real / mediaEstoque;
  }

  const linhas = [
    { titulo: 'IDENTIFICAÇÃO', items: [
      { label: 'Semana', campo: 'semana' as keyof CMVSemanal, tipo: 'numero' },
      { label: 'Data Início', campo: 'data_inicio' as keyof CMVSemanal, tipo: 'data' },
      { label: 'Data Fim', campo: 'data_fim' as keyof CMVSemanal, tipo: 'data' },
      { label: 'Status', campo: 'status' as keyof CMVSemanal, tipo: 'status' },
    ]},
    { titulo: 'CMV PRINCIPAL', items: [
      { label: 'Estoque Inicial', campo: 'estoque_inicial' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Compras', campo: 'compras_periodo' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Estoque Final', campo: 'estoque_final' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Consumo Sócios', campo: 'consumo_socios' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Consumo Benefícios', campo: 'consumo_beneficios' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Consumo ADM', campo: 'consumo_adm' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Consumo RH', campo: 'consumo_rh' as keyof CMVSemanal, tipo: 'moeda', manual: true },
      { label: 'Consumo Artista', campo: 'consumo_artista' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Outros Ajustes', campo: 'outros_ajustes' as keyof CMVSemanal, tipo: 'moeda', manual: true },
      { label: 'Ajuste Bonificações', campo: 'ajuste_bonificacoes' as keyof CMVSemanal, tipo: 'moeda', manual: true },
      { label: 'CMV Real (R$)', campo: 'cmv_real' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Faturamento CMVível', campo: 'faturamento_cmvivel' as keyof CMVSemanal, tipo: 'moeda', manual: true },
      { label: 'CMV Limpo (%)', campo: 'cmv_limpo_percentual' as keyof CMVSemanal, tipo: 'percentual' },
      { label: 'CMV Teórico (%)', campo: 'cmv_teorico_percentual' as keyof CMVSemanal, tipo: 'percentual', manual: true },
      { label: 'Gap', campo: 'gap' as keyof CMVSemanal, tipo: 'gap' },
      { label: 'Giro de Estoque', campo: 'giro_estoque' as keyof CMVSemanal, tipo: 'decimal' },
    ]},
    { titulo: 'ESTOQUE FINAL', items: [
      { label: 'Cozinha', campo: 'estoque_final_cozinha' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Bebidas + Tabacaria', campo: 'estoque_final_bebidas' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Drinks', campo: 'estoque_final_drinks' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'TOTAL', campo: 'estoque_final' as keyof CMVSemanal, tipo: 'moeda' },
    ]},
    { titulo: 'COMPRAS', items: [
      { label: 'Cozinha', campo: 'compras_custo_comida' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Bebidas + Tabacaria', campo: 'compras_custo_bebidas' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Drinks', campo: 'compras_custo_drinks' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Outros', campo: 'compras_custo_outros' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'TOTAL', campo: 'compras_periodo' as keyof CMVSemanal, tipo: 'moeda' },
    ]},
    { titulo: 'CONTAS ESPECIAIS', items: [
      { label: 'Total Consumo Sócios', campo: 'total_consumo_socios' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Mesa de Benefícios Cliente', campo: 'mesa_beneficios_cliente' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Mesa da Banda/DJ', campo: 'mesa_banda_dj' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Chegadeira', campo: 'chegadeira' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Mesa ADM/Casa', campo: 'mesa_adm_casa' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Mesa RH', campo: 'mesa_rh' as keyof CMVSemanal, tipo: 'moeda' },
    ]},
  ];

  function renderCelula(semana: CMVSemanal, campo: keyof CMVSemanal, tipo: string, manual?: boolean) {
    // Calcular Giro de Estoque dinamicamente
    if (campo === 'giro_estoque') {
      const giro = calcularGiroEstoque(semana);
      return <span className="font-mono">{giro.toFixed(2)}x</span>;
    }

    const valor = semana[campo];

    if (tipo === 'moeda') {
      return <span className="font-mono">{formatarMoeda(Number(valor))}</span>;
    }
    
    if (tipo === 'percentual') {
      return <span className="font-mono">{Number(valor).toFixed(2)}%</span>;
    }
    
    if (tipo === 'decimal') {
      return <span className="font-mono">{Number(valor).toFixed(2)}x</span>;
    }
    
    if (tipo === 'gap') {
      const numValor = Number(valor);
      return (
        <span className={`font-mono ${getGapColor(numValor)}`}>
          {numValor > 0 ? '+' : ''}{numValor.toFixed(2)}%
        </span>
      );
    }
    
    if (tipo === 'data') {
      return <span>{formatarData(String(valor))}</span>;
    }
    
    if (tipo === 'status') {
      return (
        <Badge className={getStatusBadge(String(valor))}>
          {String(valor).toUpperCase()}
        </Badge>
      );
    }
    
    if (tipo === 'numero') {
      return <span className="font-semibold">{valor}</span>;
    }

    return <span>{String(valor)}</span>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Filtro de Ano e Navegação */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <Label className="text-gray-700 dark:text-gray-300 font-semibold">Ano:</Label>
              </div>
              <Select value={anoFiltro.toString()} onValueChange={(value) => setAnoFiltro(parseInt(value))}>
                <SelectTrigger className="w-32 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="2025" className="hover:bg-gray-100 dark:hover:bg-gray-700">2025</SelectItem>
                  <SelectItem value="2026" className="hover:bg-gray-100 dark:hover:bg-gray-700">2026</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Semana Atual:</span> {getSemanaAtual()}
              </div>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Link href="/ferramentas/cmv-semanal">
                  <Button variant="outline" size="sm" className="inline-flex flex-row items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Listagem
                  </Button>
                </Link>
                <Link href="/ferramentas/cmv-semanal/visualizar">
                  <Button variant="outline" size="sm" className="inline-flex flex-row items-center">
                    📊 Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setSemanaAtualIndex(Math.max(0, semanaAtualIndex - 1))}
            disabled={semanaAtualIndex === 0}
            variant="outline"
            className="inline-flex flex-row items-center min-w-[120px]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <div className="text-center">
            {semanaExibida ? (
              <>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  Semana {semanaExibida.semana}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatarData(semanaExibida.data_inicio)} - {formatarData(semanaExibida.data_fim)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nenhuma semana selecionada
              </p>
            )}
          </div>
          
          <Button
            onClick={() => setSemanaAtualIndex(Math.min(semanas.length - 1, semanaAtualIndex + 1))}
            disabled={semanaAtualIndex === semanas.length - 1}
            variant="outline"
            className="inline-flex flex-row items-center min-w-[120px]"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Tabela Principal */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600 sticky left-0 bg-gray-100 dark:bg-gray-700 min-w-[250px]">
                      Métrica
                    </th>
                    {currentSemanas.map((semana) => {
                      const semanaAtual = getSemanaAtual();
                      const isSemanaAtual = semana.semana === semanaAtual && semana.ano === new Date().getFullYear();
                      
                      return (
                        <th
                          key={semana.id}
                          className={`px-4 py-3 text-center font-semibold border-r border-gray-300 dark:border-gray-600 min-w-[180px] ${
                            isSemanaAtual 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200' 
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-lg font-bold">
                              Semana {semana.semana}
                              {isSemanaAtual && (
                                <span className="ml-2 text-xs px-2 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-full">
                                  ATUAL
                                </span>
                              )}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((secao, secaoIdx) => (
                    <React.Fragment key={secaoIdx}>
                      {/* Título da Seção */}
                      <tr className="bg-blue-50 dark:bg-blue-900/20">
                        <td
                          colSpan={currentSemanas.length + 1}
                          className="px-4 py-2 font-bold text-blue-900 dark:text-blue-200 border-y border-gray-300 dark:border-gray-600"
                        >
                          {secao.titulo}
                        </td>
                      </tr>
                      
                      {/* Linhas da Seção */}
                      {secao.items.map((item, itemIdx) => (
                        <tr
                          key={itemIdx}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td
                            className="px-4 py-2 text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600 sticky left-0 bg-white dark:bg-gray-800"
                          >
                            {item.label}
                            {item.manual && (
                              <Edit className="w-3 h-3 ml-2 inline text-gray-500 dark:text-gray-400" />
                            )}
                          </td>
                          {currentSemanas.map((semana) => {
                            const semanaAtual = getSemanaAtual();
                            const isSemanaAtual = semana.semana === semanaAtual && semana.ano === new Date().getFullYear();
                            
                            return (
                              <td
                                key={semana.id}
                                className={`
                                  px-4 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600
                                  ${isSemanaAtual ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                `}
                              >
                                {renderCelula(semana, item.campo, item.tipo, item.manual)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

