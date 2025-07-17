import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getVendasData, getClientesData, getProdutoMaisVendido, getAnaliseCompleta, getDadosSemana, getHistoricoDiaSemana } from '@/lib/database'

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem Ã¡Â© obrigatÃ¡Â³ria' }, { status: 400 })
    }

    // Ã°Å¸Å¡â‚¬ BUSCAR DADOS REAIS usando as funÃ¡Â§Ã¡Âµes jÃ¡Â¡ existentes do frontend
    let contextoDados = ''
    let vendasData = null
    let clientesData = null
    let produtoMaisVendido = null
    
    try {
      console.log('Ã°Å¸â€œÅ  Buscando dados do sistema usando funÃ¡Â§Ã¡Âµes existentes...')
      
      // Usar as funÃ¡Â§Ã¡Âµes jÃ¡Â¡ testadas e em produÃ¡Â§Ã¡Â£o + anÃ¡Â¡lises avanÃ¡Â§adas
      const hoje = new Date().toISOString().split('T')[0]
      
      const dados = await Promise.all([
        getVendasData().catch(err => {
          console.warn('Å¡Â Ã¯Â¸Â Erro ao buscar vendas:', err.message)
          return null
        }),
        getClientesData().catch(err => {
          console.warn('Å¡Â Ã¯Â¸Â Erro ao buscar clientes:', err.message)
          return null
        }),
        getProdutoMaisVendido().catch(err => {
          console.warn('Å¡Â Ã¯Â¸Â Erro ao buscar produto mais vendido:', err.message)
          return null
        }),
        getAnaliseCompleta('semana').catch(err => {
          console.warn('Å¡Â Ã¯Â¸Â Erro ao buscar anÃ¡Â¡lise completa:', err.message)
          return null
        })
      ])
      
      vendasData = dados[0]
      clientesData = dados[1]
      produtoMaisVendido = dados[2]
      const analiseCompleta = dados[3]

      console.log('Ã°Å¸â€œË† Dados obtidos:', {
        vendas: vendasData ? 'OK' : 'ERRO',
        clientes: clientesData ? 'OK' : 'ERRO', 
        produto: produtoMaisVendido ? 'OK' : 'ERRO',
        analiseCompleta: analiseCompleta ? 'OK' : 'ERRO'
      })

      // Montar contexto com dados reais
      contextoDados = `
Ã°Å¸â€œÅ  DADOS ATUAIS DO BAR ORDINÃ¡ÂRIO (usando sistema de produÃ¡Â§Ã¡Â£o):

Ã°Å¸â€™Â° VENDAS:
${vendasData ? `
- Vendas hoje: R$ ${vendasData.vendas_hoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Vendas da semana: R$ ${vendasData.vendas_semana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de pedidos hoje: ${vendasData.total_pedidos}
- Ticket mÃ¡Â©dio: R$ ${vendasData.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de vendas indisponÃ¡Â­veis no momento'}

Ã°Å¸â€˜Â¥ CLIENTES:
${clientesData ? `
- Total de clientes hoje: ${clientesData.total_clientes_hoje}
- Novos clientes: ${clientesData.novos_clientes}
- Clientes recorrentes: ${clientesData.clientes_recorrentes}
` : '- Dados de clientes indisponÃ¡Â­veis no momento'}

Ã°Å¸Ââ€  PRODUTO MAIS VENDIDO:
${produtoMaisVendido ? `
- Produto: ${produtoMaisVendido.produto}
- Categoria: ${produtoMaisVendido.grupo}
- Quantidade vendida: ${produtoMaisVendido.quantidade}
- Valor total: R$ ${produtoMaisVendido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de produtos indisponÃ¡Â­veis no momento'}

Ã°Å¸â€œÅ  ANÃ¡ÂLISE AVANÃ¡â€¡ADA DA SEMANA:
${analiseCompleta ? `
- Ã°Å¸Ââ€  MELHOR DIA: ${analiseCompleta.melhorDiaSemana.dia} (R$ ${analiseCompleta.melhorDiaSemana.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
- Ã°Å¸â€œË† PERFORMANCE DA SEMANA: ${(analiseCompleta.insights.performanceSemana * 100).toFixed(0)}% acima da mÃ¡Â©dia
- Ã°Å¸Å½Â¯ CONSISTÃ¡Å NCIA: ${(analiseCompleta.insights.consistencia * 100).toFixed(0)}% dos dias acima de 80% da mÃ¡Â©dia
- Ã°Å¸â€œÅ  MÃ¡â€°DIA DIÃ¡ÂRIA: R$ ${analiseCompleta.medias.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Ã°Å¸â€˜Â¥ MÃ¡â€°DIA CLIENTES/DIA: ${analiseCompleta.medias.clientes.toFixed(0)} pessoas

Ã°Å¸â€˜Â¥ TOTAL CLIENTES DA SEMANA: ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.clientes, 0)}
Ã°Å¸â€™Â° TOTAL FATURAMENTO DA SEMANA: R$ ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.faturamento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

DADOS POR DIA DA SEMANA:
${analiseCompleta.dadosSemana.map((dia) => 
  `  ${dia.dia}: R$ ${dia.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dia.clientes} pessoas)`
).join('\n')}
` : '- AnÃ¡Â¡lise avanÃ¡Â§ada indisponÃ¡Â­vel no momento'}

Ã°Å¸ÂÂª INFORMAÃ¡â€¡Ã¡â€¢ES DO BAR:
- Nome: Bar OrdinÃ¡Â¡rio
- Sistema: SGB (Sistema de GestÃ¡Â£o de Bares)
- Dados em tempo real via Supabase
- IntegraÃ¡Â§Ã¡Â£o com mÃ¡Âºltiplas fontes (Contahub, Sympla, Yuzer)

Ã°Å¸â€™Â¡ INSTRUÃ¡â€¡Ã¡â€¢ES AVANÃ¡â€¡ADAS:
- Use SEMPRE os dados acima para responder perguntas sobre vendas, clientes e produtos
- RESPONDA ANÃ¡ÂLISES COMPLEXAS como "qual foi o melhor dia da semana" usando os dados detalhados
- COMPARE DIAS: Use os dados por dia da semana para identificar padrÃ¡Âµes e tendÃ¡Âªncias
- ANÃ¡ÂLISE DE PERFORMANCE: Use os insights de consistÃ¡Âªncia e performance para dar sugestÃ¡Âµes
- IDENTIFIQUE OPORTUNIDADES: Dias com performance abaixo da mÃ¡Â©dia sÃ¡Â£o oportunidades de melhoria
- Os valores mostram o desempenho real do estabelecimento em tempo real
- Se algum dado estiver indisponÃ¡Â­vel, informe e sugira verificar mais tarde
- Mantenha tom profissional mas amigÃ¡Â¡vel e seja especÃ¡Â­fico com nÃ¡Âºmeros
- DÃ¡Âª insights ACTIONABLES baseados nos dados reais
      `.trim()

    } catch (error) {
      console.error('ÂÅ’ Erro ao buscar dados para contexto:', error)
      contextoDados = `
Å¡Â Ã¯Â¸Â DADOS TEMPORARIAMENTE INDISPONÃ¡ÂVEIS

NÃ¡Â£o foi possÃ¡Â­vel acessar os dados em tempo real do sistema neste momento.
Posso ainda ajudar com:
- InformaÃ¡Â§Ã¡Âµes gerais sobre gestÃ¡Â£o de bares
- AnÃ¡Â¡lise de tendÃ¡Âªncias e estratÃ¡Â©gias
- DÃ¡Âºvidas sobre o sistema SGB
- Planejamento e metas

Por favor, tente novamente em alguns minutos para dados atualizados.
      `.trim()
    }

    // Prompt do sistema para o assistente
    const systemPrompt = `
VocÃ¡Âª Ã¡Â© o assistente inteligente do SGB (Sistema de GestÃ¡Â£o de Bares), especializado no Bar OrdinÃ¡Â¡rio.

${contextoDados}

PAPEL:
VocÃ¡Âª Ã¡Â© um consultor especialista em gestÃ¡Â£o de bares que tem acesso aos dados reais do estabelecimento. 
Suas respostas devem ser:
- Baseadas nos dados reais fornecidos acima
- PrÃ¡Â¡ticas e actionÃ¡Â¡veis para gestores de bar
- Profissionais mas com tom amigÃ¡Â¡vel
- Focadas em insights que ajudem na tomada de decisÃ¡Â£o

CAPACIDADES:
- AnÃ¡Â¡lise de vendas e performance
- IdentificaÃ¡Â§Ã¡Â£o de tendÃ¡Âªncias e oportunidades
- SugestÃ¡Âµes de melhorias operacionais
- ComparaÃ¡Â§Ã¡Âµes com benchmarks do setor
- ExplicaÃ¡Â§Ã¡Â£o clara de mÃ¡Â©tricas importantes

Sempre mencione a fonte dos dados (sistema SGB) e seja especÃ¡Â­fico nos nÃ¡Âºmeros quando relevante.
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

    const resposta = completion.choices[0]?.message?.content || 'Desculpe, nÃ¡Â£o consegui processar sua solicitaÃ¡Â§Ã¡Â£o.'

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
    console.error('ÂÅ’ Erro na API do assistente:', error)
    
    return NextResponse.json({ 
      message: 'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Erro interno'
    }, { status: 500 })
  }
} 

