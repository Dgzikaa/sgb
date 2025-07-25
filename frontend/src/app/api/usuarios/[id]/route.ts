import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';
import { authenticateUser, authErrorResponse } from '@/middleware/auth';
import { z } from 'zod';

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const AtualizarUsuarioSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'gerente', 'funcionario']).optional(),
  modulos_permitidos: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
  celular: z.string().optional(),
});

// =====================================================
// GET - OBTER USUÁRIO ESPECÍFICO
// =====================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { id: userId } = await params;
    const supabase = await getAdminClient();

    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('id', userId)
      .eq('bar_id', user.bar_id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT - ATUALIZAR USUÁRIO
// =====================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    const { id: userId } = await params;
    const body = await request.json();
    const data = AtualizarUsuarioSchema.parse(body);

    const supabase = await getAdminClient();

    // Validar celular se fornecido
    if (data.celular) {
      const celularNumbers = data.celular.replace(/\D/g, '');

      // Validação básica: 11 dígitos, DDD válido, terceiro dígito 9
      if (celularNumbers.length !== 11) {
        return NextResponse.json(
          { success: false, error: 'Celular deve ter 11 dígitos' },
          { status: 400 }
        );
      }

      const ddd = parseInt(celularNumbers.substring(0, 2));
      if (ddd < 11 || ddd > 99) {
        return NextResponse.json(
          { success: false, error: 'DDD inválido' },
          { status: 400 }
        );
      }

      if (celularNumbers[2] !== '9') {
        return NextResponse.json(
          { success: false, error: 'Terceiro dígito deve ser 9 (celular)' },
          { status: 400 }
        );
      }

      data.celular = celularNumbers; // Salvar apenas números
    }

    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('bar_id', user.bar_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario,
      message: 'Usuário atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}
