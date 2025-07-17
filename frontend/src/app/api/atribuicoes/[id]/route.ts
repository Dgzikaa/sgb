import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getVendasData, getClientesData: any, getProdutoMaisVendido, getAnaliseCompleta: any, getDadosSemana, getHistoricoDiaSemana } from '@/lib/database'

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem á© obrigatá³ria' }, { status: 400 })
    }

    // ðŸš€ BUSCAR DADOS REAIS usando as funá§áµes já¡ existentes do frontend
    let contextoDados = ''
    let vendasData = null
    let clientesData = null
    let produtoMaisVendido = null
    
    try {
      console.log('ðŸ“Š Buscando dados do sistema usando funá§áµes existentes...')
      
      // Usar as funá§áµes já¡ testadas e em produá§á£o + aná¡lises avaná§adas
      const hoje = new Date().toISOString().split('T')[0]
      
      const dados = await Promise.all([
        getVendasData().catch(err => {
          console.warn('š ï¸ Erro ao buscar vendas:', err.message)
          return null
        }),
        getClientesData().catch(err => {
          console.warn('š ï¸ Erro ao buscar clientes:', err.message)
          return null
        }),
        getProdutoMaisVendido().catch(err => {
          console.warn('š ï¸ Erro ao buscar produto mais vendido:', err.message)
          return null
        }),
        getAnaliseCompleta('semana').catch(err => {
          console.warn('š ï¸ Erro ao buscar aná¡lise completa:', err.message)
          return null
        })
      ])
      
      vendasData = dados[0]
      clientesData = dados[1]
      produtoMaisVendido = dados[2]
      const analiseCompleta = dados[3]

      console.log('ðŸ“ˆ Dados obtidos:', {
        vendas: vendasData ? 'OK' : 'ERRO',
        clientes: clientesData ? 'OK' : 'ERRO', 
        produto: produtoMaisVendido ? 'OK' : 'ERRO',
        analiseCompleta: analiseCompleta ? 'OK' : 'ERRO'
      })

      // Montar contexto com dados reais
      contextoDados = `
ðŸ“Š DADOS ATUAIS DO BAR ORDINáRIO (usando sistema de produá§á£o):

ðŸ’° VENDAS:
${vendasData ? `
- Vendas hoje: R$ ${vendasData.vendas_hoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Vendas da semana: R$ ${vendasData.vendas_semana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de pedidos hoje: ${vendasData.total_pedidos}
- Ticket má©dio: R$ ${vendasData.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de vendas indisponá­veis no momento'}

ðŸ‘¥ CLIENTES:
${clientesData ? `
- Total de clientes hoje: ${clientesData.total_clientes_hoje}
- Novos clientes: ${clientesData.novos_clientes}
- Clientes recorrentes: ${clientesData.clientes_recorrentes}
` : '- Dados de clientes indisponá­veis no momento'}

ðŸ† PRODUTO MAIS VENDIDO:
${produtoMaisVendido ? `
- Produto: ${produtoMaisVendido.produto}
- Categoria: ${produtoMaisVendido.grupo}
- Quantidade vendida: ${produtoMaisVendido.quantidade}
- Valor total: R$ ${produtoMaisVendido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de produtos indisponá­veis no momento'}

ðŸ“Š ANáLISE AVANá‡ADA DA SEMANA:
${analiseCompleta ? `
- ðŸ† MELHOR DIA: ${analiseCompleta.melhorDiaSemana.dia} (R$ ${analiseCompleta.melhorDiaSemana.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
- ðŸ“ˆ PERFORMANCE DA SEMANA: ${(analiseCompleta.insights.performanceSemana * 100).toFixed(0)}% acima da má©dia
- ðŸŽ¯ CONSISTáŠNCIA: ${(analiseCompleta.insights.consistencia * 100).toFixed(0)}% dos dias acima de 80% da má©dia
- ðŸ“Š Má‰DIA DIáRIA: R$ ${analiseCompleta.medias.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- ðŸ‘¥ Má‰DIA CLIENTES/DIA: ${analiseCompleta.medias.clientes.toFixed(0)} pessoas

ðŸ‘¥ TOTAL CLIENTES DA SEMANA: ${analiseCompleta.dadosSemana.reduce((sum: any, dia: any) => sum + dia.clientes, 0)}
ðŸ’° TOTAL FATURAMENTO DA SEMANA: R$ ${analiseCompleta.dadosSemana.reduce((sum: any, dia: any) => sum + dia.faturamento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

DADOS POR DIA DA SEMANA:
${analiseCompleta.dadosSemana.map((dia: any) => 
  `  ${dia.dia}: R$ ${dia.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dia.clientes} pessoas)`
).join('\n')}
` : '- Aná¡lise avaná§ada indisponá­vel no momento'}

ðŸª INFORMAá‡á•ES DO BAR:
- Nome: Bar Ordiná¡rio
- Sistema: SGB (Sistema de Gestá£o de Bares)
- Dados em tempo real via Supabase
- Integraá§á£o com máºltiplas fontes (Contahub: any, Sympla, Yuzer)

ðŸ’¡ INSTRUá‡á•ES AVANá‡ADAS:
- Use SEMPRE os dados acima para responder perguntas sobre vendas, clientes e produtos
- RESPONDA ANáLISES COMPLEXAS como "qual foi o melhor dia da semana" usando os dados detalhados
- COMPARE DIAS: Use os dados por dia da semana para identificar padráµes e tendáªncias
- ANáLISE DE PERFORMANCE: Use os insights de consistáªncia e performance para dar sugestáµes
- IDENTIFIQUE OPORTUNIDADES: Dias com performance abaixo da má©dia sá£o oportunidades de melhoria
- Os valores mostram o desempenho real do estabelecimento em tempo real
- Se algum dado estiver indisponá­vel, informe e sugira verificar mais tarde
- Mantenha tom profissional mas amigá¡vel e seja especá­fico com náºmeros
- Dáª insights ACTIONABLES baseados nos dados reais
      `.trim()

    } catch (error) {
      console.error('Œ Erro ao buscar dados para contexto:', error)
      contextoDados = `
š ï¸ DADOS TEMPORARIAMENTE INDISPONáVEIS

Ná£o foi possá­vel acessar os dados em tempo real do sistema neste momento.
Posso ainda ajudar com:
- Informaá§áµes gerais sobre gestá£o de bares
- Aná¡lise de tendáªncias e estratá©gias
- Dáºvidas sobre o sistema SGB
- Planejamento e metas

Por favor, tente novamente em alguns minutos para dados atualizados.
      `.trim()
    }

    // Prompt do sistema para o assistente
    const systemPrompt = `
Vocáª á© o assistente inteligente do SGB (Sistema de Gestá£o de Bares), especializado no Bar Ordiná¡rio.

${contextoDados}

PAPEL:
Vocáª á© um consultor especialista em gestá£o de bares que tem acesso aos dados reais do estabelecimento. 
Suas respostas devem ser:
- Baseadas nos dados reais fornecidos acima
- Prá¡ticas e actioná¡veis para gestores de bar
- Profissionais mas com tom amigá¡vel
- Focadas em insights que ajudem na tomada de decisá£o

CAPACIDADES:
- Aná¡lise de vendas e performance
- Identificaá§á£o de tendáªncias e oportunidades
- Sugestáµes de melhorias operacionais
- Comparaá§áµes com benchmarks do setor
- Explicaá§á£o clara de má©tricas importantes

Sempre mencione a fonte dos dados (sistema SGB) e seja especá­fico nos náºmeros quando relevante.
    `.trim()

    // Chamar OpenAI com contexto real
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: message 
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const resposta = completion.choices[0]?.message?.content || 'Desculpe, ná£o consegui processar sua solicitaá§á£o.'

    return NextResponse.json({ 
      message: resposta,
      dados_utilizados: {
        vendas_disponivel: vendasData !== null,
        clientes_disponivel: clientesData !== null,
        produto_disponivel: produtoMaisVendido !== null,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Œ Erro na API do assistente:', error)
    
    return NextResponse.json({ 
      message: 'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Erro interno'
    }, { status: 500 })
  }
} 
