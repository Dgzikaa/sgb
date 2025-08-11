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
  CheckCircle,
  Sparkles,
  Zap,
  Clock,
  Heart,
  Wallet,
  Instagram,
  Globe,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function FidelidadePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Imagens do carousel (placeholder - substituir por fotos reais do bar)
  const barImages = [
    {
      src: "/logos/ordinario-transparente.png",
      alt: "Ordinário Bar - Ambiente interno",
      caption: "Ambiente aconchegante e moderno"
    },
    {
      src: "/logos/deboche-transparente.png",
      alt: "Shows ao vivo no Ordinário",
      caption: "Música ao vivo toda semana"
    },
    {
      src: "/logos/ordinario-transparente.png",
      alt: "Drinks especiais do Ordinário",
      caption: "Drinks autorais e clássicos"
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    // Auto-play carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % barImages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [barImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % barImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + barImages.length) % barImages.length);
  };

  const beneficios = [
    {
      icon: Wallet,
      titulo: "R$ 150 em Créditos",
      descricao: "Receba R$ 150 todo mês para consumir no bar",
      destaque: true,
      gradiente: "from-green-400 to-emerald-500"
    },
    {
      icon: Crown,
      titulo: "Acesso VIP",
      descricao: "Entre sem fila e tenha prioridade no atendimento",
      destaque: false,
      gradiente: "from-yellow-400 to-amber-500"
    },
    {
      icon: Gift,
      titulo: "Drink do Mês",
      descricao: "Um drink especial exclusivo todo mês",
      destaque: false,
      gradiente: "from-amber-400 to-orange-500"
    },
    {
      icon: Star,
      titulo: "Eventos Exclusivos",
      descricao: "Convites para eventos fechados e degustações",
      destaque: false,
      gradiente: "from-orange-400 to-yellow-500"
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
    <div className="min-h-screen bg-gradient-to-br from-black via-amber-900 to-black relative overflow-hidden">
      {/* Background Pattern Moderno */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-800/10 to-yellow-800/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23D97706' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Blobs animados modernos */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full opacity-15 blur-3xl animate-bounce"></div>
      <div className="absolute -bottom-32 left-20 w-80 h-80 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      {/* Hero Section Ultra Moderno */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge Superior */}
                                    <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.6 }}
                          className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-full px-4 py-2 mb-8"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span className="text-amber-100 text-sm font-medium">Programa VIP Exclusivo</span>
                          <Crown className="w-4 h-4 text-amber-300" />
                        </motion.div>

            {/* Logo Moderno ZYKOR */}
                                    <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                          className="relative mb-12"
                        >
                          <div className="relative w-40 h-32 mx-auto mb-6">
                            {/* Logo Ordinário limpa - sem backgrounds */}
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img 
                                src="/logos/ordinario-transparente.png" 
                                alt="Ordinário Bar" 
                                className="w-full h-full object-contain"
                                style={{
                                  filter: 'drop-shadow(0 10px 25px rgba(255, 87, 34, 0.4)) drop-shadow(0 0 20px rgba(255, 87, 34, 0.3))'
                                }}
                                onError={(e) => {
                                  // Fallback se imagem não carregar
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center">
                                      <span class="text-orange-500 text-2xl font-black drop-shadow-lg">ORDINÁRIO</span>
                                    </div>
                                  `;
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-center">
                            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black bg-gradient-to-r from-white via-amber-200 to-yellow-200 bg-clip-text text-transparent mb-4 leading-none">
                              FIDELIDADE
                            </h1>
                            <p className="text-xl sm:text-2xl text-white font-normal mb-2">
                              Ordinário Bar e Música
                            </p>
                          </div>
                        </motion.div>

            {/* Proposta de Valor */}
                                    <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.6 }}
                          className="mb-12"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-3xl blur-xl"></div>
                            <div className="relative bg-black/30 backdrop-blur-md border border-amber-400/20 rounded-3xl p-8 sm:p-12">
                              <p className="text-lg sm:text-xl text-amber-100 mb-4 leading-relaxed">
                                Seja parte do círculo exclusivo do Ordinário Bar
                              </p>
                              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                                Pague <span className="text-red-400">R$ 100</span>
                              </div>
                              <div className="text-2xl sm:text-3xl md:text-4xl font-bold">
                                Ganhe <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">R$ 150</span> em créditos
                              </div>
                              <p className="text-amber-200 text-sm sm:text-base mt-4">
                                Todo mês • Renovação automática • Benefícios exclusivos
                              </p>
                            </div>
                          </div>
                        </motion.div>

            {/* CTAs Principais */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/fidelidade/lista-espera">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 transform hover:scale-105 border-0 rounded-2xl"
                >
                  <Zap className="mr-2 w-5 h-5" />
                  Lista de Espera
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/fidelidade/login">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-100 hover:bg-amber-500/30 px-8 py-4 text-lg font-semibold transition-all duration-300 rounded-2xl"
                >
                  <Heart className="mr-2 w-5 h-5" />
                  Já sou Membro
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
                                    <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 0.6 }}
                          className="flex flex-wrap items-center justify-center gap-6 text-sm text-amber-200"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span>100% Seguro</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>Ativação Imediata</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-yellow-400" />
                            <Badge className="bg-red-600/30 text-red-200 border-red-500/40">
                              Apenas 100 vagas
                            </Badge>
                          </div>
                        </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefícios Section Ultra Moderno */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-amber-900/50 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent mb-6">
              Benefícios Exclusivos
            </h2>
            <p className="text-xl text-amber-200 max-w-2xl mx-auto">
              Muito mais que um cartão fidelidade - uma experiência VIP completa
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className={`relative h-full transition-all duration-500 hover:-translate-y-2 ${
                  beneficio.destaque ? 'transform scale-105' : ''
                }`}>
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${beneficio.gradiente} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                  
                                                {/* Card */}
                              <div className="relative bg-black/20 backdrop-blur-md border border-amber-400/20 rounded-3xl p-6 h-full hover:bg-black/30 transition-all duration-500">
                                {/* Icon */}
                                <div className="text-center mb-6">
                                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${beneficio.gradiente} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <beneficio.icon className="w-8 h-8 text-black" />
                                  </div>
                                  {beneficio.destaque && (
                                    <Badge className="bg-amber-500/30 text-amber-200 border-amber-400/40 text-xs">
                                      DESTAQUE
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Content */}
                                <div className="text-center">
                                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-amber-200 transition-colors">
                                    {beneficio.titulo}
                                  </h3>
                                  <p className="text-amber-200/80 text-sm leading-relaxed">
                                    {beneficio.descricao}
                                  </p>
                                </div>
                              </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Carousel de Fotos do Bar */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-black/60 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent mb-4">
              Conheça o Ordinário
            </h2>
            <p className="text-xl text-amber-200 max-w-2xl mx-auto">
              Um ambiente único para momentos especiais
            </p>
          </motion.div>

          {/* Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative h-80 md:h-96 overflow-hidden rounded-3xl">
              {/* Imagens */}
              {barImages.map((image, index) => (
                <motion.div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                  initial={false}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback para quando as imagens não existirem
                      (e.target as HTMLImageElement).src = '/logos/ordinario-transparente.png'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Caption */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white text-lg font-semibold">
                      {image.caption}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {/* Controles */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            {/* Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {barImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-amber-400 scale-125' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Links Sociais e Contato */}
      <section className="relative py-16 border-t border-amber-400/20">
        <div className="absolute inset-0 bg-gradient-to-br from-black to-amber-900/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          
          {/* Links Sociais */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
              Siga o Ordinário
            </h3>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/ordinariobar/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Instagram className="w-6 h-6" />
                <span>@ordinariobar</span>
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </a>
              
              {/* Site */}
              <a
                href="https://www.ordinariobar.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Globe className="w-6 h-6" />
                <span>Site Oficial</span>
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </a>
            </div>
          </motion.div>

          {/* Ações Finais */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-black/30 backdrop-blur-md border border-amber-400/30 rounded-3xl p-8 max-w-md mx-auto">
              <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-4">
                Clube VIP Limitado
              </h4>
              <p className="text-amber-200 mb-6">
                Apenas 100 vagas disponíveis para garantir exclusividade
              </p>
              
              <div className="space-y-3">
                <Link href="/fidelidade/lista-espera">
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Lista de Espera
                  </Button>
                </Link>
                
                <Link href="/fidelidade/convite">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full border-2 border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-black font-semibold py-4 rounded-xl transition-all duration-300"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    Tenho um Convite
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
