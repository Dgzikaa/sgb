import { NextRequest, NextResponse } from 'next/server';
import { processDiscordCommand } from '@/lib/discord-bot-service';
import { z } from 'zod';

// Schema para webhooks do Discord
const DiscordWebhookSchema = z.object({
  content: z.string(),
  author: z.object({
    username: z.string(),
    id: z.string()
  }).optional(),
  embeds: z.array(z.any()).optional(),
  type: z.number().optional()
});

// ========================================
// ðŸŽ® POST /api/discord/webhook
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('ðŸŽ® Webhook Discord recebido');

    const body = await request.json();
    console.log('ðŸ“¦ Payload recebido:', JSON.stringify(body, null, 2));

    // Verificar se Ã© uma mensagem de usuÃ¡rio
    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ success: true, message: 'Sem conteÃºdo' });
    }

    // Ignorar mensagens de bots
    if (body.author?.bot || body.webhook_id) {
      console.log('ðŸ¤– Ignorando mensagem de bot');
      return NextResponse.json({ success: true, message: 'Bot ignorado' });
    }

    const message = body.content.trim();
    const username = body.author?.username || 'UsuÃ¡rio Desconhecido';
    
    // Bar ID do OrdinÃ¡rio Bar
    const BAR_ID = 3; // OrdinÃ¡rio Bar

    console.log(`ðŸ“¨ Processando mensagem de ${username}: "${message}"`);

    // Processar comando com o bot inteligente
    const success = await processDiscordCommand(message, username, BAR_ID);

    return NextResponse.json({
      success,
      message: success ? 'Comando processado com sucesso' : 'Erro ao processar comando'
    });

  } catch (error) {
    console.error('âŒ Erro no webhook Discord:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// ========================================
// ðŸ§ª GET /api/discord/webhook (Teste)
// ========================================
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const testCommand = url.searchParams.get('test') || 'dashboard executivo';
  
  try {
    console.log(`ðŸ§ª Teste do Discord Bot: "${testCommand}"`);
    
    const success = await processDiscordCommand(testCommand, 'Sistema de Teste', 3);
    
    return NextResponse.json({
      success,
      message: `Teste executado: "${testCommand}"`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('âŒ Erro no teste:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 
