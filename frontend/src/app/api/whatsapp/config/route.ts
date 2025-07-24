import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';

// Schema de validação para configurações WhatsApp
const ConfigWhatsAppSchema = z.object({
  phone_number_id: z.string().min(1, 'Phone Number ID é obrigatório'),
  access_token: z.string().min(1, 'Access Token é obrigatório'),
  webhook_verify_token: z.string().min(1, 'Webhook Verify Token é obrigatório'),
  webhook_url: z.string().url('URL do webhook deve ser válida').optional(),
  ativo: z.boolean().default(false),
  api_version: z.string().default('v18.0'),
  rate_limit_per_minute: z.number().int().min(1).max(1000).default(80),
  template_prefix: z.string().max(20).default('sgb_'),
  idioma: z.string().length(5).default('pt_BR'),
  max_retry_attempts: z.number().int().min(1).max(10).default(3),
  retry_delay_seconds: z.number().int().min(30).max(3600).default(60)
});

const UpdateConfigSchema = ConfigWhatsAppSchema.partial().omit({
  phone_number_id: true // Phone Number ID não pode ser alterado
});

// Função para validar token WhatsApp
async function validateWhatsAppToken(accessToken: string, phoneNumberId: string): Promise<boolean> {
  try {
    console.log('🔍 Validando token WhatsApp...');
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token WhatsApp válido:', data.display_phone_number);
      return true;
    } else {
      console.error('❌ Token WhatsApp inválido:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao validar token WhatsApp:', error);
    return false;
  }
}

// ========================================
// 📱 GET /api/whatsapp/config
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissões
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem visualizar configurações' }, { status: 403 });
    }

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Buscar configuração existente
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma configuração encontrada
        return NextResponse.json({ 
          success: true,
          config: null,
          message: 'Nenhuma configuração encontrada'
        });
      }
      
      console.error('Erro ao buscar configuração:', error);
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 });
    }

    // Mascarar dados sensíveis
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
    console.error('Erro na API de configuração WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 📱 POST /api/whatsapp/config
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissões (apenas admin pode criar)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem configurar WhatsApp' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ConfigWhatsAppSchema.parse(body);

    // Verificar se já existe configuração
    const supabase = createServiceRoleClient();
    const { data: existing } = await supabase
      .from('whatsapp_configuracoes')
      .select('id')
      .eq('bar_id', bar_id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'Configuração já existe. Use PUT para atualizar.' 
      }, { status: 409 });
    }

    // Validar token com WhatsApp API (simulado)
    const isTokenValid = await validateWhatsAppToken(
      validatedData.access_token, 
      validatedData.phone_number_id
    );

    if (!isTokenValid) {
      return NextResponse.json({ 
        error: 'Token de acesso inválido ou Phone Number ID incorreto' 
      }, { status: 400 });
    }

    // Criar configuração
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
      console.error('Erro ao criar configuração WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuração WhatsApp criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Erro na API de configurações WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 📱 PUT /api/whatsapp/config
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = await headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissões
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem alterar configurações' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateConfigSchema.parse(body);

    // Verificar se configuração existe
    const supabase = createServiceRoleClient();
    const { data: existing, error: fetchError } = await supabase
      .from('whatsapp_configuracoes')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ 
        error: 'Configuração não encontrada' 
      }, { status: 404 });
    }

    // Preparar dados para atualização
    // Tipagem explícita para evitar erro de linter
    const updateData: Record<string, any> = { ...validatedData };

    // Se alterando token, validar novamente
    if (validatedData.access_token && validatedData.access_token !== existing.access_token) {
      const isTokenValid = await validateWhatsAppToken(
        validatedData.access_token, 
        existing.phone_number_id
      );

      if (!isTokenValid) {
        return NextResponse.json({ 
          error: 'Novo token de acesso inválido' 
        }, { status: 400 });
      }
      
      updateData.last_tested_at = new Date().toISOString();
    }

    // Atualizar configuração
    const { data: config, error } = await supabase
      .from('whatsapp_configuracoes')
      .update(updateData)
      .eq('bar_id', bar_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuração WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuração atualizada com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Erro na API de configurações WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// 📱 DELETE /api/whatsapp/config
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    const headersList = await headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissões (apenas admin)
    if (permissao !== 'admin') {
      return NextResponse.json({ error: 'Apenas admins podem deletar configurações' }, { status: 403 });
    }

    // Verificar se há mensagens pendentes
    const supabase = createServiceRoleClient();
    const { data: pendingMessages } = await supabase
      .from('whatsapp_mensagens')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingMessages && pendingMessages.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível deletar. Há mensagens pendentes.' 
      }, { status: 409 });
    }

    // Deletar configuração
    const { error } = await supabase
      .from('whatsapp_configuracoes')
      .delete()
      .eq('bar_id', bar_id);

    if (error) {
      console.error('Erro ao deletar configuração WhatsApp:', error);
      return NextResponse.json({ error: 'Erro ao deletar configuração' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração WhatsApp removida com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de configurações WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
