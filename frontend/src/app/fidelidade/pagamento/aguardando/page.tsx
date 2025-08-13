'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Copy, 
  CheckCircle,
  Clock,
  ArrowLeft,
  Smartphone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import QRCodeGenerator from '@/components/fidelidade/QRCodeGenerator';

export default function AguardandoPagamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'failed'>('pending');
  const [checking, setChecking] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos em segundos

  useEffect(() => {
    if (!paymentId) {
      router.push('/fidelidade/pagamento');
      return;
    }

    // Buscar detalhes do pagamento
    fetchPaymentDetails();

    // Verificar status a cada 5 segundos
    const statusInterval = setInterval(checkPaymentStatus, 5000);

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(statusInterval);
          router.push('/fidelidade/pagamento/expirado');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(timer);
    };
  }, [paymentId, router]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/fidelidade/pagamento/webhook?payment_id=${paymentId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'pago') {
          setPaymentStatus('approved');
          setTimeout(() => {
            router.push('/fidelidade/pagamento/sucesso');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    }
  };

  const checkPaymentStatus = async () => {
    if (checking) return;
    
    setChecking(true);
    try {
      const response = await fetch(`/api/fidelidade/pagamento/webhook?payment_id=${paymentId}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'pago' || data.status === 'approved') {
          setPaymentStatus('approved');
          setTimeout(() => {
            router.push('/fidelidade/pagamento/sucesso');
          }, 2000);
        } else if (data.status === 'falhado' || data.status === 'rejected') {
          setPaymentStatus('failed');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyPixCode = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (paymentStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
            Pagamento Aprovado!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Redirecionando para sua área VIP...
          </p>
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-red-900/20 dark:to-pink-900/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Pagamento Rejeitado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Não foi possível processar seu pagamento. Tente novamente com outro método.
          </p>
          <Link href="/fidelidade/pagamento">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Tentar Novamente
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/fidelidade/pagamento">
            <Button variant="ghost" className="text-blue-600 dark:text-blue-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Clock className="w-5 h-5" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Status Principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <QrCode className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Aguardando Pagamento PIX
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              Escaneie o QR Code ou copie o código para pagar
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              O pagamento será confirmado automaticamente
            </p>
          </motion.div>

          {/* Card PIX */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="card-dark shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  Pagar com PIX
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  R$ 100,00 • Fidelidade VIP - Ordinário Bar
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="text-center">
                  <QRCodeGenerator 
                    value={pixCode || `PIX_DEMO_${paymentId}_${Date.now()}`}
                    size={256}
                    className="mx-auto mb-4"
                    errorCorrectionLevel="M"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    QR Code PIX • Válido por {formatTime(timeLeft)}
                  </p>
                </div>

                {/* Código PIX */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Ou copie o código PIX:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixCode || `PIX_CODE_${paymentId}_DEMO`}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                    <Button
                      onClick={copyPixCode}
                      disabled={copied}
                      className="px-6"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status de Verificação */}
                <div className="text-center">
                  <Button
                    onClick={checkPaymentStatus}
                    disabled={checking}
                    variant="outline"
                    className="min-w-[200px]"
                  >
                    {checking ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Verificar Pagamento
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Instruções */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <div className="space-y-2">
                  <p className="font-semibold">Como pagar com PIX:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside ml-4">
                    <li>Abra seu app de banco ou carteira digital</li>
                    <li>Escaneie o QR Code ou cole o código PIX</li>
                    <li>Confirme o pagamento de R$ 100,00</li>
                    <li>Aguarde a confirmação (geralmente instantânea)</li>
                  </ol>
                  <p className="text-xs mt-3">
                    ⚡ O pagamento PIX é processado em tempo real. 
                    Esta página será atualizada automaticamente quando o pagamento for confirmado.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Outros Métodos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Problemas com o PIX?
            </p>
            <Link href="/fidelidade/pagamento">
              <Button variant="outline">
                Tentar Outro Método
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
