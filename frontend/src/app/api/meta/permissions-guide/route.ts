import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const guide = {
    timestamp: new Date().toISOString(),
    title: "GUIA COMPLETO - Permissões Meta Business Manager",
    
    current_status: {
      working: [
        "✅ Instagram Reach: 41,583 → 45,821 → 43,779 (FUNCIONANDO PERFEITAMENTE)",
        "✅ Instagram Seguidores: 36,422 (CORRETO)",
        "✅ Instagram Posts: Coletando com likes/comments",
        "✅ Facebook Dados básicos: Nome, fãs, seguidores"
      ],
      issues: [
        "❌ Instagram Impressions: Meta removeu na API v22+",
        "❌ Instagram Profile Views: Precisa metric_type=total_value",
        "❌ Facebook Insights: Precisa Page Access Token",
        "❌ Campanhas/Ads: Precisa Business ID + Ad Account"
      ]
    },

    required_permissions: {
      "Para Instagram (FUNCIONANDO PARCIALMENTE)": [
        "instagram_basic - Dados básicos da conta",
        "instagram_manage_insights - Insights e métricas ✅",
        "read_insights - Leitura de insights ✅",
        "pages_read_engagement - Engajamento ✅"
      ],
      
      "Para Facebook (PROBLEMA: Page Token)": [
        "pages_show_list - Lista páginas ✅",
        "pages_read_engagement - Engajamento da página",
        "pages_read_user_content - Conteúdo da página",
        "read_insights - Insights da página ✅"
      ],
      
      "Para Campanhas/Ads (PROBLEMA: Business Access)": [
        "ads_read - Leitura de anúncios ✅",
        "ads_management - Gerenciamento de anúncios ✅",
        "business_management - Gerenciamento de negócios ✅"
      ]
    },

    exact_problems_found: {
      "1. Instagram Impressions": {
        error: "Starting from version 22 and above, the impressions metric is no longer supported",
        solution: "USAR: reach, profile_views, website_clicks (disponíveis)",
        status: "Meta REMOVEU esta métrica - sem solução"
      },
      
      "2. Instagram Profile Views": {
        error: "should be specified with parameter metric_type=total_value",
        solution: "Adicionar &metric_type=total_value na URL",
        status: "FÁCIL DE CORRIGIR"
      },
      
      "3. Facebook Page Insights": {
        error: "This method must be called with a Page Access Token",
        solution: "Gerar Page Access Token específico da página",
        status: "PRECISA RECONFIGURAR TOKEN"
      },
      
      "4. Facebook Reach Metric": {
        error: "The value must be a valid insights metric",
        solution: "Usar métricas corretas: page_impressions_unique, page_reach_unique",
        status: "USAR MÉTRICAS CORRETAS"
      }
    },

    action_plan: {
      "PASSO 1 - Instagram (80% OK)": {
        current: "Reach funcionando perfeitamente (41K+ dados reais)",
        fix: "Adicionar metric_type=total_value para profile_views, website_clicks",
        code_change: "URL: &metric_type=total_value"
      },
      
      "PASSO 2 - Facebook (REQUER TOKEN NOVO)": {
        current: "Usando User Access Token (não funciona para Page Insights)",
        fix: "Gerar Page Access Token específico",
        steps: [
          "1. Graph Explorer → Selecionar sua Página",
          "2. Generate Access Token → Selecionar página específica",
          "3. Salvar o Page Access Token no banco",
          "4. Usar este token para chamadas Facebook"
        ]
      },
      
      "PASSO 3 - Campanhas (CONFIGURAR BUSINESS)": {
        current: "Business ID configurado, mas precisa vincular Ad Accounts",
        fix: "Verificar se Ad Accounts estão vinculadas ao Business Manager",
        verify: "Facebook Business Manager → Settings → Ad Accounts"
      }
    },

    available_data: {
      "Instagram (Com correções)": [
        "✅ Reach: 41K+ (JÁ FUNCIONA)",
        "⚡ Profile Views: metric_type=total_value",
        "⚡ Website Clicks: metric_type=total_value", 
        "⚡ Accounts Engaged: metric_type=total_value",
        "✅ Follower Count: Funciona",
        "❌ Impressions: Meta removeu (usar reach)"
      ],
      
      "Facebook (Com Page Token)": [
        "⚡ Page Impressions: Precisa Page Token",
        "⚡ Page Reach: Precisa Page Token", 
        "⚡ Page Engagements: Precisa Page Token",
        "⚡ Page Fans: Precisa Page Token",
        "✅ Posts/Reactions: Funciona com User Token"
      ],
      
      "Campanhas (Se Business configurado)": [
        "💰 Spend (Gastos): R$ reais",
        "📊 Impressions, Reach, Clicks",
        "📈 CTR, CPC, CPM",
        "🎯 Conversions, ROI"
      ]
    },

    immediate_fixes: {
      "1. Instagram metrics": `
// ADICIONAR metric_type=total_value para:
const metricsUrl = instagram_account_id/insights?metric=profile_views,website_clicks,accounts_engaged&metric_type=total_value&period=day&since=YYYY-MM-DD&until=YYYY-MM-DD&access_token=TOKEN
      `,
      
      "2. Facebook Page Token": `
// GERAR Page Access Token:
1. https://developers.facebook.com/tools/explorer/
2. Selecionar sua Página (não User Token)
3. Solicitar permissões: pages_read_engagement, read_insights
4. Copiar o Page Access Token
5. Salvar no banco: page_access_token
      `,
      
      "3. Código corrigido": `
// Instagram: adicionar metric_type=total_value
// Facebook: usar page_access_token em vez de access_token
// Manter reach funcionando (já está perfeito)
      `
    },

    summary: {
      status: "80% FUNCIONANDO - Reach Instagram OK",
      main_issue: "Page Access Token para Facebook",
      easy_fixes: "metric_type=total_value para Instagram",
      result: "Com correções = 100% dos dados do Meta Business Manager"
    }
  }

  return NextResponse.json(guide, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
} 