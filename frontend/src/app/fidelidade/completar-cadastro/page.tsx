'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, User, Mail, Calendar, Phone, MapPin, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CompletarCadastroPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    endereco: {
      cep: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: ''
    }
  });
  
  const [codigoValidado, setCodigoValidado] = useState('');
  const [cpfValidado, setCpfValidado] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Recuperar dados da validação anterior
    const codigo = searchParams.get('codigo');
    const cpf = searchParams.get('cpf');
    const token = searchParams.get('validation_token');
    
    if (codigo && cpf && token) {
      setCodigoValidado(codigo);
      setCpfValidado(cpf);
    } else {
      // Redirecionar se não tiver dados válidos
      window.location.href = '/fidelidade/convite';
    }
  }, [searchParams]);

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').substring(0, 11);
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatarCEP = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').substring(0, 8);
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar membro no banco de dados
      const response = await fetch('/api/fidelidade/membros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo_convite: codigoValidado,
          cpf: cpfValidado,
          ...formData,
          bar_id: 1 // TODO: Pegar do contexto
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar membro');
      }

      const membroData = await response.json();
      
      // Salvar dados do membro temporariamente para o pagamento
      localStorage.setItem('fidelidade_membro_temp', JSON.stringify({
        id: membroData.membro.id,
        nome: membroData.membro.nome,
        email: membroData.membro.email,
        cpf: membroData.membro.cpf
      }));
      
      // Redirecionar para pagamento
      window.location.href = '/fidelidade/pagamento';
    } catch (error) {
      console.error('Erro ao completar cadastro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao completar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
              <Crown className="w-6 h-6 text-amber-300" />
              <span className="text-amber-100 font-bold text-lg">FINALIZE SEU CADASTRO VIP</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              Complete seus
              <span className="bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent"> Dados</span>
            </h1>
            
            <p className="text-amber-100 text-lg mb-4">
              Seu código <span className="font-bold text-amber-300">{codigoValidado}</span> foi validado com sucesso!
            </p>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm">Código validado</span>
              </div>
              <div className="w-8 h-0.5 bg-amber-400"></div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-bold">2</span>
                </div>
                <span className="text-amber-400 text-sm font-semibold">Completar dados</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-xs font-bold">3</span>
                </div>
                <span className="text-gray-400 text-sm">Pagamento</span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-black/40 backdrop-blur-xl border border-amber-400/30 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-amber-200 text-lg font-bold flex items-center gap-2 mb-4">
                  <User className="w-5 h-5" />
                  Dados Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome" className="text-amber-200 font-semibold">Nome Completo *</Label>
                    <Input
                      id="nome"
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_nascimento" className="text-amber-200 font-semibold">Data de Nascimento *</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      required
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                      className="bg-black/50 border-amber-400/50 text-white focus:border-amber-300"
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4">
                <h3 className="text-amber-200 text-lg font-bold flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5" />
                  Contato
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-amber-200 font-semibold">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone" className="text-amber-200 font-semibold">Telefone/WhatsApp *</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-amber-200 text-lg font-bold flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cep" className="text-amber-200 font-semibold">CEP *</Label>
                    <Input
                      id="cep"
                      type="text"
                      required
                      value={formData.endereco.cep}
                      onChange={(e) => setFormData({
                        ...formData, 
                        endereco: {...formData.endereco, cep: formatarCEP(e.target.value)}
                      })}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="rua" className="text-amber-200 font-semibold">Rua/Endereço *</Label>
                    <Input
                      id="rua"
                      type="text"
                      required
                      value={formData.endereco.rua}
                      onChange={(e) => setFormData({
                        ...formData, 
                        endereco: {...formData.endereco, rua: e.target.value}
                      })}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="Nome da rua"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="numero" className="text-amber-200 font-semibold">Número *</Label>
                    <Input
                      id="numero"
                      type="text"
                      required
                      value={formData.endereco.numero}
                      onChange={(e) => setFormData({
                        ...formData, 
                        endereco: {...formData.endereco, numero: e.target.value}
                      })}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bairro" className="text-amber-200 font-semibold">Bairro *</Label>
                    <Input
                      id="bairro"
                      type="text"
                      required
                      value={formData.endereco.bairro}
                      onChange={(e) => setFormData({
                        ...formData, 
                        endereco: {...formData.endereco, bairro: e.target.value}
                      })}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="Bairro"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cidade" className="text-amber-200 font-semibold">Cidade *</Label>
                    <Input
                      id="cidade"
                      type="text"
                      required
                      value={formData.endereco.cidade}
                      onChange={(e) => setFormData({
                        ...formData, 
                        endereco: {...formData.endereco, cidade: e.target.value}
                      })}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="Cidade"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estado" className="text-amber-200 font-semibold">Estado *</Label>
                    <Input
                      id="estado"
                      type="text"
                      required
                      maxLength={2}
                      value={formData.endereco.estado}
                      onChange={(e) => setFormData({
                        ...formData, 
                        endereco: {...formData.endereco, estado: e.target.value.toUpperCase()}
                      })}
                      className="bg-black/50 border-amber-400/50 text-white placeholder-amber-300/50 focus:border-amber-300"
                      placeholder="SP"
                    />
                  </div>
                </div>
              </div>

              {/* Botão Submit */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 border-0 px-8 py-6 text-xl font-black shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-3 w-6 h-6" />
                      Finalizar e Ir para Pagamento
                      <ArrowRight className="ml-3 w-6 h-6" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-amber-300/70 text-sm">
                🔒 Seus dados estão seguros e protegidos
              </div>
            </form>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
