import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Interfaces para o Planejamento Comercial
interface EventoCalendario {
  id: string
  data: string
  label: string
  artista: string
  genero: string
  reservas: {
    total: number
    presentes: number
    canceladas: number
  }
  planejado: {
    faturamento: number
    clientes: number
    ticket_medio: number
  }
  realizado?: {
    faturamento: number
    clientes: number
    ticket_medio: number
  }
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
  observacoes?: string
}

interface ReservaEvento {
  id: string
  evento_id: string
  nome: string
  telefone: string
  quantidade: number
  horario: string
  status: 'confirmada' | 'presente' | 'cancelada' | 'no_show'
  observacoes?: string
  data_criacao: string
}

interface MetaDiaria {
  data: string
  faturamento_meta: number
  clientes_meta: number
  ticket_medio_meta: number
  custo_artistico: number
  custo_producao: number
}

interface RespostaCalendario {
  eventos: EventoCalendario[]
  reservas: ReservaEvento[]
  metas_diarias: MetaDiaria[]
  resumo: {
    totalEventos: number
    eventosConfirmados: number
    eventosCancelados: number
    totalReservas: number
    reservasConfirmadas: number
    faturamentoPlanejado: number
    faturamentoRealizado: number
  }
}

// Função para gerar dados mockados
function gerarEventosMockados(): EventoCalendario[] {
  const eventos: EventoCalendario[] = []
  const artistas = [
    'DJ Carlos Silva',
    'Banda Rock & Roll',
    'Samba na Laje',
    'Jazz Trio',
    'MPB Acústico',
    'Funk Carioca',
    'Pagode Tradicional',
    'Rock Alternativo'
  ]
  
  const generos = [
    'Eletrônica',
    'Rock',
    'Samba',
    'Jazz',
    'MPB',
    'Funk',
    'Pagode',
    'Pop'
  ]

  const labels = [
    'Sextou na Casa',
    'Rock Night',
    'Samba na Laje',
    'Jazz & Wine',
    'MPB Acústico',
    'Funk Night',
    'Pagode Tradicional',
    'Rock Alternativo'
  ]

  // Gerar eventos para os próximos 30 dias
  for (let i = 0; i < 30; i++) {
    const data = new Date()
    data.setDate(data.getDate() + i)
    
    // Não gerar eventos para segundas e terças (dias de fechamento)
    const diaSemana = data.getDay()
    if (diaSemana === 1 || diaSemana === 2) continue

    const artista = artistas[Math.floor(Math.random() * artistas.length)]
    const genero = generos[Math.floor(Math.random() * generos.length)]
    const label = labels[Math.floor(Math.random() * labels.length)]
    
    const reservasTotal = Math.floor(Math.random() * 50) + 20
    const reservasPresentes = Math.floor(reservasTotal * 0.8)
    const reservasCanceladas = Math.floor(reservasTotal * 0.1)
    
    const faturamentoPlanejado = Math.floor(Math.random() * 15000) + 8000
    const clientesPlanejados = Math.floor(Math.random() * 100) + 50
    const ticketMedioPlanejado = faturamentoPlanejado / clientesPlanejados
    
    // 70% de chance de ter dados realizados (eventos passados)
    const temRealizado = i < 7 && Math.random() > 0.3
    let realizado: { faturamento: number; clientes: number; ticket_medio: number } | undefined = undefined
    
    if (temRealizado) {
      const variacao = 0.2 // ±20% de variação
      const faturamentoRealizado = faturamentoPlanejado * (1 + (Math.random() - 0.5) * variacao)
      const clientesRealizados = clientesPlanejados * (1 + (Math.random() - 0.5) * variacao)
      const ticketMedioRealizado = faturamentoRealizado / clientesRealizados
      
      realizado = {
        faturamento: Math.round(faturamentoRealizado),
        clientes: Math.round(clientesRealizados),
        ticket_medio: Math.round(ticketMedioRealizado)
      }
    }

    const status = i < 7 ? 'realizado' : 
                   i < 14 ? 'confirmado' : 
                   Math.random() > 0.1 ? 'agendado' : 'cancelado'

    eventos.push({
      id: `evento_${i}`,
      data: data.toISOString().split('T')[0],
      label,
      artista,
      genero,
      reservas: {
        total: reservasTotal,
        presentes: reservasPresentes,
        canceladas: reservasCanceladas
      },
      planejado: {
        faturamento: faturamentoPlanejado,
        clientes: clientesPlanejados,
        ticket_medio: Math.round(ticketMedioPlanejado)
      },
      realizado,
      status: status as any,
      observacoes: Math.random() > 0.7 ? 'Evento especial com promoção' : undefined
    })
  }

  return eventos
}

function gerarReservasMockadas(eventos: EventoCalendario[]): ReservaEvento[] {
  const reservas: ReservaEvento[] = []
  const nomes = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
    'Carlos Ferreira', 'Lucia Rodrigues', 'Roberto Almeida', 'Fernanda Lima',
    'Marcos Pereira', 'Juliana Gomes', 'Ricardo Martins', 'Patricia Souza',
    'Andre Santos', 'Camila Oliveira', 'Felipe Costa', 'Vanessa Silva'
  ]

  eventos.forEach(evento => {
    const numReservas = evento.reservas.total
    
    for (let i = 0; i < numReservas; i++) {
      const nome = nomes[Math.floor(Math.random() * nomes.length)]
      const telefone = `11 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
      const quantidade = Math.floor(Math.random() * 4) + 1
      const horario = `${Math.floor(Math.random() * 3) + 20}:${Math.random() > 0.5 ? '00' : '30'}`
      
      let status: 'confirmada' | 'presente' | 'cancelada' | 'no_show'
      if (i < evento.reservas.presentes) {
        status = 'presente'
      } else if (i < evento.reservas.presentes + evento.reservas.canceladas) {
        status = 'cancelada'
      } else {
        status = Math.random() > 0.8 ? 'no_show' : 'confirmada'
      }

      const dataCriacao = new Date(evento.data)
      dataCriacao.setDate(dataCriacao.getDate() - Math.floor(Math.random() * 7))

      reservas.push({
        id: `reserva_${evento.id}_${i}`,
        evento_id: evento.id,
        nome,
        telefone,
        quantidade,
        horario,
        status,
        observacoes: Math.random() > 0.9 ? 'Cliente VIP' : undefined,
        data_criacao: dataCriacao.toISOString()
      })
    }
  })

  return reservas
}

function gerarMetasDiarias(eventos: EventoCalendario[]): MetaDiaria[] {
  const metas: MetaDiaria[] = []
  
  eventos.forEach(evento => {
    const faturamentoMeta = evento.planejado.faturamento
    const clientesMeta = evento.planejado.clientes
    const ticketMedioMeta = evento.planejado.ticket_medio
    const custoArtistico = Math.round(faturamentoMeta * 0.15) // 15% do faturamento
    const custoProducao = Math.round(faturamentoMeta * 0.10) // 10% do faturamento

    metas.push({
      data: evento.data,
      faturamento_meta: faturamentoMeta,
      clientes_meta: clientesMeta,
      ticket_medio_meta: ticketMedioMeta,
      custo_artistico: custoArtistico,
      custo_producao: custoProducao
    })
  })

  return metas
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const supabase = await getAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Gerar dados mockados
    const eventos = gerarEventosMockados()
    const reservas = gerarReservasMockadas(eventos)
    const metasDiarias = gerarMetasDiarias(eventos)

    // Calcular resumo
    const resumo = {
      totalEventos: eventos.length,
      eventosConfirmados: eventos.filter(e => e.status === 'confirmado').length,
      eventosCancelados: eventos.filter(e => e.status === 'cancelado').length,
      totalReservas: reservas.length,
      reservasConfirmadas: reservas.filter(r => r.status === 'confirmada' || r.status === 'presente').length,
      faturamentoPlanejado: eventos.reduce((acc, e) => acc + e.planejado.faturamento, 0),
      faturamentoRealizado: eventos.reduce((acc, e) => acc + (e.realizado?.faturamento || 0), 0)
    }

    const resposta: RespostaCalendario = {
      eventos,
      reservas,
      metas_diarias: metasDiarias,
      resumo
    }

    return NextResponse.json(resposta)

  } catch (error) {
    console.error('Erro na API de calendário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const supabase = await getAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { tipo, dados } = body

    // Aqui você implementaria a lógica para criar eventos ou reservas
    // Por enquanto, retornamos sucesso mockado
    return NextResponse.json({
      success: true,
      message: `${tipo} criado com sucesso`,
      id: `novo_${tipo}_${Date.now()}`
    })

  } catch (error) {
    console.error('Erro na API de calendário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
