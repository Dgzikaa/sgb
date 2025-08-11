'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Users, Star, CheckCircle, ArrowRight, Mail, User } from 'lucide-react';

export default function ListaEsperaPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').substring(0, 11);
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular envio para lista de espera
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (error) {
      console.error('Erro ao entrar na lista de espera:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-amber-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto text-center p-8"
        >
          <div className="bg-black/40 backdrop-blur-xl border border-amber-400/30 rounded-3xl p-8 shadow-2xl">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Você está na lista!</h2>
            <p className="text-amber-200 mb-6">
              Parabéns! Você foi adicionado à nossa lista de espera VIP.
              Você será notificado assim que novas vagas forem liberadas.
            </p>
            <Button
              onClick={() => window.location.href = '/fidelidade'}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600 px-6 py-3 rounded-xl font-semibold"
            >
              Voltar ao Início
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-amber-900 to-black">
      {/* Background Premium */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border border-amber-400/30 rounded-full px-8 py-4 mb-6 shadow-2xl">
              <Clock className="w-6 h-6 text-amber-300 animate-pulse" />
              <span className="text-amber-100 font-bold text-lg">LISTA DE ESPERA VIP</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-none">
              Seja o primeiro a
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                SABER
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-amber-100 mb-8 max-w-xl mx-auto leading-relaxed">
              As 100 vagas se esgotaram! Mas você pode entrar na nossa lista de espera VIP 
              e ser notificado quando novas vagas forem liberadas.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-black/30 backdrop-blur-md border border-amber-400/20 rounded-2xl p-4 text-center">
              <Users className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">100</div>
              <div className="text-amber-200 text-sm">Vagas ocupadas</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md border border-amber-400/20 rounded-2xl p-4 text-center">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">24h</div>
              <div className="text-amber-200 text-sm">Notificação rápida</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md border border-amber-400/20 rounded-2xl p-4 text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">VIP</div>
              <div className="text-amber-200 text-sm">Prioridade total</div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-black/40 backdrop-blur-xl border border-amber-400/30 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Cadastre-se na Lista VIP</h3>
                <p className="text-amber-200">
                  Seja notificado em primeira mão quando liberarmos novas vagas
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome" className="text-amber-200 font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300 text-lg py-3"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-amber-200 font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300 text-lg py-3"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone" className="text-amber-200 font-semibold">
                    WhatsApp (opcional)
                  </Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})}
                    className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300 text-lg py-3"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Benefícios da Lista VIP */}
              <div className="bg-amber-500/10 rounded-2xl p-6 border border-amber-400/20">
                <h4 className="text-amber-200 font-bold mb-3">Benefícios da Lista VIP:</h4>
                <ul className="space-y-2 text-amber-100 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Notificação prioritária por email e WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Acesso antecipado às novas vagas (24h antes)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Processo de cadastro simplificado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Garantia de vaga nas próximas liberações
                  </li>
                </ul>
              </div>

              {/* Botão Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 border-0 px-8 py-6 text-xl font-black shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                    Entrando na Lista...
                  </>
                ) : (
                  <>
                    <Star className="mr-3 w-6 h-6" />
                    Entrar na Lista VIP
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </>
                )}
              </Button>

              <div className="text-center text-amber-300/70 text-sm">
                🔒 Não enviamos spam • Apenas notificações de novas vagas
              </div>
            </form>
          </div>

          {/* Voltar */}
          <div className="text-center mt-8">
            <button
              onClick={() => window.location.href = '/fidelidade'}
              className="text-amber-300 hover:text-amber-200 transition-colors underline"
            >
              ← Voltar para página inicial
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
