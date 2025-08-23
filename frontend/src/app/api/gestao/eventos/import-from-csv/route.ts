import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic'

function parseCSVDate(dateStr: string): string {
  // Converte datas do formato "1-Feb" para "2025-02-01"
  const [day, monthStr] = dateStr.split('-');
  const monthMap: { [key: string]: string } = {
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
  };

  const month = monthMap[monthStr] || '02';
  const paddedDay = day.padStart(2, '0');

  return `2025-${month}-${paddedDay}`;
}

export async function POST() {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }
    console.log('🔄 Iniciando importação da CSV...');

    // Criar cliente Supabase

    // Ler o arquivo CSV
    const csvPath = path.join(
      process.cwd(),
      'frontend',
      'atracoes_ordinario.csv'
    );
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    console.log(`📁 CSV encontrada com ${lines.length} linhas`);

    // 1. Limpar todos os eventos existentes do Bar Ordinário
    console.log('🗑️ Removendo eventos existentes...');
    const { error: deleteError } = await supabase
      .from('eventos')
      .delete()
      .eq('bar_id', 1);

    if (deleteError) {
      console.error('❌ Erro ao deletar eventos:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao deletar eventos existentes',
        details: deleteError,
      });
    }

    console.log('✅ Eventos existentes removidos com sucesso');

    // 2. Processar CSV e inserir eventos
    const eventosParaInserir: Array<{
      bar_id: number;
      nome_evento: string;
      nome_artista: string | null;
      genero_musical: string;
      observacoes: string | null;
      data_evento: string;
      horario_inicio: string;
      horario_fim: string;
      status: string;
      categoria: string;
      tipo_evento: string;
      divulgacao_ativa: boolean;
      created_at: string;
      updated_at: string;
    }> = [];

    // Pular o cabeçalho (primeira linha)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse da linha CSV
      const parts = line.split(',');
      if (parts.length < 6) continue;

      const data = parts[0];
      const evento = parts[3];
      const artista = parts[4] && parts[4] !== '' ? parts[4] : null;
      const genero = parts[5];
      const obs = parts[6] && parts[6] !== '' ? parts[6] : null;

      // Converter data para formato SQL
      const dataSQL = parseCSVDate(data);

      eventosParaInserir.push({
        bar_id: 1,
        nome_evento: evento,
        nome_artista: artista,
        genero_musical: genero,
        observacoes: obs,
        data_evento: dataSQL,
        horario_inicio: '19:00:00',
        horario_fim: '23:59:00',
        status: 'ativo',
        categoria: 'música',
        tipo_evento: 'show',
        divulgacao_ativa: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`📝 Processados ${eventosParaInserir.length} eventos da CSV`);

    // 3. Inserir eventos em lotes
    const { data: insertedEvents, error: insertError } = await supabase
      .from('eventos')
      .insert(eventosParaInserir)
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir novos eventos:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir novos eventos',
        details: insertError,
      });
    }

    console.log(
      `✅ ${insertedEvents?.length} novos eventos inseridos com sucesso`
    );

    return NextResponse.json({
      success: true,
      message: 'Eventos importados da CSV com sucesso!',
      totalImported: insertedEvents?.length || 0,
      csvLines: lines.length - 1,
      data: insertedEvents,
    });
  } catch (error: unknown) {
    console.error('❌ Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
