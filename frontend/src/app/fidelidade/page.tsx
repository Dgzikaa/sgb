'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CodigoConviteValidator from '@/components/forms/CodigoConviteValidator';
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
  Wallet
} from 'lucide-react';
import Link from 'next/link';

export default function FidelidadePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

            {/* Logo Moderno ZYCOR */}
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
                            <p className="text-xl sm:text-2xl text-amber-200 font-light mb-2">
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

            {/* CTAs removidos - acesso apenas via código de convite */}

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

      {/* CTA Final Ultra Moderno com Código de Convite */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-black to-amber-800"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)]"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Badge VIP Exclusivo */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border border-amber-400/30 rounded-full px-8 py-4 mb-8 shadow-2xl">
              <Crown className="w-6 h-6 text-amber-300 animate-pulse" />
              <span className="text-amber-100 font-bold text-lg">ACESSO VIP EXCLUSIVO</span>
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>

            {/* Título Principal */}
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white mb-6 leading-none">
              Você foi
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent animate-pulse">
                CONVIDADO
              </span>
            </h2>
            
            {/* Subtítulo */}
            <p className="text-lg sm:text-xl lg:text-2xl text-amber-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Para fazer parte do círculo exclusivo de apenas 
              <span className="font-black text-amber-300 text-2xl lg:text-3xl"> 100 PESSOAS </span>
              <br className="hidden sm:block" />
              no programa VIP do Ordinário Bar
            </p>

            {/* Explicação do Fluxo */}
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/20 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
              <h3 className="text-amber-200 text-lg font-bold mb-3 text-center">Como funciona:</h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-amber-100">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</span>
                  <span>Validar código</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 transform rotate-90 sm:rotate-0" />
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</span>
                  <span>Fazer cadastro</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 transform rotate-90 sm:rotate-0" />
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</span>
                  <span>Pagar R$ 100</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 transform rotate-90 sm:rotate-0" />
                <div className="flex items-center gap-2">
                  <span className="bg-green-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">✓</span>
                  <span className="font-bold text-amber-300">R$ 150 de crédito!</span>
                </div>
              </div>
            </div>

            {/* Card Central - Oferta */}
            <div className="relative max-w-2xl mx-auto mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-3xl blur-2xl"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-amber-400/30 rounded-3xl p-8 lg:p-12 shadow-2xl">
                
                {/* Preço Especial */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-white">Investimento</div>
                    <div className="text-4xl lg:text-6xl font-black text-red-400">R$ 100</div>
                    <div className="text-sm text-red-300 opacity-80">uma única vez</div>
                  </div>
                  <ArrowRight className="w-8 h-8 text-amber-400" />
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-white">Créditos</div>
                    <div className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">R$ 150</div>
                    <div className="text-sm text-amber-300 opacity-80">todo mês</div>
                  </div>
                </div>
                
                {/* Alerta importante */}
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 mb-6">
                  <p className="text-blue-100 text-sm text-center">
                    💡 <strong>Importante:</strong> Seus créditos são ativados automaticamente após a confirmação do pagamento
                  </p>
                </div>
                
                {/* Benefícios Rápidos */}
                <div className="grid grid-cols-3 gap-4 lg:gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-green-400">50%</div>
                    <div className="text-amber-200/80 text-sm lg:text-base">Retorno garantido</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-amber-300">VIP</div>
                    <div className="text-amber-200/80 text-sm lg:text-base">Acesso exclusivo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-blue-400">100</div>
                    <div className="text-amber-200/80 text-sm lg:text-base">Vagas limitadas</div>
                  </div>
                </div>

                {/* Validador de Código de Convite */}
                <CodigoConviteValidator 
                  onValidacaoSucesso={(dados) => {
                    // Redirecionar para cadastro com dados validados
                    const params = new URLSearchParams({
                      codigo: dados.codigo,
                      cpf: dados.cpf,
                      validation_token: dados.validation_token
                    });
                    window.location.href = `/fidelidade/cadastro?${params.toString()}`;
                  }}
                  className="mb-6"
                />
              </div>
            </div>

            {/* Urgência e Trust Signals */}
            <div className="space-y-4">
              <p className="text-amber-200 text-lg font-semibold">
                ⚡ Apenas para convidados especiais • Cadastro liberado com código válido
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-300/80">
                <span>🔒 Pagamento 100% seguro</span>
                <span>📱 Créditos ativados após pagamento</span>
                <span>💳 Cartão digital imediato</span>
              </div>
              
              {/* Informação adicional sobre o fluxo */}
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-400/20">
                <p className="text-amber-200 text-xs text-center">
                  O código de convite é usado apenas para validar seu acesso ao cadastro.<br/>
                  Os R$ 150 em créditos são liberados automaticamente após a confirmação do seu pagamento.
                </p>
              </div>
            </div>

          </motion.div>
        </div>
      </section>
    </div>
  );
}
