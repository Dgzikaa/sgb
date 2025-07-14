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
  // DEBUG: Log inicial reduzido
  
  // Estados
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [hasAskedPermission, setHasAskedPermission] = useState(false)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Hooks
  const { loading: pageLoading, startLoading, stopLoading } = usePageLoading('fullscreen')

  // Carregar modelos do face-api.js
  const loadModels = useCallback(async () => {
    console.log('🤖 loadModels INICIADO!')
    
    try {
      setIsLoading(true)
      startLoading('fullscreen', 'Carregando modelos de IA...')
      
      console.log('🔍 Verificando face-api...', {
        windowExists: typeof window !== 'undefined',
        faceapiExists: !!window.faceapi,
        netsExists: !!(window.faceapi && window.faceapi.nets)
      })
      
      // Verificar se face-api está disponível
      if (typeof window === 'undefined' || !window.faceapi || !window.faceapi.nets) {
        throw new Error('face-api.js não está disponível ou não foi carregado corretamente')
      }

      console.log('✅ face-api.js disponível!')

      // URLs de modelos com fallback para CDN
      const modelUrls = [
        '/models', // Local primeiro
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights', // CDN fallback
      ]
      
      // Carregar modelos com timeout e retry
      const loadModelWithFallback = async (modelName: string, loadFunction: (url: string) => Promise<void>) => {
        for (const modelUrl of modelUrls) {
          try {
            // Log removido para reduzir verbosidade
            
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error(`Timeout ao carregar ${modelName}`)), 20000)
            })
            
            await Promise.race([loadFunction(modelUrl), timeoutPromise])
            console.log(`✅ ${modelName} carregado com sucesso de: ${modelUrl}`)
            return
            
          } catch (error) {
            console.warn(`⚠️ Erro ao carregar ${modelName} de ${modelUrl}:`, error)
            if (modelUrl === modelUrls[modelUrls.length - 1]) {
              throw new Error(`Falha ao carregar ${modelName} de todas as fontes`)
            }
            continue
          }
        }
      }
      
      // Carregar apenas os modelos essenciais
      console.log('📂 Iniciando carregamento dos modelos essenciais...')
      
      await Promise.all([
        loadModelWithFallback(
          'TinyFaceDetector',
          (url) => window.faceapi.nets.tinyFaceDetector.loadFromUri(url)
        ),
        loadModelWithFallback(
          'FaceLandmark68Net',
          (url) => window.faceapi.nets.faceLandmark68Net.loadFromUri(url)
        ),
        loadModelWithFallback(
          'FaceRecognitionNet',
          (url) => window.faceapi.nets.faceRecognitionNet.loadFromUri(url)
        )
      ])

      // Verificar se os modelos foram realmente carregados
      const isLoaded = window.faceapi.nets.tinyFaceDetector.isLoaded &&
                      window.faceapi.nets.faceLandmark68Net.isLoaded &&
                      window.faceapi.nets.faceRecognitionNet.isLoaded

      if (!isLoaded) {
        throw new Error('Modelos não foram carregados corretamente')
      }

      setModelsLoaded(true)
      setError(null)
      console.log('✅ Todos os modelos de IA carregados e validados com sucesso')
      
    } catch (error) {
      console.error('❌ Erro detalhado ao carregar modelos:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      if (errorMessage.includes('Timeout')) {
        setError('Conexão lenta detectada. Tente com melhor sinal de internet.')
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch') || errorMessage.includes('404')) {
        setError('Problema de conectividade. Verifique sua internet e tente novamente.')
      } else if (errorMessage.includes('face-api.js não está')) {
        setError('Sistema de IA não carregado. Recarregue a página.')
      } else {
        setError('Erro ao inicializar reconhecimento facial. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
      stopLoading()
    }
  }, [startLoading, stopLoading])

  // Função para recarregar tudo
  const retryLoadModels = useCallback(async () => {
    setError(null)
    setModelsLoaded(false)
    
    // Remover script existente
    const existingScript = document.querySelector('script[src*="face-api"]')
    if (existingScript) {
      existingScript.remove()
    }
    
    // Limpar window.faceapi
    if (window.faceapi) {
      delete window.faceapi
    }
    
    // Aguardar um pouco antes de tentar novamente
    setTimeout(() => {
      loadModels()
    }, 500)
  }, [loadModels])

  // Verificar permissões da câmera
  const checkCameraPermissions = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu dispositivo não suporta acesso à câmera')
      }

      // Verificar permissões usando API de Permissions se disponível
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          setCameraPermission(permission.state)
          
          // Escutar mudanças de permissão
          permission.addEventListener('change', () => {
            setCameraPermission(permission.state)
          })
          
          return permission.state
        } catch (error) {
          console.warn('API de Permissions não suportada, usando fallback')
        }
      }

      // Fallback: tentar acessar diretamente
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        })
        testStream.getTracks().forEach(track => track.stop())
        setCameraPermission('granted')
        return 'granted'
      } catch (error) {
        setCameraPermission('denied')
        return 'denied'
      }
      
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      setCameraPermission('denied')
      return 'denied'
    }
  }, [])

  // Solicitar permissões da câmera
  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null)
      setHasAskedPermission(true)
      setIsLoading(true)
      
      console.log('🔐 Solicitando permissão da câmera...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      // Se chegou aqui, permissão foi concedida
      setCameraPermission('granted')
      console.log('✅ Permissão da câmera concedida')
      
      // Parar o stream temporário
      stream.getTracks().forEach(track => track.stop())
      
      // Se modelos não estão carregados, tentar carregar automaticamente
      if (!modelsLoaded) {
        console.log('🤖 Carregando modelos automaticamente após permissão...')
        await loadModels()
      }
      
      setSuccess('Câmera permitida! Agora você pode iniciar o reconhecimento facial.')
      
      return true
    } catch (error: any) {
      console.error('Erro ao solicitar permissão:', error)
      setCameraPermission('denied')
      
      if (error.name === 'NotAllowedError') {
        setError('Acesso à câmera foi negado. Por favor, permita o acesso nas configurações do navegador.')
      } else if (error.name === 'NotFoundError') {
        setError('Nenhuma câmera foi encontrada neste dispositivo.')
      } else if (error.name === 'NotSupportedError') {
        setError('Seu navegador não suporta acesso à câmera.')
      } else {
        setError('Erro ao acessar a câmera. Verifique se não está sendo usada por outro aplicativo.')
      }
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [modelsLoaded, loadModels])

  // Verificar permissões na inicialização
  useEffect(() => {
    // Log removido para reduzir verbosidade
    checkCameraPermissions()
  }, [checkCameraPermissions])

  // Inicializar câmera
  const startCamera = useCallback(async () => {
    console.log('🎬 startCamera CHAMADO!')
    
    try {
      console.log('📋 Estados atuais:', { 
        modelsLoaded, 
        cameraPermission, 
        isLoading,
        hasAskedPermission 
      })
      
      setError(null)
      setSuccess(null)
      
      // Verificar se modelos estão carregados
      if (!modelsLoaded) {
        console.log('❌ Modelos não carregados')
        setError('Aguarde o carregamento dos modelos de IA.')
        return
      }

      console.log('✅ Modelos carregados, verificando permissões...')

      // Verificar permissões antes de tentar acessar
      const permissionState = await checkCameraPermissions()
      console.log('🔐 Permission state:', permissionState)
      
      if (permissionState === 'denied') {
        console.log('❌ Permissão negada')
        setError('Acesso à câmera negado. Clique em "Permitir Câmera" para solicitar acesso.')
        return
      }

      console.log('📷 Iniciando câmera...')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        }
      })

      console.log('🎥 Stream obtido:', {
        id: mediaStream.id,
        tracks: mediaStream.getTracks().length,
        videoTracks: mediaStream.getVideoTracks().length,
        active: mediaStream.active
      })

      setStream(mediaStream)
      setCameraPermission('granted')
      console.log('💾 Stream salvo no state')
      
      if (videoRef.current) {
        // Configurar vídeo para exibir stream
        console.log('📷 Configurando vídeo element...')
        const video = videoRef.current
        
        // Limpar qualquer src anterior
        video.srcObject = null
        
        // Configurar evento de carregamento ANTES de definir srcObject
        video.onloadedmetadata = async () => {
          console.log('📺 Vídeo metadata carregado:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            duration: video.duration,
            readyState: video.readyState,
            srcObject: !!video.srcObject
          })
          
          try {
            await video.play()
            console.log('▶️ Vídeo reproduzindo com sucesso')
            // Só definir isRecording DEPOIS que o vídeo estiver reproduzindo
            setIsRecording(true)
          } catch (playError) {
            console.error('❌ Erro ao reproduzir vídeo:', playError)
            setError('Erro ao reproduzir vídeo da câmera. Tente recarregar a página.')
            setIsRecording(false)
          }
        }
        
        video.onerror = (error: any) => {
          console.error('❌ Erro no elemento de vídeo:', error)
          setError('Erro no player de vídeo. Tente recarregar a página.')
          setIsRecording(false)
        }

        video.onplaying = () => {
          console.log('🎬 Vídeo: evento playing disparado')
          console.log('🎥 Estado atual do vídeo:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            currentTime: video.currentTime,
            paused: video.paused,
            muted: video.muted
          })
          setIsRecording(true)
        }

        video.onpause = () => {
          console.log('⏸️ Vídeo: pausado')
        }

        video.oncanplay = () => {
          console.log('🎯 Vídeo: pode ser reproduzido')
        }

        video.onseeking = () => {
          console.log('🔄 Vídeo: seeking')
        }

        video.onwaiting = () => {
          console.log('⏳ Vídeo: aguardando dados')
        }
        
        // Definir stream no vídeo
        console.log('📹 Definindo stream no vídeo...', {
          streamActive: mediaStream.active,
          streamTracks: mediaStream.getTracks().length,
          videoTracks: mediaStream.getVideoTracks().length
        })
        
        video.srcObject = mediaStream
        console.log('✅ Stream definido no elemento de vídeo')
        
        // Verificar se o vídeo tem conteúdo após um breve delay
        setTimeout(() => {
          console.log('🔍 Verificação após 1s:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState,
            currentTime: video.currentTime,
            paused: video.paused,
            srcObject: !!video.srcObject
          })
        }, 1000)
        
        // Forçar play imediatamente se o navegador permitir
        try {
          const playPromise = video.play()
          if (playPromise !== undefined) {
            await playPromise
            console.log('🚀 Play forçado com sucesso')
          }
        } catch (playError) {
          console.warn('⚠️ Play automático bloqueado, aguardando interação do usuário:', playError)
        }
        
        // Timeout de segurança para remover overlay se vídeo não carregar
        setTimeout(() => {
          if (mediaStream.active && !isRecording) {
            console.log('⏰ Timeout: Forçando remoção do overlay')
            console.log('📊 Estado final do vídeo:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
              paused: video.paused,
              currentTime: video.currentTime,
              srcObject: !!video.srcObject
            })
            setIsRecording(true)
          }
        }, 3000) // Aumentado para 3 segundos
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao acessar câmera:', error)
      
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied')
        setError('Acesso à câmera foi negado. Use o botão "Permitir Câmera" para tentar novamente.')
      } else if (error.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada. Verifique se seu dispositivo possui câmera.')
      } else if (error.name === 'NotReadableError') {
        setError('Câmera está sendo usada por outro aplicativo. Feche outros apps que usam câmera.')
      } else {
        setError('Erro ao inicializar câmera. Tente novamente.')
      }
    }
  }, [modelsLoaded, checkCameraPermissions])

  // Parar câmera
  const stopCamera = useCallback(() => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop()
          console.log(`📷 Track parado: ${track.kind}`)
        })
        setStream(null)
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.onloadedmetadata = null
      }
      
      setIsRecording(false)
      setError(null)
      console.log('📷 Câmera parada completamente')
    } catch (error) {
      console.error('Erro ao parar câmera:', error)
    }
  }, [stream])

  // Capturar e processar face
  const captureFace = async () => {
    console.log('📸 captureFace CHAMADO!')
    console.log('🔍 Estados para captura:', {
      hasVideo: !!videoRef.current,
      hasCanvas: !!canvasRef.current,
      modelsLoaded,
      stream: !!stream,
      userEmail,
      barId,
      mode
    })
    
    // Verificar se dados obrigatórios estão presentes
    if (mode === 'register' && (!userEmail || !barId)) {
      console.log('❌ Dados de usuário não fornecidos para registro')
      setError('Erro: dados de usuário não fornecidos. Você precisa estar logado para registrar sua face.')
      return
    }
    
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      console.log('❌ Sistema não está pronto para captura')
      setError('Sistema não está pronto. Tente novamente.')
      return
    }

    try {
      setIsLoading(true)
      startLoading('fullscreen', 'Processando reconhecimento facial...')
      console.log('🎬 Iniciando processo de captura...')
      
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Verificação simplificada do vídeo
      console.log('🔍 Estado atual do vídeo:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime
      })

      // Forçar play se pausado
      if (video.paused) {
        console.log('🎬 Forçando reprodução do vídeo...')
        await video.play().catch(console.warn)
      }

      // Aguardar um pouco para o vídeo se estabilizar
      await new Promise(resolve => setTimeout(resolve, 500))

      // Se ainda não tem dimensões, usar dimensões padrão do canvas
      let videoWidth = video.videoWidth || 640
      let videoHeight = video.videoHeight || 480
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('⚠️ Vídeo sem dimensões detectadas, usando valores padrão:', { videoWidth, videoHeight })
      } else {
        console.log('✅ Dimensões do vídeo detectadas:', { videoWidth, videoHeight })
      }
      
      // Configurar canvas com as dimensões
      canvas.width = videoWidth
      canvas.height = videoHeight
      const ctx = canvas.getContext('2d')!
      
      console.log('🎨 Desenhando frame no canvas...')
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
      
      console.log('🤖 Detectando face no frame...')
      const detections = await window.faceapi
        .detectAllFaces(canvas, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors()

      console.log('🔍 Detecções encontradas:', detections?.length || 0)
      
      if (!detections || detections.length === 0) {
        console.log('❌ Nenhuma face detectada')
        setError('Nenhuma face foi detectada. Certifique-se de que seu rosto está visível e bem iluminado.')
        return
      }

      if (detections.length > 1) {
        console.log('⚠️ Múltiplas faces detectadas')
        setError('Múltiplas faces detectadas. Certifique-se de que apenas uma pessoa está visível.')
        return
      }

      const detection = detections[0]
      const descriptor = Array.from(detection.descriptor) as number[]
      const confidence = detection.detection.score

      console.log('✅ Face capturada com sucesso!', {
        confidence: confidence.toFixed(3),
        descriptorLength: descriptor.length
      })

      if (mode === 'register') {
        await handleRegister(descriptor, confidence)
      } else {
        await handleLogin(descriptor, confidence)
      }

    } catch (error: any) {
      console.error('❌ Erro ao capturar face:', error)
      setError(error.message || 'Erro ao processar reconhecimento facial. Tente novamente.')
    } finally {
      setIsLoading(false)
      stopLoading()
    }
  }

  // Registrar nova face
  const handleRegister = async (descriptor: number[], confidence: number) => {
    console.log('💾 handleRegister INICIADO!')
    console.log('📊 Dados para registro:', {
      descriptorLength: descriptor.length,
      confidence,
      userEmail,
      barId,
      hasDescriptor: !!descriptor
    })
    
    try {
      console.log('📡 Enviando para API /api/auth/face/register...')
      
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

      console.log('📨 Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      const result = await response.json()
      console.log('📋 Resultado da API:', result)

      if (!result.success) {
        throw new Error(result.error || 'Erro ao registrar face')
      }

      console.log('✅ Face registrada com sucesso!')
      setSuccess('Face registrada com sucesso! 🎉')
      stopCamera()
      onSuccess({ descriptor, confidence })
      
    } catch (error: any) {
      console.error('❌ Erro no handleRegister:', error)
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

  // Carregar face-api.js com fallback de CDN
  useEffect(() => {
    const loadFaceAPIScript = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        // Verificar se já está carregado
        if (window.faceapi) {
          console.log('📚 face-api.js já carregado')
          await loadModels()
          return
        }

        // Se já existe script, remover para tentar novamente
        const existingScript = document.querySelector('script[src*="face-api"]')
        if (existingScript) {
          existingScript.remove()
        }

        // Lista de URLs para tentar (CDN primeiro para melhor confiabilidade)
        const scriptUrls = [
          'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js', // CDN principal
          'https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js', // CDN alternativo
          '/face-api.min.js' // Local por último
        ]

        for (const url of scriptUrls) {
          try {
            console.log(`📚 Tentando carregar face-api.js de: ${url}`)
            
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script')
              script.src = url
              script.async = true
              script.crossOrigin = 'anonymous' // Para evitar problemas de CORS
              
              script.onload = () => {
                console.log(`✅ face-api.js carregado de: ${url}`)
                // Aguardar um pouco para garantir que está disponível
                setTimeout(resolve, 100)
              }
              
              script.onerror = () => {
                console.warn(`❌ Falha ao carregar de: ${url}`)
                script.remove()
                reject(new Error(`Falha ao carregar ${url}`))
              }
              
              // Timeout de 10 segundos (mais rápido)
              setTimeout(() => {
                script.remove()
                reject(new Error(`Timeout ao carregar ${url}`))
              }, 10000)
              
              document.head.appendChild(script)
            })

            // Verificar se realmente carregou
            if (window.faceapi && typeof window.faceapi.nets !== 'undefined') {
              console.log('✅ face-api.js validado e pronto')
              await loadModels()
              return
            } else {
              console.warn('⚠️ face-api.js carregou mas não está funcional')
              continue
            }
          } catch (error) {
            console.warn(`Erro ao carregar de ${url}:`, error)
            continue // Tenta próxima URL
          }
        }

        // Se chegou aqui, falhou em todas as tentativas
        throw new Error('Falha em carregar face-api.js de todas as fontes')
        
      } catch (error) {
        console.error('❌ Erro fatal ao carregar face-api.js:', error)
        setError('Erro ao carregar sistema de reconhecimento facial. Verifique sua conexão e tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }

    loadFaceAPIScript()
  }, [loadModels])

  // Renderização...

  return (
    <Card className={`w-full max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          {mode === 'register' ? 'Registrar Face' : 'Login Facial'}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'register' 
            ? 'Posicione sua face na câmera para registrar seu reconhecimento facial'
            : 'Olhe para a câmera para fazer login com reconhecimento facial'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Área de vídeo */}
        <div className="relative overflow-hidden rounded-lg">
          <video
            ref={videoRef}
            className="w-full h-64 rounded-lg object-cover"
            autoPlay
            muted
            playsInline
            style={{ 
              display: 'block',
              transform: 'scaleX(-1)', // Espelhar horizontalmente
              minHeight: '256px',
              maxHeight: '256px',
              width: '100%',
              backgroundColor: '#1f2937', // Fundo escuro sempre
              zIndex: 1
            }}
            onLoadedData={() => {
              console.log('📺 Vídeo: dados carregados')
              console.log('📐 Dimensões do vídeo:', {
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight,
                clientWidth: videoRef.current?.clientWidth,
                clientHeight: videoRef.current?.clientHeight
              })
            }}
            onPlay={() => {
              console.log('▶️ Vídeo: reproduzindo')
              setIsRecording(true)
            }}
            onError={(e) => console.error('❌ Vídeo: erro', e)}
            onCanPlay={() => console.log('🎬 Vídeo: pode reproduzir')}
            onLoadedMetadata={() => {
              console.log('📊 Vídeo: metadata carregado')
              console.log('🎥 Estado do vídeo:', {
                srcObject: !!videoRef.current?.srcObject,
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight,
                readyState: videoRef.current?.readyState
              })
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ display: 'none', zIndex: 0 }}
          />
          
          {/* Overlay quando câmera não está ativa */}
          {(!stream || !isRecording) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 dark:bg-gray-900/90 rounded-lg z-20">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-400" />
                <p className="text-sm text-gray-200 dark:text-gray-300">
                  {stream && !isRecording ? 'Iniciando câmera...' : 'Câmera desligada'}
                </p>
                {stream && !isRecording && (
                  <div className="mt-2">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Indicador AO VIVO */}
          {isRecording && stream && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 z-30">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              AO VIVO
            </div>
          )}

          {/* Debug info - remover em produção */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-2 rounded z-30">
              <div>Stream: {stream ? '✅' : '❌'}</div>
              <div>Recording: {isRecording ? '✅' : '❌'}</div>
              <div>Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</div>
              {stream && !isRecording && (
                <button 
                  onClick={async () => {
                    if (videoRef.current) {
                      try {
                        await videoRef.current.play()
                        console.log('🎯 Vídeo ativado manualmente')
                      } catch (e) {
                        console.error('❌ Erro ao ativar vídeo:', e)
                      }
                    }
                  }}
                  className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  ▶️ Ativar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Alertas */}
        {error && (
          <Alert className="border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-red-700 dark:text-red-300 mb-2">
                  {error}
                </AlertDescription>
                <Button
                  onClick={retryLoadModels}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    '🔄'
                  )}
                  Tentar Novamente
                </Button>
              </div>
            </div>
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
            <div className="flex items-start gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-blue-700 dark:text-blue-300 mb-2">
                  Carregando modelos de reconhecimento facial...
                  <br />
                  <span className="text-xs">Isso pode levar alguns segundos na primeira vez.</span>
                </AlertDescription>
                <Button
                  onClick={retryLoadModels}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    '⚡'
                  )}
                  Acelerar Carregamento
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Sistema de Permissões */}
        {cameraPermission === 'denied' && hasAskedPermission && (
          <Alert className="border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <div className="flex-1">
              <AlertDescription className="text-orange-700 dark:text-orange-300 mb-3">
                <strong>Câmera Bloqueada</strong><br />
                Para usar o reconhecimento facial, você precisa permitir acesso à câmera.
              </AlertDescription>
              <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1 mb-3">
                <p><strong>Como permitir no celular:</strong></p>
                <p>• Toque no ícone 🔒 ou ⚙️ na barra de endereço</p>
                <p>• Selecione "Permitir" para Câmera</p>
                <p>• Recarregue a página se necessário</p>
              </div>
              <Button
                onClick={requestCameraPermission}
                size="sm"
                className="btn-primary-dark"
              >
                <Camera className="w-3 h-3 mr-1" />
                Permitir Câmera
              </Button>
            </div>
          </Alert>
        )}

        {cameraPermission === 'prompt' && !hasAskedPermission && (
          <Alert className="border-blue-200 dark:border-blue-800">
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <AlertDescription className="text-blue-700 dark:text-blue-300 mb-2">
                Para começar, precisamos acessar sua câmera para o reconhecimento facial.
              </AlertDescription>
              <Button
                onClick={requestCameraPermission}
                disabled={isLoading}
                size="sm"
                className="btn-primary-dark"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 mr-1" />
                )}
                Permitir Acesso à Câmera
              </Button>
            </div>
          </Alert>
        )}

        {/* Status do Sistema */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span>🤖 Modelos de IA:</span>
            {modelsLoaded ? (
              <span className="text-green-600 dark:text-green-400 font-medium">✅ Carregados</span>
            ) : isLoading ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">🔄 Carregando...</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-medium">❌ Não carregados</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>📷 Câmera:</span>
            {cameraPermission === 'granted' ? (
              <span className="text-green-600 dark:text-green-400 font-medium">✅ Permitida</span>
            ) : cameraPermission === 'denied' ? (
              <span className="text-red-600 dark:text-red-400 font-medium">❌ Negada</span>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">⏳ Pendente</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>🎯 Status:</span>
            {isRecording && stream ? (
              <span className="text-green-600 dark:text-green-400 font-medium">🟢 Gravando ({stream.getTracks().length} tracks)</span>
            ) : isRecording && !stream ? (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">🟡 Iniciando...</span>
            ) : modelsLoaded && cameraPermission === 'granted' ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">🔵 Pronto</span>
            ) : (
              <span className="text-gray-600 dark:text-gray-400 font-medium">⚪ Aguardando</span>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={() => {
                console.log('🖱️ Botão Iniciar Câmera CLICADO!')
                console.log('📊 Estado do botão:', {
                  disabled: isLoading || !modelsLoaded || cameraPermission !== 'granted',
                  isLoading,
                  modelsLoaded,
                  cameraPermission
                })
                startCamera()
              }}
              disabled={isLoading || !modelsLoaded || cameraPermission !== 'granted'}
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
                onClick={() => {
                  console.log('🔘 Botão Registrar/Entrar CLICADO!')
                  console.log('📊 Modo atual:', mode)
                  console.log('🔒 isLoading:', isLoading)
                  captureFace()
                }}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium px-6 py-2 rounded-lg transition-colors flex-1"
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
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <div>
            <p className="font-medium">💡 Dicas para melhor reconhecimento:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs mt-1">
              <li>Mantenha boa iluminação no rosto</li>
              <li>Olhe diretamente para a câmera</li>
              <li>Mantenha uma expressão neutra</li>
              <li>Evite óculos escuros ou máscaras</li>
            </ul>
          </div>
          
          {cameraPermission !== 'granted' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <p className="font-medium">📱 Sobre permissões:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs mt-1">
                <li>É seguro permitir acesso - não gravamos imagens</li>
                <li>Processamos apenas no seu dispositivo</li>
                <li>Você pode revogar a permissão a qualquer momento</li>
                <li>Sem permissão, o reconhecimento facial não funciona</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 