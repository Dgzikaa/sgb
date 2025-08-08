'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  CreditCard, 
  Star, 
  Gift, 
  Calendar, 
  Clock,
  Users,
  Smartphone,
  ArrowLeft,
  CheckCircle,
  Zap,
  Heart,
  Music,
  Utensils
} from 'lucide-react';
import Link from 'next/link';

export default function BeneficiosPage() {
  const beneficiosPrincipais = [
    {
      icon: CreditCard,
      titulo: "R$ 150 em Créditos Mensais",
      descricao: "Receba R$ 150 todo mês para consumir no bar. Seus créditos nunca expiram!",
      destaque: true,
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Crown,
      titulo: "Acesso VIP Prioritário",
      descricao: "Entre sem fila e tenha prioridade no atendimento em todas as suas visitas.",
      destaque: true,
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: Gift,
      titulo: "Drink Especial do Mês",
      descricao: "Todo mês um drink exclusivo criado especialmente para nossos membros VIP.",
      destaque: false,
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Star,
      titulo: "Eventos Exclusivos",
      descricao: "Convites para eventos fechados, degustações e lançamentos de novos produtos.",
      destaque: false,
      color: "from-blue-500 to-indigo-600"
    }
  ];

  const beneficiosAdicionais = [
    {
      icon: Calendar,
      titulo: "Mesa Garantida",
      descricao: "Reserve sua mesa com antecedência através do app exclusivo para membros."
    },
    {
      icon: Clock,
      titulo: "Happy Hour Estendido",
      descricao: "Descontos especiais em horários estendidos, disponível apenas para VIPs."
    },
    {
      icon: Users,
      titulo: "Convidados Especiais",
      descricao: "Traga até 3 amigos e eles também terão benefícios especiais."
    },
    {
      icon: Smartphone,
      titulo: "App Exclusivo",
      descricao: "Acesso ao aplicativo VIP com funcionalidades especiais e conteúdo exclusivo."
    },
    {
      icon: Music,
      titulo: "Playlist Personalizada",
      descricao: "Sugira músicas para a playlist do bar e tenha prioridade nas escolhas."
    },
    {
      icon: Utensils,
      titulo: "Degustação Premium",
      descricao: "Seja o primeiro a experimentar novos drinks e pratos antes do lançamento oficial."
    }
  ];

  const planilhaComparativa = [
    {
      categoria: "Acesso",
      visitante: "Entrada normal",
      membro: "Sem fila + mesa reservada"
    },
    {
      categoria: "Créditos",
      visitante: "Pagamento à vista",
      membro: "R$ 150 mensais"
    },
    {
      categoria: "Eventos",
      visitante: "Eventos públicos",
      membro: "Eventos exclusivos + degustações"
    },
    {
      categoria: "Atendimento",
      visitante: "Atendimento padrão",
      membro: "Atendimento prioritário"
    },
    {
      categoria: "App",
      visitante: "Não disponível",
      membro: "App VIP exclusivo"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/fidelidade">
            <Button variant="ghost" className="text-amber-600 dark:text-amber-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center mb-6">
            <Crown className="w-16 h-16 text-amber-600 dark:text-amber-400 mr-4" />
            <div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                BENEFÍCIOS VIP
              </h1>
              <p className="text-2xl font-light text-gray-700 dark:text-gray-300 mt-2">
                Ordinário Bar
              </p>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Descubra tudo o que você ganha sendo um membro VIP do Ordinário Bar. 
            Muito mais que um cartão fidelidade, é uma experiência premium completa.
          </p>

          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg px-6 py-2">
            Por apenas R$ 100/mês • Receba R$ 150 em créditos
          </Badge>
        </motion.div>

        {/* Benefícios Principais */}
        <section className="mb-20">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Benefícios Principais
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Os pilares da experiência VIP
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {beneficiosPrincipais.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className={`h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 ${
                  beneficio.destaque 
                    ? 'ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20' 
                    : 'bg-white dark:bg-gray-800'
                }`}>
                  <CardHeader className="text-center pb-6">
                    <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${beneficio.color} flex items-center justify-center mb-6 shadow-lg`}>
                      <beneficio.icon className="w-10 h-10 text-white" />
                    </div>
                    {beneficio.destaque && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-4">
                        ⭐ DESTAQUE
                      </Badge>
                    )}
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {beneficio.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      {beneficio.descricao}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefícios Adicionais */}
        <section className="mb-20">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Muito Mais Benefícios
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              A experiência VIP não para por aí
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiosAdicionais.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                        <beneficio.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                          {beneficio.titulo}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {beneficio.descricao}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparativo */}
        <section className="mb-20">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Visitante vs. Membro VIP
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Veja a diferença de ser um membro VIP
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-white dark:bg-gray-800 shadow-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-lg font-semibold">Categoria</th>
                        <th className="px-6 py-4 text-center text-lg font-semibold">Visitante</th>
                        <th className="px-6 py-4 text-center text-lg font-semibold">
                          <div className="flex items-center justify-center gap-2">
                            <Crown className="w-5 h-5" />
                            Membro VIP
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {planilhaComparativa.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {item.categoria}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                            {item.visitante}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-700 dark:text-green-400 font-medium">
                                {item.membro}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ROI Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl">
              <CardContent className="p-8 text-center">
                <Zap className="w-16 h-16 mx-auto mb-6 text-green-200" />
                <h2 className="text-4xl font-bold mb-4">
                  Matemática Simples
                </h2>
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <p className="text-green-200 mb-2">Você Paga</p>
                    <p className="text-5xl font-bold">R$ 100</p>
                    <p className="text-green-200">por mês</p>
                  </div>
                  <div>
                    <p className="text-green-200 mb-2">Você Recebe</p>
                    <p className="text-5xl font-bold">R$ 150</p>
                    <p className="text-green-200">em créditos</p>
                  </div>
                  <div>
                    <p className="text-green-200 mb-2">Sua Economia</p>
                    <p className="text-5xl font-bold">R$ 50</p>
                    <p className="text-green-200">+ benefícios VIP</p>
                  </div>
                </div>
                <p className="text-xl text-green-100 mb-6">
                  Além de economizar R$ 50 por mês, você ainda ganha acesso VIP, 
                  eventos exclusivos e uma experiência premium completa!
                </p>
                <Link href="/fidelidade/cadastro">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 px-12 py-4 text-lg font-semibold">
                    <Heart className="w-5 h-5 mr-2" />
                    Quero Ser VIP Agora
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* CTA Final */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-2xl">
              <CardContent className="p-12">
                <Crown className="w-20 h-20 mx-auto mb-6 text-amber-200" />
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Pronto para Ser VIP?
                </h2>
                <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
                  Junte-se ao grupo exclusivo de membros do Ordinário Bar e 
                  descubra uma nova forma de aproveitar a noite em Brasília.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/fidelidade/cadastro">
                    <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50 px-12 py-4 text-lg font-semibold">
                      Começar Agora
                      <CheckCircle className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/fidelidade/termos">
                    <Button 
                      size="lg" 
                      className="bg-white/20 hover:bg-white/30 text-white border-white border-2 px-8 py-4 text-lg backdrop-blur-sm"
                    >
                      Ver Termos
                    </Button>
                  </Link>
                </div>
                
                <Separator className="my-8 bg-amber-400/30" />
                
                <div className="flex items-center justify-center gap-8 text-sm text-amber-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Sem fidelidade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Cancele a qualquer momento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>100% digital</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
