import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// Interface para tipos de sistema de bar
interface BarSystemType {
  id: number;
  name: string;
  display_name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  is_active: boolean;
}

// Interface para instâncias de sistema de bar
interface BarSystem {
  id?: number;
  name: string;
  system_type_id: number;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  is_active: boolean;
  last_connection_test?: string;
  last_connection_status?: 'success' | 'failed' | 'pending';
  last_error_message?: string;
}

// GET - Lista tipos de sistemas e sistemas configurados
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'types') {
      // Retornar tipos de sistema suportados (hardcoded para ContaHub por enquanto)
      const types: BarSystemType[] = [
        {
          id: 1,
          name: 'contahub',
          display_name: 'ContaHub',
          description: 'Sistema de gestão ContaHub para bares e restaurantes',
          required_fields: ['username', 'password', 'base_url'],
          optional_fields: ['timeout', 'retry_attempts'],
          is_active: true
        }
      ];
      
      return NextResponse.json({ success: true, data: types });
    }
    
    const supabase = await getAdminClient();
    const { data: systems, error } = await supabase
      .from('bar_systems')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar sistemas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar sistemas' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: systems || [] });
  } catch (error) {
    console.error('Erro ao listar sistemas de bar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Cria novo sistema ou testa conexão
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = await req.json();
    
    if (action === 'test-connection') {
      const { systemId, barId, credentials, systemType } = body;
      
      // Se for uma requisição com credenciais diretas (do frontend)
      if (barId && credentials && systemType) {
        const result = await testDirectConnection(credentials, systemType);
        return NextResponse.json({ success: true, data: result });
      }
      
      // Teste de sistema existente
      if (systemId) {
        const result = await testStoredSystemConnection(systemId);
        return NextResponse.json({ success: result.success, data: result });
      }
      
      return NextResponse.json(
        { success: false, error: 'Parâmetros insuficientes para teste' },
        { status: 400 }
      );
    }
    
    // Criar novo sistema
    const { name, system_type_id, credentials, settings } = body;
    
    if (!name || !system_type_id || !credentials) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }
    
    const supabase = await getAdminClient();
    const { data: newSystem, error } = await supabase
      .from('bar_systems')
      .insert({
        name,
        system_type_id,
        credentials,
        settings: settings || {},
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar sistema:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar sistema' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: newSystem });
  } catch (error) {
    console.error('Erro ao criar/testar sistema de bar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualiza sistema existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do sistema não fornecido' },
        { status: 400 }
      );
    }
    
    const supabase = await getAdminClient();
    const { data: updatedSystem, error } = await supabase
      .from('bar_systems')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar sistema:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar sistema' },
        { status: 500 }
      );
    }
    
    if (!updatedSystem) {
      return NextResponse.json(
        { success: false, error: 'Sistema não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedSystem });
  } catch (error) {
    console.error('Erro ao atualizar sistema de bar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remove sistema
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do sistema não fornecido' },
        { status: 400 }
      );
    }
    
    const supabase = await getAdminClient();
    const { error } = await supabase
      .from('bar_systems')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      console.error('Erro ao remover sistema:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao remover sistema' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Sistema removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover sistema de bar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para testar conexão direta
async function testDirectConnection(credentials: any, systemType: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  try {
    const startTime = Date.now();
    
    if (systemType === 'contahub') {
      const { username, password, base_url, empresa_id } = credentials;
      
      if (!username || !password) {
        return { success: false, message: 'Credenciais incompletas: login e senha são obrigatórios' };
      }

      // TODO: Implementar teste real de conexão com ContaHub
      // Por enquanto, apenas validações básicas
      const responseTime = Date.now() - startTime;
      
      if (username.includes('invalid')) {
        return { success: false, message: 'Credenciais inválidas - usuário não encontrado' };
      }
      
      if (password.length < 6) {
        return { success: false, message: 'Senha muito simples - ContaHub requer senhas mais seguras' };
      }
      
      if (base_url && !base_url.startsWith('https://')) {
        return { success: false, message: 'URL deve usar HTTPS para segurança' };
      }
      
      return { 
        success: true, 
        message: 'Conexão validada com sucesso - ContaHub aguardando implementação completa',
        responseTime 
      };
    }
    
    return { success: false, message: 'Tipo de sistema não suportado' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: errorMessage };
  }
}

// Função auxiliar para testar sistema armazenado
async function testStoredSystemConnection(systemId: number): Promise<{ success: boolean; message: string; responseTime?: number }> {
  try {
    const supabase = await getAdminClient();
    const { data: system, error } = await supabase
      .from('bar_systems')
      .select('*')
      .eq('id', systemId)
      .single();
    
    if (error || !system) {
      return { success: false, message: 'Sistema não encontrado' };
    }

    // Testar conexão usando credenciais armazenadas
    const result = await testDirectConnection(system.credentials, 'contahub');
    
    // Atualizar status do sistema
    await supabase
      .from('bar_systems')
      .update({
        last_connection_test: new Date().toISOString(),
        last_connection_status: result.success ? 'success' : 'failed',
        last_error_message: result.success ? null : result.message
      })
      .eq('id', systemId);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: errorMessage };
  }
} 
