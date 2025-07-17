import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

// FunÃ¡Â§Ã¡Â£o para normalizar telefone
function normalizarTelefone(telefone: string): string {
  if (!telefone) return '';
  
  // Remove todos os caracteres nÃ¡Â£o numÃ¡Â©ricos
  const numeros = telefone.replace(/\D/g, '');
  
  // Debug: log do nÃ¡Âºmero original e processado
  if (numeros.length >= 10) {
    console.log(`Ã°Å¸â€œÂ± Normalizando: "${telefone}" -> "${numeros}" (${numeros.length} dÃ¡Â­gitos)`);
  }
  
  // Se tem 13 dÃ¡Â­gitos e comeÃ¡Â§a com 55, remover o cÃ¡Â³digo do paÃ¡Â­s
  if (numeros.length === 13 && numeros.startsWith('55')) {
    const resultado = numeros.substring(2);
    console.log(`Ã°Å¸â€œÂ± Removendo cÃ¡Â³digo 55 (13 dÃ¡Â­gitos): ${numeros} -> ${resultado}`);
    return resultado;
  }
  
  // Se tem 12 dÃ¡Â­gitos e comeÃ¡Â§a com 55, remover o cÃ¡Â³digo do paÃ¡Â­s
  if (numeros.length === 12 && numeros.startsWith('55')) {
    const resultado = numeros.substring(2);
    console.log(`Ã°Å¸â€œÂ± Removendo cÃ¡Â³digo 55 (12 dÃ¡Â­gitos): ${numeros} -> ${resultado}`);
    return resultado;
  }
  
  // Se tem 14 dÃ¡Â­gitos e comeÃ¡Â§a com 5511, remover cÃ¡Â³digo do paÃ¡Â­s + Ã¡Â¡rea duplicada
  if (numeros.length === 14 && numeros.startsWith('5511')) {
    const resultado = numeros.substring(4);
    console.log(`Ã°Å¸â€œÂ± Removendo cÃ¡Â³digo 5511 (14 dÃ¡Â­gitos): ${numeros} -> ${resultado}`);
    return resultado;
  }
  
  // Se tem 13 dÃ¡Â­gitos e comeÃ¡Â§a com 5561, remover cÃ¡Â³digo do paÃ¡Â­s + Ã¡Â¡rea
  if (numeros.length === 13 && (numeros.startsWith('5561') || numeros.startsWith('5511'))) {
    const resultado = numeros.substring(4);
    console.log(`Ã°Å¸â€œÂ± Removendo cÃ¡Â³digo 55XX (13 dÃ¡Â­gitos): ${numeros} -> ${resultado}`);
    return resultado;
  }
  
  // Retornar o nÃ¡Âºmero como estÃ¡Â¡ se jÃ¡Â¡ tem 10 ou 11 dÃ¡Â­gitos
  if (numeros.length >= 10 && numeros.length <= 11) {
    console.log(`Ã°Å¸â€œÂ± NÃ¡Âºmero jÃ¡Â¡ normalizado: ${numeros}`);
    return numeros;
  }
  
  // Se tem 9 dÃ¡Â­gitos, pode ser celular sem DDD - adicionar DDD padrÃ¡Â£o 61 (BrasÃ¡Â­lia)
  if (numeros.length === 9 && numeros.startsWith('9')) {
    const resultado = '61' + numeros;
    console.log(`Ã°Å¸â€œÂ± Adicionando DDD 61 para celular: ${numeros} -> ${resultado}`);
    return resultado;
  }
  
  // Se tem 8 dÃ¡Â­gitos, pode ser fixo sem DDD - adicionar DDD padrÃ¡Â£o 61
  if (numeros.length === 8) {
    const resultado = '61' + numeros;
    console.log(`Ã°Å¸â€œÂ± Adicionando DDD 61 para fixo: ${numeros} -> ${resultado}`);
    return resultado;
  }
  
  console.log(`Å¡Â Ã¯Â¸Â Telefone nÃ¡Â£o normalizado: ${telefone} -> ${numeros} (${numeros.length} dÃ¡Â­gitos)`);
  return numeros;
}

// FunÃ¡Â§Ã¡Â£o para formatar telefone para exibiÃ¡Â§Ã¡Â£o
function formatarTelefone(telefone: string): string {
  if (!telefone) return '';
  
  const numeros = telefone.replace(/\D/g, '');
  
  // Celular com 11 dÃ¡Â­gitos: (XX) 9XXXX-XXXX
  if (numeros.length === 11) {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
  }
  
  // Telefone fixo com 10 dÃ¡Â­gitos: (XX) XXXX-XXXX
  if (numeros.length === 10) {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
  }
  
  // Se nÃ¡Â£o conseguir formatar, retornar como estÃ¡Â¡
  return telefone;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const eventoId = searchParams.get('evento_id');
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const generoMusical = searchParams.get('genero_musical');
    const minVisitas = parseInt(searchParams.get('min_visitas') || '1');
    const statusAtividade = searchParams.get('status_atividade');
    const categoriaRecorrencia = searchParams.get('categoria_recorrencia');
    const barId = parseInt(searchParams.get('bar_id') || '1');

    console.log('Ã°Å¸â€œÂ± Buscando dados de recorrÃ¡Âªncia por telefone:', {
      eventoId,
      dataInicio,
      dataFim,
      generoMusical,
      minVisitas,
      statusAtividade,
      categoriaRecorrencia,
      barId
    });

    // Nova abordagem: buscar telefones Ã¡Âºnicos primeiro
    console.log('Ã°Å¸â€œÂ± Buscando telefones Ã¡Âºnicos do perÃ¡Â­odo...');
    const { data: telefonesPeriodo, error: errorTelefones } = await supabase
      .from('periodo')
      .select(`
        cli_nome,
        cli_telefone,
        cli_fone,
        dt_gerencial
      `)
      .eq('bar_id', barId)
      .or('cli_telefone.not.is.null,cli_fone.not.is.null');

    console.log('Ã°Å¸â€œÂ± Buscando telefones Ã¡Âºnicos do Getin...');
    const { data: telefonesGetin, error: errorGetin } = await supabase
      .from('getin_reservas')
      .select(`
        name,
        mobile,
        date
      `)
      .not('mobile', 'is', null);

    if (errorTelefones || errorGetin) {
      console.error('ÂÅ’ Erro ao buscar telefones:', { errorTelefones, errorGetin });
      return NextResponse.json({ error: 'Erro ao buscar dados de telefone' }, { status: 500 });
    }

    // Criar mapa de telefones Ã¡Âºnicos com informaÃ¡Â§Ã¡Âµes do cliente
    const telefoneMap = new Map();

    // Processar telefones do perÃ¡Â­odo
    telefonesPeriodo?.forEach((item: any) => {
      const telefone = item.cli_telefone || item.cli_fone;
      if (!telefone || telefone.length < 10) return;

      const telefoneNormalizado = normalizarTelefone(telefone);
      if (telefoneNormalizado.length < 10) return;

      if (!telefoneMap.has(telefoneNormalizado)) {
        telefoneMap.set(telefoneNormalizado, {
          telefone: telefoneNormalizado,
          nome: item.cli_nome || 'Cliente',
          datas_atividade: new Set(),
          fonte: 'periodo'
        });
      }

      const cliente = telefoneMap.get(telefoneNormalizado);
      if (item.dt_gerencial) {
        cliente.datas_atividade.add(item.dt_gerencial);
      }
      
      // Usar o nome mais completo
      if (item.cli_nome && item.cli_nome.length > cliente.nome.length) {
        cliente.nome = item.cli_nome;
      }
    });

    // Processar telefones do Getin
    telefonesGetin?.forEach((item: any) => {
      const telefone = item.mobile;
      if (!telefone || telefone.length < 10) return;

      const telefoneNormalizado = normalizarTelefone(telefone);
      if (telefoneNormalizado.length < 10) return;

      if (!telefoneMap.has(telefoneNormalizado)) {
        telefoneMap.set(telefoneNormalizado, {
          telefone: telefoneNormalizado,
          nome: item.name || 'Cliente Sympla',
          datas_atividade: new Set(),
          fonte: 'getin'
        });
      }

      const cliente = telefoneMap.get(telefoneNormalizado);
      if (item.date) {
        cliente.datas_atividade.add(item.date);
      }
      
      // Usar o nome mais completo
      if (item.name && item.name.length > cliente.nome.length) {
        cliente.nome = item.name;
      }
    });

    console.log(`Ã°Å¸â€œÅ  Telefones Ã¡Âºnicos encontrados: ${telefoneMap.size}`);

          // Debug: mostrar alguns telefones processados
    let debugCount = 0;
    for (const [telefoneNormalizado, dadosTelefone] of telefoneMap.entries()) {
      if (debugCount < 5) {
        console.log(`Ã°Å¸â€œÂ± Debug telefone ${debugCount + 1}: ${telefoneNormalizado} -> ${formatarTelefone(telefoneNormalizado)} (${dadosTelefone.nome})`);
        debugCount++;
      }
    }

    // Agora buscar visitas apenas para as datas onde cada telefone teve atividade
    const clientesTelefone = [];

    for (const [telefoneNormalizado, dadosTelefone] of telefoneMap.entries()) {
      const datasAtividade = Array.from(dadosTelefone.datas_atividade);
      
      if (datasAtividade.length === 0) continue;

      // Buscar visitas de duas formas:
      // 1. Por data de atividade (mÃ¡Â©todo atual)
      // 2. Por telefone do cliente (se existir na tabela clientes)
      
      let visitasCliente: any[] = [];
      
      // MÃ¡Â©todo 1: Buscar por data de atividade
      const { data: visitasPorData, error: errorVisitasData } = await supabase
        .from('cliente_visitas')
        .select(`
          cliente_id,
          data_visita,
          valor_gasto,
          evento_id,
          tipo_visita
        `)
        .eq('bar_id', barId)
        .in('data_visita', datasAtividade)
        .limit(1000);

      if (visitasPorData && visitasPorData.length > 0) {
        visitasCliente = [...visitasCliente, ...visitasPorData];
      }

      // MÃ¡Â©todo 2: Buscar por telefone na tabela clientes
      const { data: clientesPorTelefone, error: errorClientes } = await supabase
        .from('clientes')
        .select('id')
        .or(`telefone.eq.${dadosTelefone.telefone},telefone.eq.${formatarTelefone(dadosTelefone.telefone)},telefone.ilike.%${dadosTelefone.telefone}%`)
        .eq('bar_id', barId);

      if (clientesPorTelefone && clientesPorTelefone.length > 0) {
        const clienteIds = clientesPorTelefone.map((c: any) => c.id);
        
        const { data: visitasPorTelefone, error: errorVisitasTel } = await supabase
          .from('cliente_visitas')
          .select(`
            cliente_id,
            data_visita,
            valor_gasto,
            evento_id,
            tipo_visita
          `)
          .in('cliente_id', clienteIds)
          .eq('bar_id', barId)
          .limit(1000);

        if (visitasPorTelefone && visitasPorTelefone.length > 0) {
          visitasCliente = [...visitasCliente, ...visitasPorTelefone];
        }
      }

      if (visitasCliente.length === 0) {
        continue;
      }

      // Remover duplicatas baseado em cliente_id + data_visita
      const visitasUnicas = visitasCliente
        .filter((visita: any, index: number, array: any[]) => {
          const key = `${visita.cliente_id}-${visita.data_visita}`;
          return array.findIndex((v: any) => `${v.cliente_id}-${v.data_visita}` === key) === index;
        })
        .sort((a: any, b: any) => new Date(a.data_visita).getTime() - new Date(b.data_visita).getTime())
        .slice(0, 100); // MÃ¡Â¡ximo de 100 visitas por telefone

      if (visitasUnicas.length === 0) continue;

      const totalVisitas = visitasUnicas.length;
      const primeiraVisita = visitasUnicas[0]?.data_visita;
      const ultimaVisita = visitasUnicas[visitasUnicas.length - 1]?.data_visita;
      const valorTotal = visitasUnicas.reduce((sum: number, v: any) => sum + parseFloat(String(v.valor_gasto || 0)), 0);
      const ticketMedio = totalVisitas > 0 ? valorTotal / totalVisitas : 0;

      // Calcular dias sem visitar
      const diasSemVisitar = ultimaVisita ? 
        Math.floor((new Date().getTime() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24)) : 
        null;

      clientesTelefone.push({
        telefone: formatarTelefone(dadosTelefone.telefone),
        telefone_normalizado: dadosTelefone.telefone,
        nome: dadosTelefone.nome,
        total_visitas: totalVisitas,
        valor_total_gasto: valorTotal,
        ticket_medio: ticketMedio,
        primeira_visita: primeiraVisita,
        ultima_visita: ultimaVisita,
        categoria_recorrencia: totalVisitas >= 10 ? 'VIP' : 
                             totalVisitas >= 5 ? 'Frequente' : 
                             totalVisitas >= 2 ? 'Regular' : 'Novo',
        status_atividade: (() => {
          if (!ultimaVisita || diasSemVisitar === null) return 'Inativo';
          if (diasSemVisitar <= 7) return 'Ativo';
          if (diasSemVisitar <= 30) return 'Moderado';
          if (diasSemVisitar <= 60) return 'Em Risco';
          return 'Inativo';
        })(),
        dias_sem_visitar: diasSemVisitar,
        fonte: dadosTelefone.fonte
      });
    }

    // Filtrar por nÃ¡Âºmero mÃ¡Â­nimo de visitas
    let clientesFiltrados = clientesTelefone.filter((cliente: any) => cliente.total_visitas >= minVisitas);

    // Aplicar filtros adicionais
    if (statusAtividade && statusAtividade !== 'todos') {
      clientesFiltrados = clientesFiltrados.filter((cliente: any) => cliente.status_atividade === statusAtividade);
    }
    if (categoriaRecorrencia && categoriaRecorrencia !== 'todos') {
      clientesFiltrados = clientesFiltrados.filter((cliente: any) => cliente.categoria_recorrencia === categoriaRecorrencia);
    }

    // Ordenar por total de visitas e valor gasto
    clientesFiltrados.sort((a: any, b: any) => {
      if (a.total_visitas !== b.total_visitas) {
        return b.total_visitas - a.total_visitas;
      }
      return b.valor_total_gasto - a.valor_total_gasto;
    });

    // Se evento especÃ¡Â­fico, buscar clientes que visitaram esse evento
    let clientesEvento = [];
    if (eventoId) {
      const { data: visitasEvento, error: errorEvento } = await supabase
        .from('cliente_visitas')
        .select(`
          cliente_id,
          clientes!inner (
            telefone,
            nome,
            total_visitas,
            valor_total_gasto,
            valor_medio_ticket
          )
        `)
        .eq('evento_id', eventoId)
        .not('clientes.telefone', 'is', null);

      if (!errorEvento && visitasEvento) {
        // Mapear dados do evento para formato compatÃ¡Â­vel
        clientesEvento = visitasEvento.map((visita: any) => ({
          telefone: visita.clientes.telefone,
          nome: visita.clientes.nome,
          total_visitas: visita.clientes.total_visitas,
          valor_total_gasto: visita.clientes.valor_total_gasto,
          ticket_medio: visita.clientes.valor_medio_ticket,
          categoria_recorrencia: visita.clientes.total_visitas >= 10 ? 'VIP' : 
                                visita.clientes.total_visitas >= 5 ? 'Frequente' : 
                                visita.clientes.total_visitas >= 2 ? 'Regular' : 'Novo'
        }));
      }
    }

    // Se gÃ¡Âªnero musical especÃ¡Â­fico, buscar atravÃ¡Â©s de eventos
    if (generoMusical && generoMusical !== 'todos') {
      const { data: eventosGenero, error: errorGenero } = await supabase
        .from('eventos')
        .select('id')
        .eq('bar_id', barId)
        .eq('genero_musical', generoMusical);

      if (!errorGenero && eventosGenero?.length > 0) {
        const eventoIds = eventosGenero.map((e: any) => e.id);
        
        const { data: visitasGenero, error: errorVisitasGenero } = await supabase
          .from('cliente_visitas')
          .select(`
            cliente_id,
            clientes!inner (
              telefone,
              nome,
              total_visitas,
              valor_total_gasto,
              valor_medio_ticket
            )
          `)
          .in('evento_id', eventoIds)
          .not('clientes.telefone', 'is', null);

        if (!errorVisitasGenero && visitasGenero) {
          const clientesGenero = visitasGenero.map((visita: any) => ({
            telefone: visita.clientes.telefone,
            nome: visita.clientes.nome,
            total_visitas: visita.clientes.total_visitas,
            valor_total_gasto: visita.clientes.valor_total_gasto,
            ticket_medio: visita.clientes.valor_medio_ticket,
            categoria_recorrencia: visita.clientes.total_visitas >= 10 ? 'VIP' : 
                                  visita.clientes.total_visitas >= 5 ? 'Frequente' : 
                                  visita.clientes.total_visitas >= 2 ? 'Regular' : 'Novo'
          }));

          // Filtrar clientes principais pelos que visitaram eventos do gÃ¡Âªnero
          const telefonesFiltrados = new Set(clientesGenero.map((c: any) => c.telefone));
          clientesFiltrados = clientesFiltrados.filter((cliente: any) => 
            telefonesFiltrados.has(cliente.telefone)
          );
        }
      }
    }

    // Calcular estatÃ¡Â­sticas
    const totalClientes = clientesFiltrados.length;
    const clientesVIP = clientesFiltrados.filter((c: any) => c.categoria_recorrencia === 'VIP').length;
    const clientesFrequentes = clientesFiltrados.filter((c: any) => c.categoria_recorrencia === 'Frequente').length;
    const clientesAtivos = clientesFiltrados.filter((c: any) => c.status_atividade === 'Ativo').length;
    const receitaTotal = clientesFiltrados.reduce((sum: number, c: any) => sum + parseFloat(String(c.valor_total_gasto || 0)), 0);
    const ticketMedio = totalClientes > 0 ? receitaTotal / totalClientes : 0;

    // Top clientes para diferentes mÃ¡Â©tricas
    const topPorVisitas = clientesFiltrados.slice(0, 10).map((cliente: any) => ({
      ...cliente,
      telefone: formatarTelefone(cliente.telefone_normalizado || cliente.telefone)
    }));
    
    console.log('Ã°Å¸Ââ€  TOP POR VISITAS (primeiros 3):', topPorVisitas.slice(0, 3).map((c) => ({
      nome: c.nome,
      telefone: c.telefone,
      total_visitas: c.total_visitas,
      ticket_medio: c.ticket_medio,
      valor_total_gasto: c.valor_total_gasto
    })));
    
    const topPorTicket = [...clientesFiltrados]
      .sort((a: any, b: any) => parseFloat(String(b.ticket_medio || 0)) - parseFloat(String(a.ticket_medio || 0)))
      .slice(0, 10)
      .map((cliente: any) => ({
        ...cliente,
        telefone: formatarTelefone(cliente.telefone_normalizado || cliente.telefone)
      }));
      
    console.log('Ã°Å¸â€™Â° TOP POR TICKET MÃ¡â€°DIO (primeiros 3):', topPorTicket.slice(0, 3).map((c) => ({
      nome: c.nome,
      telefone: c.telefone,
      total_visitas: c.total_visitas,
      ticket_medio: c.ticket_medio,
      valor_total_gasto: c.valor_total_gasto
    })));
      
    const topPorReceita = [...clientesFiltrados]
      .sort((a: any, b: any) => parseFloat(String(b.valor_total_gasto || 0)) - parseFloat(String(a.valor_total_gasto || 0)))
      .slice(0, 10)
      .map((cliente: any) => ({
        ...cliente,
        telefone: formatarTelefone(cliente.telefone_normalizado || cliente.telefone)
      }));

    console.log('Ã°Å¸â€™Å½ TOP POR FATURAMENTO (primeiros 3):', topPorReceita.slice(0, 3).map((c) => ({
      nome: c.nome,
      telefone: c.telefone,
      total_visitas: c.total_visitas,
      ticket_medio: c.ticket_medio,
      valor_total_gasto: c.valor_total_gasto
    })));

    // Clientes para campanhas de marketing (4+ visitas com telefone)
    const clientesCampanha = clientesFiltrados
      .filter((c: any) => c.total_visitas >= 4 && (c.telefone_normalizado || c.telefone) && (c.telefone_normalizado || c.telefone).length >= 10)
      .map((cliente: any) => ({
        ...cliente,
        telefone: formatarTelefone(cliente.telefone_normalizado || cliente.telefone)
      }));

    const resultado = {
      clientes: clientesFiltrados,
      clientesEvento,
      estatisticas: {
        total_clientes: totalClientes,
        clientes_vip: clientesVIP,
        clientes_frequentes: clientesFrequentes,
        clientes_ativos: clientesAtivos,
        receita_total: receitaTotal,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
        clientes_para_campanha: clientesCampanha.length
      },
      rankings: {
        top_por_visitas: topPorVisitas,
        top_por_ticket: topPorTicket,
        top_por_receita: topPorReceita
      },
      campanhas: {
        clientes_4_plus_visitas: clientesCampanha
      }
    };

    console.log('Å“â€¦ Dados de telefone carregados (corrigidos):', {
      total: totalClientes,
      vip: clientesVIP,
      campanha: clientesCampanha.length,
      telefones_processados: telefoneMap.size,
      top_visitas_sample: topPorVisitas.slice(0, 3).map((c) => ({
        nome: c.nome,
        telefone: c.telefone,
        telefone_normalizado: c.telefone_normalizado,
        visitas: c.total_visitas
      }))
    });

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('ÂÅ’ Erro interno na API de recorrÃ¡Âªncia por telefone:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 

