import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapeamento completo dos sócios com todas as variações
const SOCIOS_MAP: Record<string, string[]> = {
  'Digão': ['digao', 'digão', 'rodrigo'],
  'Corbal': ['gabriel', 'corbal', 'eduardo', 'xcorbal', 'corbalt'],
  'Cadu': ['cadu', 'xcadu'],
  'Gonza': ['pedro', 'gonza', 'gonzalez', 'xgonza'],
  'Augusto': ['augusto', 'xaugusto'],
  'Diogo': ['diogo', 'xdiogo'],
  'Vinicius': ['vini', 'vinicius', 'vinícius', 'xvinicius']
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');

    if (!mes || !ano) {
      return NextResponse.json(
        { error: 'Parâmetros mes e ano são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar todos os registros com paginação
    const todosOsRegistros = await buscarTodosOsRegistros(ano, mes);

    if (!todosOsRegistros.success) {
      console.error('Erro ao buscar dados dos sócios:', todosOsRegistros.error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    const data = todosOsRegistros.data;

    // Processar dados para agrupar por sócio
    const dadosProcessados = processarDadosSocios(data || []);

    return NextResponse.json({
      success: true,
      data: dadosProcessados,
      mes: parseInt(mes),
      ano: parseInt(ano)
    });

  } catch (error) {
    console.error('Erro na API de sócios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function processarDadosSocios(dados: any[]) {
  const sociosData: Record<string, {
    nome: string;
    totalGasto: number;
    transacoes: number;
    detalhes: any[];
  }> = {};

  // Inicializar todos os sócios
  Object.keys(SOCIOS_MAP).forEach(socio => {
    sociosData[socio] = {
      nome: socio,
      totalGasto: 0,
      transacoes: 0,
      detalhes: []
    };
  });

  dados.forEach(item => {
    const socioIdentificado = identificarSocio(item.vd_mesadesc, item.motivo);
    
    if (socioIdentificado) {
      sociosData[socioIdentificado].totalGasto += parseFloat(item.vr_desconto) || 0;
      sociosData[socioIdentificado].transacoes += 1;
      sociosData[socioIdentificado].detalhes.push({
        data: item.dt_gerencial,
        mesa: item.vd_mesadesc,
        motivo: item.motivo,
        valor: parseFloat(item.vr_desconto) || 0
      });
    }
  });

  // Converter para array e ordenar por total gasto
  return Object.values(sociosData)
    .map(socio => ({
      ...socio,
      totalGasto: Math.round(socio.totalGasto * 100) / 100, // Arredondar para 2 casas decimais
      detalhes: socio.detalhes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto);
}

function identificarSocio(mesaDesc: string, motivo: string): string | null {
  const mesa = (mesaDesc || '').toLowerCase();
  const motivoLower = (motivo || '').toLowerCase();
  const textoCompleto = `${mesa} ${motivoLower}`;

  // 1. Primeiro: verificar se o motivo já especifica o sócio diretamente
  // Ex: "Sócio Digão", "sócio vini", "Socio Cadu", etc.
  for (const [socio, nomes] of Object.entries(SOCIOS_MAP)) {
    for (const nome of nomes) {
      // Verificar padrões como "sócio digão", "socio vini", etc.
      if (motivoLower.includes(`sócio ${nome}`) || 
          motivoLower.includes(`socio ${nome}`) ||
          motivoLower.includes(`sócio${nome}`) ||
          motivoLower.includes(`socio${nome}`)) {
        console.log(`✅ Sócio identificado no motivo: ${socio} - Motivo: "${motivo}" - Nome: "${nome}"`);
        return socio;
      }
    }
  }

  // 2. Segundo: se o motivo for genérico ("sócio", "socio", "consumação sócio", etc.)
  // verificar o vd_mesadesc para identificar o sócio
  const motivoGenerico = motivoLower.includes('sócio') || motivoLower.includes('socio');
  
  if (motivoGenerico) {
    for (const [socio, nomes] of Object.entries(SOCIOS_MAP)) {
      for (const nome of nomes) {
        if (mesa.includes(nome)) {
          console.log(`✅ Sócio identificado na mesa (motivo genérico): ${socio} - Mesa: "${mesaDesc}" - Motivo: "${motivo}" - Nome: "${nome}"`);
          return socio;
        }
      }
    }
  }

  // 3. Terceiro: verificar qualquer lugar no texto completo
  for (const [socio, nomes] of Object.entries(SOCIOS_MAP)) {
    for (const nome of nomes) {
      if (textoCompleto.includes(nome)) {
        console.log(`✅ Sócio identificado no texto completo: ${socio} - Texto: "${textoCompleto}" - Nome: "${nome}"`);
        return socio;
      }
    }
  }

  // Log para registros não identificados que podem ser sócios
  if (motivoLower.includes('socio') || motivoLower.includes('sócio')) {
    console.log(`⚠️ Registro de sócio não identificado: Mesa: "${mesaDesc}" - Motivo: "${motivo}"`);
  }

  return null;
}

async function buscarTodosOsRegistros(ano: string, mes: string) {
  try {
    const todosOsDados: any[] = [];
    let from = 0;
    const pageSize = 1000; // Buscar 1000 registros por vez
    let hasMore = true;

    // Construir filtros OR para cada sócio
    const filtros = [];
    
    // Filtros por motivo
    filtros.push('motivo.ilike.%socio%');
    filtros.push('motivo.ilike.%sócio%');
    
    // Filtros por vd_mesadesc para cada sócio
    Object.values(SOCIOS_MAP).forEach(nomes => {
      nomes.forEach(nome => {
        filtros.push(`vd_mesadesc.ilike.%${nome}%`);
      });
    });

    while (hasMore) {
      const { data, error, count } = await supabase
        .from('contahub_periodo')
        .select('vd_mesadesc, motivo, vr_desconto, dt_gerencial', { count: 'exact' })
        .gt('vr_desconto', 0)
        .gte('dt_gerencial', `${ano}-${mes.padStart(2, '0')}-01`)
        .lt('dt_gerencial', `${ano}-${(parseInt(mes) + 1).toString().padStart(2, '0')}-01`)
        .or(filtros.join(','))
        .range(from, from + pageSize - 1)
        .order('dt_gerencial', { ascending: false });

      if (error) {
        return { success: false, error };
      }

      if (data && data.length > 0) {
        todosOsDados.push(...data);
        from += pageSize;
        
        // Se retornou menos que o pageSize, não há mais dados
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }

      // Limite de segurança para evitar loops infinitos
      if (from > 50000) {
        console.warn('Limite de segurança atingido na paginação');
        break;
      }
    }

    console.log(`Total de registros encontrados: ${todosOsDados.length}`);
    
    // Log detalhado dos registros para debug
    console.log('=== REGISTROS ENCONTRADOS ===');
    todosOsDados.forEach((registro, index) => {
      console.log(`${index + 1}. Mesa: "${registro.vd_mesadesc}" | Motivo: "${registro.motivo}" | Valor: ${registro.vr_desconto}`);
    });
    console.log('=== FIM DOS REGISTROS ===');
    
    return { success: true, data: todosOsDados };

  } catch (error) {
    return { success: false, error };
  }
}
