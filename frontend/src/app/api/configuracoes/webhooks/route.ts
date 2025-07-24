import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ========================================
// 🔗 API PARA CONFIGURAÇÕES DE WEBHOOKS
// ========================================

interface WebhookMapping {
  [key: string]: string;
}

interface WebhookConfiguracoes {
  [key: string]: string;
}

interface WebhookResult {
  webhook: string;
  sistema: string;
  saved: boolean;
}

interface ApiError {
  message: string;
}

// Usar service role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.dGNZvl9_7-RZhFqD8GKIvSsqeAh0_GnWQdpNGQCfQ8g'
);

// ========================================
// 🔗 GET /api/configuracoes/webhooks
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    
    console.log('🔍 GET /api/configuracoes/webhooks - Bar ID:', barId)
    
    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar ID é obrigatório' },
        { status: 400 }
      )
    }

    // Converter para integer para garantir compatibilidade
    const barIdInt = parseInt(barId, 10)
    console.log('🔍 Bar ID convertido para int:', barIdInt)

    // Buscar cada webhook no seu sistema específico
    console.log('🔍 Buscando webhooks nos sistemas específicos...')
    
    const webhookMapping: WebhookMapping = {
      sistema: 'sistema',
      meta: 'meta',
      checklists: 'checklists',
      contahub: 'contahub',
      vendas: 'vendas',
      reservas: 'reservas'
    }

    const finalConfiguracoes: WebhookConfiguracoes = {}
    
    for (const [webhookKey, sistema] of Object.entries(webhookMapping)) {
      const { data: webhookData, error: webhookError } = await supabaseAdmin
        .from('api_credentials')
        .select('configuracoes')
        .eq('bar_id', barIdInt)
        .eq('sistema', sistema)
        .eq('ambiente', 'producao')
        .maybeSingle()

      if (!webhookError && webhookData && webhookData.configuracoes?.webhook_url) {
        finalConfiguracoes[webhookKey] = webhookData.configuracoes.webhook_url
        console.log(`✅ Webhook ${webhookKey} encontrado no sistema ${sistema}`)
      } else {
        finalConfiguracoes[webhookKey] = ''
        console.log(`⚠️ Webhook ${webhookKey} não encontrado no sistema ${sistema}`)
      }
    }

    console.log('✅ Configurações finais:', finalConfiguracoes)
    
    return NextResponse.json({
      success: true,
      configuracoes: finalConfiguracoes
    })

  } catch (error) {
    console.error('❌ Erro na API de configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 🔗 POST /api/configuracoes/webhooks
// ========================================

export async function POST(request: NextRequest) {
  try {
    const { bar_id, configuracoes } = await request.json()
    
    console.log('💾 POST /api/configuracoes/webhooks - Dados recebidos:', { bar_id, configuracoes })
    
    if (!bar_id || !configuracoes) {
      console.log('❌ Dados insuficientes:', { bar_id, configuracoes })
      return NextResponse.json(
        { success: false, error: 'Bar ID e configurações são obrigatórios' },
        { status: 400 }
      )
    }

    // Salvar cada webhook no seu sistema específico
    console.log('💾 Tentando salvar configurações...')
    
    // Mapear webhooks para seus respectivos sistemas
    const webhookMapping: WebhookMapping = {
      sistema: 'sistema',
      meta: 'meta',
      checklists: 'checklists',
      contahub: 'contahub',
      vendas: 'vendas',
      reservas: 'reservas'
    }

    const results: WebhookResult[] = []
    
    // Salvar cada webhook no seu sistema específico
    for (const [webhookKey, sistema] of Object.entries(webhookMapping)) {
      const webhookUrl = configuracoes[webhookKey];
      
      if (webhookUrl && webhookUrl.trim()) {
        console.log(`💾 Salvando webhook ${webhookKey} no sistema ${sistema}`);
        
        const { error: specificError } = await supabaseAdmin
          .from('api_credentials')
          .upsert({
            bar_id,
            sistema,
            ambiente: 'producao',
            configuracoes: {
              webhook_url: webhookUrl,
              tipo: 'discord_webhook',
              origem: 'configuracoes_integracoes'
            },
            ativo: true,
            atualizado_em: new Date().toISOString()
          }, {
            onConflict: 'bar_id,sistema,ambiente'
          });

        if (specificError) {
          console.error(`❌ Erro ao salvar webhook ${webhookKey}:`, specificError);
          return NextResponse.json(
            { success: false, error: `Erro ao salvar webhook ${webhookKey}`, details: specificError },
            { status: 500 }
          );
        }

        results.push({ webhook: webhookKey, sistema, saved: true });
      } else {
        console.log(`⚠️ Webhook ${webhookKey} está vazio, pulando...`);
      }
    }

    console.log('✅ Configurações salvas com sucesso!');
    console.log('✅ Resultados:', results);
    
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      results
    });

  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('❌ Erro na API de configurações:', apiError);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
