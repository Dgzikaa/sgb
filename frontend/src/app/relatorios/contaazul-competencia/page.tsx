'use client'

import { useState, useEffect } from 'react'
import { StandardPageLayout } from '@/components/layouts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { AdvancedDataTable } from '@/components/ui/advanced-datatable'

// Grupos DRE conforme regras do usuário
const GRUPOS_DRE = [
  {
    nome: 'Receita',
    categorias: [
      'Stone Crédito', 'Stone Débito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
    ],
    cor: 'text-green-600 dark:text-green-400'
  },
  {
    nome: 'Custos Variáveis',
    categorias: ['IMPOSTO', 'COMISSÃO 10%', 'TAXA MAQUININHA'],
    cor: 'text-red-600 dark:text-red-400'
  },
  {
    nome: 'Custo insumos (CMV)',
    categorias: ['Custo Drinks', 'Custo Bebidas', 'Custo Comida', 'Custo Outros'],
    cor: 'text-red-600 dark:text-red-400'
  },
  {
    nome: 'Mão-de-Obra',
    categorias: [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAÇÃO', 'ADICIONAIS', 'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA', 'FREELA SEGURANÇA', 'PRO LABORE', 'PROVISÃO TRABALHISTA'
    ],
    cor: 'text-red-600 dark:text-red-400'
  },
  {
    nome: 'Despesas Comerciais',
    categorias: ['Marketing', 'Atrações Programação', 'Produção Eventos'],
    cor: 'text-red-600 dark:text-red-400'
  },
  {
    nome: 'Despesas Administrativas',
    categorias: ['Administrativo Ordinário', 'Escritório Central', 'Recursos Humanos'],
    cor: 'text-red-600 dark:text-red-400'
  },
  {
    nome: 'Despesas Operacionais',
    categorias: ['Materiais Operação', 'Materiais de Limpeza e Descartáveis', 'Utensílios', 'Estorno', 'Outros Operação'],
    cor: 'text-red-600 dark:text-red-400'
  },
  {
    nome: 'Despesas de Ocupação (Contas)',
    categorias: ['ALUGUEL/CONDOMÍNIO/IPTU', 'ÁGUA', 'MANUTENÇÃO', 'INTERNET', 'GÁS', 'LUZ'],
    cor: 'text-red-600 dark:text-red-400'
  },
  {
    nome: 'Não Operacionais',
    categorias: ['Contratos'],
    cor: 'text-red-600 dark:text-red-400'
  }
];

function totalGrupo(mes: any, grupo: any) {
  return grupo.categorias.reduce((acc: number, cat: string) => acc + (mes.categorias[cat] || 0), 0);
}

function totalReceitas(mes: any) {
  return GRUPOS_DRE[0].categorias.reduce((acc: number, cat: string) => acc + (mes.categorias[cat] || 0), 0);
}
function totalCustos(mes: any) {
  // Soma todos os grupos exceto Receita
  return GRUPOS_DRE.slice(1).reduce((acc: number, grupo: any) => acc + totalGrupo(mes, grupo), 0);
}

function formatarValor(valor: number) {
  if (valor === undefined || valor === null) return '-';
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-';
}

export default function DREOrdinarioPage() {
  const [dadosMensais, setDadosMensais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gruposAbertos, setGruposAbertos] = useState<string[]>(GRUPOS_DRE.map((g: any) => g.nome))
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/contaazul/competencia-semanal')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          // Filtrar meses a partir de fevereiro
          const filtrados = (res.meses || []).filter((m: any) => m.mes >= 2)
          setDadosMensais(filtrados)
        }
        setLoading(false)
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
          }
        }, 300)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleGrupo = (nome: string) => {
    setGruposAbertos(prev => prev.includes(nome) ? prev.filter((g: any) => g !== nome) : [...prev, nome])
  }

  return (
    <StandardPageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <h1 className="card-title-dark mb-6">DRE Ordinário</h1>
          <div ref={scrollRef} className="w-full overflow-x-auto">
            <table className="table-dark w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header-dark sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">Indicador</th>
                  {dadosMensais.map((mes: any) => (
                    <th key={mes.ano + '-' + mes.mes} className="table-header-dark text-center">
                      {new Date(mes.ano, mes.mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRUPOS_DRE.map((grupo: any) => (
                  <>
                    {/* Linha macro do grupo (expand/recolher) */}
                    <tr key={grupo.nome + '-total'} className="group cursor-pointer select-none" onClick={() => toggleGrupo(grupo.nome)}>
                      <td className={`table-cell-dark sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 font-bold uppercase flex items-center gap-2`} style={{ minWidth: 220 }}>
                        {gruposAbertos.includes(grupo.nome)
                          ? <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                          : <ChevronRight className="w-4 h-4 transition-transform duration-200" />}
                        {grupo.nome} TOTAL
                      </td>
                      {dadosMensais.map((mes: any) => (
                        <td key={mes.ano + '-' + mes.mes} className={`table-cell-dark text-right font-mono font-bold ${grupo.cor}`}>{formatarValor(totalGrupo(mes, grupo))}</td>
                      ))}
                    </tr>
                    {/* Linhas detalhadas do grupo */}
                    {gruposAbertos.includes(grupo.nome) && grupo.categorias.map((cat: any) => (
                      <tr key={grupo.nome + '-' + cat} className="transition-all">
                        <td className="table-cell-dark sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 pl-8">{cat}</td>
                        {dadosMensais.map((mes: any) => (
                          <td key={mes.ano + '-' + mes.mes} className={`table-cell-dark text-right font-mono ${grupo.cor}`}>{formatarValor(mes.categorias[cat] || 0)}</td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
                {/* EBITDA */}
                <tr>
                  <td className="table-cell-dark sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200">EBITDA</td>
                  {dadosMensais.map((mes: any) => (
                    <td key={mes.ano + '-' + mes.mes} className="table-cell-dark text-right font-mono font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200">{formatarValor(totalReceitas(mes) - totalCustos(mes))}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  )
} 
