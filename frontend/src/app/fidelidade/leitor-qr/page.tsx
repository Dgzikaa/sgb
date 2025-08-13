'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  CreditCard,
  Clock,
  ArrowLeft,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

interface CheckinResult {
  success: boolean;
  membro?: {
    id: string;
    nome: string;
    email: string;
    saldo_atual: number;
  };
  checkin?: {
    data: string;
    localizacao: string;
  };
  message?: string;
  error?: string;
}

export default function LeitorQRPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup da câmera ao sair da página
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Câmera traseira por padrão
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const processQRCode = async (qrCodeData: string) => {
    if (loading) return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/fidelidade/qr-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code_token: qrCodeData }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          membro: data.membro,
          checkin: data.checkin,
          message: data.message
        });
        
        // Parar a câmera após sucesso
        stopCamera();
        
        // Auto-reset após 5 segundos
        setTimeout(() => {
          setResult(null);
        }, 5000);
      } else {
        setResult({
          success: false,
          error: data.error,
          message: data.message
        });
      }
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
      setResult({
        success: false,
        error: 'Erro de conexão. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      processQRCode(manualCode.trim());
    }
  };

  // Simular leitura de QR Code (em produção, usaria uma biblioteca como zxing-js)
  const simulateQRRead = () => {
    const testQRCodes = [
      'abc123def456', // QR Code de teste válido
      'invalid-qr',   // QR Code inválido
    ];
    
    const randomQR = testQRCodes[Math.floor(Math.random() * testQRCodes.length)];
    processQRCode(randomQR);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <QrCode className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Leitor QR Code
              </h1>
              <p className="text-blue-600 dark:text-blue-400">
                Fidelidade Ordinário Bar
              </p>
            </div>
          </div>
          
          <Link href="/configuracoes/fidelidade">
            <Button variant="ghost" className="text-blue-600 dark:text-blue-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Card Principal */}
          <Card className="card-dark shadow-xl mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                Scanner de Check-in
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Escaneie o QR Code do membro para registrar a entrada
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Resultado do Scan */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {result.success ? (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        <div className="space-y-2">
                          <p className="font-semibold text-lg">Check-in Realizado com Sucesso!</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <div>
                                <p className="text-sm opacity-75">Membro</p>
                                <p className="font-medium">{result.membro?.nome}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              <div>
                                <p className="text-sm opacity-75">Saldo</p>
                                <p className="font-medium">R$ {result.membro?.saldo_atual.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <div>
                                <p className="text-sm opacity-75">Horário</p>
                                <p className="font-medium">
                                  {result.checkin?.data ? new Date(result.checkin.data).toLocaleTimeString('pt-BR') : 'Agora'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        <div>
                          <p className="font-semibold text-lg">Erro no Check-in</p>
                          <p className="mt-1">{result.error}</p>
                          {result.message && (
                            <p className="mt-2 text-sm">{result.message}</p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}

              {/* Scanner de Câmera */}
              <div className="text-center space-y-4">
                {!isScanning ? (
                  <div>
                    <div className="w-64 h-64 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                      <Camera className="w-20 h-20 text-gray-400" />
                    </div>
                    <Button
                      onClick={startCamera}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Iniciar Scanner
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="relative w-64 h-64 mx-auto bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="absolute inset-4 border-2 border-blue-500 rounded-lg"></div>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">
                          Ativo
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center mt-4">
                      <Button
                        onClick={simulateQRRead}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Simular Leitura
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        disabled={loading}
                      >
                        Parar Scanner
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Manual */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Código Manual
                </h3>
                <div className="flex gap-3 max-w-md mx-auto">
                     <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Digite o código do QR"
                       className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg input-dark"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleManualSubmit}
                    disabled={loading || !manualCode.trim()}
                    variant="outline"
                  >
                    Verificar
                  </Button>
                </div>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-2">Como usar:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Peça ao cliente para mostrar o QR Code do app</li>
                      <li>Aponte a câmera para o código</li>
                      <li>Aguarde a leitura automática</li>
                      <li>Confirme os dados do check-in</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-dark">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check-ins Hoje</p>
              </CardContent>
            </Card>
            
            <Card className="card-dark">
              <CardContent className="p-4 text-center">
                <User className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Membros Ativos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-4 text-center">
                <Smartphone className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">100%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Digital</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
