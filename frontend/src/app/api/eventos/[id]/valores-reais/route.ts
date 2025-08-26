import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/middleware/auth';

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔄 API Edição Valores Reais - Evento ID:', params.id);

    // Autenticação
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const eventoId = parseInt(params.id);
    if (!eventoId) {
      return NextResponse.json({ error: 'ID do evento inválido' }, { status: 400 });
    }

    // Dados do corpo da requisição
    const body = await request.json();
    
    // Extrair valores diretamente do body para evitar problemas de desestruturação
    const real_r = body.real_r;
    const cl_real = body.cl_real;
    const te_real = body.te_real;
    const tb_real = body.tb_real;
    const t_medio = body.t_medio;
    const res_tot = body.res_tot;
    const res_p = body.res_p;
    const c_art = body.c_art;
    const c_prod = body.c_prod;
    const percent_b = body.percent_b;
    const percent_d = body.percent_d;
    const percent_c = body.percent_c;
    const t_coz = body.t_coz;
    const t_bar = body.t_bar;
    const observacoes = body.observacoes;

    console.log('📝 Dados recebidos para edição:', {
      eventoId,
      real_r,
      cl_real,
      te_real,
      tb_real,
      t_medio,
      res_tot,
      res_p
    });

    console.log('🔍 Debug - Body completo recebido:', body);
    console.log('🔍 Debug - Tipo de cada valor:', {
      real_r: typeof real_r,
      cl_real: typeof cl_real,
      te_real: typeof te_real,
      tb_real: typeof tb_real,
      t_medio: typeof t_medio,
      res_tot: typeof res_tot,
      res_p: typeof res_p
    });

    // Verificar se o evento existe e pertence ao bar do usuário
    const { data: evento, error: eventoError } = await supabase
      .from('eventos_base')
      .select('id, nome, bar_id')
      .eq('id', eventoId)
      .eq('bar_id', user.bar_id)
      .single();

    if (eventoError || !evento) {
      console.error('❌ Evento não encontrado:', eventoError);
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    console.log('✅ Evento encontrado:', evento.nome);

    // Atualizar os valores reais na tabela eventos_base
    const { data: eventoAtualizado, error: updateError } = await supabase
      .from('eventos_base')
      .update({
        real_r: real_r || 0,
        cl_real: cl_real || 0,
        te_real: te_real || 0,
        tb_real: tb_real || 0,
        t_medio: t_medio || 0,
        res_tot: res_tot || 0,
        res_p: res_p || 0,
        c_art: c_art || 0,
        c_prod: c_prod || 0,
        percent_b: percent_b || 0,
        percent_d: percent_d || 0,
        percent_c: percent_c || 0,
        t_coz: t_coz || 0,
        t_bar: t_bar || 0,
        observacoes: observacoes || '',
        atualizado_em: new Date().toISOString(),
        // Marcar que os valores foram editados manualmente
        calculado_em: new Date().toISOString(),
        precisa_recalculo: false, // Não precisa recalcular pois foi editado manualmente
        versao_calculo: 999 // Versão especial para indicar edição manual
      })
      .eq('id', eventoId)
      .eq('bar_id', user.bar_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar valores reais:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao salvar valores reais',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Valores reais atualizados com sucesso para evento:', evento.nome);

    // Log da operação para auditoria
    console.log('📊 Valores salvos:', {
      evento_id: eventoId,
      evento_nome: evento.nome,
      real_r,
      cl_real,
      te_real,
      tb_real,
      t_medio,
      usuario: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Valores reais atualizados com sucesso',
      data: eventoAtualizado
    });

  } catch (error) {
    console.error('❌ Erro na API de edição de valores reais:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
