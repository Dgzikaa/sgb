import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const status = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrl: supabaseUrl ? 'Configurada' : 'NÃO CONFIGURADA',
      connection: 'Não testada'
    };

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Testar conexão
        const { count, error } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          status.connection = `Erro: ${error.message}`;
        } else {
          status.connection = `Conectado! ${count} usuários no banco`;
        }
      } catch (err) {
        status.connection = `Erro de conexão: ${err}`;
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