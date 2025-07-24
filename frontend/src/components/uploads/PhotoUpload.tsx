'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useFileUpload, UploadOptions } from '@/hooks/useFileUpload'

interface PhotoUploadProps {
  onUploadComplete?: (result: unknown) => void
  onError?: (error: string) => void
  folder?: 'checklist_photos' | 'signatures' | 'profile_photos'
  compress?: boolean
  maxWidth?: number
  quality?: number
  showPreview?: boolean
  multiple?: boolean
  className?: string
}

export default function PhotoUpload({
  onUploadComplete,
  onError,
  folder = 'checklist_photos',
  compress = true,
  maxWidth = 1920,
  quality = 0.8,
  showPreview = true,
  multiple = false,
  className = ''
}: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const { uploadFile, uploads } = useFileUpload()

  // Função para capturar foto da câmera
  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    await processFiles(Array.from(files))
  }

  // Função para upload de arquivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    await processFiles(Array.from(files))
  }

  // Processar arquivos selecionados
  const processFiles = async (files: File[]) => {
    if (isUploading) return

    setIsUploading(true)

    try {
      const uploadOptions: UploadOptions = {
        folder,
        compress,
        maxWidth,
        quality,
        maxSizeMB: 10
      }

      // Criar previews
      if (showPreview) {
        const newPreviews = files.map(file => URL.createObjectURL(file))
        setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews)
      }

      // Fazer uploads
      for (const file of files) {
        try {
          const result = await uploadFile(file, uploadOptions)
          
          if (onUploadComplete) {
            onUploadComplete(result)
          }
          
          console.log('✅ Upload concluído:', result.filename)
          
        } catch (error: unknown) {
          console.error('❌ Erro no upload:', error)
          
          if (onError) {
            onError(error.message)
          }
        }
      }

    } catch (error: unknown) {
      console.error('❌ Erro no processamento:', error)
      
      if (onError) {
        onError(error.message)
      }
    } finally {
      setIsUploading(false)
      
      // Limpar inputs
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  // Remover preview
  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Verificar se há uploads em progresso
  const uploadsInProgress = Object.values(uploads).some(upload => upload.loading)
  const uploadProgress = Object.values(uploads).find(upload => upload.loading)?.progress || 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botões de Upload */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Botão Câmera */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Camera size={20} />
          <span>Capturar Foto</span>
        </button>

        {/* Botão Galeria */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={20} />
          <span>Escolher Arquivo</span>
        </button>
      </div>

      {/* Progress Bar */}
      {uploadsInProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Enviando foto...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview das fotos */}
      {showPreview && previews.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Fotos selecionadas:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removePreview(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações sobre upload */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>📸 Formatos aceitos: JPEG, PNG, WebP</p>
        <p>📏 Tamanho máximo: 10MB por foto</p>
        {compress && (
          <p>🗜️ Compressão automática ativada (máx. {maxWidth}px, qualidade {Math.round(quality * 100)}%)</p>
        )}
      </div>

      {/* Inputs ocultos */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple}
        onChange={handleCameraCapture}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple={multiple}
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
} 
