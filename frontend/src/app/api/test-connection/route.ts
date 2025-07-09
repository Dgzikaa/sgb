import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const status = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasAnonKey: !!anonKey,
      supabaseUrl: supabaseUrl ? 'Configurada' : 'NÃO CONFIGURADA',
      urlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Não definida',
      connection: 'Não testada',
      details: {}
    };

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Teste simples primeiro - verificar se a URL é válida
        try {
          const testUrl = new URL(supabaseUrl);
          status.details = { urlValida: true, host: testUrl.host };
        } catch (urlError) {
          status.details = { urlValida: false, erro: 'URL mal formada' };
        }
        
        // Testar conexão
        const { count, error } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          status.connection = `Erro do Supabase: ${error.message}`;
          status.details = {
            ...status.details,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint
          };
        } else {
          status.connection = `Conectado! ${count} usuários no banco`;
          
          // Testar também a tabela usuarios_bar
          const { count: countBar } = await supabase
            .from('usuarios_bar')
            .select('*', { count: 'exact', head: true });
          
          status.details = {
            ...status.details,
            usuariosCount: count,
            usuariosBarCount: countBar
          };
        }
      } catch (err: any) {
        status.connection = `Erro de conexão: ${err.message || err}`;
        status.details = {
          ...status.details,
          errorType: err.name,
          errorStack: err.stack?.split('\n')[0]
        };
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro ao testar conexão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 