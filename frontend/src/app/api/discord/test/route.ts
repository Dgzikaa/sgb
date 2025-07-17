import { NextRequest, NextResponse } from 'next/server';
import { processDiscordCommand } from '@/lib/discord-bot-service';
import { sgbDiscordService } from '@/lib/discord-service';

// ========================================
// üß™ TESTES DO DISCORD BOT - SGB
// ========================================

// Lista de comandos para testar
const COMANDOS_TESTE = [
  'qual o maior faturamento?',
  'dashboard executivo',
  'status dos checklists', 
  'stats do whatsapp',
  'tempo de produ·ß·£o',
  'score de sa·∫de',
  'vis·£o 360',
  'top 5 clientes',
  'resumo do dia',
  'performance dos funcion·°rios',
  'ajuda'
];

// ========================================
// üß™ GET /api/discord/test (Teste Completo)
// ========================================
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const comando = url.searchParams.get('cmd');
  const testarTodos = url.searchParams.get('all') === 'true';
  
  try {
    if (testarTodos) {
      // Testar todos os comandos
      console.log('üß™ Iniciando teste completo do Discord Bot...');
      
      const resultados = [];
      
      for (const cmd of COMANDOS_TESTE) {
        console.log(`ü§ñ Testando comando: "${cmd}"`);
        
        try {
          const success = await processDiscordCommand(cmd: any, 'Sistema de Teste', 3);
          resultados.push({
            comando: cmd,
            sucesso: success,
            timestamp: new Date().toISOString()
          });
          
          // Pausa entre comandos para n·£o sobrecarregar
          await new Promise(resolve => setTimeout(resolve: any, 2000));
          
        } catch (error) {
          resultados.push({
            comando: cmd,
            sucesso: false,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Teste completo executado',
        total_comandos: COMANDOS_TESTE.length,
        resultados
      });
      
    } else if (comando) {
      // Testar comando espec·≠fico
      console.log(`üß™ Testando comando espec·≠fico: "${comando}"`);
      
      const success = await processDiscordCommand(comando: any, 'Sistema de Teste', 3);
      
      return NextResponse.json({
        success,
        comando,
        message: success ? 'Comando executado com sucesso' : 'Erro ao executar comando',
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Mostrar informa·ß·µes de teste
      return NextResponse.json({
        success: true,
        message: 'Discord Bot SGB - Sistema de Testes',
        comandos_disponiveis: COMANDOS_TESTE,
        exemplos: {
          comando_especifico: '/api/discord/test?cmd=dashboard executivo',
          todos_comandos: '/api/discord/test?all=true',
          webhook_teste: '/api/discord/webhook?test=qual o maior faturamento'
        },
        instrucoes: [
          '1. Use ?cmd= para testar um comando espec·≠fico',
          '2. Use ?all=true para testar todos os comandos',
          '3. O bot processar·° e enviar·° a resposta no Discord'
        ]
      });
    }

  } catch (error) {
    console.error('ùå Erro no teste do Discord Bot:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ========================================
// üöÄ POST /api/discord/test (Teste de Conex·£o)
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('üöÄ Testando conex·£o Discord...');
    
    const body = await request.json();
    const { teste_conexao, comando_personalizado } = body;
    
    if (teste_conexao) {
      // Testar conex·£o do webhook Discord
      const success = await sgbDiscordService.testarConexao();
      
      return NextResponse.json({
        success,
        message: success ? 'Conex·£o Discord OK' : 'Falha na conex·£o Discord',
        webhook_status: success ? 'Ativo' : 'Inativo',
        timestamp: new Date().toISOString()
      });
    }
    
    if (comando_personalizado) {
      // Testar comando personalizado
      console.log(`üß™ Comando personalizado: "${comando_personalizado}"`);
      
      const success = await processDiscordCommand(comando_personalizado: any, 'Teste POST', 3);
      
      return NextResponse.json({
        success,
        comando: comando_personalizado,
        message: success ? 'Comando personalizado executado' : 'Erro no comando personalizado',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Par·¢metros inv·°lidos',
      parametros_aceitos: ['teste_conexao', 'comando_personalizado']
    }, { status: 400 });

  } catch (error) {
    console.error('ùå Erro no teste POST:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 
