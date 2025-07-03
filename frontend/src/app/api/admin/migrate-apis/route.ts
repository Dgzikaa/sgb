import { NextRequest, NextResponse } from 'next/server';

// Configurações de APIs - TOKENS REMOVIDOS (agora usando secrets do Supabase)
const EXISTING_API_CONFIGS = {
  production: {
    sympla: {
      token: '', // Token será buscado dos secrets do Supabase
      baseUrl: 'https://api.sympla.com.br/public/v1.5.1',
      endpoint: '/events',
      secretKey: 'SYMPLA_API_TOKEN'
    },
    yuzer: {
      token: '', // Token será buscado dos secrets do Supabase
      baseUrl: 'https://api.eagle.yuzer.com.br/api',
      endpoint: '/dashboards/salesPanels/statistics',
      method: 'POST',
      secretKey: 'YUZER_API_TOKEN'
    },
    googlePlaces: {
      token: '', // Token será buscado dos secrets do Supabase
      baseUrl: 'https://maps.googleapis.com/maps/api/place',
      endpoint: '/nearbysearch/json',
      secretKey: 'GOOGLE_PLACES_API_KEY'
    },
    openai: {
      token: '', // Token será buscado dos secrets do Supabase
      baseUrl: 'https://api.openai.com/v1',
      endpoint: '/models',
      secretKey: 'OPENAI_API_KEY'
    }
  },
  pending: {
    googleMyBusiness: {
      token: '',
      baseUrl: 'https://mybusinessbusinessinformation.googleapis.com/v1',
      endpoint: '/accounts',
      status: 'pending'
    },
    contaAzul: {
      token: '',
      baseUrl: 'https://api.contaazul.com/v1',
      endpoint: '/financial',
      status: 'pending'
    },
    getin: {
      token: '',
      baseUrl: 'https://api.getin.com.br/v1',
      endpoint: '/reservations',
      status: 'pending'
    }
  }
};

// GET - Obter configurações para migração
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'preview') {
      // Retorna as configurações que seriam migradas
      return NextResponse.json({
        success: true,
        data: {
          production: Object.keys(EXISTING_API_CONFIGS.production).map(apiName => ({
            name: apiName,
            displayName: getApiDisplayName(apiName),
            hasToken: Boolean(EXISTING_API_CONFIGS.production[apiName as keyof typeof EXISTING_API_CONFIGS.production].token),
            status: 'production'
          })),
          pending: Object.keys(EXISTING_API_CONFIGS.pending).map(apiName => ({
            name: apiName,
            displayName: getApiDisplayName(apiName),
            hasToken: Boolean(EXISTING_API_CONFIGS.pending[apiName as keyof typeof EXISTING_API_CONFIGS.pending].token),
            status: 'pending'
          }))
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Ação não especificada'
    });
  } catch (error) {
    console.error('Erro ao obter configurações para migração:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Executar migração
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetBarId, selectedApis } = body;
    
    if (!targetBarId) {
      return NextResponse.json(
        { success: false, error: 'ID do bar é obrigatório' },
        { status: 400 }
      );
    }
    
    // Simular migração para localStorage (em produção seria Supabase)
    const migratedConfigs: any = {};
    const migrationLog: string[] = [];
    
    // Migrar APIs selecionadas
    for (const apiName of selectedApis || []) {
      const productionConfig = EXISTING_API_CONFIGS.production[apiName as keyof typeof EXISTING_API_CONFIGS.production];
      const pendingConfig = EXISTING_API_CONFIGS.pending[apiName as keyof typeof EXISTING_API_CONFIGS.pending];
      
      const config = productionConfig || pendingConfig;
      
                    if (config) {
        const configName = getConfigName(apiName);
        const tokenField = getTokenFieldName(apiName);
        migratedConfigs[`${configName}_enabled`] = true;
        migratedConfigs[tokenField] = config.token;
        migratedConfigs[`${configName}_baseUrl`] = config.baseUrl;
        migratedConfigs[`${configName}_endpoint`] = config.endpoint;
          
          if ('method' in config && config.method) {
            migratedConfigs[`${configName}_method`] = config.method;
          }
        
        if (config.token && config.token.length > 10 && !config.token.includes('exemplo') && !config.token.includes('sua_')) {
          migrationLog.push(`✅ ${getApiDisplayName(apiName)}: Migrada com sucesso`);
        } else {
          migrationLog.push(`⚠️ ${getApiDisplayName(apiName)}: Migrada, mas token não configurado`);
        }
      } else {
        migrationLog.push(`❌ ${getApiDisplayName(apiName)}: Configuração não encontrada`);
      }
    }
    
    // Se nenhuma API foi selecionada, migrar todas as de produção
    if (!selectedApis || selectedApis.length === 0) {
      for (const [apiName, config] of Object.entries(EXISTING_API_CONFIGS.production)) {
        const configName = getConfigName(apiName);
        const tokenField = getTokenFieldName(apiName);
        migratedConfigs[`${configName}_enabled`] = true;
        migratedConfigs[tokenField] = config.token;
        migratedConfigs[`${configName}_baseUrl`] = config.baseUrl;
        migratedConfigs[`${configName}_endpoint`] = config.endpoint;
        
        if ('method' in config && config.method) {
          migratedConfigs[`${configName}_method`] = config.method;
        }
        
        if (config.token && config.token.length > 10 && !config.token.includes('exemplo') && !config.token.includes('sua_')) {
          migrationLog.push(`✅ ${getApiDisplayName(apiName)}: Auto-migrada (produção)`);
        } else {
          migrationLog.push(`⚠️ ${getApiDisplayName(apiName)}: Auto-migrada, mas token precisa ser configurado`);
        }
      }
    }
    
    // Salvar no localStorage (simulando banco)
    if (typeof window !== 'undefined') {
      const existingConfigs = JSON.parse(localStorage.getItem('sgb-bar-configs') || '{}');
      existingConfigs[targetBarId] = {
        ...existingConfigs[targetBarId],
        ...migratedConfigs,
        last_migration: new Date().toISOString(),
        migration_source: 'env_configs'
      };
      localStorage.setItem('sgb-bar-configs', JSON.stringify(existingConfigs));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        barId: targetBarId,
        migratedConfigs,
        migrationLog,
        summary: {
          total: selectedApis?.length || Object.keys(EXISTING_API_CONFIGS.production).length,
          successful: migrationLog.filter(log => log.includes('✅')).length,
          failed: migrationLog.filter(log => log.includes('❌')).length
        }
      }
    });
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function getApiDisplayName(apiName: string): string {
  const displayNames: Record<string, string> = {
    sympla: 'Sympla',
    yuzer: 'Yuzer',
    googlePlaces: 'Google Places',
    openai: 'OpenAI',
    googleMyBusiness: 'Google My Business',
    contaAzul: 'Conta Azul',
    getin: 'GetIN'
  };
  
  return displayNames[apiName] || apiName;
}

function getConfigName(apiName: string): string {
  const configNames: Record<string, string> = {
    sympla: 'sympla',
    yuzer: 'yuzer', 
    googlePlaces: 'google_places',
    openai: 'openai',
    googleMyBusiness: 'google_my_business',
    contaAzul: 'conta_azul',
    getin: 'getin'
  };
  
  return configNames[apiName] || apiName;
}

function getTokenFieldName(apiName: string): string {
  const tokenFields: Record<string, string> = {
    sympla: 'sympla_token',
    yuzer: 'yuzer_token',
    googlePlaces: 'google_places_key', // Interface usa 'key' não 'token'
    openai: 'openai_key', // Interface usa 'key' não 'token'
    googleMyBusiness: 'google_my_business_token',
    contaAzul: 'conta_azul_token',
    getin: 'getin_token'
  };
  
  return tokenFields[apiName] || `${getConfigName(apiName)}_token`;
} 