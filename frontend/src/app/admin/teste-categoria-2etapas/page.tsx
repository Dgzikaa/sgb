'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Search, Database, Key, RefreshCw } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useBar } from '@/contexts/BarContext'

export default function TesteCategoriaEtapas() {
  const { selectedBar } = useBar()
  const [loading, setLoading] = useState(false)
  const [loadingToken, setLoadingToken] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [accessToken, setAccessToken] = useState('')
  const [dataInicio, setDataInicio] = useState('2024-01-01')
  const [dataFim, setDataFim] = useState('2024-12-31')
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'expired'>('idle')
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null)

  // Buscar token automaticamente quando o bar for selecionado
  useEffect(() => {
    if (selectedBar) {
      buscarTokenContaAzul()
    }
  }, [selectedBar])

  const buscarTokenContaAzul = async () => {
    if (!selectedBar) return

    setLoadingToken(true)
    setTokenStatus('loading')

    try {
      const supabase = await getSupabaseClient()
      if (!supabase) {
        console.error('❌ Erro ao conectar com banco')
        setTokenStatus('not_found')
        return
      }

      const { data, error } = await supabase
        .from('contaazul_config')
        .select('access_token, expires_at')
        .eq('bar_id', selectedBar.id)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar token:', error)
        setTokenStatus('not_found')
        return
      }

      if (data?.access_token) {
        setTokenExpiresAt(data.expires_at)
        
        // Verificar se o token ainda é válido
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at)
          const now = new Date()
          const isValid = expiresAt > now
          
          if (isValid) {
            setAccessToken(data.access_token)
            setTokenStatus('found')
            console.log('✅ Token ContaAzul encontrado e válido até:', expiresAt.toLocaleString('pt-BR'))
          } else {
            setTokenStatus('expired')
            console.log('⚠️ Token ContaAzul expirado em:', expiresAt.toLocaleString('pt-BR'))
          }
        } else {
          // Token sem data de expiração - assumir válido
          setAccessToken(data.access_token)
          setTokenStatus('found')
          console.log('✅ Token ContaAzul encontrado (sem data de expiração)')
        }
      } else {
        setTokenStatus('not_found')
        console.log('❌ Token ContaAzul não encontrado')
      }
    } catch (error) {
      console.error('❌ Erro ao buscar token:', error)
      setTokenStatus('not_found')
    } finally {
      setLoadingToken(false)
    }
  }

  const executarTeste = async () => {
    if (!accessToken) {
      alert('Por favor, conecte o ContaAzul primeiro ou insira um token válido')
      return
    }

    setLoading(true)
    setResultado(null)

    try {
      const response = await fetch('/api/contaazul/teste-buscar-com-categoria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          data_inicio: dataInicio,
          data_fim: dataFim
        })
      })

      const data = await response.json()
      
      // Verificar se o erro é de token inválido
      if (data.error && data.details && data.details.includes('invalid_token')) {
        setTokenStatus('expired')
        setResultado({
          error: 'Token ContaAzul expirado ou inválido',
          details: 'O token de acesso precisa ser renovado. Clique em "Reconectar ContaAzul" para obter um novo token.',
          token_expired: true
        })
      } else {
        setResultado(data)
      }
    } catch (error) {
      console.error('Erro:', error)
      setResultado({
        error: 'Erro ao executar teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  const abrirConfiguracaoContaAzul = () => {
    // Abrir em nova aba a página de configuração correta
    window.open('/configuracoes/integracoes/contaazul', '_blank')
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎯 Teste: Buscar Categorias (2 Etapas)</h1>
        <p className="text-gray-600">
          Testa a estratégia correta: buscar lista básica + detalhes com categoria
        </p>
      </div>

      {/* Status do Token */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Token de Acesso ContaAzul
          </CardTitle>
          <CardDescription>
            {selectedBar ? `Token para o bar: ${selectedBar.nome}` : 'Selecione um bar primeiro'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              tokenStatus === 'found' ? 'bg-green-500' :
              tokenStatus === 'loading' ? 'bg-yellow-500 animate-pulse' :
              tokenStatus === 'expired' ? 'bg-orange-500' :
              tokenStatus === 'not_found' ? 'bg-red-500' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm">
              {tokenStatus === 'found' ? '✅ Token encontrado e válido' :
               tokenStatus === 'loading' ? '🔄 Buscando token...' :
               tokenStatus === 'expired' ? '⚠️ Token expirado' :
               tokenStatus === 'not_found' ? '❌ Token não encontrado' : 'Aguardando...'}
            </span>
            {tokenExpiresAt && tokenStatus === 'found' && (
              <span className="text-xs text-gray-500">
                (expira em {new Date(tokenExpiresAt).toLocaleString('pt-BR')})
              </span>
            )}
            {(tokenStatus === 'not_found' || tokenStatus === 'expired') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={abrirConfiguracaoContaAzul}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {tokenStatus === 'expired' ? 'Reconectar ContaAzul' : 'Conectar ContaAzul'}
              </Button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Token de Acesso
              {loadingToken && (
                <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
              )}
            </label>
            <Input
              type="password"
              placeholder={
                tokenStatus === 'found' ? 'Token carregado automaticamente' :
                tokenStatus === 'expired' ? 'Token expirado - reconecte o ContaAzul' :
                'Cole o Bearer token do ContaAzul aqui'
              }
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="font-mono"
              disabled={loadingToken}
            />
            {tokenStatus === 'found' && (
              <p className="text-xs text-green-600 mt-1">
                Token carregado automaticamente do banco de dados
              </p>
            )}
            {tokenStatus === 'expired' && (
              <p className="text-xs text-orange-600 mt-1">
                Token expirado. Reconecte o ContaAzul para obter um novo token.
              </p>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={buscarTokenContaAzul}
            disabled={loadingToken || !selectedBar}
            className="w-full"
          >
            {loadingToken ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando Token...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recarregar Token
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Configuração */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Configuração do Teste
          </CardTitle>
          <CardDescription>
            Configure os parâmetros para testar a busca em 2 etapas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Fim</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={executarTeste}
            disabled={loading || !accessToken || tokenStatus === 'expired'}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando Teste...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Executar Teste de 2 Etapas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Estratégia */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📋 Estratégia de 2 Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div>
                <h4 className="font-medium">Buscar Lista Básica</h4>
                <p className="text-sm text-gray-600">
                  <code>GET /v1/financeiro/eventos-financeiros/contas-a-receber/buscar</code>
                </p>
                <p className="text-sm text-gray-500">
                  Retorna ContasAReceberResponse com campos básicos (id, valor, etc.)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <h4 className="font-medium">Buscar Detalhes com Categoria</h4>
                <p className="text-sm text-gray-600">
                  <code>GET /v1/financeiro/eventos-financeiros/parcelas/&#123;id&#125;</code>
                </p>
                <p className="text-sm text-gray-500">
                  Retorna Parcela completa com evento.rateio contendo categoria_id
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {resultado.error ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resultado.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Erro</h4>
                <p className="text-red-700">{resultado.error}</p>
                {resultado.details && (
                  <p className="text-sm text-red-600 mt-2">{resultado.details}</p>
                )}
                {resultado.token_expired && (
                  <div className="mt-4">
                    <Button 
                      onClick={abrirConfiguracaoContaAzul}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reconectar ContaAzul
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {resultado.etapa1?.total_parcelas || 0}
                    </div>
                    <div className="text-sm text-blue-600">Parcelas Totais</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {resultado.etapa2?.com_categoria || 0}
                    </div>
                    <div className="text-sm text-green-600">Com Categoria</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {resultado.etapa2?.sem_categoria || 0}
                    </div>
                    <div className="text-sm text-yellow-600">Sem Categoria</div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {resultado.erros?.length || 0}
                    </div>
                    <div className="text-sm text-red-600">Erros</div>
                  </div>
                </div>

                {/* Dados Detalhados */}
                {resultado.dados && resultado.dados.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Parcelas Processadas</h4>
                    <div className="space-y-3">
                      {resultado.dados.map((parcela: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium">{parcela.descricao}</h5>
                              <p className="text-sm text-gray-600">
                                ID: {parcela.parcela_id}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                R$ {parcela.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <Badge variant={parcela.tem_rateio ? 'default' : 'secondary'}>
                                {parcela.tem_rateio ? 'Com Rateio' : 'Sem Rateio'}
                              </Badge>
                            </div>
                          </div>
                          
                          {parcela.categorias && parcela.categorias.length > 0 && (
                            <div className="mt-3 bg-gray-50 p-3 rounded">
                              <h6 className="font-medium text-sm mb-2">Categorias:</h6>
                              {parcela.categorias.map((cat: any, catIndex: number) => (
                                <div key={catIndex} className="text-sm">
                                  <span className="font-mono">{cat.categoria_id}</span>
                                  <span className="mx-2">-</span>
                                  <span>R$ {cat.valor_categoria?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  {cat.centros_custo && cat.centros_custo.length > 0 && (
                                    <div className="ml-4 mt-1 text-gray-600">
                                      Centros de Custo: {cat.centros_custo.length}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Erros */}
                {resultado.erros && resultado.erros.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-red-600">Erros Encontrados</h4>
                    <div className="space-y-2">
                      {resultado.erros.map((erro: any, index: number) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-medium text-red-800">
                            Parcela: {erro.parcela_id}
                          </div>
                          <div className="text-sm text-red-700">{erro.erro}</div>
                          {erro.status && (
                            <div className="text-sm text-red-600">Status: {erro.status}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* JSON Completo */}
                <details className="mt-6">
                  <summary className="cursor-pointer font-medium">Ver JSON Completo</summary>
                  <pre className="mt-2 bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 