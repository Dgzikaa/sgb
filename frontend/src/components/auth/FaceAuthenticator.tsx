'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, StopCircle, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePageLoading } from '@/hooks/usePageLoading'

// Tipos para face-api.js
declare global {
  interface Window {
    faceapi: any;
  }
}

export interface FaceDescriptor {
  descriptor: number[]
  confidence: number
}

export interface FaceAuthenticatorProps {
  mode: 'register' | 'login'
  onSuccess: (descriptor?: FaceDescriptor, userData?: any) => void
  onError: (error: string) => void
  userEmail?: string
  barId?: number
  className?: string
}

export default function FaceAuthenticator({
  mode,
  onSuccess,
  onError,
  userEmail,
  barId,
  className = ''
}: FaceAuthenticatorProps) {
  // Estados
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Hooks
  const { loading: pageLoading, startLoading, stopLoading } = usePageLoading('fullscreen')

  // Carregar modelos do face-api.js
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true)
      startLoading('fullscreen', 'Carregando modelos de IA...')
      
      // Verificar se face-api está disponível
      if (typeof window === 'undefined' || !window.faceapi) {
        throw new Error('face-api.js não está carregado')
      }

      const MODEL_URL = '/models' // Pasta de modelos
      
      // Carregar modelos necessários
      await Promise.all([
        window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      ])

      setModelsLoaded(true)
      console.log('✅ Modelos de IA carregados com sucesso')
      
    } catch (error) {
      console.error('❌ Erro ao carregar modelos:', error)
      setError('Erro ao carregar modelos de IA. Verifique sua conexão.')
    } finally {
      setIsLoading(false)
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Inicializar câmera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setSuccess(null)
      
      if (!modelsLoaded) {
        await loadModels()
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      setIsRecording(true)
      console.log('📷 Câmera iniciada')
      
    } catch (error) {
      console.error('❌ Erro ao acessar câmera:', error)
      setError('Erro ao acessar a câmera. Verifique as permissões.')
    }
  }, [modelsLoaded, loadModels])

  // Parar câmera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsRecording(false)
    console.log('📷 Câmera parada')
  }, [stream])

  // Capturar e processar face
  const captureFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      setError('Sistema não está pronto. Tente novamente.')
      return
    }

    try {
      setIsLoading(true)
      startLoading('fullscreen', 'Processando reconhecimento facial...')
      
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Configurar canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Detectar face
      const detection = await window.faceapi
        .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        throw new Error('Nenhuma face detectada. Posicione-se bem na frente da câmera.')
      }

      // Verificar qualidade da detecção
      if (detection.detection.score < 0.7) {
        throw new Error('Qualidade da detecção baixa. Melhore a iluminação e tente novamente.')
      }

      const descriptor = Array.from(detection.descriptor) as number[]
      
      console.log('✅ Face capturada com sucesso', {
        score: detection.detection.score,
        descriptorLength: descriptor.length
      })

      // Processar baseado no modo
      if (mode === 'register') {
        await handleRegister(descriptor, detection.detection.score)
      } else {
        await handleLogin(descriptor, detection.detection.score)
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao capturar face:', error)
      setError(error.message || 'Erro ao processar reconhecimento facial')
      onError(error.message || 'Erro ao processar reconhecimento facial')
    } finally {
      setIsLoading(false)
      stopLoading()
    }
  }, [modelsLoaded, mode, startLoading, stopLoading, onError])

  // Registrar nova face
  const handleRegister = async (descriptor: number[], confidence: number) => {
    try {
      const response = await fetch('/api/auth/face/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descriptor,
          confidence,
          userEmail,
          barId
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao registrar face')
      }

      setSuccess('Face registrada com sucesso! 🎉')
      stopCamera()
      onSuccess({ descriptor, confidence })
      
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao registrar face no servidor')
    }
  }

  // Fazer login com face
  const handleLogin = async (descriptor: number[], confidence: number) => {
    try {
      const response = await fetch('/api/auth/face/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descriptor,
          barId
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Face não reconhecida')
      }

      setSuccess(`Bem-vindo(a), ${result.user.nome}! 🎉`)
      stopCamera()
      onSuccess({ descriptor, confidence }, result.user)
      
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao autenticar face')
    }
  }

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Carregar face-api.js
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/face-api.min.js'
    script.async = true
    script.onload = () => {
      console.log('📚 face-api.js carregado')
      loadModels()
    }
    script.onerror = () => {
      setError('Erro ao carregar biblioteca de reconhecimento facial')
    }
    
    if (!document.querySelector('script[src="/face-api.min.js"]')) {
      document.head.appendChild(script)
    } else if (window.faceapi) {
      loadModels()
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [loadModels])

  return (
    <Card className={`w-full max-w-md mx-auto card-dark ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="card-title-dark flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 icon-primary" />
          {mode === 'register' ? 'Registrar Face' : 'Login Facial'}
        </CardTitle>
        <CardDescription className="card-description-dark">
          {mode === 'register' 
            ? 'Posicione sua face na câmera para registrar seu reconhecimento facial'
            : 'Olhe para a câmera para fazer login com reconhecimento facial'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Área de vídeo */}
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg object-cover"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ display: 'none' }}
          />
          
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Câmera desligada
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Alertas */}
        {error && (
          <Alert className="border-red-200 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {!modelsLoaded && !error && (
          <Alert className="border-blue-200 dark:border-blue-800">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Carregando modelos de IA... Aguarde.
            </AlertDescription>
          </Alert>
        )}

        {/* Controles */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={startCamera}
              disabled={isLoading || !modelsLoaded}
              className="btn-primary-dark flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              Iniciar Câmera
            </Button>
          ) : (
            <>
              <Button
                onClick={captureFace}
                disabled={isLoading}
                className="btn-success-dark flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {mode === 'register' ? 'Registrar' : 'Entrar'}
              </Button>
              
              <Button
                onClick={stopCamera}
                disabled={isLoading}
                variant="outline"
                className="btn-outline-dark"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Parar
              </Button>
            </>
          )}
        </div>

        {/* Instruções */}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p className="font-medium">💡 Dicas para melhor reconhecimento:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Mantenha boa iluminação no rosto</li>
            <li>Olhe diretamente para a câmera</li>
            <li>Mantenha uma expressão neutra</li>
            <li>Evite óculos escuros ou máscaras</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 