'use client'

import { useState, useEffect } from 'react'
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
        console.error('Erro ao buscar categorias:', error)
      }
    }
    buscarCategorias()
  }, [])

  // Buscar eventos
  const buscarEventos = async (page = 1) => {
    setLoading(true)
    try {
      console.log('🔄 Carregando eventos financeiros...')
      
      const params = new URLSearchParams({
        bar_id: '3',
        page: page.toString(),
        limit: itemsPerPage.toString()
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
      console.log('✅ Eventos carregados:', data.lancamentos?.length || 0)
      
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
      console.error('❌ Erro ao carregar eventos:', error)
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
    buscarEventos(1)
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
      buscarEventos(1)
    }, 100)
  }

  // Ordenação
  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDirection)
    
    const sortedEventos = [...eventos].sort((a, b) => {
      let aValue = a[field]
      let bValue = b[field]
      
      if (field === 'valor') {
        aValue = parseFloat(aValue.toString())
        bValue = parseFloat(bValue.toString())
      }
      
      if (field === 'data_competencia') {
        // Garantir formato correto da data para ordenação
        const parseDate = (dateStr: string) => {
          // Se a data já está no formato ISO (YYYY-MM-DD), usar diretamente
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return new Date(dateStr).getTime()
          }
          // Se está no formato DD/MM/YYYY, converter
          if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            const [day, month, year] = dateStr.split('/')
            return new Date(`${year}-${month}-${day}`).getTime()
          }
          return new Date(dateStr).getTime()
        }
        
        aValue = parseDate(aValue.toString())
        bValue = parseDate(bValue.toString())
      }
      
      if (newDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    setEventos(sortedEventos)
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
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatarValor(resumo.total_receitas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
              <TrendingDownIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatarValor(resumo.total_despesas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatarValor(resumo.saldo_liquido)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lançamentos</CardTitle>
              <FileTextIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {resumo.total_lancamentos.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Colapsáveis com Título */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-5 w-5" />
                <div>
                  <div className="text-lg font-semibold">ContaAzul - Eventos Financeiros por Competência</div>
                  <div className="text-sm font-normal text-gray-600 mt-1">
                    Visualize todos os eventos financeiros sincronizados - {totalRegistros.toLocaleString('pt-BR')} registros encontrados
                  </div>
                </div>
                {(filtros.dataInicial || filtros.dataFinal || filtros.mes || filtros.ano || filtros.tipo || filtros.categoriasSelecionadas.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {[
                      filtros.dataInicial && 'Data Inicial',
                      filtros.dataFinal && 'Data Final', 
                      filtros.mes && 'Mês',
                      filtros.ano && 'Ano',
                      filtros.tipo && 'Tipo',
                      filtros.categoriasSelecionadas.length > 0 && `${filtros.categoriasSelecionadas.length} categorias`
                    ].filter(Boolean).length} filtros ativos
                  </Badge>
                )}
              </div>
              {filtrosExpandidos ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
          
          {filtrosExpandidos && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                {/* Filtro por Período - Campos Menores */}
                <div className="space-y-2">
                  <Label className="text-xs">Data Inicial</Label>
                  <Input
                    type="date"
                    value={filtros.dataInicial}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataInicial: e.target.value }))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Data Final</Label>
                  <Input
                    type="date"
                    value={filtros.dataFinal}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataFinal: e.target.value }))}
                    className="text-xs h-8"
                  />
                </div>

                {/* Filtro por Mês */}
                <div className="space-y-2">
                  <Label className="text-xs">Mês</Label>
                  <Select value={filtros.mes || 'all'} onValueChange={(value) => setFiltros(prev => ({ ...prev, mes: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="h-8 text-xs">
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
                <div className="space-y-2">
                  <Label className="text-xs">Ano</Label>
                  <Select value={filtros.ano || 'all'} onValueChange={(value) => setFiltros(prev => ({ ...prev, ano: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="h-8 text-xs">
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
                <div className="space-y-2">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={filtros.tipo || 'all'} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="h-8 text-xs">
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
                <div className="space-y-2">
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
                        className="pl-8 text-xs h-8"
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
                          className="text-xs px-2 py-1 cursor-pointer"
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
              <div className="flex gap-2 mt-4">
                <Button onClick={aplicarFiltros} disabled={loading} size="sm">
                  {loading ? 'Carregando...' : 'Aplicar Filtros'}
                </Button>
                <Button variant="outline" onClick={limparFiltros} size="sm">
                  <XIcon className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabela de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle>
              Lançamentos
              <span className="text-sm font-normal text-gray-500 ml-2">
                Página {currentPage} de {totalPages} • Mostrando {eventos.length} de {totalRegistros.toLocaleString('pt-BR')} registros
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th
                      className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('data_competencia')}
                    >
                      <div className="flex items-center gap-2">
                        Data Competência
                        {renderSortIcon('data_competencia')}
                      </div>
                    </th>
                    <th
                      className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('descricao')}
                    >
                      <div className="flex items-center gap-2">
                        Descrição
                        {renderSortIcon('descricao')}
                      </div>
                    </th>
                    <th
                      className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('categoria')}
                    >
                      <div className="flex items-center gap-2">
                        Categoria
                        {renderSortIcon('categoria')}
                      </div>
                    </th>
                    <th
                      className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('valor')}
                    >
                      <div className="flex items-center gap-2">
                        Valor
                        {renderSortIcon('valor')}
                      </div>
                    </th>
                    <th
                      className="text-left p-3 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('tipo')}
                    >
                      <div className="flex items-center gap-2">
                        Tipo
                        {renderSortIcon('tipo')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Carregando...</span>
                        </div>
                      </td>
                    </tr>
                  ) : eventos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-500">
                        Nenhum evento encontrado
                      </td>
                    </tr>
                  ) : (
                    eventos.map((evento) => (
                      <tr key={evento.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {formatarData(evento.data_competencia)}
                        </td>
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={evento.descricao}>
                            {evento.descricao}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {evento.categoria}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className={`font-medium ${evento.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatarValor(evento.valor)}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant={evento.tipo === 'Receita' ? 'default' : 'destructive'}>
                            {evento.tipo}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages} • {totalRegistros.toLocaleString('pt-BR')} registros
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => buscarEventos(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => buscarEventos(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  )
} 