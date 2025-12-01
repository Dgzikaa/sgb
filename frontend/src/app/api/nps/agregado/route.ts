import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para obter número da semana
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const tipo = searchParams.get('tipo') || 'dia'; // dia ou semana
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');

    console.log(`📊 NPS Agregado: ${tipo} | Período: ${dataInicio} a ${dataFim}`);

    // Buscar todos os dados brutos
    let query = supabase
      .from('nps')
      .select('*')
      .eq('bar_id', barId)
      .order('data_pesquisa', { ascending: true });

    if (dataInicio) {
      query = query.gte('data_pesquisa', dataInicio);
    }

    if (dataFim) {
      query = query.lte('data_pesquisa', dataFim);
    }

    const { data: npsDados, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar NPS:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    if (!npsDados || npsDados.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        tipo
      });
    }

    // Função para classificar NPS
    // Verde: >= 50, Amarelo: >= 0, Vermelho: < 0
    const classificarNPS = (nps: number) => {
      if (nps >= 50) return 'verde';
      if (nps >= 0) return 'amarelo';
      return 'vermelho';
    };

    // Função para calcular NPS TRADICIONAL (escala 0-10)
    // NPS = ((% Promotores) - (% Detratores)) × 100
    // Promotores: notas > 8 (9 e 10)
    // Neutros: notas 7 e 8 (não contam)
    // Detratores: notas < 7 (0 a 6)
    const calcularNPS = (valores: number[], comentarios: string[]) => {
      const valoresValidos = valores.filter(v => v > 0);
      if (valoresValidos.length === 0) return { 
        media: 0, 
        classificacao: 'vermelho', 
        total: 0,
        comentarios: [],
        promotores: 0,
        neutros: 0,
        detratores: 0
      };

      // Contar promotores, neutros e detratores
      const promotores = valoresValidos.filter(v => v > 8).length;
      const neutros = valoresValidos.filter(v => v >= 7 && v <= 8).length;
      const detratores = valoresValidos.filter(v => v < 7).length;
      
      // Calcular percentuais
      const percPromotores = (promotores / valoresValidos.length) * 100;
      const percDetratores = (detratores / valoresValidos.length) * 100;
      
      // NPS = % Promotores - % Detratores
      const nps = Math.round(percPromotores - percDetratores);
      
      return {
        media: nps, // Retorna NPS (-100 a +100)
        classificacao: classificarNPS(nps),
        total: valoresValidos.length,
        comentarios: comentarios.filter(c => c && c.trim() !== ''),
        promotores,
        neutros,
        detratores
      };
    };

    if (tipo === 'dia') {
      // Agrupar por dia
      const porDia = new Map();

      npsDados.forEach(registro => {
        const data = registro.data_pesquisa;
        
        if (!porDia.has(data)) {
          porDia.set(data, {
            data,
            nps_geral: [],
            nps_ambiente: [],
            nps_atendimento: [],
            nps_limpeza: [],
            nps_musica: [],
            nps_comida: [],
            nps_drink: [],
            nps_preco: [],
            nps_reservas: [],
            comentarios_geral: [],
            comentarios_ambiente: [],
            comentarios_atendimento: [],
            comentarios_limpeza: [],
            comentarios_musica: [],
            comentarios_comida: [],
            comentarios_drink: [],
            comentarios_preco: [],
            comentarios_reservas: [],
            total_respostas: 0
          });
        }

        const dia = porDia.get(data);
        dia.total_respostas++;

        const comentario = registro.comentarios || '';

        if (registro.nps_geral > 0) {
          dia.nps_geral.push(registro.nps_geral);
          if (comentario) dia.comentarios_geral.push(comentario);
        }
        if (registro.nps_ambiente > 0) {
          dia.nps_ambiente.push(registro.nps_ambiente);
          if (comentario) dia.comentarios_ambiente.push(comentario);
        }
        if (registro.nps_atendimento > 0) {
          dia.nps_atendimento.push(registro.nps_atendimento);
          if (comentario) dia.comentarios_atendimento.push(comentario);
        }
        if (registro.nps_limpeza > 0) {
          dia.nps_limpeza.push(registro.nps_limpeza);
          if (comentario) dia.comentarios_limpeza.push(comentario);
        }
        if (registro.nps_musica > 0) {
          dia.nps_musica.push(registro.nps_musica);
          if (comentario) dia.comentarios_musica.push(comentario);
        }
        if (registro.nps_comida > 0) {
          dia.nps_comida.push(registro.nps_comida);
          if (comentario) dia.comentarios_comida.push(comentario);
        }
        if (registro.nps_drink > 0) {
          dia.nps_drink.push(registro.nps_drink);
          if (comentario) dia.comentarios_drink.push(comentario);
        }
        if (registro.nps_preco > 0) {
          dia.nps_preco.push(registro.nps_preco);
          if (comentario) dia.comentarios_preco.push(comentario);
        }
        if (registro.nps_reservas > 0) {
          dia.nps_reservas.push(registro.nps_reservas);
          if (comentario) dia.comentarios_reservas.push(comentario);
        }
      });

      const resultado = Array.from(porDia.values()).map(dia => {
        // Calcular NPS de cada categoria usando fórmula tradicional
        const metricas = {
          nps_ambiente: calcularNPS(dia.nps_ambiente, dia.comentarios_ambiente),
          nps_atendimento: calcularNPS(dia.nps_atendimento, dia.comentarios_atendimento),
          nps_limpeza: calcularNPS(dia.nps_limpeza, dia.comentarios_limpeza),
          nps_musica: calcularNPS(dia.nps_musica, dia.comentarios_musica),
          nps_comida: calcularNPS(dia.nps_comida, dia.comentarios_comida),
          nps_drink: calcularNPS(dia.nps_drink, dia.comentarios_drink),
          nps_preco: calcularNPS(dia.nps_preco, dia.comentarios_preco),
          nps_reservas: calcularNPS(dia.nps_reservas, dia.comentarios_reservas),
        };

        // Calcular NPS Geral diretamente dos dados brutos (não como média das categorias)
        const npsGeral = calcularNPS(dia.nps_geral, dia.comentarios_geral);

        return {
          data: dia.data,
          semana: null,
          total_respostas: dia.total_respostas,
          nps_geral: npsGeral,
          ...metricas
        };
      });

      return NextResponse.json({
        success: true,
        data: resultado,
        tipo: 'dia'
      });

    } else {
      // Agrupar por semana (Segunda a Domingo)
      const porSemana = new Map();

      // Função para obter segunda-feira da semana
      const getSegunda = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
        const diff = day === 0 ? -6 : 1 - day; // Se domingo, volta 6 dias; senão, calcula diferença para segunda
        d.setDate(d.getDate() + diff);
        return d.toISOString().split('T')[0];
      };

      npsDados.forEach(registro => {
        const data = new Date(registro.data_pesquisa + 'T12:00:00');
        const segunda = getSegunda(data);
        const semana = getWeekNumber(data);
        const ano = data.getFullYear();
        const chave = `${ano}-W${semana}-${segunda}`;

        if (!porSemana.has(chave)) {
          porSemana.set(chave, {
            semana: `Semana ${semana}`,
            ano,
            numero_semana: semana,
            segunda_feira: segunda,
            nps_geral: [],
            nps_ambiente: [],
            nps_atendimento: [],
            nps_limpeza: [],
            nps_musica: [],
            nps_comida: [],
            nps_drink: [],
            nps_preco: [],
            nps_reservas: [],
            comentarios_geral: [],
            comentarios_ambiente: [],
            comentarios_atendimento: [],
            comentarios_limpeza: [],
            comentarios_musica: [],
            comentarios_comida: [],
            comentarios_drink: [],
            comentarios_preco: [],
            comentarios_reservas: [],
            total_respostas: 0
          });
        }

        const sem = porSemana.get(chave);
        sem.total_respostas++;

        const comentario = registro.comentarios || '';

        if (registro.nps_geral > 0) {
          sem.nps_geral.push(registro.nps_geral);
          if (comentario) sem.comentarios_geral.push(comentario);
        }
        if (registro.nps_ambiente > 0) {
          sem.nps_ambiente.push(registro.nps_ambiente);
          if (comentario) sem.comentarios_ambiente.push(comentario);
        }
        if (registro.nps_atendimento > 0) {
          sem.nps_atendimento.push(registro.nps_atendimento);
          if (comentario) sem.comentarios_atendimento.push(comentario);
        }
        if (registro.nps_limpeza > 0) {
          sem.nps_limpeza.push(registro.nps_limpeza);
          if (comentario) sem.comentarios_limpeza.push(comentario);
        }
        if (registro.nps_musica > 0) {
          sem.nps_musica.push(registro.nps_musica);
          if (comentario) sem.comentarios_musica.push(comentario);
        }
        if (registro.nps_comida > 0) {
          sem.nps_comida.push(registro.nps_comida);
          if (comentario) sem.comentarios_comida.push(comentario);
        }
        if (registro.nps_drink > 0) {
          sem.nps_drink.push(registro.nps_drink);
          if (comentario) sem.comentarios_drink.push(comentario);
        }
        if (registro.nps_preco > 0) {
          sem.nps_preco.push(registro.nps_preco);
          if (comentario) sem.comentarios_preco.push(comentario);
        }
        if (registro.nps_reservas > 0) {
          sem.nps_reservas.push(registro.nps_reservas);
          if (comentario) sem.comentarios_reservas.push(comentario);
        }
      });

      const resultado = Array.from(porSemana.values())
        .sort((a, b) => {
          // Ordenar por ano e semana DECRESCENTE (mais recente primeiro)
          if (a.ano !== b.ano) return b.ano - a.ano;
          return b.numero_semana - a.numero_semana;
        })
        .map(sem => {
          // Calcular NPS de cada categoria usando fórmula tradicional
          const metricas = {
            nps_ambiente: calcularNPS(sem.nps_ambiente, sem.comentarios_ambiente),
            nps_atendimento: calcularNPS(sem.nps_atendimento, sem.comentarios_atendimento),
            nps_limpeza: calcularNPS(sem.nps_limpeza, sem.comentarios_limpeza),
            nps_musica: calcularNPS(sem.nps_musica, sem.comentarios_musica),
            nps_comida: calcularNPS(sem.nps_comida, sem.comentarios_comida),
            nps_drink: calcularNPS(sem.nps_drink, sem.comentarios_drink),
            nps_preco: calcularNPS(sem.nps_preco, sem.comentarios_preco),
            nps_reservas: calcularNPS(sem.nps_reservas, sem.comentarios_reservas),
          };

          // Calcular NPS Geral diretamente dos dados brutos (não como média das categorias)
          const npsGeral = calcularNPS(sem.nps_geral, sem.comentarios_geral);

          return {
            semana: sem.semana,
            ano: sem.ano,
            numero_semana: sem.numero_semana,
            data: null,
            total_respostas: sem.total_respostas,
            nps_geral: npsGeral,
            ...metricas
          };
        });

      return NextResponse.json({
        success: true,
        data: resultado,
        tipo: 'semana'
      });
    }

  } catch (error: any) {
    console.error('❌ Erro na API de NPS:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

