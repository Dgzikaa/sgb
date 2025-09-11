import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapeamento dos sócios
const SOCIOS_MAP: Record<string, string> = {
  'Digão': 'digao|rodrigo|digão',
  'Corbal': 'gabriel|corbal|eduardo',
  'Cadu': 'cadu',
  'Gonza': 'pedro|gonza|gonzalez',
  'Augusto': 'augusto',
  'Diogo': 'diogo',
  'Vinicius': 'vini|vinicius'
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
  const textoCompleto = `${mesaDesc || ''} ${motivo || ''}`.toLowerCase();

  // Verificar cada sócio
  for (const [socio, nomes] of Object.entries(SOCIOS_MAP)) {
    const nomesArray = nomes.split('|');
    
    for (const nome of nomesArray) {
      if (textoCompleto.includes(nome.toLowerCase())) {
        console.log(`✅ Sócio identificado: ${socio} - Texto: "${textoCompleto}" - Nome encontrado: "${nome}"`);
        return socio;
      }
    }
  }

  // Log para registros não identificados que podem ser sócios
  if (textoCompleto.includes('socio') || textoCompleto.includes('sócio')) {
    console.log(`⚠️ Registro não identificado: "${textoCompleto}"`);
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
      nomes.split('|').forEach(nome => {
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
    return { success: true, data: todosOsDados };

  } catch (error) {
    return { success: false, error };
  }
}
