'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  Grip
} from 'lucide-react'

// =====================================================
// 🎨 COMPONENTE DE SEÇÃO VISUAL MELHORADA
// =====================================================
// Implementa clusterização visual conforme documento:
// "A lógica se separar por áreas da segunda ref é muito boa"
// "Clusterizar as perguntas por área/seção"

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

  // Calcular estatísticas da seção
  const stats = {
    total: secao.itens.length,
    preenchidos: secao.itens.filter(item => item.status === 'preenchido' || item.status === 'ok').length,
    problemas: secao.itens.filter(item => item.status === 'problema').length,
    obrigatorios: secao.itens.filter(item => item.obrigatorio).length,
    obrigatoriosPreenchidos: secao.itens.filter(item => item.obrigatorio && (item.status === 'preenchido' || item.status === 'ok')).length
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

  // Determinar ícone do status
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
          ✅ Completo
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
      baixa: '⬇️',
      media: '➡️',
      alta: '⬆️',
      critica: '🚨'
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
        transition-all duration-300 hover:shadow-lg
        ${getCorSecao()}
        ${isHovered ? 'shadow-md scale-[1.02]' : ''}
        ${expanded ? 'ring-2 ring-blue-200' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header da Seção */}
      <CardHeader className={`${getHeaderColor()} cursor-pointer`} onClick={onToggleExpand}>
        <div className="flex items-center justify-between">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-3">
            {/* Ícone de Expansão */}
            <div className="flex items-center gap-2">
              {expanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              
              {/* Ícone da Seção */}
              {secao.icone && (
                <span className="text-xl">{secao.icone}</span>
              )}
            </div>

            {/* Informações Principais */}
            <div>
              <h3 className="font-semibold text-lg">{secao.nome}</h3>
              {secao.descricao && (
                <p className="text-sm opacity-90 mt-1">{secao.descricao}</p>
              )}
            </div>
          </div>

          {/* Lado Direito */}
          <div className="flex items-center gap-3">
            {/* Status Visual */}
            {getIconeStatus()}
            
            {/* Progress Badge */}
            {renderProgressoBadge()}
            
            {/* Estimativa de Tempo */}
            {renderEstimativaTempo()}
            
            {/* Prioridade */}
            {renderPrioridade()}
          </div>
        </div>
        
        {/* Barra de Progresso */}
        {showProgress && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso Geral</span>
              <span>{progresso}%</span>
            </div>
            <Progress value={progresso} className="h-2 bg-white/30">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </Progress>
            
            {stats.obrigatorios > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span>Itens Obrigatórios</span>
                  <span>{progressoObrigatorios}%</span>
                </div>
                <Progress value={progressoObrigatorios} className="h-1 bg-white/30">
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

      {/* Conteúdo Expandido */}
      {expanded && (
        <CardContent className="p-0">
          {/* Barra de Ações */}
          {!readonly && variant === 'execution' && (
            <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                {secao.status === 'pendente' && onStartSection && (
                  <Button size="sm" onClick={onStartSection} className="bg-blue-500 hover:bg-blue-600">
                    ▶️ Iniciar Seção
                  </Button>
                )}
                {secao.status === 'em_andamento' && onCompleteSection && (
                  <Button size="sm" onClick={onCompleteSection} className="bg-green-500 hover:bg-green-600">
                    ✅ Finalizar Seção
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {secao.responsavel && (
                  <span>👤 {secao.responsavel}</span>
                )}
                {secao.iniciadoEm && (
                  <span>🕐 Iniciado: {new Date(secao.iniciadoEm).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          )}

          {/* Lista de Itens */}
          <div className="p-4 space-y-3">
            {secao.itens.map((item, index) => (
              <div 
                key={item.id}
                className={`
                  p-3 rounded-lg border-l-4 transition-all duration-200
                  ${item.status === 'ok' || item.status === 'preenchido' 
                    ? 'border-green-500 bg-green-50' 
                    : item.status === 'problema'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                  }
                  hover:shadow-sm
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {index + 1}. {item.titulo}
                      </span>
                      {item.obrigatorio && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    
                    {/* Renderizar campo baseado no tipo */}
                    <div className="mt-2">
                      {renderCampoItem(item, onItemChange, readonly)}
                    </div>
                    
                    {/* Observações */}
                    {item.observacoes && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs text-gray-600 font-medium">Observações:</p>
                        <p className="text-sm text-gray-700">{item.observacoes}</p>
                      </div>
                    )}
                    
                    {/* Validação */}
                    {item.validacao && !item.validacao.valido && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-600 font-medium">⚠️ {item.validacao.erro}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Status do Item */}
                  <div className="ml-3">
                    {item.status === 'ok' || item.status === 'preenchido' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : item.status === 'problema' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
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
// 🔧 FUNÇÃO PARA RENDERIZAR CAMPOS POR TIPO
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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={item.valor === true ? 'default' : 'outline'}
            onClick={() => handleChange(true)}
            disabled={readonly}
            className="text-xs"
          >
            ✅ Sim
          </Button>
          <Button
            size="sm"
            variant={item.valor === false ? 'default' : 'outline'}
            onClick={() => handleChange(false)}
            disabled={readonly}
            className="text-xs"
          >
            ❌ Não
          </Button>
        </div>
      )
    
    case 'avaliacao':
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(nota => (
            <Button
              key={nota}
              size="sm"
              variant="ghost"
              onClick={() => handleChange(nota)}
              disabled={readonly}
              className="p-1 h-8 w-8"
            >
              <span className={item.valor >= nota ? 'text-yellow-500' : 'text-gray-300'}>
                ⭐
              </span>
            </Button>
          ))}
          {item.valor && <span className="text-sm text-gray-600 ml-2">{item.valor}/5</span>}
        </div>
      )
    
    case 'texto':
      return (
        <input
          type="text"
          value={item.valor || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={readonly}
          className="w-full p-2 border rounded text-sm"
          placeholder="Digite aqui..."
        />
      )
    
    case 'numero':
      return (
        <input
          type="number"
          value={item.valor || ''}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          disabled={readonly}
          className="w-32 p-2 border rounded text-sm"
          placeholder="0"
        />
      )
    
    case 'data':
      return (
        <input
          type="date"
          value={item.valor || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={readonly}
          className="w-40 p-2 border rounded text-sm"
        />
      )
    
    case 'foto_camera':
    case 'foto_upload':
      return (
        <div className="space-y-2">
          {!readonly && (
            <Button size="sm" variant="outline" className="text-xs">
              📷 {item.tipo === 'foto_camera' ? 'Tirar Foto' : 'Upload Foto'}
            </Button>
          )}
          {item.valor && (
            <div className="w-20 h-20 bg-gray-200 rounded border flex items-center justify-center">
              <span className="text-xs">📷</span>
            </div>
          )}
        </div>
      )
    
    default:
      return (
        <div className="text-sm text-gray-500 italic">
          Campo tipo: {item.tipo}
          {item.valor && <span className="ml-2">Valor: {String(item.valor)}</span>}
        </div>
      )
  }
} 