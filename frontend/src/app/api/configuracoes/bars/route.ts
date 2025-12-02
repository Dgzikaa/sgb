import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { createCacheHeaders } from '@/lib/api-cache';

// Cache de 5 minutos para lista de bares (muda pouco)
// Nota: revalidate precisa ser valor literal, não pode usar constante
export const revalidate = 300;

// ========================================
// 🏪 API PARA GERENCIAMENTO DE BARES
// ========================================

interface ApiError {
  message: string;
}

interface BarData {
  id: number;
  nome?: string;
  name?: string;
  endereco?: string;
  address?: string;
  telefone?: string;
  phone?: string;
  cnpj?: string;
  email?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface BarMapped {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  cnpj: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// 🏪 GET /api/bars
// ========================================

export async function GET() {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Buscar dados da tabela 'bar' (estrutura atual do banco)
    const { data: barData, error } = await supabase
      .from('bars')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      throw error;
    }

    // Mapear dados para estrutura padronizada
    const data = barData.map(
      (bar: any): BarMapped => ({
        id: bar.id,
        nome: bar.nome || bar.name || 'Sem nome',
        endereco: bar.endereco || bar.address || 'Endereço não informado',
        telefone: bar.telefone || bar.phone || '',
        cnpj: bar.cnpj || '',
        email: bar.email || '',
        status: bar.status || 'ativo',
        created_at: bar.created_at || new Date().toISOString(),
        updated_at: bar.updated_at || new Date().toISOString(),
      })
    );

    console.log(
      `✅ Encontrados ${data.length} bares na tabela 'bar':`,
      data.map((b: BarMapped) => b.nome)
    );

    return NextResponse.json({
      success: true,
      bars: data,
    }, {
      headers: createCacheHeaders('MEDIUM'),
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao buscar bares:', apiError);
    return NextResponse.json(
      {
        success: false,
        error: apiError.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { nome, endereco, telefone, cnpj, email } = body;

    // Validações básicas
    if (!nome || !endereco) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome e endereço são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Criar o novo bar
    const newBar = {
      nome,
      endereco,
      telefone: telefone || '',
      cnpj: cnpj || '',
      email: email || '',
      status: 'ativo',
      configuracoes: {
        apis_habilitadas: ['sympla', 'yuzer', 'google_places'],
        notificacoes: true,
        sync_automatico: true,
      },
    };

    const { data, error } = await supabase
      .from('bars')
      .insert([newBar])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Criar configurações padrão para o bar nas tabelas relacionadas
    await createDefaultConfigurations(data.id);

    console.log(`✅ Novo bar criado: ${nome} (ID: ${data.id})`);

    return NextResponse.json({
      success: true,
      data: data,
      message: `Bar "${nome}" criado com sucesso!`,
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao criar bar:', apiError);
    return NextResponse.json(
      {
        success: false,
        error: apiError.message,
      },
      { status: 500 }
    );
  }
}

async function createDefaultConfigurations(barId: number) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      throw new Error('Erro ao conectar com banco');
    }

    // Criar registros padrão nas tabelas de configuração
    const configurationsPromises = [
      // Configurações de API para o bar
      await supabase.from('bar_api_configs').insert([
        {
          bar_id: barId,
          api_name: 'sympla',
          enabled: true,
          settings: { auto_sync: true },
        },
      ]),

      // Configurações de notificação
      await supabase.from('bar_notification_configs').insert([
        {
          bar_id: barId,
          email_enabled: true,
          discord_enabled: false,
          alerts_enabled: true,
        },
      ]),

      // Criar entrada na tabela de estatísticas se não existir
      await supabase.from('bar_stats').insert([
        {
          bar_id: barId,
          total_eventos: 0,
          total_vendas: 0,
          ultima_sincronizacao: new Date().toISOString(),
        },
      ]),
    ];

    await Promise.all(configurationsPromises);
    console.log(`✅ Configurações padrão criadas para bar ${barId}`);
  } catch (error) {
    console.warn('⚠️ Erro ao criar configurações padrão:', error);
    // Não falhar o processo principal por isso
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, nome, endereco, telefone, cnpj, email, status } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do bar é obrigatório',
        },
        { status: 400 }
      );
    }

    const updates = {
      nome,
      endereco,
      telefone,
      cnpj,
      email,
      status,
      updated_at: new Date().toISOString(),
    };

    // Remover campos undefined
    Object.keys(updates).forEach((key: string) => {
      if (updates[key as keyof typeof updates] === undefined) {
        delete updates[key as keyof typeof updates];
      }
    });

    const { data, error } = await supabase
      .from('bars')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Bar "${nome || data.nome}" atualizado com sucesso!`,
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao atualizar bar:', apiError);
    return NextResponse.json(
      {
        success: false,
        error: apiError.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do bar é obrigatório',
        },
        { status: 400 }
      );
    }

    // Buscar o bar antes de deletar
    const { data: bar } = await supabase
      .from('bars')
      .select('nome')
      .eq('id', parseInt(id))
      .single();

    if (!bar) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bar não encontrado',
        },
        { status: 404 }
      );
    }

    // Deletar o bar
    const { error } = await supabase.from('bars').delete().eq('id', parseInt(id));

    if (error) {
      throw error;
    }

    console.log(`🗑️ Bar deletado: ${bar.nome} (ID: ${id})`);

    return NextResponse.json({
      success: true,
      message: `Bar "${bar.nome}" deletado com sucesso!`,
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erro ao deletar bar:', apiError);
    return NextResponse.json(
      {
        success: false,
        error: apiError.message,
      },
      { status: 500 }
    );
  }
}
