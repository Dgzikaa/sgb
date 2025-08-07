import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== TESTE RLS CONTAHUB ===');
    
    // Cliente normal (anon key)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Teste 1: Count simples
    const { data: count1, error: error1 } = await supabase
      .from('contahub_pagamentos')
      .select('count(*)')
      .single();
    
    console.log('Teste count com anon key:', { data: count1, error: error1 });
    
    // Teste 2: Service role key (se disponível)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: count2, error: error2 } = await supabaseAdmin
        .from('contahub_pagamentos')
        .select('count(*)')
        .single();
      
      console.log('Teste count com service role:', { data: count2, error: error2 });
    }
    
    // Teste 3: Primeiros registros
    const { data: primeiros, error: error3 } = await supabase
      .from('contahub_pagamentos')
      .select('*')
      .limit(3);
    
    console.log('Teste primeiros registros:', { 
      length: primeiros?.length || 0, 
      error: error3,
      sample: primeiros?.[0] 
    });
    
    return NextResponse.json({
      success: true,
      tests: {
        count_anon: { data: count1, error: error1 },
        primeiros: { length: primeiros?.length || 0, error: error3 }
      }
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
