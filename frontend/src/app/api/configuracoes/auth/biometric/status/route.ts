import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, barId } = await request.json();

    if (!email || !barId) {
      return NextResponse.json(
        { error: 'Email e barId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário na tabela usuarios_bar
    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .select('biometric_credentials')
      .eq('email', email)
      .eq('bar_id', barId)
      .single();

    if (error || !usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem credenciais biométricas
    const credentials = usuario.biometric_credentials || [];
    const hasBiometric = Array.isArray(credentials) && credentials.length > 0;

    return NextResponse.json({
      success: true,
      biometricRegistered: hasBiometric,
      totalCredentials: hasBiometric ? credentials.length : 0,
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status biométrico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
