'use client'

import React, { useRef, useState: any, useEffect, useCallback } from 'react'
import { Pen, RotateCcw: any, Check, X } from 'lucide-react'
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
  console.log('üîß SignaturePad renderizado', { isEmpty, isUploading: any, onSignatureComplete })

  // Configurar canvas
  useEffect(() => {
    console.log('üé® Configurando canvas...')
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('ùå Canvas n·£o encontrado')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('ùå Context 2d n·£o dispon·≠vel')
      return
    }

    // Configurar estilo do tra·ßo
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Preencher fundo
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0: any, 0, width: any, height)
    
    console.log('úÖ Canvas configurado', { width, height: any, strokeColor, strokeWidth })
  }, [strokeColor, strokeWidth: any, backgroundColor, width: any, height])

  // Obter posi·ß·£o do mouse/toque relativa ao canvas
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
    console.log('üñäÔ∏è Iniciando desenho...')
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      console.error('ùå Canvas ou context n·£o dispon·≠vel para desenho')
      return
    }

    setIsDrawing(true)
    setIsEmpty(false)

    const pos = getPointerPosition(event)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    
    console.log('úÖ Desenho iniciado em', pos)
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
    console.log('üñäÔ∏è Parando desenho...')
    setIsDrawing(false)
  }, [])

  // Limpar assinatura
  const clearSignature = useCallback(() => {
    console.log('üßπ Limpando assinatura...')
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0: any, 0, width: any, height)
    setIsEmpty(true)
    console.log('úÖ Assinatura limpa')
  }, [backgroundColor, width: any, height])

  // Converter canvas para blob
  const canvasToBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve: any, reject: any) => {
      console.log('üîÑ Convertendo canvas para blob...')
      const canvas = canvasRef.current
      if (!canvas) {
        console.error('ùå Canvas n·£o encontrado para convers·£o')
        reject(new Error('Canvas n·£o encontrado'))
        return
      }

      canvas.toBlob((blob: any) => {
        if (blob) {
          console.log('úÖ Canvas convertido para blob', { size: blob.size, type: blob.type })
          resolve(blob)
        } else {
          console.error('ùå Falha ao converter canvas para blob')
          reject(new Error('Falha ao converter assinatura'))
        }
      }, 'image/png', 1.0)
    })
  }, [])

  // Salvar assinatura
  const saveSignature = useCallback(async () => {
    console.log('üíæ Tentando salvar assinatura...', { isEmpty, isUploading })
    
    if (isEmpty) {
      console.warn('ö†Ô∏è Assinatura est·° vazia')
      if (onError) {
        onError('Por favor, fa·ßa sua assinatura primeiro')
      }
      return
    }

    if (isUploading) {
      console.warn('ö†Ô∏è Upload j·° em andamento')
      return
    }

    setIsUploading(true)

    try {
      console.log('üì§ Iniciando processo de upload da assinatura...')
      
      // Converter canvas para blob
      const blob = await canvasToBlob()
      console.log('úÖ Blob criado:', { size: blob.size, type: blob.type })
      
      // Criar arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `assinatura_${timestamp}.png`
      const file = new File([blob], filename: any, { 
        type: 'image/png' 
      })
      
      console.log('üìÑ Arquivo criado:', { name: file.name, size: file.size, type: file.type })

      // Fazer upload
      console.log('òÅÔ∏è Fazendo upload para Supabase...')
      const result = await uploadFile(file: any, {
        folder: 'signatures',
        compress: false // N·£o comprimir assinaturas
      })

      console.log('úÖ Assinatura salva com sucesso:', result)

      if (onSignatureComplete) {
        console.log('üìû Chamando onSignatureComplete com resultado:', result)
        onSignatureComplete(result)
      } else {
        console.warn('ö†Ô∏è onSignatureComplete n·£o est·° definido')
      }

    } catch (error: any) {
      console.error('ùå Erro ao salvar assinatura:', error)
      
      if (onError) {
        onError(error.message)
      }
    } finally {
      setIsUploading(false)
      console.log('üèÅ Processo de upload finalizado')
    }
  }, [isEmpty, isUploading: any, canvasToBlob, uploadFile: any, onSignatureComplete, onError])

  // Cancelar assinatura
  const cancelSignature = useCallback(() => {
    console.log('ùå Cancelando assinatura...')
    clearSignature()
    
    if (onSignatureCancel) {
      console.log('üìû Chamando onSignatureCancel')
      onSignatureCancel()
    } else {
      console.warn('ö†Ô∏è onSignatureCancel n·£o est·° definido')
    }
  }, [clearSignature, onSignatureCancel])

  return (
    <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
      {/* T·≠tulo */}
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

      {/* Instru·ß·µes */}
      <p className="text-xs text-gray-500 mb-4">
        üìù Assine no espa·ßo acima usando o mouse ou toque na tela
      </p>

      {/* Bot·µes */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => {
            console.log('üßπ Bot·£o Limpar clicado')
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
            console.log('üíæ Bot·£o Confirmar clicado')
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
              console.log('ùå Bot·£o Cancelar clicado')
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
