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
      return NextResponse.json({ error: 'Mensagem ÃÂ¡ÃÂ© obrigatÃÂ¡ÃÂ³ria' }, { status: 400 })
    }

    // ÃÂ°ÃÂ¸ÃÂ¡Ã¢âÂ¬ BUSCAR DADOS REAIS usando as funÃÂ¡ÃÂ§ÃÂ¡ÃÂµes jÃÂ¡ÃÂ¡ existentes do frontend
    let contextoDados = ''
    let vendasData = null
    let clientesData = null
    let produtoMaisVendido = null
    
    try {
      console.log('ÃÂ°ÃÂ¸Ã¢â¬ÅÃÂ  Buscando dados do sistema usando funÃÂ¡ÃÂ§ÃÂ¡ÃÂµes existentes...')
      
      // Usar as funÃÂ¡ÃÂ§ÃÂ¡ÃÂµes jÃÂ¡ÃÂ¡ testadas e em produÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o + anÃÂ¡ÃÂ¡lises avanÃÂ¡ÃÂ§adas
      const hoje = new Date().toISOString().split('T')[0]
      
      const dados = await Promise.all([
        getVendasData().catch(err => {
          console.warn('ÃÂ¡ÃÂ ÃÂ¯ÃÂ¸ÃÂ Erro ao buscar vendas:', err.message)
          return null
        }),
        getClientesData().catch(err => {
          console.warn('ÃÂ¡ÃÂ ÃÂ¯ÃÂ¸ÃÂ Erro ao buscar clientes:', err.message)
          return null
        }),
        getProdutoMaisVendido().catch(err => {
          console.warn('ÃÂ¡ÃÂ ÃÂ¯ÃÂ¸ÃÂ Erro ao buscar produto mais vendido:', err.message)
          return null
        }),
        getAnaliseCompleta('semana').catch(err => {
          console.warn('ÃÂ¡ÃÂ ÃÂ¯ÃÂ¸ÃÂ Erro ao buscar anÃÂ¡ÃÂ¡lise completa:', err.message)
          return null
        })
      ])
      
      vendasData = dados[0]
      clientesData = dados[1]
      produtoMaisVendido = dados[2]
      const analiseCompleta = dados[3]

      console.log('ÃÂ°ÃÂ¸Ã¢â¬ÅÃâ  Dados obtidos:', {
        vendas: vendasData ? 'OK' : 'ERRO',
        clientes: clientesData ? 'OK' : 'ERRO', 
        produto: produtoMaisVendido ? 'OK' : 'ERRO',
        analiseCompleta: analiseCompleta ? 'OK' : 'ERRO'
      })

      // Montar contexto com dados reais
      contextoDados = `
ÃÂ°ÃÂ¸Ã¢â¬ÅÃÂ  DADOS ATUAIS DO BAR ORDINÃÂ¡ÃÂRIO (usando sistema de produÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o):

ÃÂ°ÃÂ¸Ã¢â¬â¢ÃÂ° VENDAS:
${vendasData ? `
- Vendas hoje: R$ ${vendasData.vendas_hoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Vendas da semana: R$ ${vendasData.vendas_semana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de pedidos hoje: ${vendasData.total_pedidos}
- Ticket mÃÂ¡ÃÂ©dio: R$ ${vendasData.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de vendas indisponÃÂ¡ÃÂ­veis no momento'}

ÃÂ°ÃÂ¸Ã¢â¬ËÃÂ¥ CLIENTES:
${clientesData ? `
- Total de clientes hoje: ${clientesData.total_clientes_hoje}
- Novos clientes: ${clientesData.novos_clientes}
- Clientes recorrentes: ${clientesData.clientes_recorrentes}
` : '- Dados de clientes indisponÃÂ¡ÃÂ­veis no momento'}

ÃÂ°ÃÂ¸ÃÂÃ¢â¬Â  PRODUTO MAIS VENDIDO:
${produtoMaisVendido ? `
- Produto: ${produtoMaisVendido.produto}
- Categoria: ${produtoMaisVendido.grupo}
- Quantidade vendida: ${produtoMaisVendido.quantidade}
- Valor total: R$ ${produtoMaisVendido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de produtos indisponÃÂ¡ÃÂ­veis no momento'}

ÃÂ°ÃÂ¸Ã¢â¬ÅÃÂ  ANÃÂ¡ÃÂLISE AVANÃÂ¡Ã¢â¬Â¡ADA DA SEMANA:
${analiseCompleta ? `
- ÃÂ°ÃÂ¸ÃÂÃ¢â¬Â  MELHOR DIA: ${analiseCompleta.melhorDiaSemana.dia} (R$ ${analiseCompleta.melhorDiaSemana.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
- ÃÂ°ÃÂ¸Ã¢â¬ÅÃâ  PERFORMANCE DA SEMANA: ${(analiseCompleta.insights.performanceSemana * 100).toFixed(0)}% acima da mÃÂ¡ÃÂ©dia
- ÃÂ°ÃÂ¸ÃÂ½ÃÂ¯ CONSISTÃÂ¡ÃÂ NCIA: ${(analiseCompleta.insights.consistencia * 100).toFixed(0)}% dos dias acima de 80% da mÃÂ¡ÃÂ©dia
- ÃÂ°ÃÂ¸Ã¢â¬ÅÃÂ  MÃÂ¡Ã¢â¬Â°DIA DIÃÂ¡ÃÂRIA: R$ ${analiseCompleta.medias.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- ÃÂ°ÃÂ¸Ã¢â¬ËÃÂ¥ MÃÂ¡Ã¢â¬Â°DIA CLIENTES/DIA: ${analiseCompleta.medias.clientes.toFixed(0)} pessoas

ÃÂ°ÃÂ¸Ã¢â¬ËÃÂ¥ TOTAL CLIENTES DA SEMANA: ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.clientes, 0)}
ÃÂ°ÃÂ¸Ã¢â¬â¢ÃÂ° TOTAL FATURAMENTO DA SEMANA: R$ ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.faturamento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

DADOS POR DIA DA SEMANA:
${analiseCompleta.dadosSemana.map((dia) => 
  `  ${dia.dia}: R$ ${dia.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dia.clientes} pessoas)`
).join('\n')}
` : '- AnÃÂ¡ÃÂ¡lise avanÃÂ¡ÃÂ§ada indisponÃÂ¡ÃÂ­vel no momento'}

ÃÂ°ÃÂ¸ÃÂÃÂª INFORMAÃÂ¡Ã¢â¬Â¡ÃÂ¡Ã¢â¬Â¢ES DO BAR:
- Nome: Bar OrdinÃÂ¡ÃÂ¡rio
- Sistema: SGB (Sistema de GestÃÂ¡ÃÂ£o de Bares)
- Dados em tempo real via Supabase
- IntegraÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o com mÃÂ¡ÃÂºltiplas fontes (Contahub, Sympla, Yuzer)

ÃÂ°ÃÂ¸Ã¢â¬â¢ÃÂ¡ INSTRUÃÂ¡Ã¢â¬Â¡ÃÂ¡Ã¢â¬Â¢ES AVANÃÂ¡Ã¢â¬Â¡ADAS:
- Use SEMPRE os dados acima para responder perguntas sobre vendas, clientes e produtos
- RESPONDA ANÃÂ¡ÃÂLISES COMPLEXAS como "qual foi o melhor dia da semana" usando os dados detalhados
- COMPARE DIAS: Use os dados por dia da semana para identificar padrÃÂ¡ÃÂµes e tendÃÂ¡ÃÂªncias
- ANÃÂ¡ÃÂLISE DE PERFORMANCE: Use os insights de consistÃÂ¡ÃÂªncia e performance para dar sugestÃÂ¡ÃÂµes
- IDENTIFIQUE OPORTUNIDADES: Dias com performance abaixo da mÃÂ¡ÃÂ©dia sÃÂ¡ÃÂ£o oportunidades de melhoria
- Os valores mostram o desempenho real do estabelecimento em tempo real
- Se algum dado estiver indisponÃÂ¡ÃÂ­vel, informe e sugira verificar mais tarde
- Mantenha tom profissional mas amigÃÂ¡ÃÂ¡vel e seja especÃÂ¡ÃÂ­fico com nÃÂ¡ÃÂºmeros
- DÃÂ¡ÃÂª insights ACTIONABLES baseados nos dados reais
      `.trim()

    } catch (error) {
      console.error('ÃÂÃâ Erro ao buscar dados para contexto:', error)
      contextoDados = `
ÃÂ¡ÃÂ ÃÂ¯ÃÂ¸ÃÂ DADOS TEMPORARIAMENTE INDISPONÃÂ¡ÃÂVEIS

NÃÂ¡ÃÂ£o foi possÃÂ¡ÃÂ­vel acessar os dados em tempo real do sistema neste momento.
Posso ainda ajudar com:
- InformaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes gerais sobre gestÃÂ¡ÃÂ£o de bares
- AnÃÂ¡ÃÂ¡lise de tendÃÂ¡ÃÂªncias e estratÃÂ¡ÃÂ©gias
- DÃÂ¡ÃÂºvidas sobre o sistema SGB
- Planejamento e metas

Por favor, tente novamente em alguns minutos para dados atualizados.
      `.trim()
    }

    // Prompt do sistema para o assistente
    const systemPrompt = `
VocÃÂ¡ÃÂª ÃÂ¡ÃÂ© o assistente inteligente do SGB (Sistema de GestÃÂ¡ÃÂ£o de Bares), especializado no Bar OrdinÃÂ¡ÃÂ¡rio.

${contextoDados}

PAPEL:
VocÃÂ¡ÃÂª ÃÂ¡ÃÂ© um consultor especialista em gestÃÂ¡ÃÂ£o de bares que tem acesso aos dados reais do estabelecimento. 
Suas respostas devem ser:
- Baseadas nos dados reais fornecidos acima
- PrÃÂ¡ÃÂ¡ticas e actionÃÂ¡ÃÂ¡veis para gestores de bar
- Profissionais mas com tom amigÃÂ¡ÃÂ¡vel
- Focadas em insights que ajudem na tomada de decisÃÂ¡ÃÂ£o

CAPACIDADES:
- AnÃÂ¡ÃÂ¡lise de vendas e performance
- IdentificaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o de tendÃÂ¡ÃÂªncias e oportunidades
- SugestÃÂ¡ÃÂµes de melhorias operacionais
- ComparaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes com benchmarks do setor
- ExplicaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o clara de mÃÂ¡ÃÂ©tricas importantes

Sempre mencione a fonte dos dados (sistema SGB) e seja especÃÂ¡ÃÂ­fico nos nÃÂ¡ÃÂºmeros quando relevante.
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

    const resposta = completion.choices[0]?.message?.content || 'Desculpe, nÃÂ¡ÃÂ£o consegui processar sua solicitaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o.'

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
    console.error('ÃÂÃâ Erro na API do assistente:', error)
    
    return NextResponse.json({ 
      message: 'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Erro interno'
    }, { status: 500 })
  }
} 
