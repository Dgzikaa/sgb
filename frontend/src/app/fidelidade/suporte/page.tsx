'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  MessageCircle, 
  Phone,
  Mail,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  Users,
  FileText,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function SuportePage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    categoria: '',
    assunto: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSent(true);
      
      // Aqui integraria com sistema de tickets/suporte
      console.log('Ticket criado:', formData);
      
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const faqItems = [
    {
      pergunta: "Como funciona o programa de fidelidade?",
      resposta: "Você paga R$ 100/mês e recebe R$ 150 em créditos para usar no bar, além de benefícios VIP como acesso sem fila e eventos exclusivos."
    },
    {
      pergunta: "Como faço para cancelar minha assinatura?",
      resposta: "Você pode cancelar a qualquer momento nas suas configurações de conta ou entrando em contato conosco. Não há multa de cancelamento."
    },
    {
      pergunta: "Os créditos expiram?",
      resposta: "Não! Seus créditos nunca expiram. Você pode acumular e usar quando quiser."
    },
    {
      pergunta: "Como usar meu cartão digital?",
      resposta: "Baixe o cartão para sua wallet ou apresente o QR Code na entrada do bar. É só mostrar para nossos funcionários."
    },
    {
      pergunta: "Posso transferir créditos para outra pessoa?",
      resposta: "Os créditos são pessoais e intransferíveis, mas você pode trazer convidados e pagar por eles usando seus créditos."
    },
    {
      pergunta: "Como funciona o acesso VIP?",
      resposta: "Com seu cartão VIP, você entra sem fila e tem prioridade no atendimento. Basta apresentar seu QR Code na entrada."
    }
  ];

  const canaisContato = [
    {
      icon: MessageCircle,
      titulo: "WhatsApp",
      descricao: "(61) 99999-8888",
      horario: "Seg-Dom: 18h às 2h",
      acao: "Abrir WhatsApp",
      disponivel: true,
      link: "https://wa.me/5561999998888?text=Olá! Sou membro VIP do Ordinário Bar e preciso de ajuda."
    },
    {
      icon: Mail,
      titulo: "E-mail",
      descricao: "fidelidade@ordinariobar.com",
      horario: "Resposta em até 4h",
      acao: "Enviar E-mail",
      disponivel: true,
      link: "mailto:fidelidade@ordinariobar.com?subject=Suporte VIP - Ordinário Bar"
    }
  ];

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
            Mensagem Enviada!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Recebemos sua mensagem e entraremos em contato em breve.
          </p>
          <div className="space-y-3">
            <Link href="/fidelidade/dashboard">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Voltar ao Dashboard
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => setSent(false)}
              className="w-full"
            >
              Enviar Outra Mensagem
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/fidelidade/dashboard">
              <Button variant="ghost" className="text-amber-600 dark:text-amber-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Suporte VIP
              </h1>
              <p className="text-amber-600 dark:text-amber-400">
                Estamos aqui para ajudar
              </p>
            </div>
          </div>
          
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="w-4 h-4 mr-1" />
            Online
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Formulário de Contato */}
          <div className="lg:col-span-2 space-y-6">
            {/* Canais de Contato */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Entre em Contato
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
                {canaisContato.map((canal, index) => (
                  <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        canal.titulo === 'WhatsApp' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <canal.icon className={`w-6 h-6 ${
                          canal.titulo === 'WhatsApp' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {canal.titulo}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {canal.descricao}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                        {canal.horario}
                      </p>
                      <a href={canal.link} target="_blank" rel="noopener noreferrer">
                        <Button 
                          size="sm" 
                          className={`w-full ${
                            canal.titulo === 'WhatsApp' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white`}
                          disabled={!canal.disponivel}
                        >
                          {canal.acao}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Formulário */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Enviar Mensagem
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Descreva seu problema ou dúvida e responderemos em breve
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome" className="text-gray-700 dark:text-gray-300">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          placeholder="Seu nome completo"
                          required
                          className="bg-white dark:bg-gray-700"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="seu@email.com"
                          required
                          className="bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="categoria" className="text-gray-700 dark:text-gray-300">Categoria</Label>
                      <select
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="pagamento">Problemas com Pagamento</option>
                        <option value="creditos">Dúvidas sobre Créditos</option>
                        <option value="cartao">Cartão Digital/QR Code</option>
                        <option value="beneficios">Benefícios VIP</option>
                        <option value="cancelamento">Cancelamento</option>
                        <option value="tecnico">Problemas Técnicos</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="assunto" className="text-gray-700 dark:text-gray-300">Assunto</Label>
                      <Input
                        id="assunto"
                        value={formData.assunto}
                        onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                        placeholder="Resumo do seu problema ou dúvida"
                        required
                        className="bg-white dark:bg-gray-700"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="mensagem" className="text-gray-700 dark:text-gray-300">Mensagem</Label>
                      <Textarea
                        id="mensagem"
                        value={formData.mensagem}
                        onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                        placeholder="Descreva detalhadamente seu problema ou dúvida..."
                        rows={5}
                        required
                        className="bg-white dark:bg-gray-700"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      {loading ? (
                        'Enviando...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Perguntas Frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqItems.map((item, index) => (
                    <details key={index} className="group">
                      <summary className="flex justify-between items-center cursor-pointer text-sm font-medium text-gray-900 dark:text-white p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        {item.pergunta}
                        <span className="ml-2 transform group-open:rotate-180 transition-transform">
                          ↓
                        </span>
                      </summary>
                      <div className="mt-2 p-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded">
                        {item.resposta}
                      </div>
                    </details>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Informações de Suporte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Suporte VIP Premium
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Atendimento Prioritário
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Membros VIP têm prioridade
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Resposta Rápida
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Até 2h durante funcionamento
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Múltiplos Canais
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Chat, telefone e e-mail
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Horário de Atendimento
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Seg-Dom: 18h às 2h
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Links Úteis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Links Úteis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/fidelidade/beneficios">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Guia de Benefícios
                    </Button>
                  </Link>
                  
                  <Link href="/fidelidade/termos">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Termos de Uso
                    </Button>
                  </Link>
                  
                  <Link href="/fidelidade/privacidade">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Política de Privacidade
                    </Button>
                  </Link>
                  
                  <Link href="/fidelidade/configuracoes">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Configurações da Conta
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
