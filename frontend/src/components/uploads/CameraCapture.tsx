'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, X, Check, AlertTriangle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  isOpen: boolean;
  title?: string;
}

export default function CameraCapture({
  onCapture,
  onClose,
  isOpen,
  title = 'Capturar Foto',
}: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Iniciar stream da câmera
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }, [facingMode]);

  // Parar stream da câmera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Definir tamanho do canvas baseado no vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual do vídeo no canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para blob e base64
    canvas.toBlob(
      blob => {
        if (blob) {
          const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageUrl);
          stopCamera();
        }
      },
      'image/jpeg',
      0.8
    );
  }, [stopCamera]);

  // Confirmar captura
  const confirmCapture = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(
      blob => {
        if (blob) {
          onCapture(blob);
          setCapturedImage(null);
          onClose();
        }
      },
      'image/jpeg',
      0.8
    );
  }, [onCapture, onClose]);

  // Recomeçar captura
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Alternar câmera frontal/traseira
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Efeitos para gerenciar o ciclo de vida da câmera
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, capturedImage, facingMode]);

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-4xl max-h-full bg-black relative overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <h3 className="text-lg font-medium">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative w-full h-full flex items-center justify-center">
          {error ? (
            <div className="text-center text-white p-8">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-4">{error}</p>
              <Button onClick={startCamera} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                className="max-w-full max-h-full object-contain"
                playsInline
                muted
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                    <p>Iniciando câmera...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controles inferiores */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="flex items-center justify-center space-x-6">
            {capturedImage ? (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  size="lg"
                  className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Refazer
                </Button>
                <Button
                  onClick={confirmCapture}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirmar
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={toggleCamera}
                  variant="outline"
                  size="lg"
                  className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                  disabled={!isStreaming}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 w-16 h-16 rounded-full p-0"
                  disabled={!isStreaming}
                >
                  <Camera className="w-8 h-8" />
                </Button>
                <div className="w-12" /> {/* Spacer para centralizar */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
