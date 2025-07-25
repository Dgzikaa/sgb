import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { apiKey, organizationId, barId } = await request.json();

    if (!apiKey || !organizationId || !barId) {
      return NextResponse.json(
        {
          error: 'API key, Organization ID e Bar ID são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Testar a API key fazendo uma requisição para o NIBO
    const testResponse = await fetch(
      'https://api.nibo.com.br/empresas/v1/organizations',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          apitoken: apiKey,
        },
      }
    );

    if (!testResponse.ok) {
      return NextResponse.json(
        {
          error: 'API key inválida ou erro na conexão com NIBO',
          details: await testResponse.text(),
        },
        { status: 400 }
      );
    }

    // Salvar ou atualizar credenciais
    const { data: existingCred } = await supabase
      .from('credenciais')
      .select('id')
      .eq('bar_id', barId)
      .eq('servico', 'nibo')
      .single();

    let result;
    if (existingCred) {
      // Atualizar credencial existente
      result = await supabase
        .from('credenciais')
        .update({
          api_key: apiKey,
          organization_id: organizationId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCred.id)
        .select();
    } else {
      // Criar nova credencial
      result = await supabase
        .from('credenciais')
        .insert({
          bar_id: barId,
          servico: 'nibo',
          api_key: apiKey,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
    }

    if (result.error) {
      console.error('Erro ao salvar credenciais:', result.error);
      return NextResponse.json(
        {
          error: 'Erro ao salvar credenciais no banco de dados',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'NIBO conectado com sucesso!',
      credential: result.data[0],
    });
  } catch (error) {
    console.error('Erro ao conectar NIBO:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
