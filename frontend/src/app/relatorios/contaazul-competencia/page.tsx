'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { 
  RefreshCw, 
  Download, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ========================================
// 🎯 TIPOS SIMPLIFICADOS
// ========================================

interface Lancamento {
  id: string
  descricao: string
  valor: number
  categoria: string
  data_competencia: string
  tipo: 'Receita' | 'Despesa'
  cliente_fornecedor: string
  documento: string
}

interface Resumo {
  total_receitas: number
  total_despesas: number
  saldo_liquido: number
  total_lancamentos: number
  ultima_sincronizacao?: string
}

interface StatusSync {
  executando: boolean
  ultima_execucao?: string
  status: 'sucesso' | 'erro' | 'nunca_executado'
  registros_processados?: number
  mensagem?: string
}

// ========================================
// 🎨 COMPONENTE PRINCIPAL SIMPLIFICADO
// ========================================

export default function ContaAzulCompetenciaPage() {
  const { selectedBar, isLoading: barLoading } = useBar()
  const { setPageTitle } = usePageTitle()
  
  // Estados simplificados
  const [loading, setLoading] = useState(false)
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [statusSync, setStatusSync] = useState<StatusSync>({ 
    executando: false, 
    status: 'nunca_executado' 
  })
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const itensPorPagina = 25

  // ========================================
  // 🔄 CONFIGURAR TÍTULO DA PÁGINA
  // ========================================
  useEffect(() => {
    setPageTitle('ContaAzul - Competência (V1)')
  }, [setPageTitle])

  // ========================================
  // 🔄 CARREGAR DADOS INICIAIS
  // ========================================
  useEffect(() => {
    if (selectedBar?.id) {
      carregarDados()
      verificarStatusSync()
    }
  }, [selectedBar?.id])

  // ========================================
  // 📊 FUNÇÕES PRINCIPAIS
  // ========================================

  const carregarDados = async (pagina: number = 1) => {
    if (!selectedBar?.id) return
    
    setLoading(true)
    console.log('🔄 Carregando dados do ContaAzul...')

    try {
      const response = await fetch(`/api/contaazul-v1-simple?bar_id=${selectedBar.id}&page=${pagina}&limit=${itensPorPagina}`)
      const data = await response.json()

      if (data.success) {
        setLancamentos(data.lancamentos || [])
        setResumo(data.resumo || null)
        setTotalRegistros(data.total || 0)
        setTotalPaginas(Math.ceil((data.total || 0) / itensPorPagina))
        setPaginaAtual(pagina)
        console.log('✅ Dados carregados:', data.lancamentos?.length || 0, 'registros de', data.total || 0, 'total')
      } else {
        console.error('❌ Erro ao carregar dados:', data.error)
        setLancamentos([])
        setResumo(null)
        setTotalRegistros(0)
        setTotalPaginas(0)
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      setLancamentos([])
      setResumo(null)
      setTotalRegistros(0)
      setTotalPaginas(0)
    } finally {
      setLoading(false)
    }
  }

  const verificarStatusSync = async () => {
    try {
      const response = await fetch('/api/contaazul-v1-status')
      const data = await response.json()
      
      if (data.success) {
        setStatusSync({
          executando: data.executando || false,
          ultima_execucao: data.ultima_execucao,
          status: data.status || 'nunca_executado',
          registros_processados: data.registros_processados,
          mensagem: data.mensagem
        })
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error)
    }
  }

  const executarSincronizacao = async () => {
    if (statusSync.executando) {
      alert('Sincronização já está em andamento!')
      return
    }

    if (!confirm('Deseja executar a sincronização com o ContaAzul V1 (Playwright)? Isso pode levar alguns minutos.')) {
      return
    }

    setStatusSync(prev => ({ ...prev, executando: true, mensagem: 'Iniciando sincronização V1...' }))
    
    try {
      // Pegar dados do usuário do localStorage para autenticação
      const userData = localStorage.getItem('sgb_user')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Adicionar header de autenticação se o usuário estiver logado
      if (userData) {
        headers['x-user-data'] = encodeURIComponent(userData)
      }

      const response = await fetch('/api/contaazul-v1-sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ bar_id: selectedBar?.id })
      })

      const data = await response.json()

      if (data.success) {
        setStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'sucesso',
          registros_processados: data.registros_processados,
          mensagem: data.mensagem
        })
        
        // Recarregar dados após sincronização
        await carregarDados()
        
        alert(`Sincronização V1 concluída!\n\nRegistros processados: ${data.registros_processados || 0}`)
      } else {
        setStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'erro',
          mensagem: data.error || 'Erro desconhecido'
        })
        
        alert(`Erro na sincronização V1: ${data.error}`)
      }
    } catch (error: any) {
      console.error('❌ Erro na sincronização V1:', error)
      setStatusSync({
        executando: false,
        ultima_execucao: new Date().toISOString(),
        status: 'erro',
        mensagem: error.message || 'Erro de conexão'
      })
      
      alert('Erro na sincronização V1. Tente novamente.')
    }
  }

  const executarSincronizacaoSelenium = async () => {
    if (statusSync.executando) {
      alert('Sincronização já está em andamento!')
      return
    }

    if (!confirm('Deseja executar a sincronização com o ContaAzul V5 (Selenium)?\n\n⚠️ ATENÇÃO: Esta versão foi atualizada para NÃO fechar seus navegadores.\n\n✅ Isso pode levar alguns minutos.\n✅ Agora é seguro usar com outros navegadores abertos.')) {
      return
    }

    setStatusSync(prev => ({ ...prev, executando: true, mensagem: 'Iniciando sincronização V5 Selenium...' }))
    
    try {
      const userData = localStorage.getItem('sgb_user')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (userData) {
        headers['x-user-data'] = encodeURIComponent(userData)
      }

      const response = await fetch('/api/admin/contaazul-v5-selenium', {
        method: 'POST',
        headers,
        body: JSON.stringify({ bar_id: selectedBar?.id })
      })

      const data = await response.json()

      if (data.success) {
        setStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'sucesso',
          registros_processados: data.registros || data.registros_salvos || 0,
          mensagem: data.message
        })
        
        await carregarDados()
        
        const registrosMsg = data.registros_salvos ? 
          `Registros processados: ${data.registros}\nRegistros salvos no banco: ${data.registros_salvos}` :
          `Registros processados: ${data.registros || 0}`
        
        alert(`Sincronização V5 Selenium Original concluída!\n\n${registrosMsg}\n\nVersão: ${data.versao || 'V5'}\nDuração: ${data.duracao || 'N/A'}`)
      } else {
        setStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'erro',
          mensagem: data.error || 'Erro desconhecido'
        })
        
        alert(`Erro na sincronização V5 Original: ${data.error}`)
      }
    } catch (error: any) {
      console.error('❌ Erro na sincronização V5:', error)
      setStatusSync({
        executando: false,
        ultima_execucao: new Date().toISOString(),
        status: 'erro',
        mensagem: error.message || 'Erro de conexão'
      })
      
      alert('Erro na sincronização V5. Tente novamente.')
    }
  }

  const executarSincronizacaoAPI = async () => {
    if (statusSync.executando) {
      alert('Sincronização já está em andamento!')
      return
    }

    if (!confirm('Deseja executar a sincronização com a API do ContaAzul (Node.js)? Isso pode levar alguns minutos.')) {
      return
    }

    setStatusSync(prev => ({ ...prev, executando: true, mensagem: 'Iniciando sincronização API Node.js...' }))
    
    try {
      const userData = localStorage.getItem('sgb_user')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (userData) {
        headers['x-user-data'] = encodeURIComponent(userData)
      }

      const response = await fetch('/api/contaazul-nodejs-sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ bar_id: selectedBar?.id })
      })

      const data = await response.json()

      if (data.success) {
        setStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'sucesso',
          registros_processados: data.registros_processados,
          mensagem: data.message
        })
        
        await carregarDados()
        
        alert(`Sincronização API Node.js concluída!\n\nRegistros processados: ${data.registros_processados || 0}`)
      } else {
        setStatusSync({
          executando: false,
          ultima_execucao: new Date().toISOString(),
          status: 'erro',
          mensagem: data.error || 'Erro desconhecido'
        })
        
        alert(`Erro na sincronização API: ${data.error}`)
      }
    } catch (error: any) {
      console.error('❌ Erro na sincronização API:', error)
      setStatusSync({
        executando: false,
        ultima_execucao: new Date().toISOString(),
        status: 'erro',
        mensagem: error.message || 'Erro de conexão'
      })
      
      alert('Erro na sincronização API. Tente novamente.')
    }
  }

  // ========================================
  // 🛠️ FUNÇÕES AUXILIARES
  // ========================================

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    if (!data) return 'N/A'
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR })
  }

  const formatarDataHora = (data: string) => {
    if (!data) return 'N/A'
    return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  const exportarCSV = () => {
    if (!lancamentos.length) return
    
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Cliente/Fornecedor', 'Documento']
    const rows = lancamentos.map(l => [
      formatarData(l.data_competencia),
      l.descricao,
      formatarMoeda(l.valor),
      l.tipo,
      l.categoria,
      l.cliente_fornecedor,
      l.documento
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `contaazul-competencia-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ========================================
  // 🎨 RENDERIZAÇÃO
  // ========================================

  if (barLoading) {
    return <div className="flex justify-center items-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">ContaAzul - Sincronização de Dados</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:items-start">
          <Button 
            onClick={executarSincronizacao}
            disabled={statusSync.executando || loading}
            className="flex items-center justify-center gap-2 min-w-[180px]"
            size="sm"
          >
            {statusSync.executando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync V1 (Playwright)
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => executarSincronizacaoSelenium()}
            disabled={statusSync.executando || loading}
            variant="outline"
            className="flex items-center justify-center gap-2 min-w-[180px]"
            size="sm"
          >
            {statusSync.executando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync V5 Original
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => executarSincronizacaoAPI()}
            disabled={statusSync.executando || loading}
            variant="outline"
            className="flex items-center justify-center gap-2 min-w-[180px]"
            size="sm"
          >
            {statusSync.executando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync API (Node.js)
              </>
            )}
          </Button>
          
          <Button 
            onClick={exportarCSV}
            disabled={!lancamentos.length || loading}
            variant="secondary"
            className="flex items-center justify-center gap-2"
            size="sm"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Status da Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status da Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {statusSync.status === 'sucesso' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {statusSync.status === 'erro' && <AlertTriangle className="w-5 h-5 text-red-600" />}
              {statusSync.status === 'nunca_executado' && <Clock className="w-5 h-5 text-gray-400" />}
              
              <Badge variant={
                statusSync.status === 'sucesso' ? 'default' : 
                statusSync.status === 'erro' ? 'destructive' : 
                'secondary'
              }>
                {statusSync.status === 'sucesso' ? 'Sucesso' : 
                 statusSync.status === 'erro' ? 'Erro' : 
                 'Nunca Executado'}
              </Badge>
            </div>
            
            {statusSync.ultima_execucao && (
              <div className="text-sm text-gray-600">
                Última execução: {formatarDataHora(statusSync.ultima_execucao)}
              </div>
            )}
            
            {statusSync.registros_processados && (
              <div className="text-sm text-gray-600">
                {statusSync.registros_processados} registros processados
              </div>
            )}
          </div>
          
          {statusSync.mensagem && (
            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {statusSync.mensagem}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Receitas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatarMoeda(resumo.total_receitas)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatarMoeda(resumo.total_despesas)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saldo Líquido</p>
                  <p className={`text-2xl font-bold ${resumo.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatarMoeda(resumo.saldo_liquido)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Lançamentos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {resumo.total_lancamentos}
                  </p>
                </div>
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lançamentos</span>
            {totalRegistros > 0 && (
              <span className="text-sm text-gray-500 font-normal">
                {totalRegistros.toLocaleString()} registros encontrados
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum lançamento encontrado</p>
              <p className="text-sm text-gray-400">Execute a sincronização para buscar dados</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Cliente/Fornecedor</TableHead>
                      <TableHead>Documento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.map((lancamento) => (
                      <TableRow key={lancamento.id}>
                        <TableCell>{formatarData(lancamento.data_competencia)}</TableCell>
                        <TableCell className="max-w-xs truncate">{lancamento.descricao}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          lancamento.valor >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatarMoeda(lancamento.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lancamento.tipo === 'Receita' ? 'default' : 'destructive'}>
                            {lancamento.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{lancamento.categoria}</TableCell>
                        <TableCell>{lancamento.cliente_fornecedor}</TableCell>
                        <TableCell>{lancamento.documento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Página {paginaAtual} de {totalPaginas} • 
                    Mostrando {((paginaAtual - 1) * itensPorPagina) + 1} a {Math.min(paginaAtual * itensPorPagina, totalRegistros)} de {totalRegistros.toLocaleString()} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => carregarDados(paginaAtual - 1)}
                      disabled={paginaAtual <= 1 || loading}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-500">
                      {paginaAtual} / {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => carregarDados(paginaAtual + 1)}
                      disabled={paginaAtual >= totalPaginas || loading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 