import { NextRequest, NextResponse } from 'next/server';
import { backupSystem } from '@/lib/backup-system';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    console.log(
      `📋 Listando backups${barId ? ` para bar ${barId}` : ' (todos)'}...`
    );

    // Listar backups
    const backups = await backupSystem.listBackups(
      barId ? parseInt(barId) : undefined
    );

    return NextResponse.json({
      success: true,
      backups,
    });
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
