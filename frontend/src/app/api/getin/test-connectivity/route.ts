import { NextRequest, NextResponse } from 'next/server'

// ========================================
// 🌐 POST /api/getin/test-connectivity - Testar conectividade
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('🌐 Testando conectividade externa...')
    
    const results = []
    
    // Lista de sites para testar conectividade
    const testSites = [
      { name: 'HTTPBin (Teste)', url: 'https://httpbin.org/get' },
      { name: 'Google', url: 'https://www.google.com' },
      { name: 'GetIn Principal', url: 'https://getin.com.br' },
      { name: 'GetIn Painel (CORRETO)', url: 'https://painel-reserva.getinapp.com.br' },
      { name: 'GetIn Agent (ANTIGO)', url: 'https://agent.getin.com.br' },
      { name: 'GetIn APIs (ANTIGO)', url: 'https://agent.getinapis.com' }
    ]
    
    for (const site of testSites) {
      console.log(`🔄 Testando: ${site.name}`)
      
      try {
        const start = Date.now()
        const response = await fetch(site.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(5000) // 5 segundos timeout
        })
        
        const duration = Date.now() - start
        
        results.push({
          name: site.name,
          url: site.url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          duration: `${duration}ms`,
          headers: Object.fromEntries(response.headers.entries()),
          accessible: true
        })
        
        console.log(`✅ ${site.name}: ${response.status} (${duration}ms)`)
        
      } catch (error) {
        results.push({
          name: site.name,
          url: site.url,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          accessible: false,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        })
        
        console.log(`❌ ${site.name}: ${error}`)
      }
    }
    
    // Analisar resultados
    const accessibleSites = results.filter(r => r.accessible)
    const inaccessibleSites = results.filter(r => !r.accessible)
    
    let diagnosis = ''
    if (accessibleSites.length === 0) {
      diagnosis = 'Nenhuma conectividade externa. Problema de rede/firewall.'
    } else if (accessibleSites.some(s => s.name === 'HTTPBin (Teste)' || s.name === 'Google')) {
      if (inaccessibleSites.some(s => s.name.includes('GetIn'))) {
        diagnosis = 'Conectividade OK, mas GetIn pode estar bloqueado ou fora do ar.'
      } else {
        diagnosis = 'Conectividade externa funcionando normalmente.'
      }
    } else {
      diagnosis = 'Conectividade limitada. Possível proxy/firewall restritivo.'
    }
    
    return NextResponse.json({
      success: true,
      results: results,
      summary: {
        total: results.length,
        accessible: accessibleSites.length,
        inaccessible: inaccessibleSites.length,
        diagnosis: diagnosis
      },
      recommendations: accessibleSites.length > 0 ? [
        'Conectividade externa funciona',
        'Problema específico com GetIn ou sites bloqueados',
        'Considere usar proxy ou VPN se necessário'
      ] : [
        'Problema de conectividade geral',
        'Verifique firewall corporativo',
        'Verifique configurações de proxy',
        'Entre em contato com TI se necessário'
      ]
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de conectividade:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 