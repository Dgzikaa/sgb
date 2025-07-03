'use client'

import { useState } from 'react'
import { Trash2, Upload, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TesteImportacaoPage() {
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [verificandoTabelas, setVerificandoTabelas] = useState(false)
  const [estruturaTabelas, setEstruturaTabelas] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importandoProdutosReceitas, setImportandoProdutosReceitas] = useState(false)
  const [resultadoProdutosReceitas, setResultadoProdutosReceitas] = useState<string>('')
  const [identificandoInsumosChefe, setIdentificandoInsumosChefe] = useState(false)
  const [resultadoInsumosChefe, setResultadoInsumosChefe] = useState<string>('')
  const [importandoRendimento, setImportandoRendimento] = useState(false)
  const [resultadoRendimento, setResultadoRendimento] = useState<string>('')

  const testarImportacao = async () => {
    setImportando(true)
    setResultado(null)

    try {
      const response = await fetch('/api/admin/importar-google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          google_sheets_url: 'https://docs.google.com/spreadsheets/d/1nbGQv7Vxl8OG7ZH2Wg-lsUqNG3dVEuuAKM1mbjZWXWU/edit?gid=468785442#gid=468785442',
          bar_id: 3
        })
      })

      const data = await response.json()
      setResultado(data)
      
      if (data.success) {
        console.log('✅ Importação realizada com sucesso:', data)
      } else {
        console.error('❌ Erro na importação:', data.error)
      }

    } catch (error) {
      console.error('❌ Erro ao testar importação:', error)
      setResultado({
        success: false,
        error: 'Erro de conexão: ' + (error as Error).message
      })
    } finally {
      setImportando(false)
    }
  }

  const verificarEstrutura = async () => {
    setVerificandoTabelas(true)
    setEstruturaTabelas(null)

    try {
      const response = await fetch('/api/admin/verificar-estrutura-tabelas')
      const resultado = await response.json()
      
      if (resultado.success) {
        setEstruturaTabelas(resultado)
      } else {
        setEstruturaTabelas({
          success: false,
          error: resultado.error
        })
      }
    } catch (error) {
      setEstruturaTabelas({
        success: false,
        error: 'Erro de conexão: ' + (error as Error).message
      })
    } finally {
      setVerificandoTabelas(false)
    }
  }

  const limparDados = async () => {
    try {
      const response = await fetch('/api/admin/limpar-dados-exemplo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: 3 })
      })
      
      if (response.ok) {
        alert('✅ Dados de exemplo removidos com sucesso!')
        setResultado(null)
      } else {
        alert('❌ Erro ao limpar dados')
      }
    } catch (error) {
      alert('❌ Erro de conexão')
    }
  }

  const importarInsumos = async () => {
    setIsLoading(true)
    setResultado('⏳ Iniciando importação de insumos via API...')

    try {
      const response = await fetch('/api/admin/importar-insumos-planilha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success) {
        setResultado(`✅ ${data.message}
        
📊 Detalhes:
• Total importados: ${data.data.total_importados}
• Insumos do Bar: ${data.data.insumos_bar}
• Insumos da Cozinha: ${data.data.insumos_cozinha}

🎯 Agora você pode testar:
• Terminal de Produção
• Página de Receitas & Insumos`)
      } else {
        setResultado(`❌ Erro na importação: ${data.error}`)
      }

    } catch (error) {
      setResultado(`❌ Erro de conexão: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const importarProdutosReceitas = async () => {
    console.log('🟡 Função importarProdutosReceitas foi chamada!')
    
    setImportandoProdutosReceitas(true)
    setResultadoProdutosReceitas('⏳ Iniciando importação de produtos e receitas...')

    try {
      console.log('🟡 Fazendo requisição para a API...')
      
      const response = await fetch('/api/admin/importar-produtos-receitas-planilha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('🟡 Resposta da API recebida:', response.status)

      const data = await response.json()
      console.log('🟡 Dados da resposta:', data)

      if (data.success) {
        setResultadoProdutosReceitas(`✅ ${data.message}
        
📊 Resumo da Importação:
• Receitas únicas importadas: ${data.data.produtos_importados}
• Receitas de bebidas: ${data.data.produtos_bebida || 0}
• Receitas de comidas: ${data.data.produtos_comida || 0}
• Total de registros criados: ${data.data.receitas_importadas || 0}

🔍 Análise Detalhada:
• Linhas processadas da planilha: ${data.data.receitas_processadas || 0}/${data.data.total_linhas_planilha || 0}
• Receitas válidas encontradas: ${data.data.receitas_validas || 0}
• Produtos com rendimento: ${data.data.produtos_com_rendimento || 0}
• Insumos disponíveis no banco: ${data.data.insumos_disponiveis || 0}

⚠️ Problemas Encontrados:
• Produtos sem rendimento: ${data.data.produtos_sem_rendimento || 0}
• Insumos não encontrados: ${data.data.insumos_nao_encontrados || 0}
${data.data.insumos_rejeitados_sample ? '• Insumos rejeitados: ' + data.data.insumos_rejeitados_sample : ''}
${data.data.produtos_rejeitados_sample ? '• Produtos rejeitados: ' + data.data.produtos_rejeitados_sample : ''}

🎯 Para importar mais receitas, verifique se todos os insumos estão cadastrados!`)
      } else {
        setResultadoProdutosReceitas(`❌ Erro na importação: ${data.error}`)
      }

    } catch (error) {
      console.error('🔴 Erro na função:', error)
      setResultadoProdutosReceitas(`❌ Erro de conexão: ${error}`)
    } finally {
      console.log('🟡 Finalizando função...')
      setImportandoProdutosReceitas(false)
    }
  }

  const identificarInsumosChefe = async () => {
    console.log('🧠 Função identificarInsumosChefe foi chamada!')
    
    setIdentificandoInsumosChefe(true)
    setResultadoInsumosChefe('⏳ Iniciando identificação inteligente de insumos chefe...')

    try {
      console.log('🧠 Fazendo requisição para a API de insumos chefe...')
      
      const response = await fetch('/api/admin/identificar-insumo-chefe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('🧠 Resposta da API recebida:', response.status)

      const data = await response.json()
      console.log('🧠 Dados da resposta:', data)

      if (data.success) {
        setResultadoInsumosChefe(`✅ ${data.message}
        
📊 Algoritmo Inteligente - Resultados:
• Total de produtos analisados: ${data.data.total_produtos}
• Produtos com insumo chefe: ${data.data.produtos_com_chefe}
• Insumos chefe identificados: ${data.data.insumos_chefe_atualizados}

🧠 Critérios de Identificação:
${data.data.criterios_usados?.join('\n') || 'Algoritmo baseado em palavras-chave e quantidades'}

🎯 Processo completo! Agora os insumos chefe aparecerão corretamente no Terminal de Produção.`)
      } else {
        setResultadoInsumosChefe(`❌ Erro na identificação: ${data.error}`)
      }

    } catch (error) {
      console.error('🔴 Erro na função identificarInsumosChefe:', error)
      setResultadoInsumosChefe(`❌ Erro de conexão: ${error}`)
    } finally {
      console.log('🧠 Finalizando função identificarInsumosChefe...')
      setIdentificandoInsumosChefe(false)
    }
  }

  const importarRendimentoEsperado = async () => {
    console.log('🍯 Função importarRendimentoEsperado foi chamada!')
    
    setImportandoRendimento(true)
    setResultadoRendimento('⏳ Iniciando importação de rendimentos esperados da planilha...')

    try {
      console.log('🍯 Fazendo requisição para a API de rendimento esperado...')
      
      const response = await fetch('/api/admin/importar-rendimento-esperado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bar_id: 3 })
      })

      console.log('🍯 Resposta da API recebida:', response.status)

      const data = await response.json()
      console.log('🍯 Dados da resposta:', data)

      if (data.success) {
        setResultadoRendimento(`✅ ${data.message}
        
📊 Importação de Rendimentos - Resultados:
• Linhas processadas: ${data.data.linhas_processadas}
• Receitas com rendimento: ${data.data.receitas_com_rendimento}
• Receitas atualizadas: ${data.data.receitas_atualizadas}
• Erros: ${data.data.erros_count}

💡 Lógica aplicada: ${data.data.logica}
📁 Estrutura: ${data.data.estrutura_aplicada}

🎯 Apenas os insumos chefe receberam o rendimento esperado da planilha Google Sheets!`)
      } else {
        setResultadoRendimento(`❌ Erro na importação: ${data.error}`)
      }

    } catch (error) {
      console.error('🔴 Erro na função importarRendimentoEsperado:', error)
      setResultadoRendimento(`❌ Erro de conexão: ${error}`)
    } finally {
      console.log('🍯 Finalizando função importarRendimentoEsperado...')
      setImportandoRendimento(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="text-blue-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-black">Teste de Importação - SGB V2</h1>
              <p className="text-gray-600">Sistema de importação funcionando corretamente!</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Estrutura Esperada:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Primeira Aba (468785442):</strong> A=CódProduto, B=Produto, C=CódInsumo, D=Insumo, E=Quantidade</p>
              <p><strong>Segunda Aba (690549737):</strong> A=CódProduto, B=Produto, C=Rendimento</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="text-green-600" size={20} />
                Verificar Estrutura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={verificarEstrutura}
                disabled={verificandoTabelas}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {verificandoTabelas ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Verificando...
                  </>
                ) : (
                  'Verificar Tabelas'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Upload className="text-blue-600" size={20} />
                Importar Insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={importarInsumos}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Importando...
                  </>
                ) : (
                  'Importar Insumos'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Upload className="text-green-600" size={20} />
                Produtos & Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={importarProdutosReceitas}
                disabled={importandoProdutosReceitas}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {importandoProdutosReceitas ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Importando...
                  </>
                ) : (
                  'Importar P&R'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="text-purple-600" size={20} />
                Insumos Chefe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={identificarInsumosChefe}
                disabled={identificandoInsumosChefe}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {identificandoInsumosChefe ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Identificando...
                  </>
                ) : (
                  <>
                    <span className="mr-2 text-lg">🧠</span>
                    Identificar IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Upload className="text-orange-600" size={20} />
                Rendimento Esperado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={importarRendimentoEsperado}
                disabled={importandoRendimento}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {importandoRendimento ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Importando...
                  </>
                ) : (
                  <>
                    <span className="mr-2 text-lg">🍯</span>
                    Importar REND
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Upload className="text-purple-600" size={20} />
                Teste Google Sheets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testarImportacao}
                disabled={importando}
                className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {importando ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Importando...
                  </>
                ) : (
                  'Testar Importação'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Trash2 className="text-red-600" size={20} />
                Limpar Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={limparDados}
                variant="destructive"
                className="w-full font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                Limpar Dados de Exemplo
              </Button>
            </CardContent>
          </Card>
        </div>

        {estruturaTabelas && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-gray-900">📊 Estrutura das Tabelas</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto text-gray-900">
                {JSON.stringify(estruturaTabelas, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {resultado && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                {typeof resultado === 'string' ? (
                  <AlertTriangle className="text-yellow-600" size={20} />
                ) : resultado.success ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <AlertTriangle className="text-red-600" size={20} />
                )}
                Resultado da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap text-gray-900">
                {typeof resultado === 'string' ? resultado : JSON.stringify(resultado, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {resultadoProdutosReceitas && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="text-green-600" size={20} />
                Resultado Produtos & Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap text-gray-900">
                {resultadoProdutosReceitas}
              </pre>
            </CardContent>
          </Card>
        )}

        {resultadoInsumosChefe && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="text-purple-600" size={20} />
                Resultado Identificação de Insumos Chefe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap text-gray-900">
                {resultadoInsumosChefe}
              </pre>
            </CardContent>
          </Card>
        )}

        {resultadoRendimento && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="text-orange-600" size={20} />
                Resultado Rendimento Esperado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap text-gray-900">
                {resultadoRendimento}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 