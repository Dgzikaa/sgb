'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X, FlashlightOff, FlashlightOn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QRCameraScannerProps {
  onScan: (result: string) => void
  onClose: () => void
  isOpen: boolean
}

export default function QRCameraScanner({ onScan, onClose, isOpen }: QRCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef<boolean>(false)
  
  const [error, setError] = useState<string>('')
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [scanning, setScanning] = useState(false)

  // Função para inicializar câmera
  const initializeCamera = async () => {
    try {
      setError('')
      
      // Solicitar permissões de câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira preferível
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      // Verificar se tem flash
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()
      setHasFlash('torch' in capabilities)

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        // Iniciar scanning
        startScanning()
      }

    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError('Erro ao acessar câmera. Verifique as permissões.')
    }
  }

  // Função para controlar flash
  const toggleFlash = async () => {
    if (!streamRef.current) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      await track.applyConstraints({
        advanced: [{ torch: !flashOn }]
      })
      setFlashOn(!flashOn)
    } catch (err) {
      console.error('Erro ao controlar flash:', err)
    }
  }

  // Função para escanear QR code
  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current || scanningRef.current) return

    scanningRef.current = true
    setScanning(true)

    const scan = async () => {
      if (!scanningRef.current || !videoRef.current || !canvasRef.current) return

      try {
        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
          requestAnimationFrame(scan)
          return
        }

        // Configurar canvas
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Capturar frame do vídeo
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Tentar detectar QR code usando ImageData
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const result = await detectQRCode(imageData)

        if (result) {
          console.log('QR Code detectado:', result)
          scanningRef.current = false
          setScanning(false)
          onScan(result)
          stopCamera()
          return
        }

        // Continuar scanning
        requestAnimationFrame(scan)

      } catch (err) {
        console.error('Erro no scanning:', err)
        requestAnimationFrame(scan)
      }
    }

    scan()
  }

  // Função para detectar QR code (implementação simplificada)
  const detectQRCode = async (imageData: ImageData): Promise<string | null> => {
    try {
      // Usar ZXing library para detectar QR code
      const { BrowserQRCodeReader } = await import('@zxing/library')
      const codeReader = new BrowserQRCodeReader()
      
      // Converter ImageData para formato compatível
      const canvas = document.createElement('canvas')
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      
      ctx.putImageData(imageData, 0, 0)
      
      const result = await codeReader.decodeFromImageElement(canvas)
      return result.getText()
      
    } catch (err) {
      // QR code não encontrado ou erro de detecção
      return null
    }
  }

  // Função para parar câmera
  const stopCamera = () => {
    scanningRef.current = false
    setScanning(false)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setFlashOn(false)
  }

  // Effect para gerenciar câmera
  useEffect(() => {
    if (isOpen) {
      initializeCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md mx-4">
        
        {/* Header */}
        <div className="bg-white rounded-t-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900">Scanner QR</span>
          </div>
          <div className="flex items-center gap-2">
            {hasFlash && (
              <Button
                size="sm"
                variant="outline"
                onClick={toggleFlash}
                className="p-2"
              >
                {flashOn ? (
                  <FlashlightOn className="w-4 h-4" />
                ) : (
                  <FlashlightOff className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-80 object-cover"
            playsInline
            muted
          />
          
          {/* Overlay de scanning */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Frame do QR */}
              <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                {/* Cantos do frame */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></div>
                
                {/* Linha de scanning animada */}
                {scanning && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-orange-500 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>

          {/* Canvas oculto para processamento */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="bg-white rounded-b-xl p-4">
          {error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {scanning ? 'Escaneando...' : 'Posicione o QR code dentro do quadro'}
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initializeCamera}
                  disabled={scanning}
                >
                  Tentar Novamente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
