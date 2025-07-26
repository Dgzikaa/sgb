import { NextRequest, NextResponse } from 'next/server';

// Esta rota foi movida para /api/configuracoes/notifications/route.ts conforme padrão organizacional.
export async function GET(request: NextRequest) {
  // Redirecionar para a nova localização
  const url = new URL('/api/configuracoes/notifications', request.url);
  return NextResponse.redirect(url, 301);
}

export async function POST(request: NextRequest) {
  const url = new URL('/api/configuracoes/notifications', request.url);
  return NextResponse.redirect(url, 301);
}

export async function PUT(request: NextRequest) {
  const url = new URL('/api/configuracoes/notifications', request.url);
  return NextResponse.redirect(url, 301);
}

export async function DELETE(request: NextRequest) {
  const url = new URL('/api/configuracoes/notifications', request.url);
  return NextResponse.redirect(url, 301);
} 