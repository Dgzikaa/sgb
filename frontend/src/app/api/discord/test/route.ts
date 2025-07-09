import { NextRequest, NextResponse } from 'next/server';
import { processDiscordCommand } from '@/lib/discord-bot-service';
import { sgbDiscordService } from '@/lib/discord-service';

// ========================================
// 🧪 TESTES DO DISCORD BOT - SGB
// ========================================

// Lista de comandos para testar
const COMANDOS_TESTE = [
  'qual o maior faturamento?',
  'dashboard executivo',
  'status dos checklists', 
  'stats do whatsapp',
  'tempo de produção',
  'score de saúde',
  'visão 360',
  'top 5 clientes',
  'resumo do dia',
  'performance dos funcionários',
  'ajuda'
];

// ========================================
// 🧪 GET /api/discord/test (Teste Completo)
// ========================================
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const comando = url.searchParams.get('cmd');
  const testarTodos = url.searchParams.get('all') === 'true';
  
  try {
    if (testarTodos) {
      // Testar todos os comandos
      console.log('🧪 Iniciando teste completo do Discord Bot...');
      
      const resultados = [];
      
      for (const cmd of COMANDOS_TESTE) {
        console.log(`🤖 Testando comando: "${cmd}"`);
        
        try {
          const success = await processDiscordCommand(cmd, 'Sistema de Teste', 3);
          resultados.push({
            comando: cmd,
            sucesso: success,
            timestamp: new Date().toISOString()
          });
          
          // Pausa entre comandos para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 2000));
          
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
      // Testar comando específico
      console.log(`🧪 Testando comando específico: "${comando}"`);
      
      const success = await processDiscordCommand(comando, 'Sistema de Teste', 3);
      
      return NextResponse.json({
        success,
        comando,
        message: success ? 'Comando executado com sucesso' : 'Erro ao executar comando',
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Mostrar informações de teste
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
          '1. Use ?cmd= para testar um comando específico',
          '2. Use ?all=true para testar todos os comandos',
          '3. O bot processará e enviará a resposta no Discord'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste do Discord Bot:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ========================================
// 🚀 POST /api/discord/test (Teste de Conexão)
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Testando conexão Discord...');
    
    const body = await request.json();
    const { teste_conexao, comando_personalizado } = body;
    
    if (teste_conexao) {
      // Testar conexão do webhook Discord
      const success = await sgbDiscordService.testarConexao();
      
      return NextResponse.json({
        success,
        message: success ? 'Conexão Discord OK' : 'Falha na conexão Discord',
        webhook_status: success ? 'Ativo' : 'Inativo',
        timestamp: new Date().toISOString()
      });
    }
    
    if (comando_personalizado) {
      // Testar comando personalizado
      console.log(`🧪 Comando personalizado: "${comando_personalizado}"`);
      
      const success = await processDiscordCommand(comando_personalizado, 'Teste POST', 3);
      
      return NextResponse.json({
        success,
        comando: comando_personalizado,
        message: success ? 'Comando personalizado executado' : 'Erro no comando personalizado',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Parâmetros inválidos',
      parametros_aceitos: ['teste_conexao', 'comando_personalizado']
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erro no teste POST:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 