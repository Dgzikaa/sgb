'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap,
  ArrowRight,
  CheckCircle,
  Target,
  PieChart,
  Activity,
  Mail,
  Phone,
  Send,
  Smartphone,
  Globe,
  Database,
  Cpu,
  FileBarChart,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ nome: '', email: '', telefone: '', empresa: '', mensagem: '' });
      } else {
        setError('Erro ao enviar mensagem. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const funcionalidades = [
    {
      icon: BarChart3,
      titulo: "Gestão Inteligente",
      descricao: "Dashboard completo com métricas em tempo real para seu bar",
      destaque: true,
      cor: "from-blue-500 via-blue-600 to-indigo-600",
      gradient: "bg-gradient-to-br from-blue-500/20 to-indigo-600/20"
    },
    {
      icon: FileBarChart,
      titulo: "Relatórios Avançados",
      descricao: "Análises detalhadas de vendas, performance e insights estratégicos",
      destaque: true,
      cor: "from-amber-500 via-orange-500 to-red-500",
      gradient: "bg-gradient-to-br from-amber-500/20 to-red-500/20"
    },
    {
      icon: Users,
      titulo: "Gestão de Equipe",
      descricao: "Controle de funcionários, checklists e processos operacionais",
      destaque: false,
      cor: "from-purple-500 via-purple-600 to-pink-600",
      gradient: "bg-gradient-to-br from-purple-500/10 to-pink-600/10"
    },
    {
      icon: Database,
      titulo: "Automação Total",
      descricao: "Integração automática com ContaHub, ContaAzul e sistemas fiscais",
      destaque: false,
      cor: "from-green-500 via-emerald-600 to-teal-600",
      gradient: "bg-gradient-to-br from-green-500/10 to-teal-600/10"
    },
    {
      icon: Smartphone,
      titulo: "Mobile First",
      descricao: "Acesso completo via celular, tablet e desktop",
      destaque: false,
      cor: "from-indigo-500 via-blue-600 to-cyan-600",
      gradient: "bg-gradient-to-br from-indigo-500/10 to-cyan-600/10"
    },
    {
      icon: Shield,
      titulo: "Pagamentos Seguros",
      descricao: "Integração com Mercado Pago, PIX e cartões",
      destaque: false,
      cor: "from-red-500 via-rose-600 to-pink-600",
      gradient: "bg-gradient-to-br from-red-500/10 to-pink-600/10"
    }
  ];

  const beneficios = [
    {
      icon: Zap,
      titulo: "Automação Total",
      descricao: "Integração automática com ContaHub, ContaAzul e sistemas fiscais",
      cor: "from-blue-400 to-blue-500"
    },
    {
      icon: Clock,
      titulo: "Tempo Real",
      descricao: "Informações atualizadas instantaneamente em todos os dispositivos",
      cor: "from-blue-400 to-cyan-500"
    },
    {
      icon: Target,
      titulo: "Resultados Comprovados",
      descricao: "Aumento médio de 40% na eficiência operacional",
      cor: "from-green-400 to-emerald-500"
    },
    {
      icon: Globe,
      titulo: "Na Nuvem",
      descricao: "Acesse de qualquer lugar, dados sempre seguros e atualizados",
      cor: "from-purple-400 to-violet-500"
    }
  ];

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden h-[70vh] flex items-center">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl"
            style={{ y: y1 }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-amber-500/10 via-orange-500/10 to-transparent rounded-full blur-3xl"
            style={{ y: y2 }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-2 h-2 bg-amber-400/60 rounded-full"
            animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-40 right-20 w-1 h-1 bg-blue-400/60 rounded-full"
            animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-purple-400/60 rounded-full"
            animate={{ y: [0, -25, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div 
            className="text-center max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo Principal */}
            <motion.div 
              className="flex items-center justify-center mb-8 md:mb-10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="relative group">
                {/* Glow effect múltiplo para mais destaque */}
                <div className="absolute -inset-12 md:-inset-16 bg-gradient-to-r from-purple-500/30 via-violet-600/50 to-purple-700/30 rounded-full blur-3xl opacity-70 group-hover:opacity-90 transition duration-1000 animate-pulse"></div>
                <div className="absolute -inset-8 md:-inset-12 bg-gradient-to-r from-violet-400/40 via-purple-500/60 to-violet-600/40 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition duration-1000"></div>
                
                {/* Anel de luz animado */}
                <motion.div 
                  className="absolute -inset-6 md:-inset-10 border-2 border-purple-400/20 rounded-full"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Logo responsiva maior */}
                <div className="relative">
                  <Image
                    src="/logos/zykor-logo-transparent-small.png"
                    alt="ZYKOR"
                    width={400}
                    height={400}
                    className="w-[320px] h-[320px] md:w-[500px] md:h-[500px] drop-shadow-2xl filter brightness-130 contrast-115 group-hover:scale-105 transition-all duration-700 relative z-10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-[10rem] md:text-[16rem] text-transparent bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 bg-clip-text font-black drop-shadow-2xl">Z</span>';
                    }}
                  />
                  
                  {/* Reflexo sutil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                </div>
                
                {/* Partículas flutuantes */}
                <motion.div
                  className="absolute -top-4 -left-4 w-2 h-2 bg-purple-400/60 rounded-full"
                  animate={{ 
                    y: [0, -20, 0], 
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="absolute -top-8 right-8 w-1.5 h-1.5 bg-violet-400/60 rounded-full"
                  animate={{ 
                    y: [0, -15, 0], 
                    opacity: [0.4, 0.8, 0.4],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                />
                <motion.div
                  className="absolute -bottom-6 -right-2 w-1 h-1 bg-purple-300/60 rounded-full"
                  animate={{ 
                    y: [0, -10, 0], 
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.4, 1]
                  }}
                  transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                />
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600 bg-clip-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Sistema de Gestão para Bares e Restaurantes
            </motion.h1>
            

            
            <motion.p 
              className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              A plataforma completa que revoluciona a gestão do seu estabelecimento com <span className="font-semibold text-purple-300">relatórios avançados</span>, <span className="font-semibold text-violet-300">automação total</span> e <span className="font-semibold text-indigo-300">inteligência de dados</span>
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8 md:mb-10 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full group relative bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 hover:from-purple-600 hover:via-violet-600 hover:to-purple-700 text-white px-8 sm:px-16 py-6 sm:py-8 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 transform hover:scale-105 rounded-2xl border border-purple-400/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative flex items-center justify-center">
                    Acessar Sistema
                    <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
              <a href="#contato" className="w-full sm:w-auto">
                <Button size="lg" className="w-full group bg-slate-800/50 backdrop-blur-md border-2 border-slate-600/50 text-slate-200 hover:bg-slate-700/50 hover:border-slate-500/50 px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-xl font-semibold transition-all duration-500 rounded-2xl hover:shadow-xl hover:shadow-slate-500/10">
                  <span className="flex items-center justify-center">
                    Falar com Especialista
                    <Phone className="ml-3 w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                  </span>
                </Button>
              </a>
            </motion.div>

            <motion.div 
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <motion.div 
                className="flex items-center gap-2 sm:gap-3 bg-slate-800/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 rounded-full border border-slate-600/30 hover:border-green-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span className="text-slate-200 font-medium text-xs sm:text-sm">100% Seguro</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-2 sm:gap-3 bg-slate-800/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 rounded-full border border-slate-600/30 hover:border-blue-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-slate-200 font-medium text-xs sm:text-sm">Tempo Real</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-2 sm:gap-3 bg-slate-800/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 rounded-full border border-slate-600/30 hover:border-violet-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                <span className="text-slate-200 font-medium text-xs sm:text-sm">Automação Total</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-2 sm:gap-3 bg-slate-800/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 rounded-full border border-slate-600/30 hover:border-purple-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <span className="text-slate-200 font-medium text-xs sm:text-sm">Sistema Premium</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section className="py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-slate-900/60 to-black/40 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Funcionalidades
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Tudo que você precisa para transformar seu bar em um negócio de sucesso
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {funcionalidades.map((funcionalidade, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className={`relative h-full bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-700 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl ${
                  funcionalidade.destaque ? `ring-2 ring-amber-400/40 ${funcionalidade.gradient} border-amber-400/30 shadow-amber-500/10` : 'hover:shadow-slate-500/20'
                }`}>
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
                  </div>
                  

                  
                  {/* Content */}
                  <div className="relative p-4 text-center h-full flex flex-col">
                    {/* Icon */}
                    <div className="relative mb-3">
                      <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${funcionalidade.cor} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 border border-white/10`}>
                        <funcionalidade.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors duration-300 mb-2">
                      {funcionalidade.titulo}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors duration-300 flex-grow">
                      {funcionalidade.descricao}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Por que ZYKOR?
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Desenvolvido especificamente para bares, com tecnologia de ponta
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-8">
                  <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${beneficio.cor} rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 border border-white/10`}>
                    <beneficio.icon className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  {beneficio.titulo}
                </h3>
                <p className="text-slate-300 leading-relaxed text-lg group-hover:text-slate-200 transition-colors duration-300">
                  {beneficio.descricao}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Formulário de Contato */}
      <section id="contato" className="py-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-slate-900/80 to-black/60 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Fale Conosco
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Pronto para revolucionar seu bar? Entre em contato e descubra como o ZYKOR pode transformar seu negócio
            </p>
          </motion.div>

          <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
            {success ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Mensagem Enviada!</h3>
                <p className="text-white/70">Em breve entraremos em contato com você.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nome-input" className="block text-white font-semibold mb-2">Nome *</label>
                    <Input
                      id="nome-input"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label htmlFor="email-input" className="block text-white font-semibold mb-2">Email *</label>
                    <Input
                      id="email-input"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="telefone-input" className="block text-white font-semibold mb-2">Telefone</label>
                    <Input
                      id="telefone-input"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label htmlFor="nome-do-bar-restaurante-input" className="block text-white font-semibold mb-2">Nome do Bar/Restaurante</label>
                    <Input
                      id="nome-do-bar-restaurante-input"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                      placeholder="Nome do estabelecimento"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mensagem-input" className="block text-white font-semibold mb-2">Mensagem *</label>
                    <Textarea
                      id="mensagem-input"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                    placeholder="Conte-nos sobre seu bar e como podemos ajudar..."
                  />
                </div>

                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white py-4 text-lg font-bold shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? (
                    'Enviando...'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Enviar Mensagem
                      <Send className="w-5 h-5" />
                    </span>
                  )}
                </Button>

                <p className="text-center text-white/60 text-sm">
                  * Campos obrigatórios. Responderemos em até 24 horas.
                </p>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-gradient-to-b from-black/80 to-black backdrop-blur-sm border-t border-slate-800/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-700/50">
                  <span className="text-2xl text-transparent bg-gradient-to-br from-purple-400 to-violet-500 bg-clip-text font-black">Z</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400 mb-6 text-lg">
              © 2025 ZYKOR - Sistema de Gestão para Bares e Restaurantes
            </p>
            <div className="flex justify-center space-x-8">
              <a 
                href="mailto:rodrigo.zykor@gmail.com" 
                className="group flex items-center gap-3 bg-slate-800/30 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50 hover:border-blue-400/30 transition-all duration-300"
              >
                <Mail className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-slate-400 group-hover:text-blue-400 transition-colors">Email</span>
              </a>
              <a 
                href="https://zykor.com.br" 
                className="group flex items-center gap-3 bg-slate-800/30 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700/50 hover:border-blue-400/30 transition-all duration-300"
              >
                <Globe className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-slate-400 group-hover:text-blue-400 transition-colors">Website</span>
              </a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}