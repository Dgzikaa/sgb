'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { obterCorCategoria, obterIconeCategoria } from '@/lib/checklist-scoring'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react'

// =====================================================
// 🏆 COMPONENTE DE EXIBIÇÃO DE SCORE
// =====================================================
// Implementa visualização das notas conforme documento:
// - "ter a 'nota' do checklist"
// - Identificar visualmente problemas críticos

interface ScoreDisplayProps {
  scoreResult: {
    score_total: number
    categoria: 'excelente' | 'bom' | 'atencao' | 'critico'
    total_itens: number
    total_respondidos: number
    itens_ok: number
    itens_problema: number
    problemas_identificados: Array<{
      titulo: string
      secao: string
      tipo_problema: string
      descricao: string
      impacto: 'alto' | 'medio' | 'baixo'
      requer_acao: boolean
    }>
    detalhes_por_secao: Array<{
      secao_nome: string
      score_secao: number
      total_itens: number
      itens_respondidos: number
      problemas: number
      categoria: string
    }>
    recomendacoes: string[]
  }
  variant?: 'compact' | 'detailed' | 'card'
  showProblems?: boolean
  showRecommendations?: boolean
}

export default function ScoreDisplay({ 
  scoreResult, 
  variant = 'compact',
  showProblems = true,
  showRecommendations = true
}: ScoreDisplayProps) {
  
  if (!scoreResult) {
    return (
      <div className="text-gray-500 text-sm">
        Score não disponível
      </div>
    )
  }

  const { 
    score_total, 
    categoria, 
    total_itens, 
    total_respondidos, 
    itens_problema,
    problemas_identificados,
    detalhes_por_secao,
    recomendacoes
  } = scoreResult

  // Versão compacta para listas
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${obterCorCategoria(categoria)}`}>
          <span className="mr-1">{obterIconeCategoria(categoria)}</span>
          {score_total}/100
        </div>
        {itens_problema > 0 && (
          <Badge variant="destructive" className="text-xs">
            {itens_problema} problema{itens_problema > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    )
  }

  // Versão em card para páginas de detalhes
  if (variant === 'card') {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header do Score */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Score do Checklist
                </h3>
                <p className="text-sm text-gray-600">
                  {total_respondidos} de {total_itens} itens respondidos
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold ${obterCorCategoria(categoria)}`}>
                  <span className="mr-2 text-xl">{obterIconeCategoria(categoria)}</span>
                  {score_total}/100
                </div>
                <p className="text-sm text-gray-600 mt-1 capitalize">
                  {categoria}
                </p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {total_respondidos - itens_problema}
                </div>
                <div className="text-sm text-green-700">Itens OK</div>
              </div>
              
              {itens_problema > 0 && (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {itens_problema}
                  </div>
                  <div className="text-sm text-red-700">Problemas</div>
                </div>
              )}
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-600">
                  {total_itens - total_respondidos}
                </div>
                <div className="text-sm text-gray-700">Pendentes</div>
              </div>
            </div>

            {/* Problemas Críticos */}
            {showProblems && problemas_identificados.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Problemas Identificados ({problemas_identificados.length})
                </h4>
                <div className="space-y-2">
                  {problemas_identificados.slice(0, 3).map((problema, index) => (
                    <Alert key={index} className={`border-l-4 ${
                      problema.impacto === 'alto' ? 'border-red-500 bg-red-50' :
                      problema.impacto === 'medio' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <AlertDescription className="text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {problema.titulo}
                            </div>
                            <div className="text-gray-600 mt-1">
                              {problema.descricao}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Seção: {problema.secao}
                            </div>
                          </div>
                          <Badge 
                            variant={problema.impacto === 'alto' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {problema.impacto}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  {problemas_identificados.length > 3 && (
                    <div className="text-sm text-gray-500 text-center">
                      + {problemas_identificados.length - 3} outros problemas
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recomendações */}
            {showRecommendations && recomendacoes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Recomendações
                </h4>
                <div className="space-y-1">
                  {recomendacoes.map((recomendacao, index) => (
                    <div 
                      key={index}
                      className="text-sm text-gray-700 bg-blue-50 p-2 rounded border-l-2 border-blue-500"
                    >
                      {recomendacao}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalhes por Seção */}
            {detalhes_por_secao.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Detalhes por Seção
                </h4>
                <div className="space-y-2">
                  {detalhes_por_secao.map((secao, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {secao.secao_nome}
                        </div>
                        <div className="text-sm text-gray-600">
                          {secao.itens_respondidos}/{secao.total_itens} itens
                          {secao.problemas > 0 && ` • ${secao.problemas} problema(s)`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${obterCorCategoria(secao.categoria)}`}>
                          {secao.score_secao}/100
                        </div>
                        {secao.score_secao >= 90 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : secao.score_secao < 60 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Versão detalhada padrão
  return (
    <div className="space-y-4">
      {/* Score Principal */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div>
          <div className="text-sm text-gray-600">Score Geral</div>
          <div className="text-2xl font-bold text-gray-900">
            {score_total}/100
          </div>
          <div className={`text-sm font-medium capitalize ${obterCorCategoria(categoria).split(' ')[0]}`}>
            {obterIconeCategoria(categoria)} {categoria}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {total_respondidos}/{total_itens} itens
          </div>
          {itens_problema > 0 && (
            <Badge variant="destructive" className="mt-1">
              {itens_problema} problema{itens_problema > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Problemas (se existirem) */}
      {showProblems && problemas_identificados.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <div className="font-medium text-red-800">
              {problemas_identificados.length} problema(s) identificado(s)
            </div>
            <div className="mt-2 space-y-1">
              {problemas_identificados.slice(0, 2).map((problema, index) => (
                <div key={index} className="text-sm text-red-700">
                  • {problema.titulo} ({problema.secao})
                </div>
              ))}
              {problemas_identificados.length > 2 && (
                <div className="text-sm text-red-600">
                  + {problemas_identificados.length - 2} outros
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 
