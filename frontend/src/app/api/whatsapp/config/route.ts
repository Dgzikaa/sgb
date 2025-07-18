import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';

// Schema de validaÃ¡Â§Ã¡Â£o para configuraÃ¡Â§Ã¡Âµes WhatsApp
const ConfigWhatsAppSchema = z.object({
  phone_number_id: z.string().min(1, 'Phone Number ID Ã¡Â© obrigatÃ¡Â³rio'),
  access_token: z.string().min(1, 'Access Token Ã¡Â© obrigatÃ¡Â³rio'),
  webhook_verify_token: z.string().min(1, 'Webhook Verify Token Ã¡Â© obrigatÃ¡Â³rio'),
  webhook_url: z.string().url('URL do webhook deve ser vÃ¡Â¡lida').optional(),
  ativo: z.boolean().default(false),
  api_version: z.string().default('v18.0'),
  rate_limit_per_minute: z.number().int().min(1).max(1000).default(80),
  template_prefix: z.string().max(20).default('sgb_'),
  idioma: z.string().length(5).default('pt_BR'),
  max_retry_attempts: z.number().int().min(1).max(10).default(3),
  retry_delay_seconds: z.number().int().min(30).max(3600).default(60)
});

const UpdateConfigSchema = ConfigWhatsAppSchema.partial().omit({
  phone_number_id: true // Phone Number ID nÃ¡Â£o pode ser alterado
});

// FunÃ¡Â§Ã¡Â£o para validar token WhatsApp
async function validateWhatsAppToken(accessToken: string, phoneNumberId: string): Promise<boolean> {
  try {
    console.log('Ã°Å¸â€Â Validando token WhatsApp...');
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Å“â€¦ Token WhatsApp vÃ¡Â¡lido:', data.display_phone_number);
      return true;
    } else {
      console.error('ÂÅ’ Token WhatsApp invÃ¡Â¡lido:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('ÂÅ’ Erro ao validar token WhatsApp:', error);
    return false;
  }
}

// ========================================
// Ã°Å¸â€œÂ± GET /api/whatsapp/config
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'UsuÃ¡Â¡rio nÃ¡Â£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData) as unknown;

    // Verificar permissÃ¡Âµes
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem visualizar configuraÃ¡Â§Ã¡Âµes' }, { status: 403 });
    }

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Buscar configuraÃ¡Â§Ã¡Â£o existente
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma configuraÃ¡Â§Ã¡Â£o encontrada
        return NextResponse.json({ 
          success: true,
          config: null,
          message: 'Nenhuma configuraÃ¡Â§Ã¡Â£o encontrada'
        });
      }
      
      console.error('Erro ao buscar configuraÃ¡Â§Ã¡Â£o:', error);
      return NextResponse.json({ error: 'Erro ao buscar configuraÃ¡Â§Ã¡Â£o' }, { status: 500 });
    }

    // Mascarar dados sensÃ¡Â­veis
    const configSafe = {
      ...config,
      access_token: config.access_token ? '***' + config.access_token.slice(-8) : null,
      webhook_verify_token: config.webhook_verify_token ? '***' + config.webhook_verify_token.slice(-4) : null
    };

    return NextResponse.json({ 
      success: true,
      config: configSafe 
    });

  } catch (error: unknown) {
    console.error('Erro na API de configuraÃ¡Â§Ã¡Â£o WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€œÂ± POST /api/whatsapp/config
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'UsuÃ¡Â¡rio nÃ¡Â£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData) as unknown;

    // Verificar permissÃ¡Âµes (apenas admin pode criar)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem configurar WhatsApp' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ConfigWhatsAppSchema.parse(body);

    // Verificar se jÃ¡Â¡ existe configuraÃ¡Â§Ã¡Â£o
    const supabase = createServiceRoleClient();
    const { data: existing } = await supabase
      .from('whatsapp_configuracoes')
      .select('id')
      .eq('bar_id', bar_id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'ConfiguraÃ¡Â§Ã¡Â£o jÃ¡Â¡ existe. Use PUT para atualizar.' 
      }, { status: 409 });
    }

    // Validar token com WhatsApp API (simulado)
    const isTokenValid = await validateWhatsAppToken(
      validatedData.access_token, 
      validatedData.phone_number_id
    );

    if (!isTokenValid) {
      return NextResponse.json({ 
        error: 'Token de acesso invÃ¡Â¡lido ou Phone Number ID incorreto' 
      }, { status: 400 });
    }

    // Criar configuraÃ¡Â§Ã¡Â£o
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
      console.error('Erro ao criar configuraÃ¡Â§Ã¡Â£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao salvar configuraÃ¡Â§Ã¡Â£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'ConfiguraÃ¡Â§Ã¡Â£o WhatsApp criada com sucesso'
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invÃ¡Â¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de configuraÃ¡Â§Ã¡Âµes WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€œÂ± PUT /api/whatsapp/config
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'UsuÃ¡Â¡rio nÃ¡Â£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData) as unknown;

    // Verificar permissÃ¡Âµes
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem alterar configuraÃ¡Â§Ã¡Âµes' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateConfigSchema.parse(body);

    // Verificar se configuraÃ¡Â§Ã¡Â£o existe
    const supabase = createServiceRoleClient();
    const { data: existing, error: fetchError } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ 
        error: 'ConfiguraÃ¡Â§Ã¡Â£o nÃ¡Â£o encontrada' 
      }, { status: 404 });
    }

    // Preparar dados para atualizaÃ¡Â§Ã¡Â£o
    const updateData: Record<string, unknown> = { ...validatedData };

    // Se alterando token, validar novamente
    if (validatedData.access_token && validatedData.access_token !== existing.access_token) {
      const isTokenValid = await validateWhatsAppToken(
        validatedData.access_token, 
        existing.phone_number_id
      );

      if (!isTokenValid) {
        return NextResponse.json({ 
          error: 'Novo token de acesso invÃ¡Â¡lido' 
        }, { status: 400 });
      }
      
      updateData.last_tested_at = new Date().toISOString();
    }

    // Atualizar configuraÃ¡Â§Ã¡Â£o
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .update(updateData)
      .eq('bar_id', bar_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuraÃ¡Â§Ã¡Â£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao atualizar configuraÃ¡Â§Ã¡Â£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'ConfiguraÃ¡Â§Ã¡Â£o atualizada com sucesso'
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invÃ¡Â¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de configuraÃ¡Â§Ã¡Âµes WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€œÂ± DELETE /api/whatsapp/config
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'UsuÃ¡Â¡rio nÃ¡Â£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData) as unknown;

    // Verificar permissÃ¡Âµes (apenas admin)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem deletar configuraÃ¡Â§Ã¡Âµes' }, { status: 403 });
    }

    // Verificar se hÃ¡Â¡ mensagens pendentes
    const supabase = createServiceRoleClient();
    const { data: pendingMessages } = await supabase
      .from('whatsapp_mensagens')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingMessages && pendingMessages.length > 0) {
      return NextResponse.json({ 
        error: 'NÃ¡Â£o Ã¡Â© possÃ¡Â­vel deletar. HÃ¡Â¡ mensagens pendentes.' 
      }, { status: 409 });
    }

    // Deletar configuraÃ¡Â§Ã¡Â£o
    const { error } = await supabase
      .from('whatsapp_configuracoes')
      .delete()
      .eq('bar_id', bar_id);

    if (error) {
      console.error('Erro ao deletar configuraÃ¡Â§Ã¡Â£o WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao deletar configuraÃ¡Â§Ã¡Â£o' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'ConfiguraÃ¡Â§Ã¡Â£o WhatsApp removida com sucesso'
    });

  } catch (error: unknown) {
    console.error('Erro na API de configuraÃ¡Â§Ã¡Âµes WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// Ã°Å¸â€Â§ FUNÃ¡â€¡Ã¡â€¢ES AUXILIARES
// ========================================

// Tipos auxiliares para configuraÃ§Ã£o WhatsApp
interface WhatsAppConfig {
  api_version: string;
  phone_number_id: string;
  access_token: string;
}

/**
 * Testa conectividade com WhatsApp Business API
 */
async function testWhatsAppConnection(config: WhatsAppConfig): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
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
        message: 'Falha na conexÃ¡Â£o com WhatsApp',
        details: error
      };
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: 'Erro de rede ao conectar com WhatsApp',
      details: error
    };
  }
} 

