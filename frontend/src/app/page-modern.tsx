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
  Calendar, 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Target,
  Activity,
  Mail,
  Send,
  Smartphone,
  Globe,
  Database,
  Bot,
  Layers,
  Cpu,
  Cloud,
  Lock,
  BarChart2,
  PieChart,
  MessageSquare,
  QrCode,
  CreditCard,
  FileText,
  Briefcase,
  Monitor,
  Palette,
  Sparkles,
  Gauge,
  LineChart,
  Brain,
  Eye,
  Timer
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPageModern() {
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
  const y2 = useTransform(scrollY, [0, 300], [0, -30]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Redirecionar para email
    const emailBody = `
      Nome: ${formData.nome}
      Email: ${formData.email}
      Telefone: ${formData.telefone}
      Estabelecimento: ${formData.empresa}
      
      Mensagem:
      ${formData.mensagem}
    `;
    
    const mailtoLink = `mailto:rodrigo.zykor@gmail.com.br?subject=Contato via Zykor Landing&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    
    setSuccess(true);
    setFormData({ nome: '', email: '', telefone: '', empresa: '', mensagem: '' });
    setLoading(false);
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
      titulo: "Analytics Inteligente",
      descricao: "Dashboard completo com métricas em tempo real, comparativo semanal e projeções de crescimento",
      destaque: true,
      cor: "from-blue-500 via-cyan-500 to-teal-500",
      features: ["Dashboard em tempo real", "Análise de crescimento", "Métricas comparativas"]
    },
    {
      icon: Bot,
      titulo: "Zykor AI Assistant",
      descricao: "Inteligência artificial que interpreta dados e responde perguntas complexas sobre seu negócio",
      destaque: true,
      cor: "from-purple-500 via-violet-500 to-indigo-500",
      features: ["Análise por voz", "Interpretação de dados", "Insights automáticos"]
    },
    {
      icon: Users,
      titulo: "Gestão de Equipe",
      descricao: "Controle completo de funcionários com checklists automáticos e análise de desempenho",
      destaque: false,
      cor: "from-emerald-500 via-green-500 to-lime-500",
      features: ["Checklists automáticos", "Controle de ponto", "Análise de performance"]
    },
    {
      icon: Database,
      titulo: "Integração Total",
      descricao: "Conecta automaticamente com ContaHub, ContaAzul, Nibo, Sympla e sistemas fiscais",
      destaque: false,
      cor: "from-orange-500 via-amber-500 to-yellow-500",
      features: ["ContaHub sync", "ContaAzul integration", "APIs fiscais"]
    },
    {
      icon: QrCode,
      titulo: "QR Scanner Avançado",
      descricao: "Sistema de QR codes para eventos, promoções e controle de acesso em tempo real",
      destaque: false,
      cor: "from-pink-500 via-rose-500 to-red-500",
      features: ["Controle de acesso", "Eventos automáticos", "Promoções dinâmicas"]
    },
    {
      icon: Shield,
      titulo: "Segurança Enterprise",
      descricao: "Proteção avançada com MFA, auditoria completa e compliance LGPD automático",
      destaque: false,
      cor: "from-slate-500 via-gray-500 to-zinc-500",
      features: ["MFA/2FA", "Audit logs", "LGPD compliance"]
    }
  ];

  const beneficios = [
    {
      icon: Zap,
      titulo: "Automação Total",
      descricao: "Sincronização automática de vendas, estoque e relatórios fiscais sem intervenção manual",
      metric: "95% redução em tarefas manuais"
    },
    {
      icon: Clock,
      titulo: "Tempo Real",
      descricao: "Todas as informações atualizadas instantaneamente via WebSocket e push notifications",
      metric: "< 500ms latência"
    },
    {
      icon: Target,
      titulo: "ROI Comprovado",
      descricao: "Clientes relatam aumento médio de 40% na eficiência operacional e 25% no faturamento",
      metric: "+40% eficiência operacional"
    },
    {
      icon: Cloud,
      titulo: "Cloud Native",
      descricao: "Infraestrutura Supabase + Vercel com 99.9% uptime e backup automático",
      metric: "99.9% uptime garantido"
    }
  ];

  const tecnologias = [
    { name: "Next.js 14", icon: Monitor, color: "text-blue-400" },
    { name: "Supabase", icon: Database, color: "text-green-400" },
    { name: "TypeScript", icon: Cpu, color: "text-blue-500" },
    { name: "Tailwind CSS", icon: Palette, color: "text-cyan-400" },
    { name: "Framer Motion", icon: Sparkles, color: "text-purple-400" },
    { name: "PWA", icon: Smartphone, color: "text-orange-400" }
  ];

  const metricas = [
    {
      value: "< 2s",
      label: "Load Time",
      description: "Performance otimizada",
      icon: Gauge,
      color: "from-green-400 to-emerald-400"
    },
    {
      value: "50+",
      label: "Funcionalidades",
      description: "Sistema completo",
      icon: Layers,
      color: "from-blue-400 to-cyan-400"
    },
    {
      value: "24/7",
      label: "Monitoramento",
      description: "Observabilidade total",
      icon: Eye,
      color: "from-purple-400 to-violet-400"
    },
    {
      value: "Real-time",
      label: "Sync",
      description: "Dados sempre atuais",
      icon: Timer,
      color: "from-orange-400 to-amber-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background Effects Avançados */}
      <div className="fixed inset-0 z-0">
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-orange-500/10 via-amber-500/10 to-yellow-500/10 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Hero Section Ultra Moderno */}
      <section className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 py-20">
          <motion.div 
            className="text-center max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Logo Ultra Moderno */}
            <motion.div 
              className="flex items-center justify-center mb-12"
              initial={{ scale: 0.8, rotateY: -45 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, ease: "backOut" }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/10">
                  <Image
                    src="/logos/zykor-logo-white.png"
                    alt="ZYKOR"
                    width={100}
                    height={100}
                    className="drop-shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-5xl text-white font-black">Z</span>';
                    }}
                  />
                </div>
                <motion.div 
                  className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-3 h-3 bg-white rounded-full" />
                </motion.div>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-7xl md:text-9xl font-black mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent bg-size-200 animate-gradient">
                ZYKOR
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-2xl md:text-3xl font-light text-blue-200 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              O núcleo da gestão de bares
            </motion.p>
            
            <motion.p 
              className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              Plataforma completa com{' '}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                inteligência artificial
              </span>
              ,{' '}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
                automação total
              </span>
              {' '}e{' '}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                analytics em tempo real
              </span>
              {' '}para transformar seu bar em um negócio de sucesso.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <Link href="/login">
                <Button size="lg" className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white px-16 py-8 text-xl font-bold shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 rounded-2xl overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Acessar Sistema
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
              <a href="#contato">
                <Button size="lg" className="bg-white/5 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-12 py-8 text-xl font-semibold transition-all duration-500 rounded-2xl group">
                  Entre em Contato
                  <Mail className="ml-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </a>
            </motion.div>

            {/* Tecnologias Badges */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1 }}
            >
              {tecnologias.map((tech, index) => (
                <Badge 
                  key={index}
                  className="bg-white/5 backdrop-blur-xl border border-white/20 text-white px-4 py-2 text-sm font-medium hover:bg-white/10 transition-all duration-300 group"
                >
                  <tech.icon className={`w-4 h-4 mr-2 ${tech.color} group-hover:scale-110 transition-transform`} />
                  {tech.name}
                </Badge>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Métricas de Performance */}
      <section className="relative z-10 py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {metricas.map((metrica, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <metrica.icon className={`w-8 h-8 bg-gradient-to-r ${metrica.color} bg-clip-text text-transparent`} />
                  </div>
                </div>
                <div className={`text-4xl font-black mb-2 bg-gradient-to-r ${metrica.color} bg-clip-text text-transparent`}>
                  {metrica.value}
                </div>
                <div className="text-xl font-semibold text-white mb-1">{metrica.label}</div>
                <div className="text-sm text-white/60">{metrica.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades Avançadas */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Funcionalidades
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Tecnologia de ponta para revolucionar a gestão do seu estabelecimento
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {funcionalidades.map((funcionalidade, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group h-full"
              >
                <Card className={`h-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl rounded-3xl overflow-hidden ${
                  funcionalidade.destaque ? 'ring-2 ring-blue-400/50 bg-gradient-to-br from-blue-500/5 to-purple-500/5' : ''
                }`}>
                  <CardHeader className="text-center pb-6 relative">
                    {funcionalidade.destaque && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold px-4 py-1 text-sm">
                        🚀 DESTAQUE
                      </Badge>
                    )}
                    <div className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-r ${funcionalidade.cor} flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-xl relative`}>
                      <funcionalidade.icon className="w-12 h-12 text-white" />
                      <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors mb-3">
                      {funcionalidade.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-white/70 text-lg leading-relaxed mb-6">
                      {funcionalidade.descricao}
                    </p>
                    <div className="space-y-2">
                      {funcionalidade.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-white/60">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios com Métricas */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Por que Zykor?
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Resultados comprovados com tecnologia enterprise
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-all duration-500 relative overflow-hidden">
                  <beneficio.icon className="w-12 h-12 text-white relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {beneficio.titulo}
                </h3>
                <p className="text-white/70 leading-relaxed mb-4">
                  {beneficio.descricao}
                </p>
                <div className="text-lg font-bold text-blue-400">
                  {beneficio.metric}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário de Contato Moderno */}
      <section id="contato" className="relative z-10 py-20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Vamos Conversar
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Pronto para revolucionar seu bar? Entre em contato direto conosco
            </p>
          </motion.div>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
            {success ? (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">Email Aberto!</h3>
                <p className="text-white/70 text-lg">
                  Seu cliente de email foi aberto com todas as informações. Aguardamos seu contato!
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nome" className="block text-white font-semibold mb-3 text-lg">Nome Completo *</label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/50 focus:border-blue-400 h-14 text-lg rounded-xl transition-all duration-300"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-white font-semibold mb-3 text-lg">Email *</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/50 focus:border-blue-400 h-14 text-lg rounded-xl transition-all duration-300"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="telefone" className="block text-white font-semibold mb-3 text-lg">Telefone</label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/50 focus:border-blue-400 h-14 text-lg rounded-xl transition-all duration-300"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label htmlFor="estabelecimento" className="block text-white font-semibold mb-3 text-lg">Nome do Estabelecimento</label>
                    <Input
                      id="estabelecimento"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      className="bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/50 focus:border-blue-400 h-14 text-lg rounded-xl transition-all duration-300"
                      placeholder="Nome do seu bar/restaurante"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mensagem" className="block text-white font-semibold mb-3 text-lg">Mensagem *</label>
                    <Textarea
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/50 focus:border-blue-400 text-lg rounded-xl transition-all duration-300 resize-none"
                    placeholder="Conte-nos sobre seu estabelecimento e como podemos ajudar a transformar seu negócio..."
                  />
                </div>

                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10 rounded-xl">
                    <AlertDescription className="text-red-400 text-lg">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white py-6 text-xl font-bold shadow-2xl transition-all duration-500 transform hover:scale-[1.02] disabled:opacity-50 rounded-xl group"
                >
                  {loading ? (
                    'Abrindo Email...'
                  ) : (
                    <>
                      <span className="flex items-center justify-center">
                        Enviar Email
                        <Send className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </>
                  )}
                </Button>

                <p className="text-center text-white/60 text-sm">
                  * Campos obrigatórios. O email será aberto automaticamente no seu cliente de email padrão.
                </p>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* Footer Moderno */}
      <footer className="relative z-10 py-12 bg-black/80 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-2xl text-white font-black">Z</span>
            </div>
          </div>
          <p className="text-white/60 mb-4 text-lg">
            © 2024 Zykor - O núcleo da gestão de bares
          </p>
          <p className="text-white/40 mb-6">
            Transformando bares com tecnologia de ponta
          </p>
          <div className="flex justify-center space-x-8 text-white/40">
            <a 
              href="mailto:rodrigo.zykor@gmail.com.br" 
              className="hover:text-blue-400 transition-all duration-300 transform hover:scale-110"
            >
              <Mail className="w-6 h-6" />
            </a>
            <a 
              href="https://zykor.com.br" 
              className="hover:text-blue-400 transition-all duration-300 transform hover:scale-110"
            >
              <Globe className="w-6 h-6" />
            </a>
          </div>
        </div>
      </footer>

      {/* Estilos customizados para animações */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 6s ease infinite;
        }
        .bg-size-200 {
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
}
