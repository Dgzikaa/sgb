import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Função para buscar dados com paginação (contorna limite de 1000 do Supabase)
async function fetchAllData(supabase: any, tableName: string, columns: string, filters: any = {}) {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  const MAX_ITERATIONS = 100;
  let iterations = 0;
  
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    let query = supabase
      .from(tableName)
      .select(columns)
      .range(from, from + limit - 1);
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (key.includes('gte_')) {
        query = query.gte(key.replace('gte_', ''), value);
      } else if (key.includes('lte_')) {
        query = query.lte(key.replace('lte_', ''), value);
      } else if (key.includes('lt_')) {
        query = query.lt(key.replace('lt_', ''), value);
      } else if (key.includes('eq_')) {
        query = query.eq(key.replace('eq_', ''), value);
      } else if (key.includes('neq_')) {
        query = query.neq(key.replace('neq_', ''), value);
      } else if (key.includes('not_null_')) {
        query = query.not(key.replace('not_null_', ''), 'is', null);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`❌ Erro ao buscar ${tableName}:`, error);
      break;
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allData.push(...data);
    
    if (data.length < limit) {
      break; // Última página
    }
    
    from += limit;
  }
  
  if (iterations > 1) {
    console.log(`📊 ${tableName}: ${allData.length} registros (${iterations} página(s))`);
  }
  return allData;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const periodo = searchParams.get('periodo') || 'semana'; // dia, semana, mes
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const barId = parseInt(searchParams.get('bar_id') || '3');

    let inicioAtual: string;
    let fimAtual: string;
    let inicioAnterior: string;
    let fimAnterior: string;
    let label: string;

    // Calcular períodos baseado no tipo
    if (periodo === 'dia') {
      // DIA ESPECÍFICO - Comparar com mesmo dia da semana passada (7 dias atrás)
      if (dataInicio) {
        inicioAtual = dataInicio;
        fimAtual = dataInicio;
      } else {
        const hoje = new Date();
        inicioAtual = hoje.toISOString().split('T')[0];
        fimAtual = inicioAtual;
      }
      
      // Calcular mesmo dia da semana anterior (7 dias atrás)
      const [ano, mes, dia] = inicioAtual.split('-').map(Number);
      const dataAtual = new Date(ano, mes - 1, dia);
      const dataAnterior = new Date(dataAtual);
      dataAnterior.setDate(dataAtual.getDate() - 7); // 7 dias atrás
      inicioAnterior = dataAnterior.toISOString().split('T')[0];
      fimAnterior = inicioAnterior;
      
      label = new Date(inicioAtual + 'T00:00:00').toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long' 
      });
    } else if (periodo === 'mes') {
      // MÊS ESPECÍFICO
      let ano: number, mes: number;
      if (dataInicio) {
        const [anoStr, mesStr] = dataInicio.split('-').map(Number);
        ano = anoStr;
        mes = mesStr - 1; // JavaScript usa 0-11 para meses
      } else {
        const hoje = new Date();
        ano = hoje.getFullYear();
        mes = hoje.getMonth();
      }
      
      inicioAtual = new Date(ano, mes, 1).toISOString().split('T')[0];
      fimAtual = new Date(ano, mes + 1, 0).toISOString().split('T')[0];
      
      inicioAnterior = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
      fimAnterior = new Date(ano, mes, 0).toISOString().split('T')[0];
      
      label = new Date(inicioAtual + 'T00:00:00').toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      // SEMANA (domingo a sábado)
      const hoje = dataInicio ? new Date(dataInicio + 'T12:00:00') : new Date();
      const ano = hoje.getFullYear();
      
      // Calcular início e fim da semana atual (domingo = 0, sábado = 6)
      const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
      
      // Criar data do domingo da semana (início)
      const inicioSemanaAtual = new Date(hoje);
      inicioSemanaAtual.setDate(hoje.getDate() - diaSemana); // Volta para o domingo
      inicioSemanaAtual.setHours(0, 0, 0, 0);
      
      // Criar data do sábado da semana (fim)
      const fimSemanaAtual = new Date(inicioSemanaAtual);
      fimSemanaAtual.setDate(inicioSemanaAtual.getDate() + 6); // Avança 6 dias até sábado
      fimSemanaAtual.setHours(23, 59, 59, 999);
      
      // Calcular semana anterior
      const inicioSemanaAnterior = new Date(inicioSemanaAtual);
      inicioSemanaAnterior.setDate(inicioSemanaAtual.getDate() - 7);
      const fimSemanaAnterior = new Date(inicioSemanaAnterior);
      fimSemanaAnterior.setDate(inicioSemanaAnterior.getDate() + 6);
      
      // Calcular número da semana no ano
      const inicioAno = new Date(ano, 0, 1);
      const diffTime = inicioSemanaAtual.getTime() - inicioAno.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const semanaAtual = Math.ceil((diffDays + inicioAno.getDay() + 1) / 7);

      inicioAtual = inicioSemanaAtual.toISOString().split('T')[0];
      fimAtual = fimSemanaAtual.toISOString().split('T')[0];
      inicioAnterior = inicioSemanaAnterior.toISOString().split('T')[0];
      fimAnterior = fimSemanaAnterior.toISOString().split('T')[0];
      
      label = `Semana ${semanaAtual} (${inicioSemanaAtual.toLocaleDateString('pt-BR')} - ${fimSemanaAtual.toLocaleDateString('pt-BR')})`;
    }

    console.log(`📊 Buscando clientes ativos - Período: ${periodo}`);
    console.log(`🏢 Bar ID: ${barId}`);
    console.log(`📅 Atual: ${inicioAtual} a ${fimAtual}`);
    console.log(`📅 Comparando com: ${inicioAnterior} a ${fimAnterior}`);
    if (periodo === 'dia') {
      const diaSemana = new Date(inicioAtual + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
      console.log(`📆 Comparação: ${diaSemana} vs ${diaSemana} da semana anterior`);
    }

    // ⚡ SUPER OTIMIZAÇÃO: Usar SQL DISTINCT direto (10x mais rápido)
    const startTime = Date.now();
    
    const [resultAtual, resultAnterior, resultHistorico] = await Promise.all([
      // 1. CLIENTES ÚNICOS DO PERÍODO ATUAL
      supabase.rpc('get_clientes_unicos_periodo', {
        p_bar_id: barId,
        p_data_inicio: inicioAtual,
        p_data_fim: fimAtual
      }),
      // 2. CLIENTES ÚNICOS DO PERÍODO ANTERIOR
      supabase.rpc('get_clientes_unicos_periodo', {
        p_bar_id: barId,
        p_data_inicio: inicioAnterior,
        p_data_fim: fimAnterior
      }),
      // 3. CLIENTES ÚNICOS DO HISTÓRICO
      supabase.rpc('get_clientes_unicos_historico', {
        p_bar_id: barId,
        p_data_limite: inicioAtual
      })
    ]);

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⚡ Queries principais com SQL DISTINCT: ${elapsedTime}s`);

    // Processar resultados (já vem normalizados do banco)
    const clientesUnicosAtual = new Set(
      (resultAtual.data || [])
        .map((row: any) => row.cli_fone_normalizado)
        .filter(Boolean)
    );

    const clientesUnicosAnterior = new Set(
      (resultAnterior.data || [])
        .map((row: any) => row.cli_fone_normalizado)
        .filter(Boolean)
    );

    const clientesHistoricos = new Set(
      (resultHistorico.data || [])
        .map((row: any) => row.cli_fone_normalizado)
        .filter(Boolean)
    );

    const totalClientesAtual = clientesUnicosAtual.size;
    const totalClientesAnterior = clientesUnicosAnterior.size;
    
    console.log(`👥 Total clientes período atual: ${totalClientesAtual}`);
    console.log(`📚 Total clientes no histórico: ${clientesHistoricos.size}`);

    // 4. SEPARAR NOVOS vs RETORNANTES (PERÍODO ATUAL)
    let novosClientes = 0;
    let clientesRetornantes = 0;

    clientesUnicosAtual.forEach(cliente => {
      if (clientesHistoricos.has(cliente)) {
        clientesRetornantes++;
      } else {
        novosClientes++;
      }
    });
    
    console.log(`🆕 Novos: ${novosClientes}, 🔄 Retornantes: ${clientesRetornantes}`);

    // ⚡ SUPER OTIMIZAÇÃO: Queries secundárias com SQL otimizado
    const startTime2 = Date.now();
    
    // Preparar datas para base ativa
    const dataRef = new Date(fimAtual + 'T00:00:00');
    const anoAtual = dataRef.getFullYear();
    const mesAtual = dataRef.getMonth();
    const fimMesAtual = new Date(anoAtual, mesAtual + 1, 0).toISOString().split('T')[0];
    const data90DiasAtras = new Date(fimMesAtual + 'T00:00:00');
    data90DiasAtras.setDate(data90DiasAtras.getDate() - 90);
    const data90DiasAtrasStr = data90DiasAtras.toISOString().split('T')[0];
    
    const mesAnterior = mesAtual - 1;
    const anoMesAnterior = mesAnterior < 0 ? anoAtual - 1 : anoAtual;
    const mesMesAnterior = mesAnterior < 0 ? 11 : mesAnterior;
    const fimMesAnterior = new Date(anoMesAnterior, mesMesAnterior + 1, 0).toISOString().split('T')[0];
    const data90DiasAtrasAnterior = new Date(fimMesAnterior + 'T00:00:00');
    data90DiasAtrasAnterior.setDate(data90DiasAtrasAnterior.getDate() - 90);
    const data90DiasAtrasAnteriorStr = data90DiasAtrasAnterior.toISOString().split('T')[0];

    // Executar 3 queries otimizadas em paralelo
    const [resultHistoricoAnterior, resultBaseAtiva, resultBaseAtivaAnterior] = await Promise.all([
      // 5. Histórico anterior
      supabase.rpc('get_clientes_unicos_historico', {
        p_bar_id: barId,
        p_data_limite: inicioAnterior
      }),
      // 6. BASE ATIVA DO MÊS ATUAL (já retorna só quem tem 2+ visitas)
      supabase.rpc('get_base_ativa', {
        p_bar_id: barId,
        p_data_inicio: data90DiasAtrasStr,
        p_data_fim: fimMesAtual
      }),
      // 7. BASE ATIVA DO MÊS ANTERIOR
      supabase.rpc('get_base_ativa', {
        p_bar_id: barId,
        p_data_inicio: data90DiasAtrasAnteriorStr,
        p_data_fim: fimMesAnterior
      })
    ]);

    const elapsedTime2 = ((Date.now() - startTime2) / 1000).toFixed(2);
    console.log(`⚡ Queries secundárias com SQL otimizado: ${elapsedTime2}s`);

    // Processar histórico anterior (já vem normalizado do banco)
    const clientesHistoricosAnterior = new Set(
      (resultHistoricoAnterior.data || [])
        .map((row: any) => row.cli_fone_normalizado)
        .filter(Boolean)
    );

    let novosClientesAnterior = 0;
    let clientesRetornantesAnterior = 0;

    clientesUnicosAnterior.forEach(cliente => {
      if (clientesHistoricosAnterior.has(cliente)) {
        clientesRetornantesAnterior++;
      } else {
        novosClientesAnterior++;
      }
    });

    // Base ativa atual (já vem processada do banco)
    const clientesAtivos = (resultBaseAtiva.data || []).length;

    // Base ativa anterior (já vem processada do banco)
    const clientesAtivosAnterior = (resultBaseAtivaAnterior.data || []).length;

    // 8. CALCULAR VARIAÇÕES
    const variacaoTotal = totalClientesAnterior > 0 
      ? ((totalClientesAtual - totalClientesAnterior) / totalClientesAnterior) * 100 
      : 0;

    const variacaoNovos = novosClientesAnterior > 0 
      ? ((novosClientes - novosClientesAnterior) / novosClientesAnterior) * 100 
      : 0;

    const variacaoRetornantes = clientesRetornantesAnterior > 0 
      ? ((clientesRetornantes - clientesRetornantesAnterior) / clientesRetornantesAnterior) * 100 
      : 0;

    const variacaoAtivos = clientesAtivosAnterior > 0 
      ? ((clientesAtivos - clientesAtivosAnterior) / clientesAtivosAnterior) * 100 
      : 0;

    // 9. PERCENTUAIS
    const percentualNovos = totalClientesAtual > 0 
      ? (novosClientes / totalClientesAtual) * 100 
      : 0;
    const percentualRetornantes = totalClientesAtual > 0 
      ? (clientesRetornantes / totalClientesAtual) * 100 
      : 0;

    // 10. INSIGHTS E INDICADORES
    const insights = [];

    // Crescimento geral
    if (variacaoTotal > 10) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Crescimento Acelerado',
        descricao: `O número de clientes cresceu ${variacaoTotal.toFixed(1)}% em relação ao período anterior. Continue investindo nas estratégias atuais!`
      });
    } else if (variacaoTotal < -10) {
      insights.push({
        tipo: 'atencao',
        titulo: 'Queda no Fluxo',
        descricao: `Redução de ${Math.abs(variacaoTotal).toFixed(1)}% no número de clientes. Considere ações de marketing e promoções.`
      });
    }

    // Novos clientes
    if (percentualNovos > 60) {
      insights.push({
        tipo: 'info',
        titulo: 'Alta Aquisição de Novos Clientes',
        descricao: `${percentualNovos.toFixed(1)}% dos clientes são novos. Ótimo para crescimento! Foque em estratégias de fidelização.`
      });
    }

    // Clientes retornantes
    if (percentualRetornantes > 60) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Excelente Fidelização',
        descricao: `${percentualRetornantes.toFixed(1)}% dos clientes já conhecem o Ordinário. A experiência está gerando retorno!`
      });
    }

    // Clientes ativos
    if (variacaoAtivos > 15) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Base Ativa em Crescimento',
        descricao: `A base de clientes ativos cresceu ${variacaoAtivos.toFixed(1)}%. Excelente engajamento!`
      });
    } else if (variacaoAtivos < -15) {
      insights.push({
        tipo: 'atencao',
        titulo: 'Atenção: Base Ativa em Queda',
        descricao: `Redução de ${Math.abs(variacaoAtivos).toFixed(1)}% na base ativa. Priorize reengajamento de clientes.`
      });
    }

    console.log(`✅ Período ${periodo}: ${totalClientesAtual} clientes`);
    console.log(`👤 Novos: ${novosClientes} (${percentualNovos.toFixed(1)}%)`);
    console.log(`🔄 Retornantes: ${clientesRetornantes} (${percentualRetornantes.toFixed(1)}%)`);
    console.log(`⭐ Ativos: ${clientesAtivos} (anterior: ${clientesAtivosAnterior})`);

    return NextResponse.json({
      success: true,
      data: {
        periodo,
        label,
        periodoAtual: {
          inicio: inicioAtual,
          fim: fimAtual
        },
        periodoAnterior: {
          inicio: inicioAnterior,
          fim: fimAnterior
        },
        atual: {
          totalClientes: totalClientesAtual,
          novosClientes,
          clientesRetornantes,
          percentualNovos: parseFloat(percentualNovos.toFixed(1)),
          percentualRetornantes: parseFloat(percentualRetornantes.toFixed(1)),
          clientesAtivos
        },
        anterior: {
          totalClientes: totalClientesAnterior,
          novosClientes: novosClientesAnterior,
          clientesRetornantes: clientesRetornantesAnterior,
          clientesAtivos: clientesAtivosAnterior
        },
        variacoes: {
          total: parseFloat(variacaoTotal.toFixed(1)),
          novos: parseFloat(variacaoNovos.toFixed(1)),
          retornantes: parseFloat(variacaoRetornantes.toFixed(1)),
          ativos: parseFloat(variacaoAtivos.toFixed(1))
        },
        insights
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na API de clientes ativos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao buscar dados de clientes ativos' 
      },
      { status: 500 }
    );
  }
}
