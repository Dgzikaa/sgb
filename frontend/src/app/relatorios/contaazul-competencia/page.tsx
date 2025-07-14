'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { StandardPageLayout } from '@/components/layouts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  DollarSignIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  FileTextIcon,
  CalendarIcon,
  FilterIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Evento {
  id: string
  descricao: string
  valor: number
  categoria: string
  data_competencia: string
  data_vencimento: string
  data_pagamento: string | null
  tipo: 'Receita' | 'Despesa'
  cliente_fornecedor: string
  documento: string
}

interface Resumo {
  total_receitas: number
  total_despesas: number
  saldo_liquido: number
  total_lancamentos: number
}

interface Categoria {
  id: string
  nome: string
}

type SortField = 'data_competencia' | 'descricao' | 'valor' | 'categoria' | 'tipo'
type SortDirection = 'asc' | 'desc'

export default function ContaAzulCompetenciaPage() {
  const { user } = usePermissions()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [resumo, setResumo] = useState<Resumo>({
    total_receitas: 0,
    total_despesas: 0,
    saldo_liquido: 0,
    total_lancamentos: 0
  })
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('data_competencia')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Filtros
  const [filtros, setFiltros] = useState({
    dataInicial: '',
    dataFinal: '',
    mes: '',
    ano: '',
    categoriasSelecionadas: [] as string[],
    tipo: '' // 'receita', 'despesa' ou ''
  })

  // Estado para controlar se os filtros estão expandidos
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false)

  // Estado para busca de categorias
  const [buscaCategoria, setBuscaCategoria] = useState('')
  const [mostrarDropdownCategorias, setMostrarDropdownCategorias] = useState(false)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const itemsPerPage = 50

  // Buscar categorias
  useEffect(() => {
    const buscarCategorias = async () => {
      try {
        const response = await fetch(`/api/contaazul/eventos-competencia/categorias?bar_id=3`)
        if (response.ok) {
          const data = await response.json()
          setCategorias(data.categorias || [])
        }
      } catch (error) {
        // Error silently handled
      }
    }
    buscarCategorias()
  }, [])

  // Buscar eventos
  const buscarEventos = async (page = 1, newSortField?: SortField, newSortDirection?: SortDirection) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        bar_id: '3',
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sort_field: newSortField || sortField,
        sort_direction: newSortDirection || sortDirection
      })

      // Adicionar filtros
      if (filtros.tipo) {
        params.append('tipo', filtros.tipo)
      }
      if (filtros.dataInicial) {
        params.append('data_inicial', filtros.dataInicial)
      }
      if (filtros.dataFinal) {
        params.append('data_final', filtros.dataFinal)
      }
      if (filtros.mes) {
        params.append('mes', filtros.mes)
      }
      if (filtros.ano) {
        params.append('ano', filtros.ano)
      }
      if (filtros.categoriasSelecionadas.length > 0) {
        params.append('categorias', filtros.categoriasSelecionadas.join(','))
      }

      const response = await fetch(`/api/contaazul/eventos-competencia?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar eventos financeiros')
      }

      const data = await response.json()
      
      setEventos(data.lancamentos || [])
      setResumo(data.resumo || {
        total_receitas: 0,
        total_despesas: 0,
        saldo_liquido: 0,
        total_lancamentos: 0
      })
      setTotalRegistros(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      setCurrentPage(page)
      
    } catch (error) {
      // Error silently handled
    } finally {
      setLoading(false)
    }
  }

  // Carregar eventos na inicialização
  useEffect(() => {
    buscarEventos(1)
  }, [])

  // Aplicar filtros
  const aplicarFiltros = () => {
    setCurrentPage(1)
    buscarEventos(1, sortField, sortDirection)
  }

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      dataInicial: '',
      dataFinal: '',
      mes: '',
      ano: '',
      categoriasSelecionadas: [],
      tipo: ''
    })
    setBuscaCategoria('')
    setTimeout(() => {
      setCurrentPage(1)
      buscarEventos(1, sortField, sortDirection)
    }, 100)
  }

  // Ordenação - agora usa a API
  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    
    setSortField(field)
    setSortDirection(newDirection)
    
    // Buscar dados ordenados na API
    buscarEventos(1, field, newDirection)
  }

  // Renderizar ícone de ordenação
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
  }

  // Toggle categoria selecionada
  const toggleCategoria = (categoriaId: string) => {
    setFiltros(prev => ({
      ...prev,
      categoriasSelecionadas: prev.categoriasSelecionadas.includes(categoriaId)
        ? prev.categoriasSelecionadas.filter(id => id !== categoriaId)
        : [...prev.categoriasSelecionadas, categoriaId]
    }))
    setMostrarDropdownCategorias(false)
    setBuscaCategoria('')
  }

  // Remover categoria selecionada
  const removerCategoria = (categoriaId: string) => {
    setFiltros(prev => ({
      ...prev,
      categoriasSelecionadas: prev.categoriasSelecionadas.filter(id => id !== categoriaId)
    }))
  }

  // Filtrar categorias pela busca
  const categoriasFiltradas = categorias.filter(cat => 
    cat.nome.toLowerCase().includes(buscaCategoria.toLowerCase()) &&
    !filtros.categoriasSelecionadas.includes(cat.id)
  )

  // Formatação de valores
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Formatação de data
  const formatarData = (data: string) => {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR })
  }

  return (
    <ProtectedRoute requiredModule="relatorio_contaazul_competencia">
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Receitas</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatarValor(resumo.total_receitas)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Despesas</CardTitle>
              <TrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatarValor(resumo.total_despesas)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Saldo Líquido</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumo.saldo_liquido >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'}`}>
                {formatarValor(resumo.saldo_liquido)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Lançamentos</CardTitle>
              <FileTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {resumo.total_lancamentos}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Filtros */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader 
            className="cursor-pointer select-none border-b border-gray-200 dark:border-gray-700"
            onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <CardTitle className="text-gray-900 dark:text-white">ContaAzul - Eventos Financeiros por Competência</CardTitle>
              </div>
              {filtrosExpandidos ? (
                <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Visualize todos os eventos financeiros organizados por competência. {totalRegistros} registros encontrados
            </p>
          </CardHeader>

          {filtrosExpandidos && (
            <CardContent className="space-y-4">
              <div className="form-grid">
                  {/* Filtro por Período - Campos Menores */}
                  <div className="form-group">
                    <Label className="text-xs">Data Inicial</Label>
                    <Input
                      type="date"
                      value={filtros.dataInicial}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataInicial: e.target.value }))}
                      className="input-mobile"
                    />
                  </div>

                  <div className="form-group">
                    <Label className="text-xs">Data Final</Label>
                    <Input
                      type="date"
                      value={filtros.dataFinal}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataFinal: e.target.value }))}
                      className="input-mobile"
                    />
                  </div>

                  {/* Filtro por Mês */}
                  <div className="form-group">
                    <Label className="text-xs">Mês</Label>
                    <Select value={filtros.mes || 'all'} onValueChange={(value) => setFiltros(prev => ({ ...prev, mes: value === 'all' ? '' : value }))}>
                      <SelectTrigger className="select-mobile">
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="01">Janeiro</SelectItem>
                        <SelectItem value="02">Fevereiro</SelectItem>
                        <SelectItem value="03">Março</SelectItem>
                        <SelectItem value="04">Abril</SelectItem>
                        <SelectItem value="05">Maio</SelectItem>
                        <SelectItem value="06">Junho</SelectItem>
                        <SelectItem value="07">Julho</SelectItem>
                        <SelectItem value="08">Agosto</SelectItem>
                        <SelectItem value="09">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Ano */}
                  <div className="form-group">
                    <Label className="text-xs">Ano</Label>
                    <Select value={filtros.ano || 'all'} onValueChange={(value) => setFiltros(prev => ({ ...prev, ano: value === 'all' ? '' : value }))}>
                      <SelectTrigger className="select-mobile">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Tipo */}
                  <div className="form-group">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={filtros.tipo || 'all'} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value === 'all' ? '' : value }))}>
                      <SelectTrigger className="select-mobile">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="receita">Receitas</SelectItem>
                        <SelectItem value="despesa">Despesas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Categorias - Dropdown Pesquisável Melhorado */}
                  <div className="form-group">
                    <Label className="text-xs">Categorias</Label>
                    <div className="relative">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar categoria..."
                          value={buscaCategoria}
                          onChange={(e) => {
                            setBuscaCategoria(e.target.value)
                            setMostrarDropdownCategorias(true)
                          }}
                          onFocus={() => setMostrarDropdownCategorias(true)}
                          onBlur={() => setTimeout(() => setMostrarDropdownCategorias(false), 200)}
                          className="search-input-mobile pl-8"
                        />
                      </div>
                      {mostrarDropdownCategorias && buscaCategoria && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {categoriasFiltradas.map((categoria) => (
                            <div
                              key={categoria.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs text-gray-900 border-b border-gray-100 last:border-b-0"
                              onClick={() => toggleCategoria(categoria.id)}
                            >
                              {categoria.nome}
                            </div>
                          ))}
                          {categoriasFiltradas.length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-xs">
                              Nenhuma categoria encontrada
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categorias Selecionadas */}
                {filtros.categoriasSelecionadas.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-xs">Categorias Selecionadas:</Label>
                    <div className="flex flex-wrap gap-1">
                      {filtros.categoriasSelecionadas.map((categoriaId) => {
                        const categoria = categorias.find(c => c.id === categoriaId)
                        return (
                          <Badge
                            key={categoriaId}
                            variant="default"
                            className="badge-mobile cursor-pointer"
                            onClick={() => removerCategoria(categoriaId)}
                          >
                            {categoria?.nome || categoriaId}
                            <XIcon className="w-3 h-3 ml-1" />
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="btn-group-mobile mt-4">
                  <Button onClick={aplicarFiltros} disabled={loading} className="btn-touch">
                    {loading ? 'Carregando...' : 'Aplicar Filtros'}
                  </Button>
                  <Button variant="outline" onClick={limparFiltros} className="btn-touch">
                    <XIcon className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
            </CardContent>
          )}
        </Card>

        {/* Tabela de Lançamentos */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Lançamentos - Página {currentPage} de {totalPages}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {Math.min(itemsPerPage, eventos.length)} de {totalRegistros} registros
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : eventos.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th 
                          className="p-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => handleSort('data_competencia')}
                        >
                          <div className="flex items-center gap-1">
                            Data Competência
                            {renderSortIcon('data_competencia')}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => handleSort('descricao')}
                        >
                          <div className="flex items-center gap-1">
                            Descrição
                            {renderSortIcon('descricao')}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => handleSort('categoria')}
                        >
                          <div className="flex items-center gap-1">
                            Categoria
                            {renderSortIcon('categoria')}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => handleSort('valor')}
                        >
                          <div className="flex items-center gap-1">
                            Valor
                            {renderSortIcon('valor')}
                          </div>
                        </th>
                        <th 
                          className="p-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => handleSort('tipo')}
                        >
                          <div className="flex items-center gap-1">
                            Tipo
                            {renderSortIcon('tipo')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventos.map((evento, index) => (
                        <tr 
                          key={evento.id} 
                          className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                          }`}
                        >
                          <td className="p-3 text-sm text-gray-900 dark:text-gray-100">
                            {formatarData(evento.data_competencia)}
                          </td>
                          <td className="p-3 text-sm text-gray-900 dark:text-gray-100">
                            <div>
                              <div className="font-medium">{evento.descricao}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {evento.cliente_fornecedor}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <Badge 
                              variant="outline" 
                              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                            >
                              {evento.categoria}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            <div className={`font-medium ${
                              evento.tipo === 'Receita' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatarValor(evento.valor)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {evento.cliente_fornecedor}
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <Badge 
                              className={`${
                                evento.tipo === 'Receita' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {evento.tipo}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Página {currentPage} de {totalPages} • {totalRegistros} registros
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FileTextIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum evento encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tente ajustar os filtros ou selecione um período diferente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 