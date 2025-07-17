import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    // Buscar dados da tabela 'bar' (estrutura atual do banco)
    const { data: barData, error } = await supabase
      .from('bar')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }

    // Mapear dados para estrutura padronizada
    const data = barData.map((bar: any) => ({
      id: bar.id,
      nome: bar.nome || bar.name || 'Sem nome',
      endereco: bar.endereco || bar.address || 'EndereÃ§o nÃ¡o informado',
      telefone: bar.telefone || bar.phone || '',
      cnpj: bar.cnpj || '',
      email: bar.email || '',
      status: bar.status || 'ativo',
      created_at: bar.created_at || new Date().toISOString(),
      updated_at: bar.updated_at || new Date().toISOString()
    }));

    console.log(`? Encontrados ${data.length} bares na tabela 'bar':`, data.map((b: any) => b.nome));
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Erro ao buscar bares:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const body = await request.json();
    const { nome, endereco, telefone, cnpj, email } = body;
    
    // ValidaÃ§Ãµes bÃ¡sicas
    if (!nome || !endereco) {
      return NextResponse.json({
        success: false,
        error: 'Nome e endereÃ§o sÃ¡o obrigatÃ³rios'
      }, { status: 400 });
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
        sync_automatico: true
      }
    };
    
    const { data, error } = await supabase
      .from('bar')
      .insert([newBar])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Criar configuraÃ§Ãµes padrÃ¡o para o bar nas tabelas relacionadas
    await createDefaultConfigurations(data.id);
    
    console.log(`? Novo bar criado: ${nome} (ID: ${data.id})`);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: `Bar "${nome}" criado com sucesso!`
    });
    
  } catch (error) {
    console.error('Erro ao criar bar:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  }
}

async function createDefaultConfigurations(barId: number) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      throw new Error('Erro ao conectar com banco');
    }

    // Criar registros padrÃ£o nas tabelas de configuraÃ§Ã£o
    const configurationsPromises = [
      // ConfiguraÃ§Ãµes de API para o bar
      await supabase.from('bar_api_configs').insert([{
        bar_id: barId,
        api_name: 'sympla',
        enabled: true,
        settings: { auto_sync: true }
      }]),
      
      // ConfiguraÃ§Ãµes de notificaÃ§Ã£o
      await supabase.from('bar_notification_configs').insert([{
        bar_id: barId,
        email_enabled: true,
        discord_enabled: false,
        alerts_enabled: true
      }]),
      
      // Criar entrada na tabela de estatÃ­sticas se nÃ£o existir
      await supabase.from('bar_stats').insert([{
        bar_id: barId,
        total_eventos: 0,
        total_vendas: 0,
        ultima_sincronizacao: new Date().toISOString()
      }])
    ];
    
    await Promise.all(configurationsPromises);
    console.log(`? ConfiguraÃ§Ãµes padrÃ£o criadas para bar ${barId}`);
    
  } catch (error) {
    console.warn('?? Erro ao criar configuraÃ§Ãµes padrÃ£o:', error);
    // NÃ£o falhar o processo principal por isso
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const body = await request.json();
    const { id, nome, endereco, telefone, cnpj, email, status } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID do bar Ã© obrigatÃ³rio'
      }, { status: 400 });
    }
    
    const updates = {
      nome,
      endereco,
      telefone,
      cnpj,
      email,
      status,
      updated_at: new Date().toISOString()
    };
    
    // Remover campos undefined
    Object.keys(updates).forEach((key: any) => {
      if (updates[key as keyof typeof updates] === undefined) {
        delete updates[key as keyof typeof updates];
      }
    });
    
    const { data, error } = await supabase
      .from('bar')
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
      message: `Bar "${nome || data.nome}" atualizado com sucesso!`
    });
    
  } catch (error) {
    console.error('Erro ao atualizar bar:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID do bar Ã© obrigatÃ³rio'
      }, { status: 400 });
    }
    
    // Buscar o bar antes de deletar
    const { data: bar } = await supabase
      .from('bar')
      .select('nome')
      .eq('id', id)
      .single();
    
    if (!bar) {
      return NextResponse.json({
        success: false,
        error: 'Bar nÃ£o encontrado'
      }, { status: 404 });
    }
    
    // Soft delete - marcar como inativo ao invÃ©s de deletar
    const { error } = await supabase
      .from('bar')
      .update({ 
        status: 'inativo',
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: `Bar "${bar.nome}" removido com sucesso!`
    });
    
  } catch (error) {
    console.error('Erro ao deletar bar:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  }
}

