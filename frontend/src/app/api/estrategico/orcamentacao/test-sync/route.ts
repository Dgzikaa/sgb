import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('🧪 TESTE DE SINCRONIZAÇÃO - Bar ID: 3, Ano: 2025');

    // Testar busca de dados do Nibo
    const { data: niboData, error: niboError } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', 3)
      .gte('data_competencia', '2025-07-01')
      .lte('data_competencia', '2025-07-31')
      .eq('categoria_nome', 'SALARIO FUNCIONARIOS')
      .limit(5);

    console.log('📊 Dados Nibo encontrados:', niboData?.length);
    console.log('📋 Amostra:', niboData);

    if (niboError) {
      console.error('❌ Erro:', niboError);
      return NextResponse.json({ success: false, error: niboError.message });
    }

    // Testar inserção na tabela orçamentacao
    if (niboData && niboData.length > 0) {
      const testRecord = {
        bar_id: 3,
        ano: 2025,
        mes: 7,
        categoria_nome: 'SALARIO FUNCIONARIOS',
        subcategoria: null,
        valor_planejado: 83882.15,
        valor_realizado: 20264.76,
        tipo: 'despesa',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };

      console.log('💾 Testando inserção:', testRecord);

      const { data: inserted, error: insertError } = await supabase
        .from('orcamentacao')
        .insert(testRecord)
        .select();

      if (insertError) {
        console.error('❌ Erro inserção:', insertError);
        return NextResponse.json({ success: false, error: insertError.message });
      }

      console.log('✅ Inserção bem-sucedida:', inserted);

      return NextResponse.json({
        success: true,
        nibo_encontrados: niboData.length,
        inserido: inserted,
        message: 'Teste executado com sucesso'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Nenhum dado encontrado no Nibo para julho'
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
