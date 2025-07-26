// Esta rota foi movida para /api/configuracoes/integracoes/route.ts conforme padrão organizacional.
export async function GET() {
  return Response.json({ success: false, error: 'Rota movida para /api/configuracoes/integracoes' }, { status: 410 });
} 