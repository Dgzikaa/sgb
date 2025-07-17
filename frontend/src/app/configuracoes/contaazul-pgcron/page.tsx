'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, Play, Square, RotateCcw, CheckCircle, XCircle, Activity } from 'lucide-react'
import { StandardPageLayout } from '@/components/layouts'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useBarContext } from '@/contexts/BarContext'

interface JobStatus {
  success: boolean
  activeJobs[]
  recentRuns[]
  hasActiveJob: boolean
  edgeFunction: {
    available: boolean
    status: number
    message: string
  }
  status: {
    configured: boolean
    lastRun: string
    nextRun: string
  }
}

interface TestResult {
  success: boolean
  message: string
  result?: any
  status?: number
}

export default function ContaAzulPgcronPage() {
  const { selectedBar } = useBarContext()
  const [isLoading, setIsLoading] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    if (selectedBar) {
      loadStatus()
    }
  }, [selectedBar])

  const loadStatus = async () => {
    if (!selectedBar) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/contaazul/configurar-pgcron-v2?barId=${selectedBar.id}&action=status`)
      const data = await response.json()

      if (response.ok) {
        setJobStatus(data)
      } else {
        console.error('Erro ao carregar status:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    } finally {
      setIsLoading(false)
      setLastUpdate(new Date())
    }
  }

  const configurarCron = async () => {
    if (!selectedBar) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/contaazul/configurar-pgcron-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barId: selectedBar.id,
          action: 'configure'
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('úÖ Cron job configurado com sucesso!')
        await loadStatus()
      } else {
        alert(`ùå Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao configurar cron:', error)
      alert('ùå Erro ao configurar cron job')
    } finally {
      setIsLoading(false)
    }
  }

  const removerCron = async () => {
    if (!selectedBar) return
    if (!confirm('Tem certeza que deseja remover o cron job?')) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/contaazul/configurar-pgcron-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barId: selectedBar.id,
          action: 'remove'
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('úÖ Cron job removido com sucesso!')
        await loadStatus()
      } else {
        alert(`ùå Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao remover cron:', error)
      alert('ùå Erro ao remover cron job')
    } finally {
      setIsLoading(false)
    }
  }

  const testarSync = async () => {
    if (!selectedBar) return

    try {
      setIsLoading(true)
      setTestResult(null)
      
      const response = await fetch('/api/contaazul/configurar-pgcron-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barId: selectedBar.id,
          action: 'test'
        })
      })

      const data = await response.json()
      setTestResult(data)
      
      // Recarregar status ap·≥s teste
      setTimeout(() => loadStatus(), 2000)
    } catch (error) {
      console.error('Erro ao testar sync:', error)
      setTestResult({
        success: false,
        message: 'Erro ao executar teste'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (configured: boolean, active: boolean) => {
    if (configured && active) {
      return <Badge className="bg-green-100 text-green-800">úÖ Ativo</Badge>
    } else if (configured && !active) {
      return <Badge className="bg-yellow-100 text-yellow-800">ö†Ô∏è Configurado mas Inativo</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">ùå N·£o Configurado</Badge>
    }
  }

  const formatarData = (data: string) => {
    if (!data || data === 'Nunca executado') return data
    try {
      return new Date(data).toLocaleString('pt-BR')
    } catch {
      return data
    }
  }

  if (!selectedBar) {
    return (
      <ProtectedRoute requiredModule="15" errorMessage="sem_permissao_admin">
        <StandardPageLayout>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Selecione um bar para gerenciar o pgcron</p>
          </div>
        </StandardPageLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredModule="15" errorMessage="sem_permissao_admin">
      <StandardPageLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ContaAzul pgcron</h1>
              <p className="text-gray-600">
                Gerenciamento da automa·ß·£o de coleta do ContaAzul para {selectedBar.nome}
              </p>
              <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                üîÑ <strong>Arquitetura:</strong> pgcron Üí edge function Üí API dados-brutos Üí trigger Üí tabela receitas
              </div>
            </div>
            <Button 
              onClick={loadStatus}
              disabled={isLoading}
              variant="outline"
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status do Job</CardTitle>
              </CardHeader>
              <CardContent>
                {jobStatus ? (
                  <>
                    {getStatusBadge(jobStatus.status.configured, jobStatus.hasActiveJob)}
                    {jobStatus.activeJobs.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Jobs ativos: {jobStatus.activeJobs.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">Carregando...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Edge Function</CardTitle>
              </CardHeader>
              <CardContent>
                {jobStatus ? (
                  <>
                    <Badge className={
                      jobStatus.edgeFunction.available ? 
                      "bg-green-100 text-green-800" : 
                      "bg-red-100 text-red-800"
                    }>
                      {jobStatus.edgeFunction.available ? 'úÖ Online' : 'ùå Offline'}
                    </Badge>
                    <div className="mt-2 text-sm text-gray-600">
                      {jobStatus.edgeFunction.message}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">Carregando...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">·öltima Execu·ß·£o</CardTitle>
              </CardHeader>
              <CardContent>
                {jobStatus ? (
                  <>
                    <div className="text-sm font-medium">
                      {formatarData(jobStatus.status.lastRun)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Pr·≥xima: {jobStatus.status.nextRun}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">Carregando...</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                A·ß·µes de Gerenciamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={configurarCron}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {jobStatus?.hasActiveJob ? 'Reconfigurar' : 'Configurar'} Cron
                </Button>

                <Button 
                  onClick={testarSync}
                  disabled={isLoading}
                  variant="outline"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Testar Sync
                </Button>

                <Button 
                  onClick={removerCron}
                  disabled={isLoading || !jobStatus?.hasActiveJob}
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Remover Cron
                </Button>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>üìÖ Cronograma:</strong> Executa a cada 4 horas (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
              </div>
            </CardContent>
          </Card>

          {/* Test Result */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  Resultado do Teste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-3 rounded-lg ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <p className="font-medium">{testResult.message}</p>
                  {testResult.result && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm opacity-75">Ver detalhes</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(testResult.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Jobs Ativos */}
          {jobStatus?.activeJobs && jobStatus.activeJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Jobs Ativos ({jobStatus.activeJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobStatus.activeJobs.map((job, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{job.jobname}</span>
                        <Badge className={job.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {job.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Schedule:</strong> {job.schedule}</p>
                        <p><strong>Database:</strong> {job.database}</p>
                        <details className="mt-2">
                          <summary className="cursor-pointer">Ver comando</summary>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto">
                            {job.command}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execu·ß·µes Recentes */}
          {jobStatus?.recentRuns && jobStatus.recentRuns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Execu·ß·µes Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobStatus.recentRuns.slice(0, 5).map((run, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        {run.status === 'succeeded' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          {formatarData(run.start_time)}
                        </span>
                      </div>
                      <Badge className={
                        run.status === 'succeeded' ? 
                        "bg-green-100 text-green-800" : 
                        "bg-red-100 text-red-800"
                      }>
                        {run.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Info */}
          <div className="text-center text-sm text-gray-500">
            ·öltima atualiza·ß·£o: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  )
} 
