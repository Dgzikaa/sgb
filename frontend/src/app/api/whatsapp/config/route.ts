import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';

// Schema de validaá§á£o para configuraá§áµes WhatsApp
const ConfigWhatsAppSchema = z.object({
  phone_number_id: z.string().min(1: any, 'Phone Number ID á© obrigatá³rio'),
  access_token: z.string().min(1: any, 'Access Token á© obrigatá³rio'),
  webhook_verify_token: z.string().min(1: any, 'Webhook Verify Token á© obrigatá³rio'),
  webhook_url: z.string().url('URL do webhook deve ser vá¡lida').optional(),
  ativo: z.boolean().default(false),
  api_version: z.string().default('v18.0'),
  rate_limit_per_minute: z.number().int().min(1).max(1000).default(80),
  template_prefix: z.string().max(20).default('sgb_'),
  idioma: z.string().length(5).default('pt_BR'),
  max_retry_attempts: z.number().int().min(1).max(10).default(3),
  retry_delay_seconds: z.number().int().min(30).max(3600).default(60)
});

const UpdateConfigSchema = ConfigWhatsAppSchema.partial().omit({
  phone_number_id: true // Phone Number ID ná£o pode ser alterado
});

// Funá§á£o para validar token WhatsApp
async function validateWhatsAppToken(accessToken: string, phoneNumberId: string): Promise<boolean> {
  try {
    console.log('ðŸ” Validando token WhatsApp...');
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('œ… Token WhatsApp vá¡lido:', data.display_phone_number);
      return true;
    } else {
      console.error('Œ Token WhatsApp invá¡lido:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Œ Erro ao validar token WhatsApp:', error);
    return false;
  }
}

// ========================================
// ðŸ“± GET /api/whatsapp/config
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissáµes
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem visualizar configuraá§áµes' }, { status: 403 });
    }

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Buscar configuraá§á£o existente
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma configuraá§á£o encontrada
        return NextResponse.json({ 
          success: true,
          config: null,
          message: 'Nenhuma configuraá§á£o encontrada'
        });
      }
      
      console.error('Erro ao buscar configuraá§á£o:', error);
      return NextResponse.json({ error: 'Erro ao buscar configuraá§á£o' }, { status: 500 });
    }

    // Mascarar dados sensá­veis
    const configSafe = {
      ...config,
      access_token: config.access_token ? '***' + config.access_token.slice(-8) : null,
      webhook_verify_token: config.webhook_verify_token ? '***' + config.webhook_verify_token.slice(-4) : null
    };

    return NextResponse.json({ 
      success: true,
      config: configSafe 
    });

  } catch (error) {
    console.error('Erro na API de configuraá§á£o WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ“± POST /api/whatsapp/config
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissáµes (apenas admin pode criar)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem configurar WhatsApp' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ConfigWhatsAppSchema.parse(body);

    // Verificar se já¡ existe configuraá§á£o
    const supabase = createServiceRoleClient();
    const { data: existing } = await supabase
      .from('whatsapp_configuracoes')
      .select('id')
      .eq('bar_id', bar_id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'Configuraá§á£o já¡ existe. Use PUT para atualizar.' 
      }, { status: 409 });
    }

    // Validar token com WhatsApp API (simulado)
    const isTokenValid = await validateWhatsAppToken(
      validatedData.access_token, 
      validatedData.phone_number_id
    );

    if (!isTokenValid) {
      return NextResponse.json({ 
        error: 'Token de acesso invá¡lido ou Phone Number ID incorreto' 
      }, { status: 400 });
    }

    // Criar configuraá§á£o
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .insert({
        bar_id,
        ...validatedData,
        last_tested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar configuraá§á£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao salvar configuraá§á£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuraá§á£o WhatsApp criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invá¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de configuraá§áµes WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ“± PUT /api/whatsapp/config
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissáµes
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem alterar configuraá§áµes' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateConfigSchema.parse(body);

    // Verificar se configuraá§á£o existe
    const supabase = createServiceRoleClient();
    const { data: existing, error: fetchError } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ 
        error: 'Configuraá§á£o ná£o encontrada' 
      }, { status: 404 });
    }

    // Preparar dados para atualizaá§á£o
    let updateData: any = { ...validatedData };

    // Se alterando token, validar novamente
    if (validatedData.access_token && validatedData.access_token !== existing.access_token) {
      const isTokenValid = await validateWhatsAppToken(
        validatedData.access_token, 
        existing.phone_number_id
      );

      if (!isTokenValid) {
        return NextResponse.json({ 
          error: 'Novo token de acesso invá¡lido' 
        }, { status: 400 });
      }
      
      updateData.last_tested_at = new Date().toISOString();
    }

    // Atualizar configuraá§á£o
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .update(updateData)
      .eq('bar_id', bar_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuraá§á£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao atualizar configuraá§á£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuraá§á£o atualizada com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invá¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de configuraá§áµes WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ“± DELETE /api/whatsapp/config
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissáµes (apenas admin)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem deletar configuraá§áµes' }, { status: 403 });
    }

    // Verificar se há¡ mensagens pendentes
    const supabase = createServiceRoleClient();
    const { data: pendingMessages } = await supabase
      .from('whatsapp_mensagens')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingMessages && pendingMessages.length > 0) {
      return NextResponse.json({ 
        error: 'Ná£o á© possá­vel deletar. Há¡ mensagens pendentes.' 
      }, { status: 409 });
    }

    // Deletar configuraá§á£o
    const { error } = await supabase
      .from('whatsapp_configuracoes')
      .delete()
      .eq('bar_id', bar_id);

    if (error) {
      console.error('Erro ao deletar configuraá§á£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao deletar configuraá§á£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuraá§á£o WhatsApp removida com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de configuraá§áµes WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ”§ FUNá‡á•ES AUXILIARES
// ========================================

/**
 * Testa conectividade com WhatsApp Business API
 */
async function testWhatsAppConnection(config: any): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const response = await fetch(`https://graph.facebook.com/v${config.api_version}/${config.phone_number_id}`, {
      headers: {
        'Authorization': `Bearer ${config.access_token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Conectado com sucesso ao WhatsApp Business',
        details: {
          phone_number: data.display_phone_number,
          verified_name: data.verified_name,
          quality_rating: data.quality_rating
        }
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: 'Falha na conexá£o com WhatsApp',
        details: error
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro de rede ao conectar com WhatsApp',
      details: error
    };
  }
} 
