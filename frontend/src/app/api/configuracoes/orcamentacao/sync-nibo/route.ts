import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bar_id, ano } = body;

    if (!bar_id || !ano) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar dados do Nibo para o ano especificado
    const { data: niboData, error: niboError } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', bar_id)
      .gte('data_vencimento', `${ano}-01-01`)
      .lte('data_vencimento', `${ano}-12-31`)
      .not('categoria', 'is', null);

    if (niboError) {
      console.error('Erro ao buscar dados Nibo:', niboError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados do Nibo' },
        { status: 500 }
      );
    }

    // Agrupar por categoria, subcategoria e mês
    const orcamentoMap = new Map<string, any>();
    
    niboData?.forEach(item => {
      const mes = new Date(item.data_vencimento).getMonth() + 1;
      const key = `${item.categoria}-${item.subcategoria || ''}-${mes}`;
      
      if (!orcamentoMap.has(key)) {
        orcamentoMap.set(key, {
          bar_id,
          ano,
          mes,
          categoria_nome: item.categoria,
          subcategoria: item.subcategoria,
          valor_planejado: 0,
          valor_realizado: 0,
          tipo: item.valor < 0 ? 'despesa' : 'receita'
        });
      }
      
      const orcamento = orcamentoMap.get(key);
      
      // Somar valores realizados (pagos)
      if (item.situacao === 'pago' || item.situacao === 'Pago') {
        orcamento.valor_realizado += Math.abs(item.valor || 0);
      }
      
      // Para orçamento, podemos usar o valor total (pago + não pago) como planejado
      orcamento.valor_planejado += Math.abs(item.valor || 0);
    });

    // Verificar registros existentes e atualizar/inserir
    let importados = 0;
    let atualizados = 0;
    
    for (const [key, orcamento] of orcamentoMap) {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('orcamentacao')
        .select('id')
        .eq('bar_id', orcamento.bar_id)
        .eq('ano', orcamento.ano)
        .eq('mes', orcamento.mes)
        .eq('categoria_nome', orcamento.categoria_nome)
        .eq('subcategoria', orcamento.subcategoria || '')
        .single();

      if (existing) {
        // Atualizar valor realizado apenas
        await supabase
          .from('orcamentacao')
          .update({
            valor_realizado: orcamento.valor_realizado,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        atualizados++;
      } else {
        // Inserir novo registro
        await supabase
          .from('orcamentacao')
          .insert({
            ...orcamento,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          });
        
        importados++;
      }
    }

    return NextResponse.json({
      success: true,
      importados,
      atualizados,
      total: importados + atualizados
    });

  } catch (error) {
    console.error('Erro na sincronização Nibo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao sincronizar com Nibo' },
      { status: 500 }
    );
  }
}
