import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const periodo = searchParams.get('periodo') || 'semana'; // dia, semana, mes
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const barId = parseInt(searchParams.get('bar_id') || '1');

    let inicioAtual: string;
    let fimAtual: string;
    let inicioAnterior: string;
    let fimAnterior: string;
    let label: string;

    // Calcular períodos baseado no tipo
    if (periodo === 'dia') {
      // DIA ESPECÍFICO
      const dataBase = dataInicio ? new Date(dataInicio) : new Date();
      inicioAtual = dataBase.toISOString().split('T')[0];
      fimAtual = inicioAtual;
      
      const dataAnt = new Date(dataBase);
      dataAnt.setDate(dataAnt.getDate() - 1);
      inicioAnterior = dataAnt.toISOString().split('T')[0];
      fimAnterior = inicioAnterior;
      
      label = new Date(inicioAtual + 'T00:00:00').toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long' 
      });
    } else if (periodo === 'mes') {
      // MÊS ESPECÍFICO
      const dataBase = dataInicio ? new Date(dataInicio) : new Date();
      const ano = dataBase.getFullYear();
      const mes = dataBase.getMonth();
      
      inicioAtual = new Date(ano, mes, 1).toISOString().split('T')[0];
      fimAtual = new Date(ano, mes + 1, 0).toISOString().split('T')[0];
      
      inicioAnterior = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
      fimAnterior = new Date(ano, mes, 0).toISOString().split('T')[0];
      
      label = new Date(inicioAtual + 'T00:00:00').toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      // SEMANA (sexta e sábado)
      function getWeekPeriod(weekNumber: number, year: number) {
        const firstDayOfYear = new Date(year, 0, 1);
        const daysToFirstFriday = (5 - firstDayOfYear.getDay() + 7) % 7;
        const firstFriday = new Date(year, 0, 1 + daysToFirstFriday);
        
        const weeksToAdd = weekNumber - 1;
        const targetFriday = new Date(firstFriday);
        targetFriday.setDate(firstFriday.getDate() + (weeksToAdd * 7));
        
        const targetSaturday = new Date(targetFriday);
        targetSaturday.setDate(targetFriday.getDate() + 1);
        
        return {
          inicio: targetFriday,
          fim: targetSaturday
        };
      }

      const hoje = new Date();
      const ano = hoje.getFullYear();
      const firstDayOfYear = new Date(ano, 0, 1);
      const daysToFirstFriday = (5 - firstDayOfYear.getDay() + 7) % 7;
      const firstFriday = new Date(ano, 0, 1 + daysToFirstFriday);
      
      let semanaAtual = 1;
      if (hoje >= firstFriday) {
        const diffTime = hoje.getTime() - firstFriday.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        semanaAtual = Math.floor(diffDays / 7) + 1;
      }

      const periodoAtual = getWeekPeriod(semanaAtual, ano);
      const periodoAnterior = getWeekPeriod(semanaAtual - 1, ano);

      inicioAtual = periodoAtual.inicio.toISOString().split('T')[0];
      fimAtual = periodoAtual.fim.toISOString().split('T')[0];
      inicioAnterior = periodoAnterior.inicio.toISOString().split('T')[0];
      fimAnterior = periodoAnterior.fim.toISOString().split('T')[0];
      
      label = `Semana ${semanaAtual}/${ano}`;
    }

    console.log(`📊 Buscando clientes ativos - Período: ${periodo}`);
    console.log(`📅 Atual: ${inicioAtual} a ${fimAtual}`);
    console.log(`📅 Anterior: ${inicioAnterior} a ${fimAnterior}`);

    // 1. CLIENTES DO PERÍODO ATUAL
    const { data: clientesAtual, error: errorAtual } = await supabase
      .from('contahub_periodo')
      .select('cli_fone')
      .eq('bar_id', barId)
      .gte('dt_gerencial', inicioAtual)
      .lte('dt_gerencial', fimAtual)
      .not('cli_fone', 'is', null);

    if (errorAtual) {
      console.error('❌ Erro ao buscar clientes período atual:', errorAtual);
      throw errorAtual;
    }

    const clientesUnicosAtual = new Set(
      (clientesAtual || [])
        .map(row => (row.cli_fone || '').toString().trim())
        .filter(Boolean)
    );

    const totalClientesAtual = clientesUnicosAtual.size;

    // 2. CLIENTES DO PERÍODO ANTERIOR
    const { data: clientesAnterior, error: errorAnterior } = await supabase
      .from('contahub_periodo')
      .select('cli_fone')
      .eq('bar_id', barId)
      .gte('dt_gerencial', inicioAnterior)
      .lte('dt_gerencial', fimAnterior)
      .not('cli_fone', 'is', null);

    if (errorAnterior) {
      console.error('❌ Erro ao buscar clientes período anterior:', errorAnterior);
      throw errorAnterior;
    }

    const clientesUnicosAnterior = new Set(
      (clientesAnterior || [])
        .map(row => (row.cli_fone || '').toString().trim())
        .filter(Boolean)
    );

    const totalClientesAnterior = clientesUnicosAnterior.size;

    // 3. HISTÓRICO - Clientes que vieram ANTES do período atual
    const { data: historicoData, error: errorHistorico } = await supabase
      .from('contahub_periodo')
      .select('cli_fone')
      .eq('bar_id', barId)
      .lt('dt_gerencial', inicioAtual)
      .not('cli_fone', 'is', null);

    if (errorHistorico) {
      console.error('❌ Erro ao buscar histórico:', errorHistorico);
      throw errorHistorico;
    }

    const clientesHistoricos = new Set(
      (historicoData || [])
        .map(row => (row.cli_fone || '').toString().trim())
        .filter(Boolean)
    );

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

    // 5. SEPARAR NOVOS vs RETORNANTES (PERÍODO ANTERIOR)
    const { data: historicoDataAnterior, error: errorHistoricoAnterior } = await supabase
      .from('contahub_periodo')
      .select('cli_fone')
      .eq('bar_id', barId)
      .lt('dt_gerencial', inicioAnterior)
      .not('cli_fone', 'is', null);

    if (errorHistoricoAnterior) {
      console.error('❌ Erro ao buscar histórico anterior:', errorHistoricoAnterior);
      throw errorHistoricoAnterior;
    }

    const clientesHistoricosAnterior = new Set(
      (historicoDataAnterior || [])
        .map(row => (row.cli_fone || '').toString().trim())
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

    // 6. CLIENTES ATIVOS (2+ visitas nos últimos 90 dias a partir do fim do período)
    const data90DiasAtras = new Date(fimAtual + 'T00:00:00');
    data90DiasAtras.setDate(data90DiasAtras.getDate() - 90);
    const data90DiasAtrasStr = data90DiasAtras.toISOString().split('T')[0];

    const { data: clientes90Dias, error: error90Dias } = await supabase
      .from('contahub_periodo')
      .select('cli_fone')
      .eq('bar_id', barId)
      .gte('dt_gerencial', data90DiasAtrasStr)
      .lte('dt_gerencial', fimAtual)
      .not('cli_fone', 'is', null);

    if (error90Dias) {
      console.error('❌ Erro ao buscar clientes 90 dias:', error90Dias);
      throw error90Dias;
    }

    const visitasPorCliente = new Map<string, number>();
    (clientes90Dias || []).forEach(row => {
      const telefone = (row.cli_fone || '').toString().trim();
      if (telefone) {
        visitasPorCliente.set(telefone, (visitasPorCliente.get(telefone) || 0) + 1);
      }
    });

    let clientesAtivos = 0;
    visitasPorCliente.forEach(visitas => {
      if (visitas >= 2) {
        clientesAtivos++;
      }
    });

    // 7. CLIENTES ATIVOS DO PERÍODO ANTERIOR
    const data90DiasAtrasAnterior = new Date(fimAnterior + 'T00:00:00');
    data90DiasAtrasAnterior.setDate(data90DiasAtrasAnterior.getDate() - 90);
    const data90DiasAtrasAnteriorStr = data90DiasAtrasAnterior.toISOString().split('T')[0];

    const { data: clientes90DiasAnterior, error: error90DiasAnterior } = await supabase
      .from('contahub_periodo')
      .select('cli_fone')
      .eq('bar_id', barId)
      .gte('dt_gerencial', data90DiasAtrasAnteriorStr)
      .lte('dt_gerencial', fimAnterior)
      .not('cli_fone', 'is', null);

    if (error90DiasAnterior) {
      console.error('❌ Erro ao buscar clientes 90 dias anterior:', error90DiasAnterior);
      throw error90DiasAnterior;
    }

    const visitasPorClienteAnterior = new Map<string, number>();
    (clientes90DiasAnterior || []).forEach(row => {
      const telefone = (row.cli_fone || '').toString().trim();
      if (telefone) {
        visitasPorClienteAnterior.set(telefone, (visitasPorClienteAnterior.get(telefone) || 0) + 1);
      }
    });

    let clientesAtivosAnterior = 0;
    visitasPorClienteAnterior.forEach(visitas => {
      if (visitas >= 2) {
        clientesAtivosAnterior++;
      }
    });

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
