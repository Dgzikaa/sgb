'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// =====================================================
// 🎭 CAMPO DE AVALIAÇÃO COM EMOJIS/CARINHAS
// =====================================================
// Implementa conforme documento Word:
// "O campo de avaliação eu gosto de poder usar as carinhas"

interface AvaliacaoEmojiFieldProps {
  label: string
  value?: number
  onChange: (value: number) => void
  obrigatorio?: boolean
  disabled?: boolean
  descricao?: string
  variant?: 'emojis' | 'estrelas' | 'faces' | 'qualidade'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showDescription?: boolean
}

// Configurações dos diferentes tipos de avaliação
const avaliacaoConfigs = {
  emojis: {
    opcoes: [
      { valor: 1, emoji: '😢', label: 'Muito ruim', cor: 'text-red-500' },
      { valor: 2, emoji: '😕', label: 'Ruim', cor: 'text-orange-500' },
      { valor: 3, emoji: '😐', label: 'Regular', cor: 'text-yellow-500' },
      { valor: 4, emoji: '😊', label: 'Bom', cor: 'text-blue-500' },
      { valor: 5, emoji: '😍', label: 'Excelente', cor: 'text-green-500' }
    ]
  },
  faces: {
    opcoes: [
      { valor: 1, emoji: '☹️', label: 'Insatisfeito', cor: 'text-red-500' },
      { valor: 2, emoji: '😞', label: 'Pouco satisfeito', cor: 'text-orange-500' },
      { valor: 3, emoji: '😐', label: 'Neutro', cor: 'text-yellow-500' },
      { valor: 4, emoji: '🙂', label: 'Satisfeito', cor: 'text-blue-500' },
      { valor: 5, emoji: '😁', label: 'Muito satisfeito', cor: 'text-green-500' }
    ]
  },
  qualidade: {
    opcoes: [
      { valor: 1, emoji: '💔', label: 'Péssimo', cor: 'text-red-500' },
      { valor: 2, emoji: '👎', label: 'Ruim', cor: 'text-orange-500' },
      { valor: 3, emoji: '👌', label: 'Aceitável', cor: 'text-yellow-500' },
      { valor: 4, emoji: '👍', label: 'Bom', cor: 'text-blue-500' },
      { valor: 5, emoji: '🏆', label: 'Perfeito', cor: 'text-green-500' }
    ]
  },
  estrelas: {
    opcoes: [
      { valor: 1, emoji: '⭐', label: '1 estrela', cor: 'text-yellow-500' },
      { valor: 2, emoji: '⭐⭐', label: '2 estrelas', cor: 'text-yellow-500' },
      { valor: 3, emoji: '⭐⭐⭐', label: '3 estrelas', cor: 'text-yellow-500' },
      { valor: 4, emoji: '⭐⭐⭐⭐', label: '4 estrelas', cor: 'text-yellow-500' },
      { valor: 5, emoji: '⭐⭐⭐⭐⭐', label: '5 estrelas', cor: 'text-yellow-500' }
    ]
  }
}

export default function AvaliacaoEmojiField({
  label,
  value,
  onChange,
  obrigatorio = false,
  disabled = false,
  descricao,
  variant = 'emojis',
  size = 'md',
  showLabel = true,
  showDescription = true
}: AvaliacaoEmojiFieldProps) {
  
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)
  const config = avaliacaoConfigs[variant]
  
  const sizeClasses = {
    sm: 'text-2xl p-2',
    md: 'text-3xl p-3',
    lg: 'text-4xl p-4'
  }

  const getSizeClass = () => sizeClasses[size]

  const handleSelect = (valor: number) => {
    if (disabled) return
    onChange(valor)
  }

  const getOpcaoAtual = () => {
    const valorAtual = hoveredValue ?? value
    return config.opcoes.find(opcao => opcao.valor === valorAtual)
  }

  const opcaoAtual = getOpcaoAtual()

  return (
    <div className="space-y-3">
      {/* Label */}
      {showLabel && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-gray-900">
            {label}
            {obrigatorio && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {value && (
            <Badge variant="outline" className={opcaoAtual?.cor}>
              {opcaoAtual?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Descrição */}
      {showDescription && descricao && (
        <p className="text-sm text-gray-600">{descricao}</p>
      )}

      {/* Avaliação com Emojis */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
          {config.opcoes.map((opcao) => {
            const isSelected = value === opcao.valor
            const isHovered = hoveredValue === opcao.valor
            const isActive = isSelected || isHovered
            
            return (
              <button
                key={opcao.valor}
                type="button"
                disabled={disabled}
                className={`
                  ${getSizeClass()}
                  transition-all duration-200 rounded-lg border-2
                  hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isSelected ? 'border-blue-500 bg-blue-50 shadow-lg scale-110' : 'border-transparent'}
                  ${isHovered && !isSelected ? 'border-gray-300 bg-white shadow-md scale-105' : ''}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onMouseEnter={() => !disabled && setHoveredValue(opcao.valor)}
                onMouseLeave={() => setHoveredValue(null)}
                onClick={() => handleSelect(opcao.valor)}
                title={opcao.label}
              >
                <span className={`block ${isActive ? 'animate-pulse' : ''}`}>
                  {opcao.emoji}
                </span>
              </button>
            )
          })}
        </div>

        {/* Feedback Visual */}
        <div className="text-center min-h-[2rem] flex items-center justify-center">
          {opcaoAtual && (
            <div className={`text-lg font-medium transition-all duration-300 ${opcaoAtual.cor}`}>
              {opcaoAtual.emoji} {opcaoAtual.label}
            </div>
          )}
          {!value && !hoveredValue && (
            <div className="text-gray-400 text-sm">
              {obrigatorio ? 'Selecione uma avaliação' : 'Avaliação opcional'}
            </div>
          )}
        </div>
      </div>

      {/* Preview do Valor (para debug) */}
      {value && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
          Valor selecionado: {value}
        </div>
      )}
    </div>
  )
}

// =====================================================
// 🎨 VARIANTES PRÉ-CONFIGURADAS
// =====================================================

export function AvaliacaoSatisfacao(props: Omit<AvaliacaoEmojiFieldProps, 'variant'>) {
  return <AvaliacaoEmojiField {...props} variant="faces" />
}

export function AvaliacaoQualidade(props: Omit<AvaliacaoEmojiFieldProps, 'variant'>) {
  return <AvaliacaoEmojiField {...props} variant="qualidade" />
}

export function AvaliacaoEstrelas(props: Omit<AvaliacaoEmojiFieldProps, 'variant'>) {
  return <AvaliacaoEmojiField {...props} variant="estrelas" />
}

export function AvaliacaoEmojis(props: Omit<AvaliacaoEmojiFieldProps, 'variant'>) {
  return <AvaliacaoEmojiField {...props} variant="emojis" />
}

// =====================================================
// 🔧 HOOK PARA GERENCIAR AVALIAÇÕES
// =====================================================

export function useAvaliacaoEmoji(valorInicial?: number) {
  const [valor, setValor] = useState<number | undefined>(valorInicial)
  
  const reset = () => setValor(undefined)
  
  const isValid = (obrigatorio: boolean = false) => {
    return obrigatorio ? valor !== undefined && valor >= 1 && valor <= 5 : true
  }
  
  const getLabel = (variant: keyof typeof avaliacaoConfigs = 'emojis') => {
    if (!valor) return ''
    const config = avaliacaoConfigs[variant]
    return config.opcoes.find(opcao => opcao.valor === valor)?.label || ''
  }
  
  const getEmoji = (variant: keyof typeof avaliacaoConfigs = 'emojis') => {
    if (!valor) return ''
    const config = avaliacaoConfigs[variant]
    return config.opcoes.find(opcao => opcao.valor === valor)?.emoji || ''
  }
  
  return {
    valor,
    setValor,
    reset,
    isValid,
    getLabel,
    getEmoji
  }
} 
