'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Info,
  Zap
} from 'lucide-react'
import { 
  avaliarCondicoes, 
  criarRegraCondicional, 
  criarRegraCondicionalMultipla,
  ExemplosCondicionais,
  useConditionalLogic
} from '@/lib/checklist-conditional-logic'

// =====================================================
// 🔄 DEMONSTRAÇÃO DE ITENS CONDICIONAIS
// =====================================================
// Implementa conforme documento Word:
// "se clicar não, aparece" - lógica condicional baseada em respostas

interface ItemDemo {
  id: string
  titulo: string
  tipo: string
  obrigatorio: boolean
  valor?: any
  visivel: boolean
  obrigatorioCondicional?: boolean
  motivoOculto?: string
}

export default function DemoCondicionaisPage() {
  // Estado dos itens
  const [itens, setItens] = useState<ItemDemo[]>([
    {
      id: 'limpeza_geral',
      titulo: 'A limpeza geral está adequada?',
      tipo: 'sim_nao',
      obrigatorio: true,
      visivel: true
    },
    {
      id: 'obs_limpeza',
      titulo: 'Observações sobre problemas de limpeza',
      tipo: 'texto',
      obrigatorio: false,
      visivel: false,
      motivoOculto: 'Aparece apenas se limpeza = NÃO'
    },
    {
      id: 'temp_freezer',
      titulo: 'Temperatura do freezer (°C)',
      tipo: 'numero',
      obrigatorio: true,
      visivel: true
    },
    {
      id: 'foto_freezer',
      titulo: 'Foto do termômetro (obrigatória se fora do range)',
      tipo: 'texto',
      obrigatorio: false,
      visivel: true,
      motivoOculto: 'Fica obrigatória se temperatura < -20 ou > -15'
    },
    {
      id: 'avaliacao_geral',
      titulo: 'Avaliação geral do ambiente (1-5)',
      tipo: 'avaliacao',
      obrigatorio: false,
      visivel: true
    },
    {
      id: 'justificativa_baixa',
      titulo: 'Justificativa para avaliação baixa',
      tipo: 'texto',
      obrigatorio: false,
      visivel: false,
      motivoOculto: 'Obrigatória se avaliação ≤ 2'
    },
    {
      id: 'equipamento_funcionando',
      titulo: 'Todos os equipamentos estão funcionando?',
      tipo: 'sim_nao',
      obrigatorio: true,
      visivel: true
    },
    {
      id: 'equipamento_problema',
      titulo: 'Qual equipamento tem problema?',
      tipo: 'texto',
      obrigatorio: false,
      visivel: false,
      motivoOculto: 'Aparece se equipamentos = NÃO'
    },
    {
      id: 'custo_reparo',
      titulo: 'Estimativa de custo do reparo (R$)',
      tipo: 'numero',
      obrigatorio: false,
      visivel: false,
      motivoOculto: 'Aparece se equipamentos = NÃO'
    }
  ])

  // Regras condicionais
  const regrasCondicionais = [
    // Se limpeza = NÃO, mostrar observações
    ExemplosCondicionais.seNaoApareceObservacao('limpeza_geral', 'obs_limpeza'),
    
    // Se temperatura fora do range (-20 a -15), obrigar foto
    ExemplosCondicionais.seTemperaturaForaObrigarFoto('temp_freezer', 'foto_freezer', -20, -15),
    
    // Se avaliação baixa (≤2), obrigar justificativa
    ExemplosCondicionais.seAvaliacaoBaixaObrigarJustificativa('avaliacao_geral', 'justificativa_baixa'),
    
    // Se equipamento não funcionando, mostrar campos de manutenção
    ...ExemplosCondicionais.seEquipamentoNaoFuncionandoMostrarManutencao(
      'equipamento_funcionando', 
      ['equipamento_problema', 'custo_reparo']
    )
  ]

  // Hook personalizado para lógica condicional
  const {
    processarItens,
    atualizarItemValor,
    obterItensVisiveis,
    obterItensObrigatorios,
    validarItensObrigatorios
  } = useConditionalLogic(itens, regrasCondicionais)

  // Atualizar itens quando valores mudarem
  useEffect(() => {
    const itensProcessados = processarItens(itens)
    setItens(itensProcessados)
  }, [])

  const handleItemChange = (itemId: string, novoValor: any) => {
    const itensAtualizados = atualizarItemValor(itens, itemId, novoValor)
    setItens(itensAtualizados)
  }

  const resetarTudo = () => {
    const itensLimpos = itens.map(item => ({
      ...item,
      valor: undefined,
      visivel: ['limpeza_geral', 'temp_freezer', 'avaliacao_geral', 'equipamento_funcionando', 'foto_freezer'].includes(item.id),
      obrigatorioCondicional: false,
      motivoOculto: item.id !== 'limpeza_geral' && item.id !== 'temp_freezer' && item.id !== 'avaliacao_geral' && item.id !== 'equipamento_funcionando' && item.id !== 'foto_freezer' 
        ? 'Depende de outras respostas' : undefined
    }))
    setItens(itensLimpos)
  }

  const itensVisiveis = obterItensVisiveis(itens)
  const itensObrigatorios = obterItensObrigatorios(itens)
  const validacao = validarItensObrigatorios(itens)

  // Estatísticas
  const stats = {
    totalItens: itens.length,
    itensVisiveis: itensVisiveis.length,
    itensOcultos: itens.filter(item => !item.visivel).length,
    itensObrigatorios: itensObrigatorios.length,
    itensPreenchidos: itens.filter(item => item.valor !== undefined && item.valor !== '').length
  }

  const renderCampo = (item: ItemDemo) => {
    if (!item.visivel) return null

    const isObrigatorio = item.obrigatorio || item.obrigatorioCondicional

    return (
      <Card key={item.id} className="transition-all duration-300 animate-in slide-in-from-left">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header do campo */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">
                  {item.titulo}
                  {isObrigatorio && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="flex gap-2 mt-1">
                  {item.obrigatorio && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                      Obrigatório
                    </Badge>
                  )}
                  {item.obrigatorioCondicional && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                      Obrigatório por condição
                    </Badge>
                  )}
                  {item.tipo && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      {item.tipo}
                    </Badge>
                  )}
                </div>
              </div>
              
                             <div className="flex items-center gap-2">
                 <Eye className="w-4 h-4 text-green-500" />
                 {item.valor !== undefined && item.valor !== '' && (
                   <CheckCircle className="w-4 h-4 text-green-500" />
                 )}
               </div>
            </div>

            {/* Campo de input */}
            <div>
              {item.tipo === 'sim_nao' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={item.valor === true ? 'default' : 'outline'}
                    onClick={() => handleItemChange(item.id, true)}
                  >
                    ✅ Sim
                  </Button>
                  <Button
                    size="sm"
                    variant={item.valor === false ? 'default' : 'outline'}
                    onClick={() => handleItemChange(item.id, false)}
                  >
                    ❌ Não
                  </Button>
                </div>
              )}

              {item.tipo === 'texto' && (
                <Input
                  value={item.valor || ''}
                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                  placeholder="Digite aqui..."
                  className="w-full"
                />
              )}

              {item.tipo === 'numero' && (
                <Input
                  type="number"
                  value={item.valor || ''}
                  onChange={(e) => handleItemChange(item.id, parseFloat(e.target.value) || '')}
                  placeholder="0"
                  className="w-32"
                />
              )}

              {item.tipo === 'avaliacao' && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(nota => (
                    <Button
                      key={nota}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleItemChange(item.id, nota)}
                      className="p-1 h-8 w-8"
                    >
                      <span className={item.valor >= nota ? 'text-yellow-500' : 'text-gray-300'}>
                        ⭐
                      </span>
                    </Button>
                  ))}
                  {item.valor && <span className="text-sm text-gray-600 ml-2">{item.valor}/5</span>}
                </div>
              )}
            </div>

            {/* Valor atual */}
            {item.valor !== undefined && item.valor !== '' && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Valor atual:</strong> {String(item.valor)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔄 Itens Condicionais
        </h1>
        <p className="text-gray-600 mb-4">
          Demonstração da lógica condicional conforme especificação:
          <br />
          <em>"se clicar não, aparece"</em> - Campos que aparecem/desaparecem baseado em respostas
        </p>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalItens}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.itensVisiveis}</div>
              <div className="text-sm text-gray-600">Visíveis</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{stats.itensOcultos}</div>
              <div className="text-sm text-gray-600">Ocultos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.itensObrigatorios}</div>
              <div className="text-sm text-gray-600">Obrigatórios</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.itensPreenchidos}</div>
              <div className="text-sm text-gray-600">Preenchidos</div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          <Button onClick={resetarTudo} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Resetar Tudo
          </Button>
        </div>
      </div>

      {/* Status de Validação */}
      {!validacao.valido && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <div className="font-medium text-red-800">
              Campos obrigatórios não preenchidos:
            </div>
            <ul className="mt-1 text-red-700">
              {validacao.itensVazios.map((item, index) => (
                <li key={index} className="text-sm">• {item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Formulário Dinâmico */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📝 Formulário com Lógica Condicional
        </h2>
        
        {itensVisiveis.map(item => renderCampo(item))}
      </div>

      {/* Itens Ocultos */}
      {stats.itensOcultos > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gray-500" />
              Itens Ocultos ({stats.itensOcultos})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itens.filter(item => !item.visivel).map(item => (
                <div key={item.id} className="p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-700">{item.titulo}</span>
                      <div className="text-sm text-gray-600 mt-1">
                        <Info className="w-3 h-3 inline mr-1" />
                        {item.motivoOculto}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Oculto
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explicação das Regras */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Regras Condicionais Implementadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Regras Básicas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🔄 Regras de Visibilidade:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Limpeza = NÃO</strong> → Mostra campo de observações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Equipamentos = NÃO</strong> → Mostra campos de problema e custo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Temperatura fora do range</strong> → Foto fica obrigatória</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Avaliação ≤ 2</strong> → Justificativa fica obrigatória</span>
                  </li>
                </ul>
              </div>

              {/* Tipos de Ação */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">⚡ Tipos de Ação:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span><strong>Mostrar</strong> - Campo aparece quando condição é verdadeira</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span><strong>Ocultar</strong> - Campo some quando condição é verdadeira</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span><strong>Obrigar</strong> - Campo fica obrigatório condicionalmente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Opcional</strong> - Campo fica opcional condicionalmente</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Operadores */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">🔍 Operadores Suportados:</h4>
              <div className="flex flex-wrap gap-2">
                {['igual', 'diferente', 'maior_que', 'menor_que', 'contem', 'nao_contem'].map(op => (
                  <Badge key={op} variant="outline" className="bg-blue-50 text-blue-700">
                    {op}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>🔧 Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Estado dos Itens:</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(itens, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Validação:</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded">
                  {JSON.stringify(validacao, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 