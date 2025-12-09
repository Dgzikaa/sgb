import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { limparCacheCalendario } from '@/lib/helpers/calendario-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - Buscar calendário operacional
 * Query params:
 * - mes: número do mês (1-12)
 * - ano: ano (ex: 2025)
 * - bar_id: ID do bar (padrão: 3)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || new Date().getMonth() + 1 + '');
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear() + '');
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    // Calcular primeiro e último dia do mês
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    const dataInicio = primeiroDia.toISOString().split('T')[0];
    const dataFim = ultimoDia.toISOString().split('T')[0];

    console.log(`📅 Buscando calendário: ${dataInicio} até ${dataFim} (bar ${barId})`);

    // Buscar registros do calendário
    const { data: registros, error } = await supabase
      .from('calendario_operacional')
      .select('*')
      .eq('bar_id', barId)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar calendário:', error);
      throw error;
    }

    // Buscar movimento do ContaHub para datas sem registro
    const { data: movimentacoes, error: errorMovimentacoes } = await supabase
      .from('contahub_dados')
      .select('data, total_vendas')
      .eq('bar_id', barId)
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (errorMovimentacoes) {
      console.error('⚠️ Erro ao buscar movimentações:', errorMovimentacoes);
    }

    // Criar mapa de movimentações
    const movimentacoesMap = new Map(
      (movimentacoes || []).map(m => [m.data, parseFloat(m.total_vendas || '0')])
    );

    // Gerar todos os dias do mês com status
    const diasDoMes: Array<{
      data: string;
      status: 'aberto' | 'fechado' | 'desconhecido';
      motivo?: string;
      observacao?: string;
      tem_registro: boolean;
      tem_movimento: boolean;
      valor_movimento?: number;
      diaSemana: number;
      diaSemanaLabel: string;
    }> = [];

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const dataAtual = new Date(ano, mes - 1, dia);
      const dataStr = dataAtual.toISOString().split('T')[0];
      const diaSemana = dataAtual.getDay();
      
      // Verificar se tem registro manual
      const registro = registros?.find(r => r.data === dataStr);
      
      // Verificar movimento
      const movimento = movimentacoesMap.get(dataStr) || 0;
      const temMovimento = movimento > 0;

      let status: 'aberto' | 'fechado' | 'desconhecido' = 'desconhecido';
      let motivo = '';

      if (registro) {
        // Se tem registro manual, usar ele
        status = registro.status as 'aberto' | 'fechado';
        motivo = registro.motivo || '';
      } else {
        // Se não tem registro, inferir baseado em movimento (só para passado)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (dataAtual < hoje) {
          // Data passada: usar movimento como indicador
          status = temMovimento ? 'aberto' : 'fechado';
          motivo = temMovimento ? 'Movimento detectado' : 'Sem movimento';
        } else {
          // Data futura: usar padrão semanal
          if (diaSemana === 1 || diaSemana === 2) {
            // Segunda ou terça
            status = 'fechado';
            motivo = diaSemana === 1 ? 'Segunda-feira (padrão)' : 'Terça-feira (padrão)';
          } else {
            status = 'aberto';
            motivo = 'Dia normal de funcionamento';
          }
        }
      }

      diasDoMes.push({
        data: dataStr,
        status,
        motivo: registro?.motivo || motivo,
        observacao: registro?.observacao,
        tem_registro: !!registro,
        tem_movimento: temMovimento,
        valor_movimento: movimento,
        diaSemana,
        diaSemanaLabel: diasSemana[diaSemana]
      });
    }

    // Estatísticas do mês
    const totalDias = diasDoMes.length;
    const diasAbertos = diasDoMes.filter(d => d.status === 'aberto').length;
    const diasFechados = diasDoMes.filter(d => d.status === 'fechado').length;
    const diasComRegistro = diasDoMes.filter(d => d.tem_registro).length;

    return NextResponse.json({
      success: true,
      data: {
        mes,
        ano,
        bar_id: barId,
        dias: diasDoMes,
        estatisticas: {
          total_dias: totalDias,
          dias_abertos: diasAbertos,
          dias_fechados: diasFechados,
          dias_com_registro_manual: diasComRegistro,
          percentual_aberto: ((diasAbertos / totalDias) * 100).toFixed(1) + '%'
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro na API de calendário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar calendário operacional' },
      { status: 500 }
    );
  }
}

/**
 * POST - Adicionar/Atualizar registro no calendário
 * Body: { data, bar_id, status, motivo?, observacao? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, bar_id, status, motivo, observacao } = body;

    if (!bar_id) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!data || !status) {
      return NextResponse.json(
        { error: 'Data e status são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['aberto', 'fechado'].includes(status)) {
      return NextResponse.json(
        { error: 'Status deve ser "aberto" ou "fechado"' },
        { status: 400 }
      );
    }

    console.log(`📝 Salvando calendário: ${data} = ${status} (bar ${bar_id})`);

    // Buscar registro existente para histórico
    const { data: registroExistente } = await supabase
      .from('calendario_operacional')
      .select('*')
      .eq('data', data)
      .eq('bar_id', bar_id)
      .maybeSingle();

    // Upsert (inserir ou atualizar)
    const { data: resultado, error } = await supabase
      .from('calendario_operacional')
      .upsert({
        data,
        bar_id,
        status,
        motivo: motivo || null,
        observacao: observacao || null,
        atualizado_em: new Date().toISOString()
      }, {
        onConflict: 'data,bar_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar:', error);
      throw error;
    }

    // Registrar no histórico
    await supabase
      .from('calendario_historico')
      .insert({
        data,
        bar_id,
        status_anterior: registroExistente?.status || null,
        status_novo: status,
        motivo_anterior: registroExistente?.motivo || null,
        motivo_novo: motivo || null,
        observacao_anterior: registroExistente?.observacao || null,
        observacao_novo: observacao || null,
        tipo_acao: registroExistente ? 'update' : 'create',
        qtd_dias_afetados: 1,
        usuario_nome: 'Usuário Web'
      });

    // Limpar cache após mudança
    limparCacheCalendario();

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Calendário atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao salvar calendário:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar calendário operacional' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remover registro do calendário
 * Query params: data, bar_id
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    if (!data) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Removendo registro: ${data} (bar ${barId})`);

    // Buscar registro antes de deletar (para histórico)
    const { data: registroExistente } = await supabase
      .from('calendario_operacional')
      .select('*')
      .eq('data', data)
      .eq('bar_id', barId)
      .maybeSingle();

    const { error } = await supabase
      .from('calendario_operacional')
      .delete()
      .eq('data', data)
      .eq('bar_id', barId);

    if (error) {
      console.error('❌ Erro ao remover:', error);
      throw error;
    }

    // Registrar no histórico
    if (registroExistente) {
      await supabase
        .from('calendario_historico')
        .insert({
          data,
          bar_id: barId,
          status_anterior: registroExistente.status,
          status_novo: null,
          motivo_anterior: registroExistente.motivo,
          motivo_novo: null,
          tipo_acao: 'delete',
          qtd_dias_afetados: 1,
          usuario_nome: 'Usuário Web'
        });
    }

    // Limpar cache
    limparCacheCalendario();

    return NextResponse.json({
      success: true,
      message: 'Registro removido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao remover registro:', error);
    return NextResponse.json(
      { error: 'Erro ao remover registro do calendário' },
      { status: 500 }
    );
  }
}

