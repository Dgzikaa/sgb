import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Aqui você faria a chamada para o Supabase para buscar os dados
    // Por enquanto, retornando dados mockados baseados na análise das tabelas
    
    const mockCampaignsData = [
      {
        date: "2025-06-25",
        campaign: "[SS] [ORDI] [TURB] Vídeo de Lançamento 07 | \"Conceito\"",
        campaign_id: "120216604054330626",
        spend: 8.81,
        totalcost: 8.81,
        campaign_daily_budget: 1000,
        campaign_effective_status: "ACTIVE",
        campaign_objective: "LINK_CLICKS"
      },
      {
        date: "2025-06-25",
        campaign: "[SS] [ORDI] [VV] Quarta de Bamba | Geral",
        campaign_id: "120217525382390626",
        spend: 46.36,
        totalcost: 46.36,
        campaign_daily_budget: null,
        campaign_effective_status: "ACTIVE",
        campaign_objective: "OUTCOME_AWARENESS"
      },
      {
        date: "2025-06-25",
        campaign: "[SS] [ORDI] [IMP] Quarta de Bamba",
        campaign_id: "120221583700740626",
        spend: 33.99,
        totalcost: 33.99,
        campaign_daily_budget: null,
        campaign_effective_status: "ACTIVE",
        campaign_objective: "OUTCOME_AWARENESS"
      },
      {
        date: "2025-06-25",
        campaign: "[SS] [ORDI] [VV] Pagode Vira-Lata",
        campaign_id: "120225487963250626",
        spend: 69.22,
        totalcost: 69.22,
        campaign_daily_budget: null,
        campaign_effective_status: "ACTIVE",
        campaign_objective: "OUTCOME_AWARENESS"
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockCampaignsData
    });

  } catch (error) {
    console.error('Erro ao buscar dados das campanhas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
