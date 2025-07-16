'use client'

import { useState, useEffect } from 'react'
import { StandardPageLayout } from '@/components/layouts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
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
  const [gruposAbertos, setGruposAbertos] = useState<string[]>(GRUPOS_DRE.map(g => g.nome))
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
    setGruposAbertos(prev => prev.includes(nome) ? prev.filter(g => g !== nome) : [...prev, nome])
  }

  // Mapeamento de cálculo para cada indicador/linha
  const MAPA_INDICADORES: Record<string, (mes: any) => number | string> = {
    // Indicadores Estratégicos
    'Faturamento Total': (mes) => {
      const receitas = [
        'Stone Crédito', 'Stone Débito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
      ];
      return receitas.reduce((acc, cat) => acc + (mes.categorias[cat] || 0), 0);
    },
    'Faturamento Couvert': (mes) => mes.categorias['Receita de Eventos'] || 0,
    'Faturamento Bar': (mes) => {
      const bar = ['Stone Crédito', 'Stone Débito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro'];
      return bar.reduce((acc, cat) => acc + (mes.categorias[cat] || 0), 0);
    },
    'Faturamento CMvível': (mes) => mes.categorias['Outras Receitas'] || 0,
    'CMV R$': (mes) => {
      const cmv = ['Custo Drinks', 'Custo Bebidas', 'Custo Comida', 'Custo Outros'];
      return cmv.reduce((acc, cat) => acc + (mes.categorias[cat] || 0), 0);
    },
    // Exemplo de percentual: CMV Global Real = CMV R$ / Faturamento Total
    'CMV Global Real': (mes) => {
      const cmv = MAPA_INDICADORES['CMV R$'](mes) as number;
      const fat = MAPA_INDICADORES['Faturamento Total'](mes) as number;
      if (!fat) return '-';
      return ((cmv / fat) * 100).toFixed(1) + '%';
    },
    // Cockpit Financeiro
    'Imposto': (mes) => mes.categorias['IMPOSTO'] || 0,
    'Comissão': (mes) => mes.categorias['COMISSÃO 10%'] || 0,
    'CMV': (mes) => MAPA_INDICADORES['CMV R$'](mes),
    'CMO': (mes) => mes.categorias['CMO'] || 0,
    'PRO LABORE': (mes) => mes.categorias['PRO LABORE'] || 0,
    'Ocupação': (mes) => {
      const ocup = ['ALUGUEL/CONDOMÍNIO/IPTU', 'ÁGUA', 'MANUTENÇÃO', 'INTERNET', 'GÁS', 'LUZ'];
      return ocup.reduce((acc, cat) => acc + (mes.categorias[cat] || 0), 0);
    },
    'Adm Fixo': (mes) => mes.categorias['Administrativo Ordinário'] || 0,
    'Marketing Fixo': (mes) => mes.categorias['Marketing'] || 0,
    'Escritório Central': (mes) => mes.categorias['Escritório Central'] || 0,
    'Adm e Mkt da Semana': (mes) => mes.categorias['Atrações Programação'] || 0,
    'RH+Estorno+Outros Operação': (mes) => {
      const rh = ['Recursos Humanos', 'Estorno', 'Outros Operação'];
      return rh.reduce((acc, cat) => acc + (mes.categorias[cat] || 0), 0);
    },
    'Materiais': (mes) => {
      const mats = ['Materiais Operação', 'Materiais de Limpeza e Descartáveis'];
      return mats.reduce((acc, cat) => acc + (mes.categorias[cat] || 0), 0);
    },
    'Manutenção': (mes) => mes.categorias['MANUTENÇÃO'] || 0,
    'Atrações/Eventos': (mes) => mes.categorias['Produção Eventos'] || 0,
    'Utensílios': (mes) => mes.categorias['Utensílios'] || 0,
    'Consumação (sem sócio)': (mes) => 0, // Placeholder
    'Lucro (R$)': (mes) => mes.resultado || 0,
    // Outros indicadores: retornar '-' até integração de dados/metas
  };

  return (
    <StandardPageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <h1 className="card-title-dark mb-6">DRE Ordinário</h1>
          {/* DataTable premium e grupos expansíveis serão implementados aqui */}
        </div>
      </div>
    </StandardPageLayout>
  )
} 