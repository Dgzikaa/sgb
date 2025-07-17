import { NextRequest, NextResponse } from 'next/server';
import { backupSystem } from '@/lib/backup-system';

export async function POST(request: NextRequest) {
  try {
    const { backupId, barId } = await request.json();

    if (!backupId) {
      return NextResponse.json(
        { error: 'backupId Ã¡Â© obrigatÃ¡Â³rio' },
        { status: 400 }
      );
    }

    console.log(`Ã°Å¸â€â€ž Iniciando restore do backup ${backupId}${barId ? ` para bar ${barId}` : ''}...`);

    // Restaurar backup
    const success = await backupSystem.restoreBackup(backupId, barId ? parseInt(barId) : undefined);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Backup restaurado com sucesso'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Falha ao restaurar backup'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('ÂÅ’ Erro ao restaurar backup:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 

