'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TesteProducao() {
  const [resultados, setResultados] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testarEstrutura = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/estrutura-banco', {
        method: 'POST'
      })
      const data = await response.json()
      setResultados(data)
    } catch (error) {
      setResultados({ error: 'Erro: ' + (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const verificarProdutos = async () => {
    setLoading(true)
    try {
      // Buscar produtos do bar 3
      const response = await fetch('/api/receitas/produtos?bar_id=3')
      const data = await response.json()
      
      // Separar por tipo
      const produtosBar = data.produtos?.filter((p: any) => p.tipo_local === 'bar') || []
      const produtosCozinha = data.produtos?.filter((p: any) => p.tipo_local === 'cozinha') || []
      
      setResultados({
        success: true,
        total_produtos: data.produtos?.length || 0,
        produtos_bar: produtosBar.length,
        produtos_cozinha: produtosCozinha.length,
        exemplos_bar: produtosBar.slice(0, 3).map((p: any) => ({ codigo: p.codigo, nome: p.nome })),
        exemplos_cozinha: produtosCozinha.slice(0, 3).map((p: any) => ({ codigo: p.codigo, nome: p.nome })),
        estrutura_receita: data.produtos?.[0]?.receitas?.[0] || null
      })
    } catch (error) {
      setResultados({ error: 'Erro: ' + (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const criarAPIEstrutura = async () => {
    setLoading(true)
    try {
      // Criar a API manualmente via SQL
      const response = await fetch('/api/admin/importar-google-sheets', {
        method: 'GET'
      })
      
      setResultados({
        message: 'Tentando criar API de estrutura...',
        response_status: response.status
      })
    } catch (error) {
      setResultados({ error: 'Erro: ' + (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">🧪 Teste das Mudanças de Produção</h1>
        <p className="text-gray-700">Verificar se todas as alterações foram aplicadas corretamente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button 
          onClick={testarEstrutura}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          🔧 Testar Estrutura do Banco
        </Button>
        
        <Button 
          onClick={verificarProdutos}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          📦 Verificar Produtos Bar/Cozinha
        </Button>

        <Button 
          onClick={criarAPIEstrutura}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          🛠️ Criar API Estrutura
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-blue-600 font-medium">⏳ Testando...</p>
          </CardContent>
        </Card>
      )}

      {resultados && (
        <Card>
          <CardHeader>
            <CardTitle className="text-black font-semibold">
              {resultados.success ? '✅ Resultados' : '❌ Erro'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(resultados, null, 2)}
            </pre>

            {resultados.success && resultados.total_produtos && (
              <div className="mt-4 space-y-2">
                <h3 className="font-bold text-black">📊 Resumo:</h3>
                <p className="text-black">🍺 <strong>Bar:</strong> {resultados.produtos_bar} produtos</p>
                <p className="text-black">👨‍🍳 <strong>Cozinha:</strong> {resultados.produtos_cozinha} produtos</p>
                
                {resultados.exemplos_bar?.length > 0 && (
                  <div>
                    <p className="text-blue-600 font-semibold">Exemplos Bar:</p>
                    {resultados.exemplos_bar.map((p: any, i: number) => (
                      <p key={i} className="text-sm text-gray-700">• {p.codigo} - {p.nome}</p>
                    ))}
                  </div>
                )}

                {resultados.exemplos_cozinha?.length > 0 && (
                  <div>
                    <p className="text-green-600 font-semibold">Exemplos Cozinha:</p>
                    {resultados.exemplos_cozinha.map((p: any, i: number) => (
                      <p key={i} className="text-sm text-gray-700">• {p.codigo} - {p.nome}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-black font-semibold">📋 Checklist das Mudanças</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span className="text-black">Adicionada coluna <code>tipo_local</code> em produtos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span className="text-black">Produtos pd* = bar, pc* = cozinha</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span className="text-black">Adicionada coluna <code>insumo_chefe_id</code> em receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span className="text-black">Adicionada coluna <code>quantidade_base</code> em receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⏳</span>
            <span className="text-black">Sistema multi-receitas implementado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⏳</span>
            <span className="text-black">Cálculo baseado em insumo chefe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⏳</span>
            <span className="text-black">Campos fator_correcao e desvio (serão criados ao testar)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-black font-semibold">🚀 Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-black">1. <strong>Testar terminal de produção</strong> - Vai criar tabela automaticamente</p>
          <p className="text-black">2. <strong>Definir insumos chefe</strong> - Configurar nas receitas</p>
          <p className="text-black">3. <strong>Criar telas de cadastro</strong> - Insumos e receitas</p>
          <p className="text-black">4. <strong>Importar da base ingredientes</strong> - Migrar dados existentes</p>
        </CardContent>
      </Card>
    </div>
  )
} 