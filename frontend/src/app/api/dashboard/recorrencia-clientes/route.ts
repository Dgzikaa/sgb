import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const data1 = searchParams.get('data1');
    const data2 = searchParams.get('data2');
    const barId = searchParams.get('bar_id');

    if (!data1 || !data2 || !barId) {
      return NextResponse.json({ 
        error: 'Parâmetros obrigatórios: data1, data2, bar_id' 
      }, { status: 400 });
    }

    console.log(`🔍 Analisando recorrência entre ${data1} e ${data2} para bar ${barId}`);

    // Try multiple sources for customer data
    let emailsData1: unknown[] = [];
    let emailsData2: unknown[] = [];

    // First try the periodo table
    const { data: periodData1, error: periodError1 } = await supabase
      .from('periodo')
      .select('cli_email')
      .eq('bar_id', barId)
      .eq('dt_gerencial', data1)
      .not('cli_email', 'is', null)
      .not('cli_email', 'eq', '');

    const { data: periodData2, error: periodError2 } = await supabase
      .from('periodo')
      .select('cli_email')
      .eq('bar_id', barId)
      .eq('dt_gerencial', data2)
      .not('cli_email', 'is', null)
      .not('cli_email', 'eq', '');

    if (!periodError1 && periodData1) {
      emailsData1 = periodData1;
    }
    if (!periodError2 && periodData2) {
      emailsData2 = periodData2;
    }

    console.log(`📧 Emails encontrados - Data1: ${emailsData1.length}, Data2: ${emailsData2.length}`);

    // If we have very little data, try to get from other sources
    if (emailsData1.length === 0 && emailsData2.length === 0) {
      // Try to get general customer count from pessoas_diario_corrigido for context
      const { data: pessoasData1 } = await supabase
        .from('pessoas_diario_corrigido')
        .select('total_pessoas_bruto')
        .eq('dt_gerencial', data1)
        .maybeSingle();

      const { data: pessoasData2 } = await supabase
        .from('pessoas_diario_corrigido')
        .select('total_pessoas_bruto')
        .eq('dt_gerencial', data2)
        .maybeSingle();

      // Return estimated data based on general metrics
      const totalData1 = pessoasData1?.total_pessoas_bruto || 0;
      const totalData2 = pessoasData2?.total_pessoas_bruto || 0;

      return NextResponse.json({
        success: true,
        limitedData: true,
        message: 'Dados de email limitados. Análise baseada em estimativas.',
        data: {
          data1,
          data2,
          totalData1,
          totalData2,
          recorrentes: 0,
          novos: totalData2,
          percentualRecorrencia: 0,
          percentualNovos: 100,
          crescimento: totalData1 > 0 ? ((totalData2 - totalData1) / totalData1) * 100 : 0,
          insights: {
            fidelizacao: 'Dados insuficientes',
            captacao: 'Dados insuficientes',
            tendencia: totalData2 > totalData1 ? 'Crescendo' : totalData2 < totalData1 ? 'Diminuindo' : 'Estável'
          }
        }
      });
    }

    // Extract unique emails
    const emailsUnicosData1 = new Set(emailsData1?.map((item: unknown) => item.cli_email.toLowerCase().trim()) || []);
    const emailsUnicosData2 = new Set(emailsData2?.map((item: unknown) => item.cli_email.toLowerCase().trim()) || []);

    // Calculate recurrence
    const emailsRecorrentes = new Set([...emailsUnicosData1].filter(email => emailsUnicosData2.has(email)));
    const emailsNovos = new Set([...emailsUnicosData2].filter(email => !emailsUnicosData1.has(email)));

    const totalData1 = emailsUnicosData1.size;
    const totalData2 = emailsUnicosData2.size;
    const recorrentes = emailsRecorrentes.size;
    const novos = emailsNovos.size;

    // Calculate metrics
    const percentualRecorrencia = totalData2 > 0 ? (recorrentes / totalData2) * 100 : 0;
    const percentualNovos = totalData2 > 0 ? (novos / totalData2) * 100 : 0;
    const crescimento = totalData1 > 0 ? ((totalData2 - totalData1) / totalData1) * 100 : 0;

    console.log(`📊 Resultados da recorrência:`);
    console.log(`   Data 1 (${data1}): ${totalData1} clientes únicos`);
    console.log(`   Data 2 (${data2}): ${totalData2} clientes únicos`);
    console.log(`   Recorrentes: ${recorrentes} (${percentualRecorrencia.toFixed(1)}%)`);
    console.log(`   Novos: ${novos} (${percentualNovos.toFixed(1)}%)`);
    console.log(`   Crescimento: ${crescimento.toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      limitedData: totalData1 + totalData2 < 10, // Flag if we have very little data
      data: {
        data1,
        data2,
        totalData1,
        totalData2,
        recorrentes,
        novos,
        percentualRecorrencia: parseFloat(percentualRecorrencia.toFixed(1)),
        percentualNovos: parseFloat(percentualNovos.toFixed(1)),
        crescimento: parseFloat(crescimento.toFixed(1)),
        insights: {
          fidelizacao: percentualRecorrencia >= 40 ? 'Alta' : percentualRecorrencia >= 25 ? 'Média' : 'Baixa',
          captacao: percentualNovos >= 60 ? 'Excelente' : percentualNovos >= 40 ? 'Boa' : 'Regular',
          tendencia: crescimento > 10 ? 'Crescendo' : crescimento < -10 ? 'Diminuindo' : 'Estável'
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro na análise de recorrência:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
