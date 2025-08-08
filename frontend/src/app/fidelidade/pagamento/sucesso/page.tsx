'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  CheckCircle, 
  Gift, 
  Smartphone,
  Calendar,
  ArrowRight,
  Sparkles,
  Star,
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PagamentoSucessoPage() {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Esconder confetti após 3 segundos
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const proximosPassos = [
    {
      icon: Smartphone,
      titulo: "Baixe seu Cartão Digital",
      descricao: "Adicione à sua wallet para ter sempre disponível",
      acao: "Baixar Cartão",
      link: "/fidelidade/cartao-digital"
    },
    {
      icon: Gift,
      titulo: "Use seus Créditos",
      descricao: "R$ 150 já disponíveis para usar no bar",
      acao: "Ver Saldo",
      link: "/fidelidade/dashboard"
    },
    {
      icon: Calendar,
      titulo: "Agende sua Visita",
      descricao: "Mesa garantida como membro VIP",
      acao: "Reservar Mesa",
      link: "/fidelidade/dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10,
                rotate: 0,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: window.innerHeight + 10,
                rotate: 360,
                transition: {
                  duration: Math.random() * 3 + 2,
                  ease: "easeOut"
                }
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Sucesso Principal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="relative mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-32 h-32 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl"
              >
                <CheckCircle className="w-20 h-20 text-white" />
              </motion.div>
              
              {/* Sparkles ao redor */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4"
                    style={{
                      top: '50%',
                      left: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${i * 45}deg) translate(80px, -8px)`
                    }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4">
                PARABÉNS!
              </h1>
              <div className="flex items-center justify-center gap-3 mb-6">
                <Crown className="w-8 h-8 text-amber-500" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Você é VIP do Ordinário Bar!
                </h2>
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Seu pagamento foi processado com sucesso. Bem-vindo ao clube exclusivo 
                de membros VIP do Ordinário Bar!
              </p>
            </motion.div>
          </motion.div>

          {/* Card de Confirmação */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-300" />
                      Assinatura Ativa
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      Todos os benefícios VIP já estão disponíveis
                    </CardDescription>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                    ATIVO
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-3xl font-bold">R$ 150</p>
                    <p className="text-green-100">Créditos Disponíveis</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-3xl font-bold">VIP</p>
                    <p className="text-green-100">Acesso Prioritário</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-3xl font-bold">∞</p>
                    <p className="text-green-100">Eventos Exclusivos</p>
                  </div>
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="text-center">
                  <p className="text-green-100 mb-2">Próxima cobrança:</p>
                  <p className="text-xl font-semibold">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-green-100 mt-1">
                    R$ 100,00 • Cancele a qualquer momento
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Próximos Passos */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-12"
          >
            <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Próximos Passos
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {proximosPassos.map((passo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
                >
                  <Card className="h-full bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-green-200 dark:hover:border-green-700">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <passo.icon className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {passo.titulo}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {passo.descricao}
                      </p>
                      <Link href={passo.link}>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                          {passo.acao}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Ações Principais */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="text-center space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/fidelidade/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-4 text-lg font-semibold">
                  <Crown className="w-5 h-5 mr-2" />
                  Acessar Área VIP
                </Button>
              </Link>
              
              <Link href="/fidelidade/cartao-digital">
                <Button variant="outline" size="lg" className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20 px-8 py-4 text-lg">
                  <Download className="w-5 h-5 mr-2" />
                  Baixar Cartão
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mt-8">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Download className="w-4 h-4" />
                Imprimir Recibo
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Agora sou VIP do Ordinário Bar!',
                      text: 'Acabei de me tornar membro VIP do Ordinário Bar! 🍻👑',
                      url: '/fidelidade'
                    });
                  }
                }}
                className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
