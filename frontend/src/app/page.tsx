'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Activity,
  Mail,
  Phone,
  Building,
  Send,
  Crown,
  Smartphone,
  Globe
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
      cor: "from-blue-500 to-blue-600"
    },
    {
      icon: Crown,
      titulo: "Programa de Fidelidade",
      descricao: "Sistema VIP com cartões digitais e recompensas automáticas",
      destaque: true,
      cor: "from-amber-500 to-orange-500"
    },
    {
      icon: Users,
      titulo: "Gestão de Equipe",
      descricao: "Controle de funcionários, checklists e processos operacionais",
      destaque: false,
      cor: "from-purple-500 to-purple-600"
    },
    {
      icon: TrendingUp,
      titulo: "Relatórios Avançados",
      descricao: "Análises detalhadas de vendas, estoque e performance",
      destaque: false,
      cor: "from-green-500 to-green-600"
    },
    {
      icon: Smartphone,
      titulo: "Mobile First",
      descricao: "Acesso completo via celular, tablet e desktop",
      destaque: false,
      cor: "from-indigo-500 to-indigo-600"
    },
    {
      icon: Shield,
      titulo: "Pagamentos Seguros",
      descricao: "Integração com Mercado Pago, PIX e cartões",
      destaque: false,
      cor: "from-red-500 to-red-600"
    }
  ];

  const beneficios = [
    {
      icon: Zap,
      titulo: "Automação Total",
      descricao: "Integração automática com ContaHub, ContaAzul e sistemas fiscais"
    },
    {
      icon: Clock,
      titulo: "Tempo Real",
      descricao: "Informações atualizadas instantaneamente em todos os dispositivos"
    },
    {
      icon: Target,
      titulo: "Resultados Comprovados",
      descricao: "Aumento médio de 30% na fidelização de clientes"
    },
    {
      icon: Globe,
      titulo: "Na Nuvem",
      descricao: "Acesse de qualquer lugar, dados sempre seguros e atualizados"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-amber-500/20 to-orange-500/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div 
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Image
                    src="/logos/zykor-logo-white.png"
                    alt="ZYKOR"
                    width={80}
                    height={80}
                    className="drop-shadow-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl text-white font-black">Z</span>';
                    }}
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-white via-amber-200 to-orange-300 bg-clip-text text-transparent mb-4">
              ZYKOR
            </h1>
            
            <p className="text-xl md:text-2xl font-light text-amber-200 mb-3">
              Sistema de Gestão para Bares e Restaurantes
            </p>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-4xl mx-auto">
              A plataforma completa que revoluciona a gestão do seu estabelecimento com 
              <span className="font-semibold text-amber-300"> programa de fidelidade digital</span>, 
              <span className="font-semibold text-blue-300"> automação total</span> e 
              <span className="font-semibold text-green-300"> relatórios inteligentes</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 transform hover:scale-105 rounded-2xl">
                  Acessar Sistema
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
              <a href="#contato">
                <Button size="lg" className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-8 py-6 text-xl font-semibold transition-all duration-300 rounded-2xl">
                  Falar com Especialista
                  <Phone className="ml-3 w-5 h-5" />
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span>Tempo Real</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Automação Total</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/40 px-4 py-2">
                <Star className="w-4 h-4 mr-2" />
                Sistema Premium
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section className="py-12 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Funcionalidades
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Tudo que você precisa para transformar seu bar em um negócio de sucesso
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funcionalidades.map((funcionalidade, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className={`h-full bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl ${
                  funcionalidade.destaque ? 'ring-2 ring-amber-400/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10' : ''
                }`}>
                  <CardHeader className="text-center pb-4">
                    {funcionalidade.destaque && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black font-bold px-3 py-1">
                        DESTAQUE
                      </Badge>
                    )}
                    <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${funcionalidade.cor} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg`}>
                      <funcionalidade.icon className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {funcionalidade.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-white/70 text-lg leading-relaxed">
                      {funcionalidade.descricao}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Por que ZYKOR?
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Desenvolvido especificamente para bares, com tecnologia de ponta
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <beneficio.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                  {beneficio.titulo}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {beneficio.descricao}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-amber-600/20 to-orange-600/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid md:grid-cols-3 gap-6 text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="group">
              <div className="text-6xl font-black mb-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">99.9%</div>
              <div className="text-xl text-amber-200">Uptime Garantido</div>
            </div>
            <div className="group">
              <div className="text-6xl font-black mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-xl text-blue-200">Suporte Online</div>
            </div>
            <div className="group">
              <div className="text-6xl font-black mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">+50</div>
              <div className="text-xl text-green-200">Funcionalidades</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Formulário de Contato */}
      <section id="contato" className="py-16 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Fale Conosco
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Pronto para revolucionar seu bar? Entre em contato e descubra como o ZYKOR pode transformar seu negócio
            </p>
          </motion.div>

          <Card className="bg-white/5 backdrop-blur-md border border-white/20 p-6">
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
                    <label className="block text-white font-semibold mb-2">Nome *</label>
                    <Input
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Email *</label>
                    <Input
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
                    <label className="block text-white font-semibold mb-2">Telefone</label>
                    <Input
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Nome do Bar/Restaurante</label>
                    <Input
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-amber-400"
                      placeholder="Nome do estabelecimento"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Mensagem *</label>
                  <Textarea
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
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-4 text-lg font-bold shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? (
                    'Enviando...'
                  ) : (
                    <>
                      Enviar Mensagem
                      <Send className="ml-2 w-5 h-5" />
                    </>
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
      <footer className="py-8 bg-black/60 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-xl text-white font-black">Z</span>
            </div>
          </div>
          <p className="text-white/60 mb-3">
            © 2024 ZYKOR - Sistema de Gestão para Bares e Restaurantes
          </p>
          <div className="flex justify-center space-x-6 text-white/40">
            <a href="mailto:rodrigo.zykor@gmail.com" className="hover:text-amber-400 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
            <a href="https://zykor.com.br" className="hover:text-amber-400 transition-colors">
              <Globe className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}