import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';

// Schema de validaÃ§Ã£o para configuraÃ§Ãµes WhatsApp
const ConfigWhatsAppSchema = z.object({
  phone_number_id: z.string().min(1, 'Phone Number ID Ã© obrigatÃ³rio'),
  access_token: z.string().min(1, 'Access Token Ã© obrigatÃ³rio'),
  webhook_verify_token: z.string().min(1, 'Webhook Verify Token Ã© obrigatÃ³rio'),
  webhook_url: z.string().url('URL do webhook deve ser vÃ¡lida').optional(),
  ativo: z.boolean().default(false),
  api_version: z.string().default('v18.0'),
  rate_limit_per_minute: z.number().int().min(1).max(1000).default(80),
  template_prefix: z.string().max(20).default('sgb_'),
  idioma: z.string().length(5).default('pt_BR'),
  max_retry_attempts: z.number().int().min(1).max(10).default(3),
  retry_delay_seconds: z.number().int().min(30).max(3600).default(60)
});

const UpdateConfigSchema = ConfigWhatsAppSchema.partial().omit({
  phone_number_id: true // Phone Number ID nÃ£o pode ser alterado
});

// FunÃ§Ã£o para validar token WhatsApp
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
      console.log('âœ… Token WhatsApp vÃ¡lido:', data.display_phone_number);
      return true;
    } else {
      console.error('âŒ Token WhatsApp invÃ¡lido:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('âŒ Erro ao validar token WhatsApp:', error);
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
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissÃµes
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem visualizar configuraÃ§Ãµes' }, { status: 403 });
    }

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Buscar configuraÃ§Ã£o existente
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma configuraÃ§Ã£o encontrada
        return NextResponse.json({ 
          success: true,
          config: null,
          message: 'Nenhuma configuraÃ§Ã£o encontrada'
        });
      }
      
      console.error('Erro ao buscar configuraÃ§Ã£o:', error);
      return NextResponse.json({ error: 'Erro ao buscar configuraÃ§Ã£o' }, { status: 500 });
    }

    // Mascarar dados sensÃ­veis
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
    console.error('Erro na API de configuraÃ§Ã£o WhatsApp:', error);
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
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissÃµes (apenas admin pode criar)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem configurar WhatsApp' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ConfigWhatsAppSchema.parse(body);

    // Verificar se jÃ¡ existe configuraÃ§Ã£o
    const supabase = createServiceRoleClient();
    const { data: existing } = await supabase
      .from('whatsapp_configuracoes')
      .select('id')
      .eq('bar_id', bar_id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'ConfiguraÃ§Ã£o jÃ¡ existe. Use PUT para atualizar.' 
      }, { status: 409 });
    }

    // Validar token com WhatsApp API (simulado)
    const isTokenValid = await validateWhatsAppToken(
      validatedData.access_token, 
      validatedData.phone_number_id
    );

    if (!isTokenValid) {
      return NextResponse.json({ 
        error: 'Token de acesso invÃ¡lido ou Phone Number ID incorreto' 
      }, { status: 400 });
    }

    // Criar configuraÃ§Ã£o
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
      console.error('Erro ao criar configuraÃ§Ã£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao salvar configuraÃ§Ã£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'ConfiguraÃ§Ã£o WhatsApp criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invÃ¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de configuraÃ§Ãµes WhatsApp:', error);
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
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissÃµes
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem alterar configuraÃ§Ãµes' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateConfigSchema.parse(body);

    // Verificar se configuraÃ§Ã£o existe
    const supabase = createServiceRoleClient();
    const { data: existing, error: fetchError } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ 
        error: 'ConfiguraÃ§Ã£o nÃ£o encontrada' 
      }, { status: 404 });
    }

    // Preparar dados para atualizaÃ§Ã£o
    let updateData: any = { ...validatedData };

    // Se alterando token, validar novamente
    if (validatedData.access_token && validatedData.access_token !== existing.access_token) {
      const isTokenValid = await validateWhatsAppToken(
        validatedData.access_token, 
        existing.phone_number_id
      );

      if (!isTokenValid) {
        return NextResponse.json({ 
          error: 'Novo token de acesso invÃ¡lido' 
        }, { status: 400 });
      }
      
      updateData.last_tested_at = new Date().toISOString();
    }

    // Atualizar configuraÃ§Ã£o
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .update(updateData)
      .eq('bar_id', bar_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuraÃ§Ã£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao atualizar configuraÃ§Ã£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'ConfiguraÃ§Ã£o atualizada com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invÃ¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de configuraÃ§Ãµes WhatsApp:', error);
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
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissÃµes (apenas admin)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem deletar configuraÃ§Ãµes' }, { status: 403 });
    }

    // Verificar se hÃ¡ mensagens pendentes
    const supabase = createServiceRoleClient();
    const { data: pendingMessages } = await supabase
      .from('whatsapp_mensagens')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingMessages && pendingMessages.length > 0) {
      return NextResponse.json({ 
        error: 'NÃ£o Ã© possÃ­vel deletar. HÃ¡ mensagens pendentes.' 
      }, { status: 409 });
    }

    // Deletar configuraÃ§Ã£o
    const { error } = await supabase
      .from('whatsapp_configuracoes')
      .delete()
      .eq('bar_id', bar_id);

    if (error) {
      console.error('Erro ao deletar configuraÃ§Ã£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao deletar configuraÃ§Ã£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'ConfiguraÃ§Ã£o WhatsApp removida com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de configuraÃ§Ãµes WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ”§ FUNÃ‡Ã•ES AUXILIARES
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
        message: 'Falha na conexÃ£o com WhatsApp',
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
