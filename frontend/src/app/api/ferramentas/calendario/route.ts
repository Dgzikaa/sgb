import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para autenticar usuário
async function authenticateUser(request: NextRequest) {
  try {
    const userHeader = request.headers.get('x-user-data');
    if (!userHeader) {
      return null;
    }
    
    const user = JSON.parse(decodeURIComponent(userHeader));
    return user;
  } catch (error) {
    console.error('❌ Erro ao autenticar usuário:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API Calendário - Buscando eventos e reservas');

    // Autenticação
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parâmetros da URL
    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString());
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    console.log(`📅 Buscando dados para ${mes}/${ano} - Bar ID: ${user.bar_id}`);

    // Calcular período do mês
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataInicio = `${ano}-${mes.toString().padStart(2, '0')}-01`;
    const dataFim = `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDia.toString().padStart(2, '0')}`;

    // 1. Buscar eventos da tabela eventos_base
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos_base')
      .select(`
        id,
        data_evento,
        nome,
        artista,
        genero,
        observacoes
      `)
      .eq('bar_id', user.bar_id)
      .gte('data_evento', dataInicio)
      .lte('data_evento', dataFim)
      .eq('ativo', true)
      .order('data_evento', { ascending: true });

    if (eventosError) {
      console.error('❌ Erro ao buscar eventos:', eventosError);
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }

    console.log(`✅ ${eventos?.length || 0} eventos encontrados`);

    // 2. Buscar dados de reservas do Getin
    const { data: reservas, error: reservasError } = await supabase
      .from('getin_reservations')
      .select(`
        reservation_date,
        status,
        people
      `)
      .eq('bar_id', user.bar_id)
      .gte('reservation_date', dataInicio)
      .lte('reservation_date', dataFim);

    if (reservasError) {
      console.error('❌ Erro ao buscar reservas:', reservasError);
      // Não falhar se não houver reservas, apenas logar
    }

    console.log(`✅ ${reservas?.length || 0} reservas encontradas`);

    // 3. Processar dados por data
    const dadosPorData: Record<string, any> = {};
    let totais = {
      reservas: 0,
      pessoas: 0,
      confirmadas: 0,
      pessoasConfirmadas: 0,
      canceladas: 0,
      pessoasCanceladas: 0,
      noshow: 0,
      pessoasNoshow: 0,
      pendentes: 0,
      pessoasPendentes: 0
    };

    // Adicionar eventos
    eventos?.forEach(evento => {
      const dataStr = evento.data_evento;
      if (!dadosPorData[dataStr]) {
        dadosPorData[dataStr] = {
          reservas: 0,
          pessoas: 0,
          confirmadas: 0,
          pessoasConfirmadas: 0,
          canceladas: 0,
          pessoasCanceladas: 0,
          noshow: 0,
          pessoasNoshow: 0,
          pendentes: 0,
          pessoasPendentes: 0,
          evento: null
        };
      }

      dadosPorData[dataStr].evento = {
        id: evento.id,
        nome: evento.nome,
        artista: evento.artista,
        genero: evento.genero,
        observacoes: evento.observacoes
      };
    });

    // Adicionar dados de reservas
    reservas?.forEach(reserva => {
      const dataStr = reserva.reservation_date;
      if (!dadosPorData[dataStr]) {
        dadosPorData[dataStr] = {
          reservas: 0,
          pessoas: 0,
          confirmadas: 0,
          pessoasConfirmadas: 0,
          canceladas: 0,
          pessoasCanceladas: 0,
          noshow: 0,
          pessoasNoshow: 0,
          pendentes: 0,
          pessoasPendentes: 0,
          evento: null
        };
      }

      const pessoas = reserva.people || 0;
      dadosPorData[dataStr].reservas++;
      dadosPorData[dataStr].pessoas += pessoas;

      // Contabilizar por status baseado na lógica do Getin
      if (reserva.status === 'seated') {
        // Realmente foram - contar como confirmadas efetivas
        dadosPorData[dataStr].confirmadas++;
        dadosPorData[dataStr].pessoasConfirmadas += pessoas;
        totais.confirmadas++;
        totais.pessoasConfirmadas += pessoas;
      } else if (reserva.status === 'confirmed') {
        // Confirmadas mas ainda não sentaram - contar como pendentes
        dadosPorData[dataStr].pendentes++;
        dadosPorData[dataStr].pessoasPendentes += pessoas;
        totais.pendentes++;
        totais.pessoasPendentes += pessoas;
      } else if (reserva.status === 'pending') {
        // Pendentes de confirmação
        dadosPorData[dataStr].pendentes++;
        dadosPorData[dataStr].pessoasPendentes += pessoas;
        totais.pendentes++;
        totais.pessoasPendentes += pessoas;
      } else if (reserva.status === 'canceled-user' || reserva.status === 'no-show') {
        // Canceladas pelo usuário ou no-show - agrupar como canceladas
        dadosPorData[dataStr].canceladas++;
        dadosPorData[dataStr].pessoasCanceladas += pessoas;
        totais.canceladas++;
        totais.pessoasCanceladas += pessoas;
        
        // Separar no-show para estatísticas detalhadas no header
        if (reserva.status === 'no-show') {
          dadosPorData[dataStr].noshow++;
          dadosPorData[dataStr].pessoasNoshow += pessoas;
          totais.noshow++;
          totais.pessoasNoshow += pessoas;
        }
      } else {
        // Outros status - tratar como pendente
        dadosPorData[dataStr].pendentes++;
        dadosPorData[dataStr].pessoasPendentes += pessoas;
        totais.pendentes++;
        totais.pessoasPendentes += pessoas;
      }

      // Totais gerais
      totais.reservas++;
      totais.pessoas += pessoas;
    });

    console.log(`📊 Dados processados para ${Object.keys(dadosPorData).length} dias`);
    console.log(`📈 Totais: ${totais.reservas} reservas, ${totais.pessoas} pessoas`);

    return NextResponse.json({
      success: true,
      data: dadosPorData,
      totais,
      meta: {
        mes,
        ano,
        eventos_encontrados: eventos?.length || 0,
        reservas_encontradas: reservas?.length || 0,
        dias_com_dados: Object.keys(dadosPorData).length
      }
    });

  } catch (error) {
    console.error('❌ Erro na API do calendário:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
