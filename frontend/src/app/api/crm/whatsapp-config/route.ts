import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Obter configuração atual do WhatsApp
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');

    let query = supabase.from('whatsapp_configuracoes').select('*');
    
    if (barId) {
      query = query.eq('bar_id', parseInt(barId));
    }
    
    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    // Mascarar token para segurança
    const configMascarada = data ? {
      ...data,
      access_token: data.access_token ? '***' + data.access_token.slice(-10) : null,
      configurado: !!data.access_token && !!data.phone_number_id
    } : null;

    return NextResponse.json({
      success: true,
      data: configMascarada,
      configurado: !!configMascarada?.configurado
    });

  } catch (error: any) {
    console.error('Erro ao buscar config WhatsApp:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Salvar/Atualizar configuração do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bar_id,
      phone_number_id,
      access_token,
      api_version,
      rate_limit_per_minute,
      template_prefix,
      idioma,
      max_retry_attempts,
      retry_delay_seconds
    } = body;

    // Validações
    if (!phone_number_id) {
      throw new Error('Phone Number ID é obrigatório');
    }
    if (!access_token) {
      throw new Error('Access Token é obrigatório');
    }

    // Verificar se já existe configuração para este bar
    const { data: existente } = await supabase
      .from('whatsapp_configuracoes')
      .select('id')
      .eq('bar_id', bar_id || null)
      .maybeSingle();

    const configData = {
      bar_id: bar_id || null,
      phone_number_id,
      access_token,
      api_version: api_version || 'v18.0',
      rate_limit_per_minute: rate_limit_per_minute || 80,
      template_prefix: template_prefix || 'DBO',
      idioma: idioma || 'pt_BR',
      max_retry_attempts: max_retry_attempts || 3,
      retry_delay_seconds: retry_delay_seconds || 60,
      ativo: true,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existente) {
      // Atualizar
      result = await supabase
        .from('whatsapp_configuracoes')
        .update(configData)
        .eq('id', existente.id)
        .select()
        .single();
    } else {
      // Inserir
      result = await supabase
        .from('whatsapp_configuracoes')
        .insert({
          ...configData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        access_token: '***' + access_token.slice(-10)
      },
      mensagem: existente ? 'Configuração atualizada!' : 'Configuração salva!'
    });

  } catch (error: any) {
    console.error('Erro ao salvar config WhatsApp:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Testar conexão com WhatsApp
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number_id, access_token, api_version } = body;

    if (!phone_number_id || !access_token) {
      throw new Error('Phone Number ID e Access Token são obrigatórios para teste');
    }

    const version = api_version || 'v18.0';
    
    // Testar conexão buscando informações do telefone
    const url = `https://graph.facebook.com/${version}/${phone_number_id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: result.error?.message || 'Erro ao conectar com WhatsApp API',
        detalhes: result.error
      });
    }

    return NextResponse.json({
      success: true,
      mensagem: 'Conexão estabelecida com sucesso!',
      dados_telefone: {
        id: result.id,
        display_phone_number: result.display_phone_number,
        verified_name: result.verified_name,
        quality_rating: result.quality_rating
      }
    });

  } catch (error: any) {
    console.error('Erro ao testar WhatsApp:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Desativar configuração
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new Error('ID da configuração é obrigatório');
    }

    const { data, error } = await supabase
      .from('whatsapp_configuracoes')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      mensagem: 'Configuração desativada'
    });

  } catch (error: any) {
    console.error('Erro ao desativar config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}






