'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Activity,
  TrendingUp,
  DollarSign
} from 'lucide-react'

interface ColetaStatus {
  executando: boolean
  progresso: number
  etapaAtual: string
  dadosColetados: number
  erros: number
}

export default function ContaHubAutomaticoPage() {
  const router = useRouter()
  const { setPageTitle } = usePageTitle()
  const { toast } = useToast()
  const [contahubDisponivel, setContahubDisponivel] = useState<boolean | null>(null)
  const [dataInicio, setDataInicio] = useState('2025-01-01')
  const [dataFim, setDataFim] = useState('2025-01-31')
  const [executando, setExecutando] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [resultado, setResultado] = useState<unknown>(null)
  const [status, setStatus] = useState<ColetaStatus>({
    executando: false,
    progresso: 0,
    etapaAtual: 'Aguardando',
    dadosColetados: 0,
    erros: 0
  })

  useEffect(() => {
    setPageTitle('🤖 ContaHub Automático')
    verificarContaHub()
    return () => setPageTitle('')
  }, [setPageTitle])

  const verificarContaHub = async () => {
    try {
      const response = await fetch('/api/contahub/teste-5-dias')
      const data = await response.json()
      setContahubDisponivel(data.contahub_disponivel !== false)
    } catch (error) {
      setContahubDisponivel(false)
      console.error('Erro ao verificar ContaHub:', error)
    }
  }

  const executarColetaAutomatica = async () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "❌ Erro",
        description: "Por favor, selecione as datas de início e fim",
        variant: "destructive"
      })
      return
    }

    setExecutando(true)
    setLogs([])
    setResultado(null)
    setStatus({
      executando: true,
      progresso: 0,
      etapaAtual: 'Iniciando coleta...',
      dadosColetados: 0,
      erros: 0
    })

    try {
      const response = await fetch('/api/contahub/historico-completo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataInicio, dataFim })
      })

      const data = await response.json()

      if (data.success) {
        setResultado(data.resultado)
        setStatus({
          executando: false,
          progresso: 100,
          etapaAtual: 'Concluída',
          dadosColetados: data.resultado?.total_registros || 0,
          erros: data.resultado?.erros || 0
        })
        toast({
          title: "✅ Sucesso",
          description: `Coleta finalizada! ${data.resultado?.total_registros || 0} registros coletados.`,
        })
      } else {
        throw new Error(data.error || 'Erro na coleta')
      }
    } catch (error) {
      console.error('Erro na coleta:', error)
      setStatus(prev => ({
        ...prev,
        executando: false,
        etapaAtual: 'Erro',
        erros: prev.erros + 1
      }))
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao executar coleta automática",
        variant: "destructive"
      })
    } finally {
      setExecutando(false)
    }
  }

  const calcularDias = () => {
    if (!dataInicio || !dataFim) return 0
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    const diffTime = Math.abs(fim.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const getStatusColor = () => {
    if (status.executando) return 'text-blue-600 dark:text-blue-400'
    if (status.erros > 0) return 'text-red-600 dark:text-red-400'
    if (status.progresso === 100) return 'text-green-600 dark:text-green-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getStatusIcon = () => {
    if (status.executando) return <RefreshCw className="w-5 h-5 animate-spin" />
    if (status.erros > 0) return <AlertTriangle className="w-5 h-5" />
    if (status.progresso === 100) return <CheckCircle className="w-5 h-5" />
    return <Clock className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Moderno */}
        <div className="relative">
          <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/configuracoes')}
                  className="text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">ContaHub Automático</h1>
                    <p className="text-cyan-100 mt-1">Coleta automática de dados financeiros em lote</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-cyan-200">Status do Serviço</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${contahubDisponivel ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                    <span className="text-lg font-semibold">
                      {contahubDisponivel === null ? 'Verificando...' : contahubDisponivel ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <Activity className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status Atual</p>
                  <p className={`text-2xl font-bold ${getStatusColor()}`}>
                    {status.etapaAtual}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Processo de coleta</p>
                </div>
                <div className={`p-3 rounded-xl ${status.executando ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {getStatusIcon()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Dados Coletados</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {status.dadosColetados.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Registros</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Progresso</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {status.progresso}%
                  </p>
                  <Progress value={status.progresso} className="mt-2 h-2" />
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Período (dias)</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {calcularDias()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {dataInicio} - {dataFim}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuração da Coleta */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              Configuração da Coleta Automática
            </CardTitle>
            <CardDescription>
              Configure o período para coleta automática de dados do ContaHub
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dataInicio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data de Início
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  disabled={executando}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data de Fim
                </Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  disabled={executando}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Período Selecionado
                </Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {calcularDias()} dias
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    De {new Date(dataInicio).toLocaleDateString('pt-BR')} a {new Date(dataFim).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ação
                </Label>
                <Button
                  onClick={executarColetaAutomatica}
                  disabled={executando || !contahubDisponivel}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                >
                  {executando ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Coletando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Coleta
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!contahubDisponivel && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-200">ContaHub Indisponível</h4>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      O serviço ContaHub não está disponível. Verifique a configuração ou tente novamente mais tarde.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        {resultado && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                Resultados da Coleta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {resultado.total_registros?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Registros Coletados</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {resultado.sucesso ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {Math.round(resultado.tempo_execucao || 0)}s
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tempo de Execução</div>
                </div>
              </div>

              {resultado.detalhes && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Detalhes da Execução</h4>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                    {JSON.stringify(resultado.detalhes, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Logs (se houver) */}
        {logs.length > 0 && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Logs de Execução
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm text-green-400 max-h-60 overflow-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
