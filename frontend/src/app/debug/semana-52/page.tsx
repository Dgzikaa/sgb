'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCcw, CheckCircle2, XCircle, AlertTriangle, Database } from 'lucide-react'

interface DiagnosticoResult {
  semana?: any
  problemas?: string[]
  solucoes?: string[]
  dadosContahub?: any
  metricasCalculadas?: any
}

export default function DiagnosticoSemana52() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<DiagnosticoResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [recalculando, setRecalculando] = useState(false)

  const diagnosticar = async () => {
    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const response = await fetch('/api/debug/diagnostico-semana-52?barId=1')
      const data = await response.json()

      if (!data.success) {
        setErro(data.error || 'Erro ao executar diagnóstico')
        return
      }

      setResultado(data.data)
    } catch (err: any) {
      setErro(err.message || 'Erro ao executar diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  const recalcular = async () => {
    setRecalculando(true)
    setErro(null)

    try {
      const response = await fetch('/api/gestao/desempenho/recalcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barId: 1,
          ano: 2025,
          numeroSemana: 52
        })
      })

      const data = await response.json()

      if (!data.success) {
        setErro(data.error || 'Erro ao recalcular semana')
        return
      }

      // Refazer diagnóstico após recalcular
      await diagnosticar()
    } catch (err: any) {
      setErro(err.message || 'Erro ao recalcular semana')
    } finally {
      setRecalculando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Diagnóstico - Semana 52 (2025)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ferramenta para diagnosticar e corrigir problemas com dados zerados
          </p>
        </div>

        {/* Ações */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Ações</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Execute o diagnóstico para identificar problemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button 
                onClick={diagnosticar}
                disabled={loading || recalculando}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                {loading ? (
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Diagnosticando...' : 'Executar Diagnóstico'}
              </Button>

              {resultado && resultado.problemas && resultado.problemas.length > 0 && (
                <Button 
                  onClick={recalcular}
                  disabled={loading || recalculando}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                >
                  {recalculando ? (
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-4 h-4 mr-2" />
                  )}
                  {recalculando ? 'Recalculando...' : 'Recalcular Semana 52'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Erro */}
        {erro && (
          <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              {erro}
            </AlertDescription>
          </Alert>
        )}

        {/* Resultados */}
        {resultado && (
          <div className="space-y-6">
            {/* Dados da Semana 52 */}
            {resultado.semana && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    📊 Dados Salvos - Semana 52
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {resultado.semana.data_inicio} até {resultado.semana.data_fim}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Faturamento Total</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        R$ {(resultado.semana.faturamento_total || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes Atendidos</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {resultado.semana.clientes_atendidos || 0}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">% Clientes Novos</p>
                      <p className={`text-xl font-semibold ${
                        resultado.semana.perc_clientes_novos === 0 || resultado.semana.perc_clientes_novos === null
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {resultado.semana.perc_clientes_novos !== null 
                          ? `${resultado.semana.perc_clientes_novos.toFixed(2)}%`
                          : 'NULL'
                        }
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes Ativos</p>
                      <p className={`text-xl font-semibold ${
                        resultado.semana.clientes_ativos === 0 || resultado.semana.clientes_ativos === null
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {resultado.semana.clientes_ativos !== null 
                          ? resultado.semana.clientes_ativos
                          : 'NULL'
                        }
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ticket Médio</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        R$ {(resultado.semana.ticket_medio || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Última Atualização</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {resultado.semana.atualizado_em 
                          ? new Date(resultado.semana.atualizado_em).toLocaleString('pt-BR')
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>

                  {resultado.semana.observacoes && (
                    <div className="mt-4 p-3 rounded bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        <strong>Observações:</strong> {resultado.semana.observacoes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dados do ContaHub */}
            {resultado.dadosContahub && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    📁 Dados Brutos - ContaHub
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Registros encontrados na base de dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resultado.dadosContahub.totalRegistros > 0 ? (
                    <div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Total de registros: <span className="font-semibold text-gray-900 dark:text-white">
                            {resultado.dadosContahub.totalRegistros}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Clientes únicos: <span className="font-semibold text-gray-900 dark:text-white">
                            {resultado.dadosContahub.clientesUnicos}
                          </span>
                        </p>
                      </div>

                      {resultado.dadosContahub.porDia && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Distribuição por dia:
                          </p>
                          {Object.entries(resultado.dadosContahub.porDia).map(([dia, dados]: [string, any]) => (
                            <div key={dia} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-700">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{dia}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {dados.clientes} clientes, {dados.pessoas} pessoas
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-600 dark:text-red-400">
                        <strong>PROBLEMA CRÍTICO:</strong> Nenhum dado do ContaHub encontrado para a semana 52!
                        <br />
                        Isso explica os valores zerados. Execute o sync do ContaHub para essa semana.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Métricas Calculadas */}
            {resultado.metricasCalculadas && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    🧮 Métricas Calculadas (Tempo Real)
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Valores recalculados com base nos dados atuais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Clientes</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {resultado.metricasCalculadas.totalClientes || 0}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Novos Clientes</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {resultado.metricasCalculadas.novosClientes || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        ({resultado.metricasCalculadas.percNovos?.toFixed(2) || 0}%)
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes Ativos</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {resultado.metricasCalculadas.clientesAtivos || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Problemas Encontrados */}
            {resultado.problemas && resultado.problemas.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Problemas Encontrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {resultado.problemas.map((problema, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{problema}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Soluções Recomendadas */}
            {resultado.solucoes && resultado.solucoes.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Soluções Recomendadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 list-decimal list-inside">
                    {resultado.solucoes.map((solucao, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        {solucao}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Sem Problemas */}
            {resultado.problemas && resultado.problemas.length === 0 && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  <strong>✅ Tudo certo!</strong> Nenhum problema detectado na semana 52.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
