'use client'

import { useState, useEffect } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ContaHubAutomaticoPage() {
  const { setPageTitle } = usePageTitle()
  const [contahubDisponivel, setContahubDisponivel] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar se ContaHub está disponível
    const verificarContaHub = async () => {
      try {
        const response = await fetch('/api/admin/contahub-teste-5-dias')
        const data = await response.json()
        setContahubDisponivel(data.contahub_disponivel !== false)
      } catch (error) {
        setContahubDisponivel(false)
      }
    }
    verificarContaHub()
  }, [])

  useEffect(() => {
    setPageTitle('🤖 ContaHub Automático')
    return () => setPageTitle('')
  }, [setPageTitle])
  const [dataInicio, setDataInicio] = useState('2025-02-05')
  const [dataFim, setDataFim] = useState('2025-07-05')
  const [executando, setExecutando] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [resultado, setResultado] = useState<any>(null)

  const executarColetaAutomatica = async () => {
    setExecutando(true)
    setLogs([])
    setResultado(null)

    try {
      const response = await fetch('/api/admin/contahub-historico-completo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataInicio, dataFim })
      })

      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs || [])
        setResultado(data.resumo)
      } else {
        setLogs([`❌ Erro: ${data.error}`])
      }

    } catch (error) {
      setLogs([`💥 Erro de conexão: ${error}`])
    } finally {
      setExecutando(false)
    }
  }

  const calcularDias = () => {
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    const diffTime = Math.abs(fim.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <p className="text-gray-600">Coleta e processamento automatizado dia por dia</p>
      </div>

      {/* Banner de Status do ContaHub */}
      {contahubDisponivel === null ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">Verificando status do ContaHub...</span>
          </div>
        </div>
      ) : !contahubDisponivel ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-500 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">ContaHub em Modo Manutenção</h3>
              <p className="text-yellow-700 text-sm mb-2">
                Coleta automática temporariamente suspensa devido a questões contratuais com o fornecedor ContaHub.
              </p>
              <p className="text-yellow-600 text-xs">
                Para reativar, é necessário resolver a situação junto ao fornecedor e reconfigurar as credenciais.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-500 text-xl">✅</span>
            <span className="text-green-800 font-medium">ContaHub Operacional</span>
            <span className="text-green-600 text-sm">- Sistema pronto para coleta automática</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Período</CardTitle>
          <CardDescription>
            Defina o período para coleta automática (máx. recomendado: 30 dias por execução)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Data Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Data Fim</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                max="2025-07-05"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              📊 <strong>Período selecionado:</strong> {calcularDias()} dias<br/>
              ⏱️ <strong>Tempo estimado:</strong> {Math.ceil(calcularDias() * 10 / 60)} minutos<br/>
              📈 <strong>Registros esperados:</strong> ~{calcularDias() * 11} coletas, ~{calcularDias() * 200} dados processados
            </p>
          </div>

          <Button 
            onClick={executarColetaAutomatica}
            disabled={executando || !contahubDisponivel}
            className="w-full"
            size="lg"
            title={!contahubDisponivel ? 'ContaHub em modo manutenção' : ''}
          >
            {executando ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Executando... ({logs.length} logs)
              </>
            ) : !contahubDisponivel ? (
              <>🔧 Manutenção - ContaHub Indisponível</>
            ) : (
              <>🚀 Iniciar Coleta Automática</>
            )}
          </Button>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Execução Concluída</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{resultado.dias_processados}</div>
                <div className="text-sm text-blue-600">Dias Processados</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{resultado.sucessos_totais}</div>
                <div className="text-sm text-green-600">Sucessos</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">{resultado.erros_totais}</div>
                <div className="text-sm text-red-600">Erros</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-2xl font-bold text-purple-600">{resultado.taxa_sucesso}</div>
                <div className="text-sm text-purple-600">Taxa Sucesso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Logs de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {new Date().toLocaleTimeString()} - {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Segurança:</strong> Delays de 3 segundos entre dias para não sobrecarregar</p>
          <p>• <strong>Logs:</strong> Checkpoint a cada 10 dias processados</p>
          <p>• <strong>Robustez:</strong> Continua execução mesmo com erros individuais</p>
          <p>• <strong>Recomendação:</strong> Execute em períodos de até 30 dias para maior estabilidade</p>
          <p>• <strong>Monitoramento:</strong> Acompanhe os logs em tempo real</p>
        </CardContent>
      </Card>
    </div>
  )
} 