import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🧪 Teste simples de conectividade NIBO');
    
    const targetBarId = process.env.NIBO_BAR_ID || '3';

    // Log de início simples
    const { data: logInicio } = await supabase
      .from('nibo_logs_sincronizacao')
      .insert({
        bar_id: parseInt(targetBarId),
        tipo_sincronizacao: 'teste_simples',
        status: 'iniciado',
        data_inicio: new Date().toISOString(),
        criado_em: new Date().toISOString()
      })
      .select()
      .single();

    // Buscar credenciais
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'nibo')
      .eq('bar_id', targetBarId)
      .eq('ativo', true)
      .single();

    if (credError || !credenciais) {
      throw new Error(`Credenciais NIBO não encontradas para bar_id ${targetBarId}`);
    }

    // Teste simples da API NIBO - apenas 1 categoria
    const url = new URL(`https://api.nibo.com.br/empresas/v1/categories`);
    url.searchParams.set('$top', '1'); // Apenas 1 registro para teste
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apitoken': credenciais.api_token
      }
    });

    if (!response.ok) {
      throw new Error(`API NIBO falhou: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Atualizar log com sucesso
    if (logInicio) {
      await supabase
        .from('nibo_logs_sincronizacao')
        .update({
          status: 'concluido',
          data_fim: new Date().toISOString(),
          mensagem_erro: null
        })
        .eq('id', logInicio.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Conectividade NIBO testada com sucesso',
      data: {
        categories_found: data.items?.length || 0,
        first_category: data.items?.[0]?.name || 'N/A',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste NIBO:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 