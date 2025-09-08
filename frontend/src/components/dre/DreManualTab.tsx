'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Trash2,
  RefreshCw,
  BarChart3,
  Target,
  Plus,
  Edit3
} from 'lucide-react'
import DreManualModal from './DreManualModal'
import { toast } from 'sonner'

interface DreManualTabProps {
  year: number
  month: number
}

interface DreCategoria {
  categoria_dre: string
  valor_automatico: number
  valor_manual: number
  valor_total: number
  origem: string
}

interface LancamentoManual {
  id: number
  data_competencia: string
  descricao: string
  valor: number
  categoria_dre: string
  observacoes?: string
  usuario_criacao?: string
  criado_em: string
}

interface DreData {
  periodo: { ano: number; mes: number }
  resumo: {
    total_receitas: number
    total_custos: number
    total_despesas: number
    lucro_operacional: number
    margem_operacional: number
  }
  categorias: DreCategoria[]
  lancamentos_manuais: LancamentoManual[]
  total_registros: {
    automaticos: number
    manuais: number
  }
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value)
}

const getCategoriaColor = (categoria: string) => {
  const colorMap: { [key: string]: string } = {
    'Receita': 'text-green-600 dark:text-green-400',
    'CMV': 'text-orange-600 dark:text-orange-400',
    'Despesas Operacionais': 'text-blue-600 dark:text-blue-400',
    'Despesas com Pessoal': 'text-purple-600 dark:text-purple-400',
    'Despesas Administrativas': 'text-indigo-600 dark:text-indigo-400',
    'Despesas Comerciais': 'text-pink-600 dark:text-pink-400',
    'Despesas Financeiras': 'text-red-600 dark:text-red-400',
    'Impostos e Taxas': 'text-yellow-600 dark:text-yellow-400',
    'Compensações/Rateios': 'text-gray-600 dark:text-gray-400',
    'Outras Despesas': 'text-slate-600 dark:text-slate-400'
  }
  return colorMap[categoria] || 'text-gray-600 dark:text-gray-400'
}

export default function DreManualTab({ year, month }: DreManualTabProps) {
  const [data, setData] = useState<DreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/financeiro/dre-simples?ano=${year}&mes=${month}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar dados da DRE')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast.error('Erro ao carregar dados da DRE')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLancamentoAdicionado = () => {
    fetchData() // Recarregar dados após adicionar lançamento
  }

  const handleRemoverLancamento = async (id: number) => {
    try {
      const response = await fetch(`/api/financeiro/dre-simples?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao remover lançamento')
      }

      toast.success('Lançamento removido com sucesso!')
      fetchData() // Recarregar dados
    } catch (error) {
      console.error('Erro ao remover lançamento:', error)
      toast.error('Erro ao remover lançamento')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
          Erro ao carregar dados
        </div>
        <div className="text-gray-600 dark:text-gray-400 mb-4">{error}</div>
        <Button onClick={fetchData} className="btn-primary-dark">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header com informações do período */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            DRE Manual - {months[month - 1]} {year}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Visualização e edição de lançamentos manuais da DRE
          </p>
        </div>
        
        <DreManualModal 
          isOpen={false}
          onClose={() => {}}
          onLancamentoAdicionado={handleLancamentoAdicionado}
          mesAno={{ mes: month, ano: year }}
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receitas</p>
                <p className={`text-lg font-semibold ${data.resumo.total_receitas >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(data.resumo.total_receitas)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Custos</p>
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(Math.abs(data.resumo.total_custos))}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Despesas</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(Math.abs(data.resumo.total_despesas))}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Operacional</p>
                <p className={`text-lg font-semibold ${data.resumo.lucro_operacional >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(data.resumo.lucro_operacional)}
                </p>
              </div>
              <Target className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Categorias DRE */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="card-title-dark flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Categorias DRE Consolidadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Categoria
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Automático
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Manual
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Origem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.categorias.map((categoria) => (
                  <tr key={categoria.categoria_dre} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getCategoriaColor(categoria.categoria_dre)}`}>
                        {categoria.categoria_dre}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(categoria.valor_automatico)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={categoria.valor_manual !== 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'}>
                        {formatCurrency(categoria.valor_manual)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${categoria.valor_total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(categoria.valor_total)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant={categoria.origem === 'hibrido' ? 'default' : categoria.origem === 'automatico' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {categoria.origem === 'hibrido' ? 'Híbrido' : categoria.origem === 'automatico' ? 'Auto' : 'Manual'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Lançamentos Manuais */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="card-title-dark flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Lançamentos Manuais ({data.lancamentos_manuais.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.lancamentos_manuais.length === 0 ? (
            <div className="text-center py-8">
              <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Nenhum lançamento manual encontrado para este período
              </p>
              <DreManualModal 
                isOpen={false}
                onClose={() => {}}
                onLancamentoAdicionado={handleLancamentoAdicionado}
                mesAno={{ mes: month, ano: year }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {data.lancamentos_manuais.map((lancamento) => (
                <div 
                  key={lancamento.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {lancamento.descricao}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {lancamento.categoria_dre}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lancamento.data_competencia).toLocaleDateString('pt-BR')}
                      </span>
                      {lancamento.observacoes && (
                        <span className="truncate max-w-xs">
                          {lancamento.observacoes}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-semibold ${lancamento.valor >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(lancamento.valor)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoverLancamento(lancamento.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-dark">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.total_registros.automaticos}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Registros Automáticos
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.total_registros.manuais}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Lançamentos Manuais
            </div>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.resumo.margem_operacional.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Margem Operacional
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
