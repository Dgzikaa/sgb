'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  QrCode, 
  Download, 
  Smartphone,
  Apple,
  ArrowLeft,
  Wallet,
  Share,
  Copy,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface Membro {
  id: string;
  nome: string;
  email: string;
  qr_code_token: string;
  status: string;
  saldo_atual?: number;
}

export default function CartaoDigitalPage() {
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Verificar se há dados do membro no localStorage
    const membroData = localStorage.getItem('fidelidade_membro');
    
    if (membroData) {
      try {
        const parsedMembro = JSON.parse(membroData);
        setMembro(parsedMembro);
      } catch (error) {
        console.error('Erro ao carregar dados do membro:', error);
      }
    }
    setLoading(false);
  }, []);

  const copyQRCode = () => {
    if (membro?.qr_code_token) {
      navigator.clipboard.writeText(membro.qr_code_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    // Em uma implementação real, geraria um QR Code e faria download
    alert('Download do QR Code será implementado');
  };

  const addToAppleWallet = () => {
    // Implementação para Apple Wallet
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      alert('Redirecionando para Apple Wallet...');
    } else {
      alert('Apple Wallet disponível apenas em dispositivos iOS');
    }
  };

  const addToGooglePay = () => {
    // Implementação para Google Pay
    if (navigator.userAgent.includes('Android')) {
      alert('Redirecionando para Google Pay...');
    } else {
      alert('Google Pay disponível apenas em dispositivos Android');
    }
  };

  const shareCard = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Meu Cartão VIP - Ordinário Bar',
        text: 'Confira meu cartão fidelidade VIP do Ordinário Bar!',
        url: window.location.href,
      });
    } else {
      // Fallback para dispositivos que não suportam Web Share API
      copyQRCode();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Carregando cartão...</p>
        </div>
      </div>
    );
  }

  if (!membro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Necessário
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Faça login para acessar seu cartão digital
          </p>
          <Link href="/fidelidade/login">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/fidelidade/dashboard">
            <Button variant="ghost" className="text-amber-600 dark:text-amber-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <Button variant="outline" onClick={shareCard}>
            <Share className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>

        <div className="max-w-md mx-auto">
          {/* Cartão Digital */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8 }}
            className="perspective-1000"
          >
            <Card className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden relative">
              {/* Padrão de fundo */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-10 h-10 text-amber-200" />
                    <div>
                      <CardTitle className="text-xl font-bold">FIDELIDADE VIP</CardTitle>
                      <CardDescription className="text-amber-100 text-sm">
                        Ordinário Bar
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {membro.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-6">
                {/* Informações do Membro */}
                <div>
                  <p className="text-amber-100 text-sm mb-1">MEMBRO</p>
                  <p className="text-2xl font-bold">{membro.nome.toUpperCase()}</p>
                </div>
                
                {/* QR Code */}
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <QrCode className="w-20 h-20 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-mono">
                    {membro.qr_code_token.substring(0, 12)}...
                  </p>
                </div>
                
                {/* Saldo */}
                {membro.saldo_atual !== undefined && (
                  <div className="text-center">
                    <p className="text-amber-100 text-sm mb-1">SALDO DISPONÍVEL</p>
                    <p className="text-3xl font-bold">R$ {membro.saldo_atual.toFixed(2)}</p>
                  </div>
                )}
                
                {/* ID do Cartão */}
                <div className="text-right">
                  <p className="text-amber-100 text-xs">ID: {membro.id.substring(0, 8)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ações do Cartão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 space-y-4"
          >
            {/* Adicionar à Wallet */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Adicionar à Wallet
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Tenha seu cartão sempre disponível no seu smartphone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={addToAppleWallet}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  <Apple className="w-5 h-5 mr-2" />
                  Adicionar ao Apple Wallet
                </Button>
                
                <Button 
                  onClick={addToGooglePay}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Adicionar ao Google Pay
                </Button>
              </CardContent>
            </Card>

            {/* Outras Ações */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Outras Opções
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={downloadQRCode}
                  variant="outline" 
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar QR Code
                </Button>
                
                <Button 
                  onClick={copyQRCode}
                  variant="outline" 
                  className="w-full"
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Código
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <div className="space-y-2">
                  <p className="font-semibold">Como usar seu cartão:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Apresente o QR Code na entrada do bar</li>
                    <li>Use no balcão para consumir seus créditos</li>
                    <li>Tenha sempre disponível na sua wallet</li>
                    <li>Compartilhe com amigos (somente para visualização)</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Status e Benefícios */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Status VIP Ativo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Todos os benefícios desbloqueados</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">∞</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Acessos VIP</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ 150</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Mensais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
