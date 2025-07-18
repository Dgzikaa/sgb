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

﻿import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    console.log('?? Starting simple event name fix...');
    
    // Simple test: Update just a few specific events
    const updates = [
      { date: '2025-06-01', name: 'Samba da tia Zelia' },
      { date: '2025-06-02', name: 'Jet - Segunda da Resenha' },
      { date: '2025-06-04', name: 'Quarta de Bamba' },
      { date: '2025-06-06', name: 'Pagode Vira-Lata' },
      { date: '2025-06-09', name: 'Jet - Segunda da Resenha' },
      { date: '2025-06-11', name: 'Quarta de Bamba' }
    ];
    
    let successCount = 0;
    const results = [];
    
    for (const update of updates) {
      console.log(`Updating ${update.date} to "${update.name}"`);
      
      const { data, error } = await supabase
        .from('eventos')
        .update({ nome_evento: update.name })
        .eq('bar_id', 1)
        .eq('data_evento', update.date)
        .select();
      
      if (error) {
        console.error(`Error updating ${update.date}:`, error);
        results.push({ date: update.date, status: 'error', error: error.message });
      } else {
        console.log(`? Successfully updated ${update.date}`);
        successCount++;
        results.push({ date: update.date, status: 'success', rowsAffected: data?.length || 0 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${successCount} out of ${updates.length} events`,
      successCount,
      totalAttempts: updates.length,
      results
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

