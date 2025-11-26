import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface StatusDia {
  aberto: boolean;
  motivo: string;
  fonte: 'manual' | 'movimento' | 'padrao';
}

/**
 * Verifica se o bar está aberto em uma determinada data
 * 
 * LÓGICA DE PRIORIDADE:
 * 1º - Verifica calendário_operacional (registro manual)
 * 2º - Para datas passadas: verifica movimento no ContaHub
 * 3º - Para datas futuras: usa padrão semanal (seg/ter fechado)
 * 
 * @param data - Data no formato YYYY-MM-DD
 * @param barId - ID do bar (padrão: 3)
 * @returns StatusDia com informações sobre o status do dia
 */
export async function verificarBarAberto(
  data: string,
  barId: number = 3
): Promise<StatusDia> {
  try {
    // 1º PRIORIDADE: Verificar se existe registro manual no calendário
    const { data: registro, error: errorRegistro } = await supabase
      .from('calendario_operacional')
      .select('status, motivo')
      .eq('data', data)
      .eq('bar_id', barId)
      .maybeSingle();

    if (errorRegistro) {
      console.error('⚠️ Erro ao verificar calendário:', errorRegistro);
    }

    if (registro) {
      console.log(`📅 Calendário manual: ${data} = ${registro.status}`);
      return {
        aberto: registro.status === 'aberto',
        motivo: registro.motivo || `Definido manualmente como ${registro.status}`,
        fonte: 'manual'
      };
    }

    // 2º PRIORIDADE: Para datas passadas, verificar movimento no ContaHub
    const dataVerificacao = new Date(data + 'T12:00:00Z');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataVerificacao < hoje) {
      // Data no passado - verificar movimento
      const { data: movimento, error: errorMovimento } = await supabase
        .from('contahub_dados')
        .select('total_vendas')
        .eq('data', data)
        .eq('bar_id', barId)
        .maybeSingle();

      if (errorMovimento) {
        console.error('⚠️ Erro ao verificar movimento:', errorMovimento);
      }

      if (movimento) {
        const valorVendas = parseFloat(movimento.total_vendas || '0');
        const temMovimento = valorVendas > 0;
        
        console.log(`💰 Movimento detectado: ${data} = R$ ${valorVendas.toFixed(2)}`);
        
        return {
          aberto: temMovimento,
          motivo: temMovimento 
            ? `Movimento detectado (R$ ${valorVendas.toFixed(2)})` 
            : 'Sem movimento registrado',
          fonte: 'movimento'
        };
      }
    }

    // 3º PRIORIDADE: Usar padrão semanal
    const diaSemana = dataVerificacao.getUTCDay();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    // Verificar se é terça após 15/04/2025
    const ultimaTercaOperacional = new Date('2025-04-15T12:00:00Z');
    if (diaSemana === 2 && dataVerificacao > ultimaTercaOperacional) {
      return {
        aberto: false,
        motivo: 'Terça-feira (bar fechado)',
        fonte: 'padrao'
      };
    }

    // Verificar se é segunda
    if (diaSemana === 1) {
      return {
        aberto: false,
        motivo: 'Segunda-feira (bar fechado)',
        fonte: 'padrao'
      };
    }

    // Outros dias: aberto
    return {
      aberto: true,
      motivo: `${diasSemana[diaSemana]} (dia normal de funcionamento)`,
      fonte: 'padrao'
    };

  } catch (error) {
    console.error('❌ Erro ao verificar se bar está aberto:', error);
    
    // Em caso de erro, assumir fechado por segurança
    return {
      aberto: false,
      motivo: 'Erro ao verificar status do dia',
      fonte: 'padrao'
    };
  }
}

/**
 * Verifica múltiplas datas de uma vez (mais eficiente)
 * 
 * @param datas - Array de datas no formato YYYY-MM-DD
 * @param barId - ID do bar (padrão: 3)
 * @returns Map com data como chave e StatusDia como valor
 */
export async function verificarMultiplasDatas(
  datas: string[],
  barId: number = 3
): Promise<Map<string, StatusDia>> {
  const resultado = new Map<string, StatusDia>();

  if (datas.length === 0) {
    return resultado;
  }

  try {
    // Buscar todos os registros manuais de uma vez
    const { data: registros, error: errorRegistros } = await supabase
      .from('calendario_operacional')
      .select('data, status, motivo')
      .eq('bar_id', barId)
      .in('data', datas);

    if (errorRegistros) {
      console.error('⚠️ Erro ao buscar registros:', errorRegistros);
    }

    // Criar map de registros manuais
    const registrosMap = new Map(
      (registros || []).map(r => [r.data, r])
    );

    // Buscar movimentações de uma vez
    const { data: movimentacoes, error: errorMovimentacoes } = await supabase
      .from('contahub_dados')
      .select('data, total_vendas')
      .eq('bar_id', barId)
      .in('data', datas);

    if (errorMovimentacoes) {
      console.error('⚠️ Erro ao buscar movimentações:', errorMovimentacoes);
    }

    // Criar map de movimentações
    const movimentacoesMap = new Map(
      (movimentacoes || []).map(m => [m.data, parseFloat(m.total_vendas || '0')])
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ultimaTercaOperacional = new Date('2025-04-15T12:00:00Z');

    // Processar cada data
    for (const data of datas) {
      // 1º - Registro manual
      const registro = registrosMap.get(data);
      if (registro) {
        resultado.set(data, {
          aberto: registro.status === 'aberto',
          motivo: registro.motivo || `Definido como ${registro.status}`,
          fonte: 'manual'
        });
        continue;
      }

      const dataVerificacao = new Date(data + 'T12:00:00Z');
      const diaSemana = dataVerificacao.getUTCDay();

      // 2º - Movimento (só para passado)
      if (dataVerificacao < hoje) {
        const movimento = movimentacoesMap.get(data) || 0;
        const temMovimento = movimento > 0;

        resultado.set(data, {
          aberto: temMovimento,
          motivo: temMovimento ? 'Movimento detectado' : 'Sem movimento',
          fonte: 'movimento'
        });
        continue;
      }

      // 3º - Padrão semanal
      if (diaSemana === 2 && dataVerificacao > ultimaTercaOperacional) {
        resultado.set(data, {
          aberto: false,
          motivo: 'Terça-feira (bar fechado)',
          fonte: 'padrao'
        });
      } else if (diaSemana === 1) {
        resultado.set(data, {
          aberto: false,
          motivo: 'Segunda-feira (bar fechado)',
          fonte: 'padrao'
        });
      } else {
        resultado.set(data, {
          aberto: true,
          motivo: 'Dia normal de funcionamento',
          fonte: 'padrao'
        });
      }
    }

    return resultado;

  } catch (error) {
    console.error('❌ Erro ao verificar múltiplas datas:', error);
    return resultado;
  }
}

