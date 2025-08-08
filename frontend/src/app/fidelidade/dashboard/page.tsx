'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  CreditCard, 
  QrCode, 
  Download, 
  History,
  Gift,
  Calendar,
  Smartphone,
  LogOut,
  Settings,
  Star,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCodeGenerator from '@/components/fidelidade/QRCodeGenerator';

interface Membro {
  id: string;
  nome: string;
  email: string;
  status: string;
  qr_code_token: string;
  data_adesao: string;
  proxima_cobranca: string;
  fidelidade_saldos?: {
    saldo_atual: number;
    saldo_mes_atual: number;
  }[];
}

export default function DashboardFidelidadePage() {
  const router = useRouter();
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há dados do membro no localStorage
    const membroData = localStorage.getItem('fidelidade_membro');
    
    if (!membroData) {
      router.push('/fidelidade/login');
      return;
    }

    try {
      const parsedMembro = JSON.parse(membroData);
      setMembro(parsedMembro);
    } catch (error) {
      console.error('Erro ao carregar dados do membro:', error);
      router.push('/fidelidade/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('fidelidade_membro');
    router.push('/fidelidade');
  };

  const addToWallet = () => {
    if (!membro) return;

    // Criar dados para o cartão digital
    const cardData = {
      name: 'Fidelidade VIP - Ordinário Bar',
      description: `Membro: ${membro.nome}`,
      backgroundColor: '#F59E0B', // amber-500
      foregroundColor: '#FFFFFF',
      barcode: {
        message: membro.qr_code_token,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      }
    };

    // Para dispositivos iOS (Apple Wallet)
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      // Aqui você implementaria a integração com Apple Wallet
      alert('Redirecionando para Apple Wallet...');
    }
    // Para dispositivos Android (Google Pay)
    else if (navigator.userAgent.includes('Android')) {
      // Aqui você implementaria a integração com Google Pay
      alert('Redirecionando para Google Pay...');
    }
    // Para outros dispositivos
    else {
      // Gerar QR Code para download
      alert('QR Code será baixado como imagem');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Carregando sua área VIP...</p>
        </div>
      </div>
    );
  }

  if (!membro) {
    return null;
  }

  const saldo = membro.fidelidade_saldos?.[0]?.saldo_atual || 0;
  const saldoMesAtual = membro.fidelidade_saldos?.[0]?.saldo_mes_atual || 0;

  const statusColor = {
    'ativo': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'pendente': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'suspenso': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'cancelado': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  };

  const statusText = {
    'ativo': 'Ativo',
    'pendente': 'Pagamento Pendente',
    'suspenso': 'Suspenso',
    'cancelado': 'Cancelado'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Crown className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Olá, {membro.nome.split(' ')[0]}!
              </h1>
              <p className="text-amber-600 dark:text-amber-400">
                Membro VIP do Ordinário Bar
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={statusColor[membro.status as keyof typeof statusColor]}>
              {statusText[membro.status as keyof typeof statusText]}
            </Badge>
            <Button variant="ghost" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cartão Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Saldo e Créditos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">Saldo Disponível</CardTitle>
                      <CardDescription className="text-amber-100">
                        Para usar no Ordinário Bar
                      </CardDescription>
                    </div>
                    <CreditCard className="w-12 h-12 text-amber-200" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-4xl font-bold">
                        R$ {saldo.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-amber-100 text-sm">
                        Usado este mês: R$ {saldoMesAtual.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4">
                      <Button 
                        onClick={addToWallet}
                        className="bg-white text-amber-600 hover:bg-amber-50 flex-1"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Adicionar à Wallet
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-white text-white hover:bg-white/10"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Ver QR Code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Benefícios Ativos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Seus Benefícios VIP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <Gift className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Drink do Mês</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Disponível</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Crown className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Acesso VIP</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Sem fila</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Eventos</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Exclusivos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">R$ 150/mês</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Em créditos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Histórico Recente */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Histórico Recente
                  </CardTitle>
                  <Link href="/fidelidade/historico">
                    <Button variant="outline" size="sm">
                      Ver Tudo
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Crédito Mensal</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">01/01/2024</p>
                      </div>
                      <p className="text-green-600 dark:text-green-400 font-semibold">+R$ 150,00</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Consumo no Bar</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">28/12/2023</p>
                      </div>
                      <p className="text-red-600 dark:text-red-400 font-semibold">-R$ 45,00</p>
                    </div>
                    
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Últimas transações
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white dark:bg-gray-800 text-center">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Seu QR Code
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Use na entrada do bar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QRCodeGenerator 
                    value={membro.qr_code_token}
                    size={128}
                    className="mx-auto mb-4"
                    errorCorrectionLevel="H"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {membro.qr_code_token.substring(0, 8)}...
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={addToWallet}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar QR Code
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Informações da Conta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Minha Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Membro desde</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(membro.data_adesao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Próxima cobrança</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(membro.proxima_cobranca).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Link href="/fidelidade/configuracoes">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </Button>
                    </Link>
                    
                    <Link href="/fidelidade/suporte">
                      <Button variant="outline" size="sm" className="w-full">
                        Suporte
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
