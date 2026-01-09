'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  TrendingUp,
  Target,
  Sparkles,
  Flag,
  Trophy,
  Heart,
  Music,
  PartyPopper,
  Gift,
  Sun,
  Snowflake,
  Star,
  Users,
  DollarSign,
  Lightbulb,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Flame,
  Zap,
  Crown,
  Plane,
  Globe,
  Timer,
  AlertCircle,
  CheckCircle2,
  MapPin,
  CalendarDays,
  Megaphone,
  TrendingDown,
  Percent,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ========================================
// DADOS DE 2026 - DATAS IMPORTANTES
// ========================================

// Feriados Nacionais 2026
const FERIADOS_2026 = [
  { data: '2026-01-01', nome: 'Ano Novo', tipo: 'nacional', diaSemana: 'Quinta', potencial: 'alto', dica: 'Véspera é QUARTA - ótimo para evento especial' },
  { data: '2026-02-14', nome: 'Carnaval (Sábado)', tipo: 'carnaval', diaSemana: 'Sábado', potencial: 'maximo', dica: 'Início do Carnaval - lotação máxima!' },
  { data: '2026-02-15', nome: 'Carnaval (Domingo)', tipo: 'carnaval', diaSemana: 'Domingo', potencial: 'maximo', dica: 'Domingo de Carnaval' },
  { data: '2026-02-16', nome: 'Carnaval (Segunda)', tipo: 'carnaval', diaSemana: 'Segunda', potencial: 'maximo', dica: 'Segunda de Carnaval' },
  { data: '2026-02-17', nome: 'Carnaval (Terça)', tipo: 'carnaval', diaSemana: 'Terça', potencial: 'maximo', dica: 'Terça de Carnaval - pico!' },
  { data: '2026-02-18', nome: 'Quarta de Cinzas', tipo: 'carnaval', diaSemana: 'Quarta', potencial: 'alto', dica: 'Ressaca de Carnaval - feijoada?' },
  { data: '2026-04-03', nome: 'Sexta-feira Santa', tipo: 'nacional', diaSemana: 'Sexta', potencial: 'alto', dica: 'Feriadão da Páscoa - sexta é ouro!' },
  { data: '2026-04-04', nome: 'Sábado de Aleluia', tipo: 'pascoa', diaSemana: 'Sábado', potencial: 'maximo', dica: 'Pós-Sexta Santa - evento especial' },
  { data: '2026-04-05', nome: 'Domingo de Páscoa', tipo: 'pascoa', diaSemana: 'Domingo', potencial: 'alto', dica: 'Almoço especial de Páscoa' },
  { data: '2026-04-21', nome: 'Tiradentes', tipo: 'nacional', diaSemana: 'Terça', potencial: 'medio', dica: 'Terça-feira - possível emenda segunda' },
  { data: '2026-05-01', nome: 'Dia do Trabalho', tipo: 'nacional', diaSemana: 'Sexta', potencial: 'maximo', dica: 'SEXTA - feriadão perfeito!' },
  { data: '2026-05-10', nome: 'Dia das Mães', tipo: 'especial', diaSemana: 'Domingo', potencial: 'alto', dica: 'Almoço especial - reservas antecipadas' },
  { data: '2026-06-04', nome: 'Corpus Christi', tipo: 'nacional', diaSemana: 'Quinta', potencial: 'alto', dica: 'Quinta + emenda sexta = feriadão!' },
  { data: '2026-06-12', nome: 'Dia dos Namorados', tipo: 'especial', diaSemana: 'Sexta', potencial: 'maximo', dica: 'SEXTA - noite romântica perfeita!' },
  { data: '2026-06-13', nome: 'São João', tipo: 'festa_junina', diaSemana: 'Sábado', potencial: 'maximo', dica: 'Festa Junina no sábado!' },
  { data: '2026-06-24', nome: 'São João (tradicional)', tipo: 'festa_junina', diaSemana: 'Quarta', potencial: 'alto', dica: 'Arraiá especial' },
  { data: '2026-06-29', nome: 'São Pedro', tipo: 'festa_junina', diaSemana: 'Segunda', potencial: 'medio', dica: 'Final das festas juninas' },
  { data: '2026-08-09', nome: 'Dia dos Pais', tipo: 'especial', diaSemana: 'Domingo', potencial: 'alto', dica: 'Almoço especial - churrasco?' },
  { data: '2026-09-07', nome: 'Independência', tipo: 'nacional', diaSemana: 'Segunda', potencial: 'maximo', dica: 'SEGUNDA - feriadão domingo+segunda!' },
  { data: '2026-10-12', nome: 'N. Sra. Aparecida', tipo: 'nacional', diaSemana: 'Segunda', potencial: 'maximo', dica: 'SEGUNDA - outro feriadão perfeito!' },
  { data: '2026-10-31', nome: 'Halloween', tipo: 'especial', diaSemana: 'Sábado', potencial: 'maximo', dica: 'SÁBADO - festa fantasia!' },
  { data: '2026-11-02', nome: 'Finados', tipo: 'nacional', diaSemana: 'Segunda', potencial: 'alto', dica: 'Segunda - emenda de domingo' },
  { data: '2026-11-15', nome: 'Proclamação República', tipo: 'nacional', diaSemana: 'Domingo', potencial: 'medio', dica: 'Domingo - dia normal' },
  { data: '2026-12-24', nome: 'Véspera de Natal', tipo: 'natal', diaSemana: 'Quinta', potencial: 'medio', dica: 'Happy hour corporativo' },
  { data: '2026-12-25', nome: 'Natal', tipo: 'natal', diaSemana: 'Sexta', potencial: 'baixo', dica: 'Fechado ou horário especial' },
  { data: '2026-12-31', nome: 'Véspera Ano Novo', tipo: 'reveillon', diaSemana: 'Quinta', potencial: 'maximo', dica: 'Réveillon - evento do ano!' },
]

// Copa do Mundo 2026 - Jogos do Brasil (EUA/Canadá/México)
const COPA_2026 = [
  { fase: 'Fase de Grupos', jogo: 1, data: '2026-06-14', adversario: 'A definir', local: 'TBD', horario: 'TBD', potencial: 'maximo', dica: 'Estreia do Brasil - LOTAÇÃO GARANTIDA!' },
  { fase: 'Fase de Grupos', jogo: 2, data: '2026-06-18', adversario: 'A definir', local: 'TBD', horario: 'TBD', potencial: 'maximo', dica: 'Segundo jogo - manter momentum' },
  { fase: 'Fase de Grupos', jogo: 3, data: '2026-06-22', adversario: 'A definir', local: 'TBD', horario: 'TBD', potencial: 'maximo', dica: 'Terceiro jogo - decisivo?' },
  { fase: 'Oitavas', jogo: 4, data: '2026-07-01', adversario: 'A definir', local: 'TBD', horario: 'TBD', potencial: 'maximo', dica: 'Mata-mata começa!' },
  { fase: 'Quartas', jogo: 5, data: '2026-07-05', adversario: 'A definir', local: 'TBD', horario: 'TBD', potencial: 'maximo', dica: 'Quartas de final' },
  { fase: 'Semifinal', jogo: 6, data: '2026-07-09', adversario: 'A definir', local: 'TBD', horario: 'TBD', potencial: 'maximo', dica: 'Semifinal - tensão máxima!' },
  { fase: 'Final', jogo: 7, data: '2026-07-13', adversario: 'A definir', local: 'MetLife Stadium, NY', horario: 'TBD', potencial: 'maximo', dica: 'FINAL DA COPA - evento histórico!' },
]

// Jogos Importantes 2026 (Libertadores, Estadual, etc.)
const JOGOS_IMPORTANTES_2026 = [
  { competicao: 'Libertadores', fase: 'Final', data: '2026-11-28', times: 'Final', local: 'A definir', potencial: 'maximo', dica: 'Final da Libertadores - evento do ano!' },
  { competicao: 'Copa do Brasil', fase: 'Final (Ida)', data: '2026-10-21', times: 'Final', local: 'A definir', potencial: 'alto', dica: 'Final da Copa do Brasil' },
  { competicao: 'Copa do Brasil', fase: 'Final (Volta)', data: '2026-10-28', times: 'Final', local: 'A definir', potencial: 'alto', dica: 'Decisão Copa do Brasil' },
  { competicao: 'Supercopa', fase: 'Final', data: '2026-02-08', times: 'Campeão BR x Copa', local: 'Brasília', potencial: 'alto', dica: 'Primeira decisão do ano' },
  { competicao: 'Recopa', fase: 'Ida', data: '2026-02-11', times: 'Libertadores x Sudamericana', local: 'A definir', potencial: 'medio', dica: 'Recopa Sul-Americana' },
  { competicao: 'Recopa', fase: 'Volta', data: '2026-02-18', times: 'Libertadores x Sudamericana', local: 'A definir', potencial: 'medio', dica: 'Decisão Recopa' },
]

// Oportunidades Comerciais 2026
const OPORTUNIDADES_2026 = [
  { categoria: 'Shows/Festivais', evento: 'Rock in Rio', periodo: 'Setembro 2026', potencial: 'alto', dica: 'Semana do Rock - tema musical especial', icon: Music },
  { categoria: 'Shows/Festivais', evento: 'Lollapalooza', periodo: 'Março 2026', potencial: 'alto', dica: 'Fim de semana de festival', icon: Music },
  { categoria: 'Shows/Festivais', evento: 'The Town', periodo: 'Outubro 2026', potencial: 'alto', dica: 'Festival em SP', icon: Music },
  { categoria: 'Gastronomia', evento: 'Restaurant Week', periodo: 'Mar e Set 2026', potencial: 'medio', dica: 'Menu especial promocional', icon: Star },
  { categoria: 'Gastronomia', evento: 'Comida di Buteco', periodo: 'Abril/Maio 2026', potencial: 'alto', dica: 'Se participar - MARKETING!', icon: Trophy },
  { categoria: 'Corporativo', evento: 'Confraternizações', periodo: 'Nov-Dez 2026', potencial: 'maximo', dica: 'Pacotes corporativos', icon: Users },
  { categoria: 'Corporativo', evento: 'Happy Hours', periodo: 'Todo ano', potencial: 'alto', dica: 'Parcerias com empresas locais', icon: DollarSign },
  { categoria: 'Esportivo', evento: 'NFL Games', periodo: 'Set-Fev', potencial: 'medio', dica: 'Domingo de futebol americano', icon: Trophy },
  { categoria: 'Esportivo', evento: 'UFC/Lutas', periodo: 'Variado', potencial: 'alto', dica: 'Noites de luta - público específico', icon: Flame },
  { categoria: 'Cultural', evento: 'Aniversário Brasília', periodo: '21/04/2026', potencial: 'alto', dica: 'Data local importante', icon: PartyPopper },
  { categoria: 'Temático', evento: 'St. Patricks Day', periodo: '17/03/2026', potencial: 'alto', dica: 'Terça - chopp verde, promoções!', icon: Star },
  { categoria: 'Temático', evento: 'Oktoberfest', periodo: 'Out 2026', potencial: 'alto', dica: 'Semana da cerveja', icon: Star },
  { categoria: 'Sazonal', evento: 'Verão/Férias', periodo: 'Jan-Fev 2026', potencial: 'medio', dica: 'Turistas, horário estendido', icon: Sun },
  { categoria: 'Sazonal', evento: 'Volta às Aulas', periodo: 'Fev/Ago 2026', potencial: 'baixo', dica: 'Período mais fraco - promoções', icon: TrendingDown },
]

// Análise de Feriadões 2026 (dias consecutivos de folga)
const FERIADOES_2026 = [
  { nome: 'Carnaval', inicio: '2026-02-14', fim: '2026-02-18', dias: 5, potencial: 'maximo', descricao: 'Sáb-Qua: 5 dias de festa!' },
  { nome: 'Páscoa', inicio: '2026-04-03', fim: '2026-04-05', dias: 3, potencial: 'alto', descricao: 'Sex-Dom: Feriadão religioso' },
  { nome: 'Tiradentes + Emenda', inicio: '2026-04-18', fim: '2026-04-21', dias: 4, potencial: 'alto', descricao: 'Sáb-Ter: Possível emenda segunda' },
  { nome: 'Dia do Trabalho', inicio: '2026-05-01', fim: '2026-05-03', dias: 3, potencial: 'maximo', descricao: 'Sex-Dom: Feriadão perfeito!' },
  { nome: 'Corpus Christi', inicio: '2026-06-04', fim: '2026-06-07', dias: 4, potencial: 'maximo', descricao: 'Qui-Dom: Com emenda sexta!' },
  { nome: 'Independência', inicio: '2026-09-05', fim: '2026-09-07', dias: 3, potencial: 'maximo', descricao: 'Sáb-Seg: Feriadão nacional' },
  { nome: 'Aparecida', inicio: '2026-10-10', fim: '2026-10-12', dias: 3, potencial: 'maximo', descricao: 'Sáb-Seg: Outro feriadão perfeito' },
  { nome: 'Finados', inicio: '2026-10-31', fim: '2026-11-02', dias: 3, potencial: 'alto', descricao: 'Sáb-Seg: Halloween + Finados' },
  { nome: 'Natal/Ano Novo', inicio: '2026-12-24', fim: '2027-01-01', dias: 9, potencial: 'alto', descricao: 'Período festivo - corporativos' },
]

// Ideias de Ações Comerciais
const IDEIAS_ACOES = [
  { titulo: 'Pacotes Corporativos', descricao: 'Monte pacotes de confraternização Nov-Dez com preço fechado por pessoa', categoria: 'Vendas', prioridade: 'alta' },
  { titulo: 'Parcerias Empresas', descricao: 'Feche parcerias com empresas próximas para happy hours mensais', categoria: 'Parcerias', prioridade: 'alta' },
  { titulo: 'Programa Fidelidade', descricao: 'Lançar programa de pontos para aumentar recorrência', categoria: 'Fidelização', prioridade: 'media' },
  { titulo: 'Reservas Antecipadas', descricao: 'Sistema de reservas para datas especiais com desconto antecipado', categoria: 'Vendas', prioridade: 'alta' },
  { titulo: 'Lives/Transmissões', descricao: 'Transmitir jogos importantes com promoções especiais', categoria: 'Eventos', prioridade: 'alta' },
  { titulo: 'Menu Temático', descricao: 'Criar cardápios especiais para datas (Junino, Copa, Halloween)', categoria: 'Produto', prioridade: 'media' },
  { titulo: 'Influenciadores Locais', descricao: 'Parcerias com micro-influenciadores de Brasília', categoria: 'Marketing', prioridade: 'media' },
  { titulo: 'Eventos Privados', descricao: 'Oferecer espaço para eventos fechados (aniversários, empresas)', categoria: 'Vendas', prioridade: 'alta' },
  { titulo: 'Delivery/Take Away', descricao: 'Ampliar operação para períodos de menor movimento', categoria: 'Operação', prioridade: 'baixa' },
  { titulo: 'Brunch Domingos', descricao: 'Lançar brunch especial para aumentar faturamento domingo', categoria: 'Produto', prioridade: 'media' },
]

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function ComercialPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroPotencial, setFiltroPotencial] = useState('todos')
  const [expandedSection, setExpandedSection] = useState<string | null>('feriadoes')

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const feriadosOuro = FERIADOS_2026.filter(f => f.potencial === 'maximo').length
    const copaJogos = COPA_2026.length
    const oportunidades = OPORTUNIDADES_2026.length
    const feriadoes = FERIADOES_2026.length
    
    return { feriadosOuro, copaJogos, oportunidades, feriadoes }
  }, [])

  // Filtragem de feriados
  const feriadosFiltrados = useMemo(() => {
    return FERIADOS_2026.filter(f => {
      const matchSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase())
      const matchTipo = filtroTipo === 'todos' || f.tipo === filtroTipo
      const matchPotencial = filtroPotencial === 'todos' || f.potencial === filtroPotencial
      return matchSearch && matchTipo && matchPotencial
    })
  }, [searchTerm, filtroTipo, filtroPotencial])

  // Próximos eventos (ordenados por data)
  const proximosEventos = useMemo(() => {
    const hoje = new Date()
    const eventos = [
      ...FERIADOS_2026.map(f => ({ ...f, categoria: 'feriado' as const })),
      ...COPA_2026.map(c => ({ 
        data: c.data, 
        nome: `Copa: ${c.adversario}`, 
        tipo: 'copa' as const, 
        diaSemana: '', 
        potencial: c.potencial, 
        dica: c.dica,
        categoria: 'copa' as const 
      })),
    ]
    return eventos
      .filter(e => new Date(e.data) >= hoje)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 10)
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getPotencialColor = (potencial: string) => {
    switch (potencial) {
      case 'maximo': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
      case 'alto': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
      case 'medio': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
      case 'baixo': return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }

  const getPotencialIcon = (potencial: string) => {
    switch (potencial) {
      case 'maximo': return <Flame className="w-4 h-4" />
      case 'alto': return <TrendingUp className="w-4 h-4" />
      case 'medio': return <Target className="w-4 h-4" />
      default: return <TrendingDown className="w-4 h-4" />
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'nacional': return <Flag className="w-4 h-4" />
      case 'carnaval': return <PartyPopper className="w-4 h-4" />
      case 'pascoa': return <Gift className="w-4 h-4" />
      case 'especial': return <Heart className="w-4 h-4" />
      case 'festa_junina': return <Sparkles className="w-4 h-4" />
      case 'natal': return <Snowflake className="w-4 h-4" />
      case 'reveillon': return <Star className="w-4 h-4" />
      case 'copa': return <Trophy className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Central Comercial 2026
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Planejamento estratégico de datas, eventos e oportunidades
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Flame className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.feriadosOuro}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Datas Potencial Máximo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.copaJogos}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Jogos Copa do Mundo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.oportunidades}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Oportunidades Mapeadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.feriadoes}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Feriadões Identificados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="calendario" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex-wrap h-auto">
            <TabsTrigger value="calendario" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg">
              <Calendar className="w-4 h-4 mr-2" />
              Calendário 2026
            </TabsTrigger>
            <TabsTrigger value="copa" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white rounded-lg">
              <Trophy className="w-4 h-4 mr-2" />
              Copa do Mundo
            </TabsTrigger>
            <TabsTrigger value="futebol" className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg">
              <Flag className="w-4 h-4 mr-2" />
              Jogos Importantes
            </TabsTrigger>
            <TabsTrigger value="oportunidades" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg">
              <Lightbulb className="w-4 h-4 mr-2" />
              Oportunidades
            </TabsTrigger>
            <TabsTrigger value="acoes" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg">
              <Target className="w-4 h-4 mr-2" />
              Plano de Ação
            </TabsTrigger>
          </TabsList>

          {/* TAB: CALENDÁRIO 2026 */}
          <TabsContent value="calendario" className="space-y-6">
            {/* Filtros */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar data..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filtroTipo}
                      onChange={e => setFiltroTipo(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="todos">Todos os Tipos</option>
                      <option value="nacional">Nacionais</option>
                      <option value="carnaval">Carnaval</option>
                      <option value="pascoa">Páscoa</option>
                      <option value="especial">Especiais</option>
                      <option value="festa_junina">Festa Junina</option>
                    </select>
                    <select
                      value={filtroPotencial}
                      onChange={e => setFiltroPotencial(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="todos">Todos os Potenciais</option>
                      <option value="maximo">🔥 Máximo</option>
                      <option value="alto">📈 Alto</option>
                      <option value="medio">🎯 Médio</option>
                      <option value="baixo">📉 Baixo</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feriadões - Destaque */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Crown className="w-5 h-5" />
                  Feriadões 2026 - Oportunidades de Ouro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FERIADOES_2026.map((f, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{f.nome}</span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPotencialColor(f.potencial)}`}>
                          {f.dias} dias
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {formatDate(f.inicio)} → {formatDate(f.fim)}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                        💡 {f.descricao}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Feriados */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  Calendário Completo 2026
                  <span className="text-sm font-normal text-gray-500">({feriadosFiltrados.length} datas)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3 font-medium">Data</th>
                        <th className="pb-3 font-medium">Dia</th>
                        <th className="pb-3 font-medium">Evento</th>
                        <th className="pb-3 font-medium">Tipo</th>
                        <th className="pb-3 font-medium">Potencial</th>
                        <th className="pb-3 font-medium">Dica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feriadosFiltrados.map((feriado, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 font-mono text-gray-600 dark:text-gray-400">
                            {formatDate(feriado.data)}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              ['Sexta', 'Sábado'].includes(feriado.diaSemana) 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                : feriado.diaSemana === 'Domingo'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {feriado.diaSemana}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {getTipoIcon(feriado.tipo)}
                              {feriado.nome}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {feriado.tipo.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getPotencialColor(feriado.potencial)}`}>
                              {getPotencialIcon(feriado.potencial)}
                              {feriado.potencial}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                            💡 {feriado.dica}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: COPA DO MUNDO */}
          <TabsContent value="copa" className="space-y-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/10 dark:to-green-900/10 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-yellow-700 dark:text-yellow-300">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  Copa do Mundo 2026 - EUA/Canadá/México
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Primeira Copa com 48 seleções! Jogos do Brasil ainda serão definidos após sorteio.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COPA_2026.map((jogo, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                          {jogo.fase}
                        </span>
                        <span className="text-xs text-gray-500">Jogo {jogo.jogo}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">🇧🇷</div>
                        <div className="text-gray-400">vs</div>
                        <div className="text-2xl">🏳️</div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Brasil x {jogo.adversario}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        📅 {formatDate(jogo.data)} • 📍 {jogo.local}
                      </p>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                        <p className="text-xs text-green-700 dark:text-green-300">
                          💡 {jogo.dica}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Dicas para Copa do Mundo
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Fuso horário favorável: jogos provavelmente à tarde/noite no Brasil</li>
                    <li>• Prepare decoração temática verde e amarela</li>
                    <li>• Monte combos especiais para jogos</li>
                    <li>• Reserve telão/TVs adicionais com antecedência</li>
                    <li>• Considere reservas antecipadas para jogos decisivos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: JOGOS IMPORTANTES */}
          <TabsContent value="futebol" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Flag className="w-5 h-5 text-green-500" />
                  Jogos Importantes 2026
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {JOGOS_IMPORTANTES_2026.map((jogo, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          jogo.competicao === 'Libertadores' 
                            ? 'bg-amber-100 dark:bg-amber-900/30' 
                            : jogo.competicao === 'Copa do Brasil'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <Trophy className={`w-5 h-5 ${
                            jogo.competicao === 'Libertadores' 
                              ? 'text-amber-600 dark:text-amber-400' 
                              : jogo.competicao === 'Copa do Brasil'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {jogo.competicao} - {jogo.fase}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {jogo.times} • {jogo.local}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-gray-900 dark:text-white">
                          {formatDate(jogo.data)}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getPotencialColor(jogo.potencial)}`}>
                          {getPotencialIcon(jogo.potencial)}
                          {jogo.potencial}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
                    📝 Nota: Atualize com times locais!
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Adicione aqui os jogos importantes dos times de Brasília (se aplicável) e finais de estadual conforme calendário for definido.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: OPORTUNIDADES */}
          <TabsContent value="oportunidades" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['Shows/Festivais', 'Gastronomia', 'Corporativo', 'Esportivo', 'Cultural', 'Temático', 'Sazonal'].map((categoria) => {
                const itens = OPORTUNIDADES_2026.filter(o => o.categoria === categoria)
                if (itens.length === 0) return null
                
                const IconComponent = itens[0].icon
                
                return (
                  <Card key={categoria} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base">
                        {IconComponent && <IconComponent className="w-4 h-4 text-purple-500" />}
                        {categoria}
                        <span className="text-xs font-normal text-gray-500">({itens.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {itens.map((op, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">{op.evento}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPotencialColor(op.potencial)}`}>
                              {op.potencial}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{op.periodo}</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">💡 {op.dica}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* TAB: PLANO DE AÇÃO */}
          <TabsContent value="acoes" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Target className="w-5 h-5 text-blue-500" />
                  Ideias de Ações Comerciais para 2026
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sugestões de ações para aumentar faturamento e recorrência
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {IDEIAS_ACOES.map((acao, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 rounded-xl border-2 ${
                        acao.prioridade === 'alta' 
                          ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' 
                          : acao.prioridade === 'media'
                          ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{acao.titulo}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          acao.prioridade === 'alta' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                            : acao.prioridade === 'media'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {acao.prioridade}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{acao.descricao}</p>
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        {acao.categoria}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumo Mensal */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <Zap className="w-5 h-5" />
                  Resumo por Trimestre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Q1 (Jan-Mar)</h5>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>🎭 Carnaval (Fev)</li>
                      <li>☘️ St. Patrick's (Mar)</li>
                      <li>🎵 Lollapalooza (Mar)</li>
                      <li>📈 Volta às aulas</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Q2 (Abr-Jun)</h5>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>🐰 Páscoa (Abr)</li>
                      <li>👔 Dia do Trabalho (Mai)</li>
                      <li>💑 Dia Namorados (Jun)</li>
                      <li>🌽 Festas Juninas</li>
                      <li>⚽ COPA DO MUNDO!</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Q3 (Jul-Set)</h5>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>⚽ Copa continua (Jul)</li>
                      <li>👨 Dia dos Pais (Ago)</li>
                      <li>🇧🇷 Independência (Set)</li>
                      <li>🎸 Rock in Rio (Set)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Q4 (Out-Dez)</h5>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>🎃 Halloween (Out)</li>
                      <li>🏆 Final Libertadores (Nov)</li>
                      <li>🎄 Confraternizações</li>
                      <li>🎆 Réveillon</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
