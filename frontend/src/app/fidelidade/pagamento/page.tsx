'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  CreditCard, 
  Lock, 
  CheckCircle,
  ArrowLeft,
  Gift,
  Star,
  Calendar,
  Shield,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PagamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);

  const handlePayment = async (method: 'pix' | 'card') => {
    setLoading(true);
    setPaymentMethod(method);

    try {
      // Buscar dados do membro (primeiro tenta temporários, depois logado)
      let membroData = localStorage.getItem('fidelidade_membro_temp');
      
      if (!membroData) {
        // Se não tem dados temporários, buscar dados do usuário logado
        membroData = localStorage.getItem('fidelidade_membro');
      }
      
      if (!membroData) {
        throw new Error('Dados do membro não encontrados. Faça o login ou cadastro novamente.');
      }

      const membro = JSON.parse(membroData);

      if (method === 'pix') {
        // Criar pagamento PIX direto
        const response = await fetch('/api/fidelidade/pagamento/mercado-pago', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membro_id: membro.id,
            valor: 100.00
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Verificar se está em modo demonstração
          if (data.demo_mode) {
            alert(`🔧 MODO DEMONSTRAÇÃO\n\n${data.message}\n\nPIX Demo: ${data.qr_code}\n\nEm produção, aqui seria exibido o QR Code real do Mercado Pago.`);
            return;
          }
          
          // Mostrar QR Code PIX
          if (data.qr_code) {
            // Aqui você pode mostrar o QR Code em um modal
            const pixModal = confirm(`PIX gerado com sucesso!\n\nCódigo PIX: ${data.qr_code}\n\nClique OK para copiar o código PIX ou Cancelar para tentar outro método.`);
            
            if (pixModal) {
              navigator.clipboard.writeText(data.qr_code);
              alert('Código PIX copiado! Cole no seu app de pagamento.');
            }
            
            // Redirecionar para página de aguardando pagamento
            router.push(`/fidelidade/pagamento/aguardando?payment_id=${data.payment_id}`);
          }
        } else {
          throw new Error(data.error || 'Erro ao criar pagamento PIX');
        }
      } else {
        // Criar preferência para cartão
        const response = await fetch('/api/fidelidade/pagamento/mercado-pago', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membro_id: membro.id,
            payment_method: 'card',
            valor: 100.00
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Verificar se está em modo demonstração
          if (data.demo_mode) {
            alert(`🔧 MODO DEMONSTRAÇÃO\n\n${data.message}\n\nEm produção, você seria redirecionado para o checkout do Mercado Pago.`);
            return;
          }
          
          // Redirecionar para o checkout do Mercado Pago
          const checkoutUrl = process.env.NODE_ENV === 'production' 
            ? data.init_point 
            : data.sandbox_init_point;
          
          window.location.href = checkoutUrl;
        } else {
          throw new Error(data.error || 'Erro ao criar pagamento');
        }
      }
      
    } catch (error) {
      console.error('Erro no pagamento:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
      setPaymentMethod(null);
    }
  };

  const beneficiosResumo = [
    { icon: Gift, texto: "R$ 150 em créditos mensais", valor: "R$ 150" },
    { icon: Crown, texto: "Acesso VIP sem fila", valor: "Grátis" },
    { icon: Star, texto: "Eventos exclusivos", valor: "Grátis" },
    { icon: Calendar, texto: "Drink especial do mês", valor: "Grátis" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/fidelidade/cadastro">
            <Button variant="ghost" className="text-amber-600 dark:text-amber-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Pagamento Seguro</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  <div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      Fidelidade VIP
                    </CardTitle>
                    <CardDescription className="text-amber-600 dark:text-amber-400">
                      Ordinário Bar
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Preço */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      R$ 100,00
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      mensalidade
                    </p>
                    <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Receba R$ 150 em créditos
                    </Badge>
                  </div>
                </div>

                {/* Benefícios */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    O que está incluído:
                  </h3>
                  <div className="space-y-3">
                    {beneficiosResumo.map((beneficio, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <beneficio.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {beneficio.texto}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {beneficio.valor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Valor total do primeiro mês:
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ 100,00
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cancelamento a qualquer momento
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área de Pagamento */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  Finalizar Pagamento
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Escolha a forma de pagamento e finalize sua assinatura VIP
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Métodos de Pagamento */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Forma de Pagamento
                  </h3>
                  
                  <div className="grid gap-4">
                    {/* PIX */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => handlePayment('pix')}
                        disabled={loading}
                        className="w-full h-auto p-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white justify-start"
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-lg font-semibold">PIX</p>
                            <p className="text-sm opacity-90">Pagamento instantâneo • Sem taxas</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">R$ 100,00</p>
                            <Badge className="bg-white/20 text-white">
                              Recomendado
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    </motion.div>

                    {/* Cartão */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => handlePayment('card')}
                        disabled={loading}
                        className="w-full h-auto p-6 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-400 justify-start text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">Cartão de Crédito</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Elo</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">R$ 100,00</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">+ taxas do cartão</p>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Status do Pagamento */}
                {loading && paymentMethod && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                      <AlertDescription className="text-blue-700 dark:text-blue-300">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>
                            Processando pagamento via {paymentMethod === 'pix' ? 'PIX' : 'cartão'}...
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Informações de Segurança */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Pagamento 100% Seguro
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Criptografia SSL de ponta a ponta</li>
                        <li>• Dados protegidos conforme LGPD</li>
                        <li>• Processamento seguro por gateways certificados</li>
                        <li>• Possibilidade de cancelamento a qualquer momento</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Termos */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Ao finalizar o pagamento, você concorda com os{' '}
                    <Link href="/fidelidade/termos" className="text-amber-600 dark:text-amber-400 hover:underline">
                      Termos de Uso
                    </Link>{' '}
                    e{' '}
                    <Link href="/fidelidade/privacidade" className="text-amber-600 dark:text-amber-400 hover:underline">
                      Política de Privacidade
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Garantias */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Garantias e Benefícios
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sua satisfação é nossa prioridade
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Cancelamento Livre
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cancele sua assinatura a qualquer momento sem multas
                  </p>
                </div>
                
                <div>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Benefícios Imediatos
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seus créditos e benefícios VIP são ativados na hora
                  </p>
                </div>
                
                <div>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Experiência Premium
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Acesso VIP e eventos exclusivos inclusos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
