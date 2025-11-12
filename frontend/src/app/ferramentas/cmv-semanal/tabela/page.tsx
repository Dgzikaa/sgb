'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Edit, Plus, Calendar } from 'lucide-react';
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
  const [currentGroup, setCurrentGroup] = useState(0);
  const SEMANAS_POR_PAGINA = 3;

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const response = await fetch('/api/cmv-semanal');
      if (!response.ok) throw new Error('Erro ao carregar dados');
      
      const data = await response.json();
      
      // Ordenar por ano e semana (decrescente para ver mais recentes primeiro)
      const ordenado = data.sort((a: CMVSemanal, b: CMVSemanal) => {
        if (b.ano !== a.ano) return b.ano - a.ano;
        return b.semana - a.semana;
      });
      
      setSemanas(ordenado);
    } catch (error) {
      console.error('Erro ao carregar CMV Semanal:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalGroups = Math.ceil(semanas.length / SEMANAS_POR_PAGINA);
  const currentSemanas = semanas.slice(
    currentGroup * SEMANAS_POR_PAGINA,
    (currentGroup + 1) * SEMANAS_POR_PAGINA
  );

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

  const linhas = [
    { titulo: 'IDENTIFICAÇÃO', items: [
      { label: 'Semana', campo: 'semana' as keyof CMVSemanal, tipo: 'numero' },
      { label: 'Data Início', campo: 'data_inicio' as keyof CMVSemanal, tipo: 'data' },
      { label: 'Data Fim', campo: 'data_fim' as keyof CMVSemanal, tipo: 'data' },
      { label: 'Status', campo: 'status' as keyof CMVSemanal, tipo: 'status' },
    ]},
    { titulo: 'VENDAS', items: [
      { label: 'Vendas Brutas', campo: 'vendas_brutas' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Vendas Líquidas', campo: 'vendas_liquidas' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Faturamento CMVível', campo: 'faturamento_cmvivel' as keyof CMVSemanal, tipo: 'moeda' },
    ]},
    { titulo: 'ESTOQUE', items: [
      { label: 'Estoque Inicial', campo: 'estoque_inicial' as keyof CMVSemanal, tipo: 'moeda', destaque: true },
      { label: 'Estoque Final', campo: 'estoque_final' as keyof CMVSemanal, tipo: 'moeda', destaque: true },
      { label: '├─ Cozinha', campo: 'estoque_final_cozinha' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '├─ Bebidas + Tabacaria', campo: 'estoque_final_bebidas' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '└─ Drinks', campo: 'estoque_final_drinks' as keyof CMVSemanal, tipo: 'moeda', indent: true },
    ]},
    { titulo: 'COMPRAS', items: [
      { label: 'Compras Total', campo: 'compras_periodo' as keyof CMVSemanal, tipo: 'moeda', destaque: true },
      { label: '├─ Custo Comida', campo: 'compras_custo_comida' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '├─ Custo Bebidas', campo: 'compras_custo_bebidas' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '├─ Custo Drinks', campo: 'compras_custo_drinks' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '└─ Custo Outros', campo: 'compras_custo_outros' as keyof CMVSemanal, tipo: 'moeda', indent: true },
    ]},
    { titulo: 'CONSUMOS INTERNOS', items: [
      { label: 'Consumo Sócios', campo: 'consumo_socios' as keyof CMVSemanal, tipo: 'moeda', destaque: true },
      { label: '├─ Mesa Benefícios Cliente', campo: 'mesa_beneficios_cliente' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '├─ Mesa Banda/DJ', campo: 'mesa_banda_dj' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '├─ Chegadeira', campo: 'chegadeira' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '├─ Mesa ADM/Casa', campo: 'mesa_adm_casa' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: '└─ Mesa RH', campo: 'mesa_rh' as keyof CMVSemanal, tipo: 'moeda', indent: true },
      { label: 'Consumo Benefícios', campo: 'consumo_beneficios' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Consumo ADM', campo: 'consumo_adm' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Consumo RH', campo: 'consumo_rh' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Consumo Artista', campo: 'consumo_artista' as keyof CMVSemanal, tipo: 'moeda' },
    ]},
    { titulo: 'AJUSTES', items: [
      { label: 'Outros Ajustes', campo: 'outros_ajustes' as keyof CMVSemanal, tipo: 'moeda' },
      { label: 'Ajuste Bonificações', campo: 'ajuste_bonificacoes' as keyof CMVSemanal, tipo: 'moeda' },
    ]},
    { titulo: 'CÁLCULOS CMV', items: [
      { label: 'CMV Real', campo: 'cmv_real' as keyof CMVSemanal, tipo: 'moeda', destaque: true },
      { label: 'CMV Limpo (%)', campo: 'cmv_limpo_percentual' as keyof CMVSemanal, tipo: 'percentual', destaque: true },
      { label: 'CMV Teórico (%)', campo: 'cmv_teorico_percentual' as keyof CMVSemanal, tipo: 'percentual' },
      { label: 'Gap', campo: 'gap' as keyof CMVSemanal, tipo: 'gap', destaque: true },
    ]},
  ];

  function renderCelula(semana: CMVSemanal, campo: keyof CMVSemanal, tipo: string) {
    const valor = semana[campo];

    if (tipo === 'moeda') {
      return <span className="font-mono">{formatarMoeda(Number(valor))}</span>;
    }
    
    if (tipo === 'percentual') {
      return <span className="font-mono">{Number(valor).toFixed(2)}%</span>;
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                CMV Semanal - Visualização Tabela
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Layout estilo planilha com {SEMANAS_POR_PAGINA} semanas por vez
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/ferramentas/cmv-semanal">
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Listagem
                </Button>
              </Link>
              <Link href="/ferramentas/cmv-semanal/visualizar">
                <Button variant="outline">
                  📊 Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setCurrentGroup(Math.max(0, currentGroup - 1))}
            disabled={currentGroup === 0}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Grupo {currentGroup + 1} de {totalGroups}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Semanas {currentGroup * SEMANAS_POR_PAGINA + 1} - {Math.min((currentGroup + 1) * SEMANAS_POR_PAGINA, semanas.length)} de {semanas.length}
            </p>
          </div>
          
          <Button
            onClick={() => setCurrentGroup(Math.min(totalGroups - 1, currentGroup + 1))}
            disabled={currentGroup === totalGroups - 1}
            variant="outline"
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
                    {currentSemanas.map((semana) => (
                      <th
                        key={semana.id}
                        className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600 min-w-[180px]"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-lg">Semana {semana.semana}</span>
                          <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                            {semana.ano}
                          </span>
                          <Link href={`/ferramentas/cmv-semanal?edit=${semana.id}`}>
                            <Button size="sm" variant="ghost" className="h-6 text-xs">
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </th>
                    ))}
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
                          className={`
                            border-b border-gray-200 dark:border-gray-700
                            hover:bg-gray-50 dark:hover:bg-gray-700/50
                            ${item.destaque ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                          `}
                        >
                          <td
                            className={`
                              px-4 py-2 text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600
                              sticky left-0 bg-white dark:bg-gray-800
                              ${item.destaque ? 'font-semibold bg-yellow-50 dark:bg-yellow-900/10' : ''}
                              ${item.indent ? 'pl-8 text-gray-700 dark:text-gray-300 text-xs' : ''}
                            `}
                          >
                            {item.label}
                          </td>
                          {currentSemanas.map((semana) => (
                            <td
                              key={semana.id}
                              className={`
                                px-4 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600
                                ${item.destaque ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                              `}
                            >
                              {renderCelula(semana, item.campo, item.tipo)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="mt-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Status:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">FECHADO</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">RASCUNHO</Badge>
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">REVISÃO</Badge>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Gap (Diferença CMV):</p>
                <div className="space-y-1">
                  <p className="text-green-600 dark:text-green-400">● Verde: Gap ≤ 0% (Ótimo)</p>
                  <p className="text-yellow-600 dark:text-yellow-400">● Amarelo: Gap 0-5% (Atenção)</p>
                  <p className="text-red-600 dark:text-red-400">● Vermelho: Gap &gt; 5% (Crítico)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

