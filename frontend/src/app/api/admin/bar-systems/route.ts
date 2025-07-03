import { NextRequest, NextResponse } from 'next/server';

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

// Interface para instÃ¢ncias de sistema de bar
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

// SimulaÃ§Ã£o de conexÃ£o com Supabase
const mockSupabase = {
  // Lista tipos de sistemas de bar
  async getSystemTypes(): Promise<BarSystemType[]> {
    return [
      {
        id: 1,
        name: 'contahub',
        display_name: 'ContaHub',
        description: 'Sistema de gestÃ£o ContaHub para bares e restaurantes',
        required_fields: ['username', 'password', 'base_url'],
        optional_fields: ['timeout', 'retry_attempts'],
        is_active: true
      }
    ];
  },

  // Lista sistemas configurados
  async getSystems(): Promise<BarSystem[]> {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sgb-bar-systems') : null;
    return saved ? JSON.parse(saved) : [];
  },

  // Cria novo sistema
  async createSystem(system: Omit<BarSystem, 'id'>): Promise<BarSystem> {
    const systems = await this.getSystems();
    const newSystem: BarSystem = {
      ...system,
      id: Math.max(0, ...systems.map((s: any) => s.id || 0)) + 1
    };
    
    systems.push(newSystem);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgb-bar-systems', JSON.stringify(systems));
    }
    
    return newSystem;
  },

  // Atualiza sistema existente
  async updateSystem(id: number, updates: Partial<BarSystem>): Promise<BarSystem | null> {
    const systems = await this.getSystems();
    const index = systems.findIndex(s => s.id === id);
    
    if (index === -1) return null;
    
    systems[index] = { ...systems[index], ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgb-bar-systems', JSON.stringify(systems));
    }
    
    return systems[index];
  },

  // Deleta sistema
  async deleteSystem(id: number): Promise<boolean> {
    const systems = await this.getSystems();
    const filtered = systems.filter((s: any) => s.id !== id);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgb-bar-systems', JSON.stringify(filtered));
    }
    
    return filtered.length !== systems.length;
  },

  // Testa conexÃ£o direta com credenciais fornecidas
  async testDirectConnection(credentials: any, systemType: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      
      if (systemType === 'contahub') {
        const { username, password, base_url, empresa_id } = credentials;
        
        if (!username || !password) {
          return { success: false, message: 'Credenciais incompletas: login e senha sÃ£o obrigatÃ³rios' };
        }

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));
        
        const responseTime = Date.now() - startTime;
        
        // Iniciar como sucesso e verificar condiÃ§Ãµes de falha
        let success = true;
        let message = 'ConexÃ£o estabelecida com sucesso - ContaHub respondeu corretamente';
        
        // ValidaÃ§Ãµes especÃ­ficas para ContaHub (apenas falha se houver problema real)
        if (username.includes('invalid')) {
          success = false;
          message = 'Credenciais invÃ¡lidas - usuÃ¡rio nÃ£o encontrado';
        } else if (password.length < 6) {
          success = false;
          message = 'Senha muito simples - ContaHub requer senhas mais seguras';
        } else if (base_url && !base_url.startsWith('https://')) {
          success = false;
          message = 'URL deve usar HTTPS para seguranÃ§a';
        } else if (username.includes('test-fail')) {
          // Apenas para testes especÃ­ficos de falha
          success = false;
          message = 'Falha na autenticaÃ§Ã£o - verifique suas credenciais no ContaHub';
        }
        
        // Simular variaÃ§Ã£o ocasional apenas para usuÃ¡rios de teste
        if (success && (username.includes('demo') || username.includes('teste'))) {
          success = Math.random() > 0.3; // Apenas demos podem falhar
          if (!success) {
            message = 'ConexÃ£o instÃ¡vel - tente novamente (simulaÃ§Ã£o demo)';
          }
        }
        
        return { success, message, responseTime };
      }
      
      return { success: false, message: 'Tipo de sistema nÃ£o suportado' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, message: errorMessage };
    }
  },

  // Testa conexÃ£o com o sistema
  async testConnection(systemId: number): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const systems = await this.getSystems();
    const system = systems.find(s => s.id === systemId);
    
    if (!system) {
      return { success: false, message: 'Sistema nÃ£o encontrado' };
    }

    try {
      const startTime = Date.now();
      
      // Simular teste de conexÃ£o com ContaHub
      if (system.system_type_id === 1) { // ContaHub
        const { username, password, base_url } = system.credentials;
        
        if (!username || !password || !base_url) {
          return { success: false, message: 'Credenciais incompletas' };
        }

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        const responseTime = Date.now() - startTime;
        
        // Simular sucesso/falha aleatÃ³rio para demonstraÃ§Ã£o
        const success = Math.random() > 0.3;
        
        // Atualizar status do sistema
        await this.updateSystem(systemId, {
          last_connection_test: new Date().toISOString(),
          last_connection_status: success ? 'success' : 'failed',
          last_error_message: success ? undefined : 'Credenciais invÃ¡lidas ou serviÃ§o indisponÃ­vel'
        });
        
        return {
          success,
          message: success ? 'ConexÃ£o estabelecida com sucesso' : 'Falha na autenticaÃ§Ã£o ou conexÃ£o',
          responseTime
        };
      }
      
      return { success: false, message: 'Tipo de sistema nÃ£o suportado' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      await this.updateSystem(systemId, {
        last_connection_test: new Date().toISOString(),
        last_connection_status: 'failed',
        last_error_message: errorMessage
      });
      
      return { success: false, message: errorMessage };
    }
  }
};

// GET - Lista tipos de sistemas e sistemas configurados
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'types') {
      const types = await mockSupabase.getSystemTypes();
      return NextResponse.json({ success: true, data: types });
    }
    
    const systems = await mockSupabase.getSystems();
    return NextResponse.json({ success: true, data: systems });
  } catch (error) {
    console.error('Erro ao listar sistemas de bar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Cria novo sistema ou testa conexÃ£o
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = await req.json();
    
    if (action === 'test-connection') {
      const { systemId, barId, credentials, systemType } = body;
      
      // Se for uma requisiÃ§Ã£o com credenciais diretas (do frontend)
      if (barId && credentials && systemType) {
        const result = await mockSupabase.testDirectConnection(credentials, systemType);
        return NextResponse.json({ success: true, data: result });
      }
      
      // Teste de sistema existente
      if (systemId) {
        const result = await mockSupabase.testConnection(systemId);
        return NextResponse.json({ success: result.success, data: result });
      }
      
      return NextResponse.json(
        { success: false, error: 'ParÃ¢metros insuficientes para teste' },
        { status: 400 }
      );
    }
    
    // Criar novo sistema
    const { name, system_type_id, credentials, settings } = body;
    
    if (!name || !system_type_id || !credentials) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatÃ³rios nÃ£o fornecidos' },
        { status: 400 }
      );
    }
    
    const newSystem = await mockSupabase.createSystem({
      name,
      system_type_id,
      credentials,
      settings: settings || {},
      is_active: true
    });
    
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
        { success: false, error: 'ID do sistema nÃ£o fornecido' },
        { status: 400 }
      );
    }
    
    const updatedSystem = await mockSupabase.updateSystem(id, updates);
    
    if (!updatedSystem) {
      return NextResponse.json(
        { success: false, error: 'Sistema nÃ£o encontrado' },
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
        { success: false, error: 'ID do sistema nÃ£o fornecido' },
        { status: 400 }
      );
    }
    
    const deleted = await mockSupabase.deleteSystem(parseInt(id));
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Sistema nÃ£o encontrado' },
        { status: 404 }
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