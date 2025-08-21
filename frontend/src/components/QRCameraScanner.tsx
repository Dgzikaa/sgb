'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, X, FlashlightOff, Flashlight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QRCameraScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (data: string) => void
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

  // Função para escanear QR code
  const startScanning = useCallback(() => {
    if (!scanningRef.current) return

    const scanFrame = () => {
      if (!scanningRef.current || !videoRef.current || !canvasRef.current) return

      try {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Desenhar frame da câmera no canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        
        // Simular detecção de QR code (implementar lógica real conforme necessário)
        console.log('Processando frame da câmera...')
        
        // Por enquanto, apenas simular detecção
        if (Math.random() < 0.01) { // 1% de chance de "detectar"
          console.log('QR Code simulado detectado')
          scanningRef.current = false
          setScanning(false)
          onScan('qr-code-simulado')
          stopCamera()
          return
        }

        // Continuar scanning
        if (scanningRef.current) {
          requestAnimationFrame(scanFrame)
        }
      } catch (err) {
        console.error('Erro ao processar frame:', err)
        if (scanningRef.current) {
          requestAnimationFrame(scanFrame)
        }
      }
    }

    scanFrame()
  }, [onScan])

  // Função para inicializar câmera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return

    try {
      setError('')
      setScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Iniciar scanning após camera estar pronta
        videoRef.current.onloadedmetadata = () => {
          startScanning()
        }
      }
    } catch (err) {
      console.error('Erro ao inicializar camera:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
      setScanning(false)
    }
  }, [startScanning])

  // Função para controlar flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      if (track && 'torch' in track.getCapabilities()) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn } as any]
        })
        setFlashOn(!flashOn)
      }
    } catch (err) {
      console.error('Erro ao controlar flash:', err)
    }
  }, [flashOn])

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
  }, [isOpen, initializeCamera])

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
                  <Flashlight className="w-4 h-4" />
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
