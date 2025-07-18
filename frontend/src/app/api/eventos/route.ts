import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
    console.log('?? [EVENTOS API] Iniciando busca de eventos');
    
    // Debug das variÃ¡veis de ambiente
    console.log('?? [ENV DEBUG] Cliente Supabase configurado');
    
    console.log('?? [EVENTOS API] Criando cliente Supabase...');
    
    console.log('?? [EVENTOS API] Montando query...');
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');
    const ano = searchParams.get('ano');
    const mes = searchParams.get('mes');

    console.log('?? [EVENTOS API] Parmetros:', { bar_id, ano, mes });

    if (!bar_id) {
      console.log('? [EVENTOS API] bar_id nÃ¡o fornecido');
      return NextResponse.json({ success: false, error: 'bar_id Ã© obrigatÃ³rio' }, { status: 400 });
    }

    let query = supabase
      .from('eventos')
      .select('*')
      .eq('bar_id', parseInt(bar_id));

    if (ano && mes) {
      const startDate = `${ano}-${mes.padStart(2, '0')}-01`;
      // Calcular o Ãºltimo dia do mÃªs corretamente
      const lastDay = new Date(parseInt(ano), parseInt(mes), 0).getDate();
      const endDate = `${ano}-${mes.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      console.log('?? [EVENTOS API] Filtrando perÃ­odo:', { startDate, endDate, lastDay });
      
      query = query
        .gte('data_evento', startDate)
        .lte('data_evento', endDate);
    }

    console.log('?? [EVENTOS API] Executando consulta...');
    const { data: eventos, error } = await query.order('data_evento');

    if (error) {
      console.error('? [EVENTOS API] Erro na consulta:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`? [EVENTOS API] Sucesso! Encontrados ${eventos?.length || 0} eventos`);
    
    return NextResponse.json({ 
      success: true, 
      data: eventos || [],
      count: eventos?.length || 0
    });

  } catch (error) {
    console.error('?? [EVENTOS API] Erro inesperado:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
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

    console.log('??? Recebendo requisiÃ§Ã¡o para deletar eventos...');
    
    const body = await request.json();
    const { bar_id } = body;

    console.log('?? Parmetros recebidos:', { bar_id });

    if (!bar_id) {
      console.log('? bar_id nÃ¡o fornecido');
      return NextResponse.json({ error: 'bar_id Ã© obrigatÃ³rio' }, { status: 400 });
    }

    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('bar_id', bar_id);

    if (error) {
      console.error('? Erro ao deletar:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('? Eventos deletados com sucesso');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('?? Erro inesperado:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
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

    console.log('? [POST EVENTOS] Recebendo requisiÃ§Ã¡o para inserir eventos...');
    
    const eventos = await request.json();
    console.log('?? [POST EVENTOS] Dados recebidos:', JSON.stringify(eventos, null, 2));

    console.log('?? [POST EVENTOS] Validando estrutura...');
    console.log('?? [POST EVENTOS] Ã‰ array?', Array.isArray(eventos));
    console.log('?? [POST EVENTOS] Quantidade:', eventos?.length);

    if (!Array.isArray(eventos) || eventos.length === 0) {
      console.log('? [POST EVENTOS] Array de eventos invÃ¡lido');
      return NextResponse.json({ 
        success: false,
        error: 'Array de eventos Ã© obrigatÃ³rio' 
      }, { status: 400 });
    }

    // Validar cada evento
    console.log('?? [POST EVENTOS] Validando cada evento...');
    for (let i = 0; i < eventos.length; i++) {
      const evento = eventos[i];
      console.log(`?? [POST EVENTOS] Evento ${i + 1}:`, {
        bar_id: evento.bar_id,
        nome_evento: evento.nome_evento,
        data_evento: evento.data_evento,
        hasRequiredFields: !!(evento.bar_id && evento.nome_evento && evento.data_evento)
      });
    }

    console.log('?? [POST EVENTOS] Criando cliente Supabase...');
    
    console.log('?? [POST EVENTOS] Executando inserÃ§Ã¡o...');
    const { data, error } = await supabase
      .from('eventos')
      .insert(eventos)
      .select();

    if (error) {
      console.error('? [POST EVENTOS] Erro ao inserir:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('? [POST EVENTOS] Eventos inseridos com sucesso:', data?.length || 0);
    console.log('?? [POST EVENTOS] Eventos criados:', data);
    
    // VerificaÃ§Ã¡o adicional: buscar os eventos que acabamos de criar
    if (data && data.length > 0) {
      console.log('?? [POST EVENTOS] Verificando se os eventos foram realmente salvos...');
      
      for (const eventoSalvo of data) {
        const { data: verificacao, error: erroVerificacao } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', eventoSalvo.id)
          .single();
          
        if (erroVerificacao || !verificacao) {
          console.error('? [POST EVENTOS] Evento nÃ¡o encontrado apÃ³s inserÃ§Ã¡o:', {
            id: eventoSalvo.id,
            erro: erroVerificacao
          });
        } else {
          console.log('? [POST EVENTOS] Evento verificado:', {
            id: verificacao.id,
            nome: verificacao.nome_evento,
            data: verificacao.data_evento
          });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('?? [POST EVENTOS] Erro inesperado:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
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
    const { id, ...updateData } = body;

    const { data: evento, error } = await supabase
      .from('eventos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar evento:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: evento
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 

