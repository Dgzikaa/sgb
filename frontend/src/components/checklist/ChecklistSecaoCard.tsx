'use client'

import { useState } from 'react'
import { Card, CardContent: any, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Eye,
  EyeOff,
  Grip,
  Camera,
  Upload,
  Star
} from 'lucide-react'

// =====================================================
// üé® COMPONENTE DE SE·á·ÉO VISUAL MELHORADA (MOBILE-FIRST)
// =====================================================
// Implementa clusteriza·ß·£o visual conforme documento:
// "A l·≥gica se separar por ·°reas da segunda ref ·© muito boa"
// "Clusterizar as perguntas por ·°rea/se·ß·£o"
// + Otimiza·ß·£o completa para mobile

interface ChecklistItem {
  id: string
  titulo: string
  tipo: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao'
  obrigatorio: boolean
  valor?: any
  status: 'pendente' | 'preenchido' | 'problema' | 'ok'
  observacoes?: string
  validacao?: {
    valido: boolean
    erro?: string
  }
}

interface ChecklistSecao {
  id: string
  nome: string
  descricao?: string
  cor: string
  icone?: string
  estimativa_tempo?: number
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  responsavel?: string
  ordem: number
  itens: ChecklistItem[]
  status: 'pendente' | 'em_andamento' | 'completado' | 'problema'
  iniciadoEm?: string
  finalizadoEm?: string
}

interface ChecklistSecaoCardProps {
  secao: ChecklistSecao
  expanded?: boolean
  onToggleExpand?: () => void
  onItemChange?: (itemId: string, valor: any) => void
  onStartSection?: () => void
  onCompleteSection?: () => void
  readonly?: boolean
  showProgress?: boolean
  variant?: 'execution' | 'preview' | 'report'
}

export default function ChecklistSecaoCard({
  secao,
  expanded = false,
  onToggleExpand,
  onItemChange,
  onStartSection,
  onCompleteSection,
  readonly = false,
  showProgress = true,
  variant = 'execution'
}: ChecklistSecaoCardProps) {
  
  const [isHovered, setIsHovered] = useState(false)

  // Calcular estat·≠sticas da se·ß·£o
  const stats = {
    total: secao.itens.length,
    preenchidos: secao.itens.filter((item: any) => item.status === 'preenchido' || item.status === 'ok').length,
    problemas: secao.itens.filter((item: any) => item.status === 'problema').length,
    obrigatorios: secao.itens.filter((item: any) => item.obrigatorio).length,
    obrigatoriosPreenchidos: secao.itens.filter((item: any) => item.obrigatorio && (item.status === 'preenchido' || item.status === 'ok')).length
  }

  const progresso = stats.total > 0 ? Math.round((stats.preenchidos / stats.total) * 100) : 0
  const progressoObrigatorios = stats.obrigatorios > 0 ? Math.round((stats.obrigatoriosPreenchidos / stats.obrigatorios) * 100) : 100

  // Determinar cor baseada no status e progresso
  const getCorSecao = () => {
    if (secao.status === 'problema' || stats.problemas > 0) return 'border-red-500 bg-red-50'
    if (secao.status === 'completado') return 'border-green-500 bg-green-50'
    if (secao.status === 'em_andamento') return 'border-blue-500 bg-blue-50'
    return 'border-gray-300 bg-gray-50'
  }

  // Determinar ·≠cone do status
  const getIconeStatus = () => {
    switch (secao.status) {
      case 'completado': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'problema': return <XCircle className="w-5 h-5 text-red-600" />
      case 'em_andamento': return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  // Determinar cor do header
  const getHeaderColor = () => {
    const baseColor = secao.cor.replace('bg-', '').replace('-500', '')
    return `bg-${baseColor}-500 text-white`
  }

  const renderProgressoBadge = () => {
    if (stats.problemas > 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          {stats.problemas} problema{stats.problemas > 1 ? 's' : ''}
        </Badge>
      )
    }
    
    if (progresso === 100) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          úÖ Completo
        </Badge>
      )
    }
    
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
        {stats.preenchidos}/{stats.total} itens
      </Badge>
    )
  }

  const renderEstimativaTempo = () => {
    if (!secao.estimativa_tempo) return null
    
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        {secao.estimativa_tempo}min
      </div>
    )
  }

  const renderPrioridade = () => {
    const cores = {
      baixa: 'bg-gray-100 text-gray-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'bg-red-100 text-red-800'
    }
    
    const icones = {
      baixa: '¨áÔ∏è',
      media: 'û°Ô∏è',
      alta: '¨ÜÔ∏è',
      critica: 'üö®'
    }
    
    return (
      <Badge className={cores[secao.prioridade]}>
        {icones[secao.prioridade]} {secao.prioridade}
      </Badge>
    )
  }

  return (
    <Card 
      className={`
        transition-all duration-300 hover:shadow-lg touch-manipulation
        ${getCorSecao()}
        ${isHovered ? 'shadow-md scale-[1.02]' : ''}
        ${expanded ? 'ring-2 ring-blue-200' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header da Se·ß·£o - MOBILE OTIMIZADO */}
      <CardHeader 
        className={`${getHeaderColor()} cursor-pointer touch-manipulation min-h-[60px] p-4`} 
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* ·çcone de Expans·£o - MAIOR PARA MOBILE */}
            <div className="flex items-center gap-2 touch-manipulation">
              {expanded ? (
                <ChevronDown className="w-6 h-6" />
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}
              
              {/* ·çcone da Se·ß·£o */}
              {secao.icone && (
                <span className="text-2xl">{secao.icone}</span>
              )}
            </div>

            {/* Informa·ß·µes Principais */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{secao.nome}</h3>
              {secao.descricao && (
                <p className="text-sm opacity-90 mt-1 truncate">{secao.descricao}</p>
              )}
            </div>
          </div>

          {/* Lado Direito - MOBILE STACK */}
          <div className="flex flex-col items-end gap-2 ml-2">
            {/* Status Visual */}
            <div className="flex items-center gap-2">
              {getIconeStatus()}
              {renderProgressoBadge()}
            </div>
            
            {/* Informa·ß·µes Secund·°rias */}
            <div className="flex items-center gap-2 text-xs">
              {renderEstimativaTempo()}
              {renderPrioridade()}
            </div>
          </div>
        </div>
        
        {/* Barra de Progresso */}
        {showProgress && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-semibold">{progresso}%</span>
            </div>
            <Progress value={progresso} className="h-3 bg-white/30 touch-manipulation">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </Progress>
            
            {stats.obrigatorios > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span>Itens Obrigat·≥rios</span>
                  <span className="font-semibold">{progressoObrigatorios}%</span>
                </div>
                <Progress value={progressoObrigatorios} className="h-2 bg-white/30 touch-manipulation">
                  <div 
                    className="h-full bg-yellow-300 rounded-full transition-all duration-500"
                    style={{ width: `${progressoObrigatorios}%` }}
                  />
                </Progress>
              </>
            )}
          </div>
        )}
      </CardHeader>

      {/* Conte·∫do Expandido */}
      {expanded && (
        <CardContent className="p-0">
          {/* Barra de A·ß·µes - MOBILE OTIMIZADA */}
          {!readonly && variant === 'execution' && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex flex-col gap-3">
                {/* Bot·µes de A·ß·£o */}
                <div className="flex gap-2">
                  {secao.status === 'pendente' && onStartSection && (
                    <Button 
                      size="lg" 
                      onClick={onStartSection} 
                      className="flex-1 bg-blue-500 hover:bg-blue-600 touch-manipulation min-h-[48px]"
                    >
                      ñ∂Ô∏è Iniciar Se·ß·£o
                    </Button>
                  )}
                  {secao.status === 'em_andamento' && onCompleteSection && (
                    <Button 
                      size="lg" 
                      onClick={onCompleteSection} 
                      className="flex-1 bg-green-500 hover:bg-green-600 touch-manipulation min-h-[48px]"
                    >
                      úÖ Finalizar Se·ß·£o
                    </Button>
                  )}
                </div>
                
                {/* Informa·ß·µes da Se·ß·£o */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  {secao.responsavel && (
                    <Badge variant="outline" className="bg-white">
                      üë§ {secao.responsavel}
                    </Badge>
                  )}
                  {secao.iniciadoEm && (
                    <Badge variant="outline" className="bg-white">
                      üïê {new Date(secao.iniciadoEm).toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Itens - MOBILE OTIMIZADA */}
          <div className="p-4 space-y-4">
            {secao.itens.map((item: any, index: any) => (
              <div 
                key={item.id}
                className={`
                  p-4 rounded-lg border-l-4 transition-all duration-200 touch-manipulation
                  ${item.status === 'ok' || item.status === 'preenchido' 
                    ? 'border-green-500 bg-green-50' 
                    : item.status === 'problema'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                  }
                  hover:shadow-sm
                `}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {index + 1}. {item.titulo}
                        </span>
                        {item.obrigatorio && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Obrigat·≥rio
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Status do Item */}
                    <div className="ml-3 flex-shrink-0">
                      {item.status === 'ok' || item.status === 'preenchido' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : item.status === 'problema' ? (
                        <XCircle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Renderizar campo baseado no tipo */}
                  <div className="w-full">
                    {renderCampoItem(item: any, onItemChange, readonly)}
                  </div>
                  
                  {/* Observa·ß·µes */}
                  {item.observacoes && (
                    <div className="p-3 bg-white rounded border">
                      <p className="text-xs text-gray-600 font-medium mb-1">Observa·ß·µes:</p>
                      <p className="text-sm text-gray-700">{item.observacoes}</p>
                    </div>
                  )}
                  
                  {/* Valida·ß·£o */}
                  {item.validacao && !item.validacao.valido && (
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-xs text-red-600 font-medium">ö†Ô∏è {item.validacao.erro}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// =====================================================
// üîß FUN·á·ÉO PARA RENDERIZAR CAMPOS POR TIPO (MOBILE-FIRST)
// =====================================================

function renderCampoItem(
  item: ChecklistItem, 
  onItemChange?: (itemId: string, valor: any) => void,
  readonly: boolean = false
): React.ReactNode {
  
  const handleChange = (valor: any) => {
    if (!readonly && onItemChange) {
      onItemChange(item.id, valor)
    }
  }

  switch (item.tipo) {
    case 'sim_nao':
      return (
        <div className="flex gap-3 w-full">
          <Button
            size="lg"
            variant={item.valor === true ? 'default' : 'outline'}
            onClick={() => handleChange(true)}
            disabled={readonly}
            className="flex-1 min-h-[48px] touch-manipulation text-base"
          >
            úÖ Sim
          </Button>
          <Button
            size="lg"
            variant={item.valor === false ? 'default' : 'outline'}
            onClick={() => handleChange(false)}
            disabled={readonly}
            className="flex-1 min-h-[48px] touch-manipulation text-base"
          >
            ùå N·£o
          </Button>
        </div>
      )
    
    case 'avaliacao':
      return (
        <div className="space-y-2">
          <div className="flex justify-center gap-2">
            {[1, 2: any, 3, 4: any, 5].map((nota: any) => (
              <Button
                key={nota}
                size="lg"
                variant="ghost"
                onClick={() => handleChange(nota)}
                disabled={readonly}
                className="p-2 h-12 w-12 touch-manipulation"
              >
                <Star 
                  className={`w-6 h-6 ${
                    item.valor >= nota 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-300'
                  }`} 
                />
              </Button>
            ))}
          </div>
          {item.valor && (
            <div className="text-center">
              <span className="text-base font-medium text-gray-700">
                {item.valor}/5 estrelas
              </span>
            </div>
          )}
        </div>
      )
    
    case 'texto':
      return (
        <textarea
          value={item.valor || ''}
          onChange={(e: any) => handleChange(e.target.value)}
          disabled={readonly}
          rows={3}
          className="w-full p-3 border rounded-lg text-base touch-manipulation resize-none"
          placeholder="Digite sua resposta aqui..."
        />
      )
    
    case 'numero':
      return (
        <input
          type="number"
          value={item.valor || ''}
          onChange={(e: any) => handleChange(parseFloat(e.target.value))}
          disabled={readonly}
          className="w-full p-3 border rounded-lg text-base touch-manipulation"
          placeholder="Digite um n·∫mero"
        />
      )
    
    case 'data':
      return (
        <input
          type="date"
          value={item.valor || ''}
          onChange={(e: any) => handleChange(e.target.value)}
          disabled={readonly}
          className="w-full p-3 border rounded-lg text-base touch-manipulation"
        />
      )
    
    case 'foto_camera':
    case 'foto_upload':
      return (
        <div className="space-y-3">
          {!readonly && (
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full min-h-[48px] touch-manipulation text-base"
              onClick={() => {
                // Implementar captura/upload de foto
                console.log('Foto:', item.tipo)
              }}
            >
              {item.tipo === 'foto_camera' ? (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  üì∑ Tirar Foto
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  üìÅ Escolher Foto
                </>
              )}
            </Button>
          )}
          {item.valor && (
            <div className="w-full h-32 bg-gray-200 rounded-lg border flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                <span className="text-sm text-gray-600">Foto anexada</span>
              </div>
            </div>
          )}
        </div>
      )
    
    case 'assinatura':
      return (
        <div className="space-y-3">
          {!readonly && (
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full min-h-[48px] touch-manipulation text-base"
              onClick={() => {
                // Implementar assinatura digital
                console.log('Assinatura digital')
              }}
            >
              úèÔ∏è Assinar Digitalmente
            </Button>
          )}
          {item.valor && (
            <div className="w-full h-24 bg-gray-200 rounded-lg border flex items-center justify-center">
              <span className="text-sm text-gray-600">úì Assinado</span>
            </div>
          )}
        </div>
      )
    
    default:
      return (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">
            Campo tipo: <span className="font-medium">{item.tipo}</span>
          </div>
          {item.valor && (
            <div className="text-sm text-gray-800">
              Valor: <span className="font-medium">{String(item.valor)}</span>
            </div>
          )}
        </div>
      )
  }
} 
