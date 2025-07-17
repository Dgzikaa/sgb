import { NextRequest, NextResponse } from 'next/server';
import { backupSystem } from '@/lib/backup-system';

export async function POST(request: NextRequest) {
  try {
    const { barId } = await request.json();

    if (!barId) {
      return NextResponse.json(
        { error: 'barId Ã© obrigatÃ³rio' },
        { status: 400 }
      );
    }

    console.log(`ðŸ”„ Iniciando backup para bar ${barId}...`);

    // Criar backup
    const result = await backupSystem.createBackup(parseInt(barId));

    return NextResponse.json({
      success: true,
      message: 'Backup criado com sucesso',
      backup: result
    });

  } catch (error) {
    console.error('âŒ Erro ao criar backup:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
