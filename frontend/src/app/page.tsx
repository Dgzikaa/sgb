'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  ShoppingCart, 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Target,
  PieChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const funcionalidades = [
    {
      icon: BarChart3,
      titulo: "Gestão Completa",
      descricao: "Dashboard inteligente com métricas em tempo real",
      destaque: true,
      link: "/dashboard"
    },
    {
      icon: Users,
      titulo: "Equipe & Checklists",
      descricao: "Gerencie sua equipe e processos operacionais",
      destaque: false,
      link: "/operacoes"
    },
    {
      icon: Calendar,
      titulo: "Eventos & Shows",
      descricao: "Planeje e monitore eventos com integração total",
      destaque: false,
      link: "/gestao/eventos"
    },
    {
      icon: TrendingUp,
      titulo: "Relatórios Avançados",
      descricao: "Análises detalhadas para tomada de decisão",
      destaque: false,
      link: "/relatorios"
    },
    {
      icon: ShoppingCart,
      titulo: "Fidelidade Digital",
      descricao: "Sistema completo de fidelização de clientes",
      destaque: false,
      link: "/fidelidade"
    },
    {
      icon: PieChart,
      titulo: "Financeiro Integrado",
      descricao: "Controle financeiro com sincronização automática",
      destaque: false,
      link: "/financeiro"
    }
  ];

  const beneficios = [
    {
      icon: Zap,
      titulo: "Automação Total",
      descricao: "Sincronização automática com ContaHub, ContaAzul e outros sistemas"
    },
    {
      icon: Shield,
      titulo: "100% Seguro",
      descricao: "Dados protegidos com criptografia e backup em nuvem"
    },
    {
      icon: Clock,
      titulo: "Tempo Real",
      descricao: "Informações atualizadas instantaneamente em todos os dispositivos"
    },
    {
      icon: Target,
      titulo: "Foco no Resultado",
      descricao: "Métricas e KPIs que realmente importam para seu negócio"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5" />
        <div className="container mx-auto px-4 py-20 relative">
          <motion.div 
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-3xl text-white">🏪</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
              SGB
            </h1>
            
            <p className="text-2xl md:text-3xl font-light text-gray-700 dark:text-gray-300 mb-4">
              Sistema de Gestão de Bares
            </p>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed max-w-4xl mx-auto">
              A plataforma completa para gerenciar seu bar ou restaurante com 
              <span className="font-semibold text-blue-600 dark:text-blue-400"> inteligência artificial</span>, 
              <span className="font-semibold text-purple-600 dark:text-purple-400"> automação total</span> e 
              <span className="font-semibold text-indigo-600 dark:text-indigo-400"> relatórios em tempo real</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  Acessar Sistema
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <Link href="/visao-geral">
                <Button size="lg" className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-600 dark:hover:text-white px-8 py-4 text-xl font-semibold shadow-lg transition-all duration-300">
                  Ver Demo
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Sistema Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <span>Tempo Real</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1">
                <Star className="w-4 h-4 mr-1" />
                Sistema Premium
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Funcionalidades
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu negócio de forma inteligente e eficiente
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {funcionalidades.map((funcionalidade, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={funcionalidade.link}>
                  <Card className={`h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 cursor-pointer group ${
                    funcionalidade.destaque 
                      ? 'ring-2 ring-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>
                    <CardHeader className="text-center pb-4">
                      <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
                        funcionalidade.destaque
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20'
                      }`}>
                        <funcionalidade.icon className={`w-10 h-10 ${
                          funcionalidade.destaque ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`} />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {funcionalidade.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center text-gray-600 dark:text-gray-400 text-lg">
                        {funcionalidade.descricao}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Por que SGB?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Desenvolvido especificamente para o setor de bares e restaurantes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                  <beneficio.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {beneficio.titulo}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {beneficio.descricao}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid md:grid-cols-3 gap-8 text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-xl text-blue-100">Uptime Garantido</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-xl text-blue-100">Monitoramento</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100+</div>
              <div className="text-xl text-blue-100">Funcionalidades</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Pronto para revolucionar seu bar?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Junte-se aos estabelecimentos que já transformaram sua gestão com o SGB. 
              Sistema completo, integrado e inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 border-2 border-white px-12 py-4 text-xl font-semibold shadow-xl transition-all duration-300 transform hover:scale-105">
                  Começar Agora
                  <CheckCircle className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <Link href="/configuracoes">
                <Button size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-900 px-8 py-4 text-xl font-semibold transition-all duration-300">
                  Ver Configurações
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
