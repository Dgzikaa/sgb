'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ChecklistSecaoCard from '@/components/checklist/ChecklistSecaoCard'

// =====================================================
// 🎨 DEMONSTRAÇÃO DA CLUSTERIZAÇÃO VISUAL
// =====================================================
// Implementa conforme documento Word:
// "A lógica se separar por áreas da segunda ref é muito boa"
// "Clusterizar as perguntas por área/seção"

export default function DemoClusterizacaoPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [itemValues, setItemValues] = useState<Record<string, any>>({})

  // Dados mock de um checklist completo com clusterização
  const checklistData = {
    nome: 'Checklist Abertura Completa',
    descricao: 'Checklist matinal com separação clara por áreas',
    secoes: [
      {
        id: 'cozinha',
        nome: 'Cozinha',
        descricao: 'Verificações de equipamentos, temperatura e limpeza',
        cor: 'bg-orange-500',
        icone: '🍳',
        estimativa_tempo: 15,
        prioridade: 'critica' as const,
        responsavel: 'Chef João',
        ordem: 1,
        status: 'completado' as const,
        iniciadoEm: new Date(Date.now() - 30 * 60000).toISOString(),
        finalizadoEm: new Date(Date.now() - 10 * 60000).toISOString(),
        itens: [
          {
            id: 'temp_freezer',
            titulo: 'Temperatura do freezer (-18°C)',
            tipo: 'numero' as const,
            obrigatorio: true,
            valor: -18,
            status: 'ok' as const
          },
          {
            id: 'fogao_funcionando',
            titulo: 'Fogão funcionando adequadamente',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: false,
            status: 'problema' as const,
            observacoes: 'Boca 3 não está acendendo - chamar técnico'
          },
          {
            id: 'limpeza_bancadas',
            titulo: 'Bancadas higienizadas',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: true,
            status: 'ok' as const
          },
          {
            id: 'qualidade_limpeza',
            titulo: 'Qualidade geral da limpeza',
            tipo: 'avaliacao' as const,
            obrigatorio: false,
            valor: 4,
            status: 'ok' as const
          }
        ]
      },
      {
        id: 'bar',
        nome: 'Bar',
        descricao: 'Estoque, equipamentos de bebidas e organização',
        cor: 'bg-blue-500',
        icone: '🍺',
        estimativa_tempo: 10,
        prioridade: 'alta' as const,
        responsavel: 'Bartender Maria',
        ordem: 2,
        status: 'em_andamento' as const,
        iniciadoEm: new Date(Date.now() - 5 * 60000).toISOString(),
        itens: [
          {
            id: 'cervejeira_temp',
            titulo: 'Temperatura da cervejeira (2-4°C)',
            tipo: 'numero' as const,
            obrigatorio: true,
            valor: 3,
            status: 'ok' as const
          },
          {
            id: 'estoque_chopeira',
            titulo: 'Barril da chopeira abastecido',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: true,
            status: 'ok' as const
          },
          {
            id: 'organizacao_bar',
            titulo: 'Organização geral do bar',
            tipo: 'avaliacao' as const,
            obrigatorio: false,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'foto_bar',
            titulo: 'Foto do estado atual do bar',
            tipo: 'foto_camera' as const,
            obrigatorio: false,
            valor: undefined,
            status: 'pendente' as const
          }
        ]
      },
      {
        id: 'salao',
        nome: 'Salão',
        descricao: 'Ambiente, mesas, cadeiras e decoração',
        cor: 'bg-green-500',
        icone: '🪑',
        estimativa_tempo: 12,
        prioridade: 'media' as const,
        responsavel: 'Garçom Pedro',
        ordem: 3,
        status: 'pendente' as const,
        itens: [
          {
            id: 'mesas_limpas',
            titulo: 'Todas as mesas estão limpas',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'cadeiras_alinhadas',
            titulo: 'Cadeiras alinhadas e organizadas',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'ambiente_geral',
            titulo: 'Avaliação do ambiente para clientes',
            tipo: 'avaliacao' as const,
            obrigatorio: false,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'iluminacao',
            titulo: 'Iluminação adequada',
            tipo: 'sim_nao' as const,
            obrigatorio: false,
            valor: undefined,
            status: 'pendente' as const
          }
        ]
      },
      {
        id: 'seguranca',
        nome: 'Segurança',
        descricao: 'Verificações de segurança e emergência',
        cor: 'bg-red-500',
        icone: '🔒',
        estimativa_tempo: 8,
        prioridade: 'critica' as const,
        responsavel: 'Gerente Carlos',
        ordem: 4,
        status: 'pendente' as const,
        itens: [
          {
            id: 'extintores',
            titulo: 'Extintores nos locais corretos',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'saidas_emergencia',
            titulo: 'Saídas de emergência desobstruídas',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'cameras_funcionando',
            titulo: 'Sistema de câmeras funcionando',
            tipo: 'sim_nao' as const,
            obrigatorio: false,
            valor: undefined,
            status: 'pendente' as const
          }
        ]
      },
      {
        id: 'administrativo',
        nome: 'Administrativo',
        descricao: 'Caixa, sistemas e escalas',
        cor: 'bg-purple-500',
        icone: '📊',
        estimativa_tempo: 5,
        prioridade: 'media' as const,
        responsavel: 'Admin Ana',
        ordem: 5,
        status: 'pendente' as const,
        itens: [
          {
            id: 'caixa_zerado',
            titulo: 'Caixa zerado para início do dia',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'sistema_pdv',
            titulo: 'Sistema PDV funcionando',
            tipo: 'sim_nao' as const,
            obrigatorio: true,
            valor: undefined,
            status: 'pendente' as const
          },
          {
            id: 'escala_funcionarios',
            titulo: 'Escala de funcionários conferida',
            tipo: 'sim_nao' as const,
            obrigatorio: false,
            valor: undefined,
            status: 'pendente' as const
          }
        ]
      }
    ]
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleItemChange = (itemId: string, valor: any) => {
    setItemValues(prev => ({
      ...prev,
      [itemId]: valor
    }))
  }

  const expandirTodas = () => {
    setExpandedSections(new Set(checklistData.secoes.map(s => s.id)))
  }

  const recolherTodas = () => {
    setExpandedSections(new Set())
  }

  const calcularEstatisticas = () => {
    const totalItens = checklistData.secoes.reduce((acc, secao) => acc + secao.itens.length, 0)
    const itensPreenchidos = checklistData.secoes.reduce((acc, secao) => 
      acc + secao.itens.filter(item => item.valor !== undefined).length, 0)
    const secoesCompletas = checklistData.secoes.filter(secao => secao.status === 'completado').length
    const problemas = checklistData.secoes.reduce((acc, secao) => 
      acc + secao.itens.filter(item => item.status === 'problema').length, 0)

    return {
      totalItens,
      itensPreenchidos,
      secoesCompletas,
      problemas,
      progressoGeral: Math.round((itensPreenchidos / totalItens) * 100)
    }
  }

  const stats = calcularEstatisticas()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎨 Clusterização Visual por Áreas
        </h1>
        <p className="text-gray-600 mb-4">
          Demonstração da separação visual melhorada conforme especificação:
          <br />
          <em>"A lógica se separar por áreas da segunda ref é muito boa"</em>
          <br />
          <em>"Clusterizar as perguntas por área/seção"</em>
        </p>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{checklistData.secoes.length}</div>
              <div className="text-sm text-gray-600">Seções</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.secoesCompletas}</div>
              <div className="text-sm text-gray-600">Completas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.itensPreenchidos}/{stats.totalItens}</div>
              <div className="text-sm text-gray-600">Itens</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.problemas}</div>
              <div className="text-sm text-gray-600">Problemas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.progressoGeral}%</div>
              <div className="text-sm text-gray-600">Progresso</div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          <Button onClick={expandirTodas} variant="outline">
            📖 Expandir Todas
          </Button>
          <Button onClick={recolherTodas} variant="outline">
            📕 Recolher Todas
          </Button>
        </div>
      </div>

      {/* Navegação Visual das Seções */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🗺️ Mapa das Seções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {checklistData.secoes.map((secao) => {
              const completedItems = secao.itens.filter(item => item.valor !== undefined).length
              const progress = Math.round((completedItems / secao.itens.length) * 100)
              
              return (
                <div
                  key={secao.id}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                         ${secao.status === 'completado' ? 'border-green-500 bg-green-50' :
                       secao.status === 'em_andamento' ? 'border-blue-500 bg-blue-50' :
                       'border-gray-300 bg-gray-50'}
                    ${expandedSections.has(secao.id) ? 'ring-2 ring-blue-200' : ''}
                    hover:shadow-md hover:scale-105
                  `}
                  onClick={() => toggleSection(secao.id)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{secao.icone}</div>
                    <div className="font-medium text-sm">{secao.nome}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {completedItems}/{secao.itens.length} itens
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Seções Clusterizadas */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📋 Seções do Checklist
        </h2>
        
        {checklistData.secoes
          .sort((a, b) => a.ordem - b.ordem)
          .map((secao) => (
            <ChecklistSecaoCard
              key={secao.id}
              secao={secao}
              expanded={expandedSections.has(secao.id)}
              onToggleExpand={() => toggleSection(secao.id)}
              onItemChange={handleItemChange}
              variant="execution"
              showProgress={true}
            />
          ))}
      </div>

      {/* Resumo Final */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📊 Resumo da Clusterização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Benefícios da Clusterização */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">✅ Benefícios Implementados:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span><strong>Separação visual clara</strong> por cores e ícones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span><strong>Progresso individual</strong> de cada área</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span><strong>Priorização</strong> por criticidade das áreas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span><strong>Estimativa de tempo</strong> por seção</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span><strong>Responsável definido</strong> para cada área</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span><strong>Status visual imediato</strong> (pendente/andamento/completo)</span>
                  </li>
                </ul>
              </div>

              {/* Recursos Visuais */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🎨 Recursos Visuais:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Cores temáticas</strong> para cada área</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Ícones intuitivos</strong> para identificação rápida</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Animações de hover</strong> e transições suaves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Badges informativos</strong> com status e progresso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Barras de progresso</strong> individuais e gerais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Destacamento de problemas</strong> em vermelho</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mapa Visual das Cores */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">🌈 Paleta de Cores por Área:</h4>
              <div className="flex flex-wrap gap-3">
                {checklistData.secoes.map((secao) => (
                  <div key={secao.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${secao.cor}`} />
                    <span className="text-sm">{secao.icone} {secao.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 