import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Gerando guia de configuração para acessar dados do Ads Manager...')

    const guide = {
      success: true,
      title: 'Guia Completo: Como Acessar Dados do Ads Manager via API',
      current_situation: {
        status: 'Você tem acesso via interface web, mas não via API',
        visible_data: [
          'Campanhas do "Ordinário - CA"',
          'Orçamentos: R$10,00 a R$1.900,00',
          'Resultados: 49 a 80.852 clicks',
          'Alcance: 2.101 a 281.870',
          'Impressões: 2.107 a 158.048',
          'Valor gasto: R$4.776,72'
        ],
        api_error: 'Ad account owner has NOT grant ads_management or ads_read permission'
      },
      
      solution_steps: [
        {
          step: 1,
          title: 'Verificar Permissões Atuais do Token',
          description: 'Primeiro, vamos ver quais permissões seu token atual possui',
          action: 'Teste através da API: /api/meta/check-permissions',
          current_permissions: [
            'pages_read_engagement',
            'pages_show_list', 
            'instagram_basic',
            'instagram_manage_insights'
          ],
          missing_permissions: [
            'ads_read',
            'ads_management'
          ]
        },
        
        {
          step: 2,
          title: 'Regenerar Token com Permissões de Ads',
          description: 'Criar novo token que inclua permissões para acessar campanhas',
          instructions: [
            'Acessar: https://developers.facebook.com/tools/explorer/',
            'Selecionar sua aplicação',
            'Marcar as permissões necessárias:',
            '  ✅ ads_read',
            '  ✅ ads_management', 
            '  ✅ business_management',
            '  ✅ read_insights',
            'Clicar em "Generate Access Token"',
            'Copiar o novo token gerado'
          ],
          required_permissions: [
            {
              permission: 'ads_read',
              description: 'Ler dados de campanhas, ad sets e anúncios',
              required_for: 'Acessar métricas das campanhas'
            },
            {
              permission: 'ads_management', 
              description: 'Gerenciar campanhas publicitárias',
              required_for: 'Acesso completo aos dados de performance'
            },
            {
              permission: 'business_management',
              description: 'Acessar Business Manager',
              required_for: 'Listar contas de anúncios no business'
            }
          ]
        },
        
        {
          step: 3,
          title: 'Solicitar Acesso à Conta de Anúncios',
          description: 'O dono da conta precisa conceder acesso programático',
          account_info: {
            account_name: 'Ordinário - CA',
            account_id: '1153081576486761',
            business_manager: 'Bem Dito'
          },
          instructions: [
            'Acesse: https://business.facebook.com/',
            'Vá em Business Settings > Ad Accounts',
            'Encontre a conta "Ordinário - CA"',
            'Clique em "People" na conta',
            'Adicione seu usuário Facebook com função "Advertiser" ou "Admin"',
            'Vá em "Apps" na mesma conta',
            'Adicione sua aplicação Meta com acesso "Advertiser"'
          ],
          permissions_needed: [
            'Advertiser: Ver e editar campanhas',
            'Admin: Acesso total incluindo configurações'
          ]
        },

        {
          step: 4,
          title: 'Atualizar Configuração no Sistema',
          description: 'Salvar novo token no sistema',
          api_endpoint: '/api/meta/config',
          required_data: {
            access_token: 'Novo token com permissões ads_*',
            app_id: 'ID da aplicação (opcional)',
            app_secret: 'Secret da aplicação (opcional)'
          }
        },

        {
          step: 5,
          title: 'Testar Acesso aos Dados',
          description: 'Verificar se consegue acessar os dados via API',
          test_endpoints: [
            {
              endpoint: '/api/meta/check-permissions',
              description: 'Verificar permissões do token'
            },
            {
              endpoint: '/api/meta/ordinario-campaigns', 
              description: 'Acessar campanhas específicas do Ordinário'
            }
          ]
        }
      ],

      api_parameters: {
        title: 'Parâmetros Necessários para APIs',
        base_url: 'https://graph.facebook.com/v18.0',
        ad_account_id: 'act_1153081576486761',
        access_token: 'Token com ads_read/ads_management',
        
        example_requests: [
          {
            purpose: 'Listar campanhas',
            url: 'https://graph.facebook.com/v18.0/act_1153081576486761/campaigns',
            parameters: {
              fields: 'id,name,status,objective,effective_status',
              access_token: 'SEU_TOKEN_AQUI'
            }
          },
          {
            purpose: 'Insights de campanhas',
            url: 'https://graph.facebook.com/v18.0/act_1153081576486761/insights',
            parameters: {
              fields: 'impressions,clicks,spend,reach,frequency,ctr,cpc',
              level: 'campaign',
              time_range: '{"since":"2025-01-01","until":"2025-01-13"}',
              access_token: 'SEU_TOKEN_AQUI'
            }
          },
          {
            purpose: 'Insights por campanha específica',
            url: 'https://graph.facebook.com/v18.0/{campaign_id}/insights',
            parameters: {
              fields: 'impressions,clicks,spend,reach,ctr,cpc,cost_per_action_type',
              access_token: 'SEU_TOKEN_AQUI'
            }
          }
        ]
      },

      common_issues: [
        {
          issue: 'Token expira em 60 dias',
          solution: 'Configurar refresh automático ou usar token de longa duração'
        },
        {
          issue: 'Permissão negada mesmo com ads_read',
          solution: 'Verificar se o usuário tem acesso à conta específica no Business Manager'
        },
        {
          issue: 'App não aprovado para ads_management',
          solution: 'Usar ads_read para dados ou submeter app para revisão'
        }
      ],

      next_actions: [
        {
          action: 'Verificar permissões atuais',
          url: '/api/meta/check-permissions'
        },
        {
          action: 'Regenerar token',
          url: 'https://developers.facebook.com/tools/explorer/'
        },
        {
          action: 'Configurar acesso no Business Manager',
          url: 'https://business.facebook.com/'
        }
      ]
    }

    return NextResponse.json(guide, { status: 200 })

  } catch (error: any) {
    console.error('❌ Erro ao gerar guia:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 