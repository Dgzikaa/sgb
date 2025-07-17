'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Pen, RotateCcw, Check, X } from 'lucide-react'
import { useFileUpload } from '@/hooks/useFileUpload'

interface SignaturePadProps {
  onSignatureComplete?: (result: any) => void
  onSignatureCancel?: () => void
  onError?: (error: string) => void
  width?: number
  height?: number
  strokeColor?: string
  strokeWidth?: number
  backgroundColor?: string
  className?: string
}

export default function SignaturePad({
  onSignatureComplete,
  onSignatureCancel,
  onError,
  width = 400,
  height = 200,
  strokeColor = '#000000',
  strokeWidth = 2,
  backgroundColor = '#ffffff',
  className = ''
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const { uploadFile } = useFileUpload()

  // Debug logs
  console.log('Ã°Å¸â€Â§ SignaturePad renderizado', { isEmpty, isUploading, onSignatureComplete })

  // Configurar canvas
  useEffect(() => {
    console.log('Ã°Å¸Å½Â¨ Configurando canvas...')
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('ÂÅ’ Canvas nÃ¡Â£o encontrado')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('ÂÅ’ Context 2d nÃ¡Â£o disponÃ¡Â­vel')
      return
    }

    // Configurar estilo do traÃ¡Â§o
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Preencher fundo
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
    
    console.log('Å“â€¦ Canvas configurado', { width, height, strokeColor, strokeWidth })
  }, [strokeColor, strokeWidth, backgroundColor, width, height])

  // Obter posiÃ¡Â§Ã¡Â£o do mouse/toque relativa ao canvas
  const getPointerPosition = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      }
    } else {
      // Mouse event
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      }
    }
  }, [])

  // Iniciar desenho
  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    console.log('Ã°Å¸â€“Å Ã¯Â¸Â Iniciando desenho...')
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      console.error('ÂÅ’ Canvas ou context nÃ¡Â£o disponÃ¡Â­vel para desenho')
      return
    }

    setIsDrawing(true)
    setIsEmpty(false)

    const pos = getPointerPosition(event)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    
    console.log('Å“â€¦ Desenho iniciado em', pos)
  }, [getPointerPosition])

  // Desenhar
  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const pos = getPointerPosition(event)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }, [isDrawing, getPointerPosition])

  // Parar desenho
  const stopDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    console.log('Ã°Å¸â€“Å Ã¯Â¸Â Parando desenho...')
    setIsDrawing(false)
  }, [])

  // Limpar assinatura
  const clearSignature = useCallback(() => {
    console.log('Ã°Å¸Â§Â¹ Limpando assinatura...')
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
    setIsEmpty(true)
    console.log('Å“â€¦ Assinatura limpa')
  }, [backgroundColor, width, height])

  // Converter canvas para blob
  const canvasToBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      console.log('Ã°Å¸â€â€ž Convertendo canvas para blob...')
      const canvas = canvasRef.current
      if (!canvas) {
        console.error('ÂÅ’ Canvas nÃ¡Â£o encontrado para conversÃ¡Â£o')
        reject(new Error('Canvas nÃ¡Â£o encontrado'))
        return
      }

      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Å“â€¦ Canvas convertido para blob', { size: blob.size, type: blob.type })
          resolve(blob)
        } else {
          console.error('ÂÅ’ Falha ao converter canvas para blob')
          reject(new Error('Falha ao converter assinatura'))
        }
      }, 'image/png', 1.0)
    })
  }, [])

  // Salvar assinatura
  const saveSignature = useCallback(async () => {
    console.log('Ã°Å¸â€™Â¾ Tentando salvar assinatura...', { isEmpty, isUploading })
    
    if (isEmpty) {
      console.warn('Å¡Â Ã¯Â¸Â Assinatura estÃ¡Â¡ vazia')
      if (onError) {
        onError('Por favor, faÃ¡Â§a sua assinatura primeiro')
      }
      return
    }

    if (isUploading) {
      console.warn('Å¡Â Ã¯Â¸Â Upload jÃ¡Â¡ em andamento')
      return
    }

    setIsUploading(true)

    try {
      console.log('Ã°Å¸â€œÂ¤ Iniciando processo de upload da assinatura...')
      
      // Converter canvas para blob
      const blob = await canvasToBlob()
      console.log('Å“â€¦ Blob criado:', { size: blob.size, type: blob.type })
      
      // Criar arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `assinatura_${timestamp}.png`
      const file = new File([blob], filename, { 
        type: 'image/png' 
      })
      
      console.log('Ã°Å¸â€œâ€ž Arquivo criado:', { name: file.name, size: file.size, type: file.type })

      // Fazer upload
      console.log('ËœÂÃ¯Â¸Â Fazendo upload para Supabase...')
      const result = await uploadFile(file, {
        folder: 'signatures',
        compress: false // NÃ¡Â£o comprimir assinaturas
      })

      console.log('Å“â€¦ Assinatura salva com sucesso:', result)

      if (onSignatureComplete) {
        console.log('Ã°Å¸â€œÅ¾ Chamando onSignatureComplete com resultado:', result)
        onSignatureComplete(result)
      } else {
        console.warn('Å¡Â Ã¯Â¸Â onSignatureComplete nÃ¡Â£o estÃ¡Â¡ definido')
      }

    } catch (error) {
      console.error('ÂÅ’ Erro ao salvar assinatura:', error)
      
      if (onError) {
        onError((error as any).message)
      }
    } finally {
      setIsUploading(false)
      console.log('Ã°Å¸ÂÂ Processo de upload finalizado')
    }
  }, [isEmpty, isUploading, canvasToBlob, uploadFile, onSignatureComplete, onError])

  // Cancelar assinatura
  const cancelSignature = useCallback(() => {
    console.log('ÂÅ’ Cancelando assinatura...')
    clearSignature()
    
    if (onSignatureCancel) {
      console.log('Ã°Å¸â€œÅ¾ Chamando onSignatureCancel')
      onSignatureCancel()
    } else {
      console.warn('Å¡Â Ã¯Â¸Â onSignatureCancel nÃ¡Â£o estÃ¡Â¡ definido')
    }
  }, [clearSignature, onSignatureCancel])

  return (
    <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
      {/* TÃ¡Â­tulo */}
      <div className="flex items-center gap-2 mb-3">
        <Pen size={18} className="text-gray-600" />
        <h3 className="text-sm font-medium text-gray-700">Assinatura Digital</h3>
      </div>

      {/* Canvas */}
              <div className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 mb-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block cursor-crosshair touch-none"
          style={{ width: '100%', maxWidth: `${width}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
        <strong>Debug:</strong> isEmpty: {isEmpty.toString()}, isDrawing: {isDrawing.toString()}, isUploading: {isUploading.toString()}
      </div>

      {/* InstruÃ¡Â§Ã¡Âµes */}
      <p className="text-xs text-gray-500 mb-4">
        Ã°Å¸â€œÂ Assine no espaÃ¡Â§o acima usando o mouse ou toque na tela
      </p>

      {/* BotÃ¡Âµes */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => {
            console.log('Ã°Å¸Â§Â¹ BotÃ¡Â£o Limpar clicado')
            clearSignature()
          }}
          disabled={isEmpty || isUploading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw size={16} />
          <span>Limpar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            console.log('Ã°Å¸â€™Â¾ BotÃ¡Â£o Confirmar clicado')
            saveSignature()
          }}
          disabled={isEmpty || isUploading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check size={16} />
          <span>{isUploading ? 'Salvando...' : 'Confirmar Assinatura'}</span>
        </button>

        {onSignatureCancel && (
          <button
            type="button"
            onClick={() => {
              console.log('ÂÅ’ BotÃ¡Â£o Cancelar clicado')
              cancelSignature()
            }}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X size={16} />
            <span>Cancelar</span>
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isUploading && (
        <div className="mt-3 text-center">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
          <span className="ml-2 text-sm text-gray-600">Salvando assinatura...</span>
        </div>
      )}
    </div>
  )
} 

