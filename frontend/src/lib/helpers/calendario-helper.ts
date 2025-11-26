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

// ⚡ CACHE EM MEMÓRIA PARA PERFORMANCE
interface CacheEntry {
  data: StatusDia;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const statusCache = new Map<string, CacheEntry>();

// Limpar cache periodicamente
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of statusCache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        statusCache.delete(key);
      }
    }
  }, 60 * 1000); // Limpar a cada minuto
}

/**
 * Limpa o cache (útil após mudanças no calendário)
 */
export function limparCacheCalendario() {
  statusCache.clear();
  console.log('🗑️ Cache do calendário limpo');
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
    // ⚡ VERIFICAR CACHE PRIMEIRO
    const cacheKey = `${data}-${barId}`;
    const cached = statusCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }

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
      const resultado = {
        aberto: registro.status === 'aberto',
        motivo: registro.motivo || `Definido manualmente como ${registro.status}`,
        fonte: 'manual' as const
      };
      
      // Salvar no cache
      statusCache.set(cacheKey, { data: resultado, timestamp: Date.now() });
      return resultado;
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
        
        const resultado = {
          aberto: temMovimento,
          motivo: temMovimento 
            ? `Movimento detectado (R$ ${valorVendas.toFixed(2)})` 
            : 'Sem movimento registrado',
          fonte: 'movimento' as const
        };
        
        // Salvar no cache
        statusCache.set(cacheKey, { data: resultado, timestamp: Date.now() });
        return resultado;
      }
    }

    // 3º PRIORIDADE: Usar padrão semanal
    const diaSemana = dataVerificacao.getUTCDay();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    // Verificar se é terça após 15/04/2025
    const ultimaTercaOperacional = new Date('2025-04-15T12:00:00Z');
    let resultado: StatusDia;
    
    if (diaSemana === 2 && dataVerificacao > ultimaTercaOperacional) {
      resultado = {
        aberto: false,
        motivo: 'Terça-feira (bar fechado)',
        fonte: 'padrao'
      };
    } else if (diaSemana === 1) {
      // Verificar se é segunda
      resultado = {
        aberto: false,
        motivo: 'Segunda-feira (bar fechado)',
        fonte: 'padrao'
      };
    } else {
      // Outros dias: aberto
      resultado = {
        aberto: true,
        motivo: `${diasSemana[diaSemana]} (dia normal de funcionamento)`,
        fonte: 'padrao'
      };
    }

    // Salvar no cache
    statusCache.set(cacheKey, { data: resultado, timestamp: Date.now() });
    return resultado;

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

/**
 * Filtra um array de dados removendo registros de dias fechados
 * Função genérica que funciona com qualquer tipo de dado que tenha campo de data
 * 
 * @param dados - Array de dados a filtrar
 * @param campoData - Nome do campo que contém a data (padrão: 'data')
 * @param barId - ID do bar (padrão: 3)
 * @returns Array filtrado apenas com dias abertos
 */
export async function filtrarDiasAbertos<T extends Record<string, any>>(
  dados: T[],
  campoData: keyof T = 'data' as keyof T,
  barId: number = 3
): Promise<T[]> {
  if (!dados || dados.length === 0) {
    return [];
  }

  try {
    // Extrair datas únicas dos dados
    const datasUnicas = [...new Set(
      dados
        .map(item => item[campoData] as string)
        .filter(data => data) // Remove nulls/undefined
    )];

    if (datasUnicas.length === 0) {
      console.warn('⚠️ Nenhuma data válida encontrada para filtrar');
      return dados;
    }

    // Verificar status de todas as datas de uma vez
    const statusDias = await verificarMultiplasDatas(datasUnicas, barId);

    // Filtrar apenas registros de dias abertos
    const dadosFiltrados = dados.filter(item => {
      const data = item[campoData] as string;
      if (!data) return false;

      const status = statusDias.get(data);
      
      // Se não conseguiu verificar, mantém por segurança (pode ser erro de conexão)
      if (!status) return true;
      
      // Remove apenas se explicitamente fechado
      return status.aberto !== false;
    });

    const removidos = dados.length - dadosFiltrados.length;
    if (removidos > 0) {
      console.log(`🔍 Filtro de dias: ${dados.length} → ${dadosFiltrados.length} (${removidos} dias fechados removidos)`);
    }

    return dadosFiltrados;

  } catch (error) {
    console.error('❌ Erro ao filtrar dias abertos:', error);
    // Em caso de erro, retorna dados originais para não quebrar a aplicação
    return dados;
  }
}

