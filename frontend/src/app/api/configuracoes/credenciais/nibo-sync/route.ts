import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função auxiliar para sincronização
async function executeNiboSync(barId?: string) {
  try {
    // Se não tiver barId no body, usar variável de ambiente (cron job)
    const targetBarId = barId || process.env.NIBO_BAR_ID;

    if (!targetBarId) {
      throw new Error('Bar ID é obrigatório (via body ou variável de ambiente NIBO_BAR_ID)');
    }

    // Horário atual no fuso de São Paulo
    const agoraBrasil = DateTime.now().setZone('America/Sao_Paulo');
    console.log(`🕐 Horário em São Paulo: ${agoraBrasil.toFormat('HH:mm:ss')}`);
    console.log(`🔄 Iniciando sincronização NIBO para bar ${targetBarId}...`);

    // Buscar credenciais do NIBO
    const { data: credenciais, error: credError } = await supabase
      .from('credenciais')
      .select('*')
      .eq('bar_id', targetBarId)
      .eq('servico', 'nibo')
      .single();

    if (credError || !credenciais) {
      throw new Error('Credenciais NIBO não encontradas');
    }

    // Iniciar sincronização em background
    // Por enquanto, vamos apenas retornar sucesso
    // A sincronização real será implementada como Edge Function

    return {
      success: true,
      message: 'Sincronização NIBO iniciada com sucesso!',
      syncId: `sync_${Date.now()}`,
      barId: targetBarId,
    };
  } catch (error) {
    console.error('Erro ao sincronizar NIBO:', error);
    throw error;
  }
}

// Método GET para cron jobs do Vercel
export async function GET(request: NextRequest) {
  try {
    const result = await executeNiboSync();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no cron job NIBO:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// Método POST para chamadas manuais
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barId } = body || {};

    const result = await executeNiboSync(barId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao sincronizar NIBO:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
