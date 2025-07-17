import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

// Event name mappings to fix encoding issues
const eventMappings = [
  // February 2025
  { originalPattern: /Sertanejada com ARNO SANTANA \*OPEN BAR\*/i, name: 'Sertanejada com ARNO SANTANA OPEN BAR', date: '2025-02-01' }
];

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    console.log('?? Starting complete event name fix...');
    
    let totalFixed = 0;
    const errors = [];

    // Fix each mapping
    for (const mapping of eventMappings) {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .update({ nome_evento: mapping.name })
          .eq('bar_id', 1)
          .ilike('nome_evento', `%${mapping.originalPattern.source}%`);

        if (error) {
          errors.push(`Error fixing ${mapping.name}: ${error.message}`);
        } else {
          console.log(`? Fixed event: ${mapping.name}`);
          totalFixed++;
        }
      } catch (err) {
        errors.push(`Exception fixing ${mapping.name}: ${(err as any).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalFixed,
      errors: errors.length > 0 ? errors : null,
      message: `Fixed ${totalFixed} event names successfully`
    });

  } catch (error) {
    console.error('? Error in fix-all endpoint:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  }
}

