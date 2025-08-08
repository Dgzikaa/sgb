'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Star, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Gift, 
  Shield, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function FidelidadePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const beneficios = [
    {
      icon: CreditCard,
      titulo: "R$ 150 em Créditos",
      descricao: "Receba R$ 150 todo mês para consumir no bar",
      destaque: true
    },
    {
      icon: Crown,
      titulo: "Acesso VIP",
      descricao: "Entre sem fila e tenha prioridade no atendimento",
      destaque: false
    },
    {
      icon: Gift,
      titulo: "Drink do Mês",
      descricao: "Um drink especial exclusivo todo mês",
      destaque: false
    },
    {
      icon: Star,
      titulo: "Eventos Exclusivos",
      descricao: "Convites para eventos fechados e degustações",
      destaque: false
    }
  ];

  const comoFunciona = [
    {
      passo: 1,
      titulo: "Cadastre-se",
      descricao: "Preencha seus dados e escolha sua forma de pagamento"
    },
    {
      passo: 2,
      titulo: "Receba seu Cartão",
      descricao: "Cartão digital na sua wallet com QR Code único"
    },
    {
      passo: 3,
      titulo: "Aproveite",
      descricao: "Use seus créditos e desfrute dos benefícios exclusivos"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-15 blur-lg animate-bounce"></div>
      <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full opacity-10 blur-2xl animate-pulse"></div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-orange-600/10 dark:from-amber-400/5 dark:to-orange-400/5" />
        <div className="container mx-auto px-4 py-20 relative">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col items-center justify-center mb-6">
              {/* Logo Container inspirado no estilo "glow" */}
              <div className="relative mb-8">
                <div className="relative w-48 h-32 mb-4">
                  {/* Forma orgânica inspirada no "glow" original */}
                  <div className="absolute inset-0 transform rotate-6">
                    {/* Blob orgânico principal */}
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 shadow-2xl"
                         style={{
                           clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                           borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%'
                         }}>
                    </div>
                    
                    {/* Blob secundário para criar profundidade */}
                    <div className="absolute inset-2 bg-gradient-to-tl from-orange-400 via-red-400 to-orange-500 transform -rotate-12"
                         style={{
                           clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
                           borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%'
                         }}>
                    </div>
                  </div>
                  
                  {/* Texto "ordinário" estilizado como no glow */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <div className="text-white font-bold text-3xl tracking-wide transform -rotate-3 relative">
                      <span className="drop-shadow-lg" style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: '800',
                        letterSpacing: '0.05em'
                      }}>
                        ordinário
                      </span>
                    </div>
                  </div>
                  
                  {/* Glow effect difuso */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 blur-2xl opacity-40 -z-10 scale-125 animate-pulse transform rotate-6"></div>
                  
                  {/* Pequenos elementos decorativos flutuantes */}
                  <div className="absolute -top-3 right-8 w-3 h-3 bg-yellow-300 rounded-full opacity-80 animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-4 w-2 h-2 bg-orange-300 rounded-full opacity-70 animate-pulse"></div>
                  <div className="absolute top-4 -right-3 w-1.5 h-1.5 bg-white rounded-full opacity-90 animate-ping"></div>
                </div>
              </div>
              
              <div className="text-center">
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
                  FIDELIDADE
                </h1>
                <p className="text-2xl md:text-3xl font-light text-gray-700 dark:text-gray-300">
                  Ordinário Bar
                </p>
                
                {/* Linha decorativa */}
                <div className="flex items-center justify-center mt-4">
                  <div className="h-1 w-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                  <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-3" />
                  <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Seja parte do círculo exclusivo do Ordinário Bar. 
              <br />
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Pague R$ 100, ganhe R$ 150 em créditos todo mês
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/fidelidade/cadastro">
                <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Quero Ser Membro VIP
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/fidelidade/login">
                <Button size="lg" className="bg-white text-amber-600 border-2 border-amber-600 hover:bg-amber-600 hover:text-white dark:bg-gray-800 dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-600 dark:hover:text-white px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-300">
                  Já sou Membro
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Vagas Limitadas</span>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Apenas 100 membros
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Benefícios Exclusivos
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Muito mais que um cartão fidelidade
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                  beneficio.destaque 
                    ? 'ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20' 
                    : 'bg-white dark:bg-gray-800'
                }`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      beneficio.destaque
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <beneficio.icon className={`w-8 h-8 ${
                        beneficio.destaque ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {beneficio.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                      {beneficio.descricao}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Simples, rápido e digital
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {comoFunciona.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-start mb-12 last:mb-0"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-6">
                  {item.passo}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {item.descricao}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <Smartphone className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <QrCode className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Cartão 100% digital na sua wallet. Sem plástico, sem complicação.
            </p>
            <Link href="/fidelidade/cadastro">
              <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-4 text-lg font-semibold shadow-xl transition-all duration-300 transform hover:scale-105">
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para ser VIP?
            </h2>
            <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
              Junte-se ao grupo exclusivo de membros do Ordinário Bar. 
              Vagas limitadas, benefícios ilimitados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/fidelidade/cadastro">
                <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50 border-2 border-white px-12 py-4 text-lg font-semibold shadow-xl transition-all duration-300 transform hover:scale-105">
                  Garantir Minha Vaga
                  <Crown className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/fidelidade/beneficios">
                <Button size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-amber-600 px-8 py-4 text-lg font-semibold transition-all duration-300">
                  Ver Todos os Benefícios
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
