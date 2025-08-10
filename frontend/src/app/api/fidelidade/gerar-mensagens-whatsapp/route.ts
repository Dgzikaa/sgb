import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Gerar mensagens de WhatsApp para códigos disponíveis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'simples' // simples, completo, csv
    const limite = parseInt(searchParams.get('limite') || '10')

    // Buscar códigos disponíveis
    const { data: codigos, error } = await supabase
      .from('fidelidade_codigos_convite')
      .select('codigo, data_expiracao')
      .eq('usado', false)
      .eq('ativo', true)
      .order('codigo')
      .limit(limite)

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar códigos' },
        { status: 500 }
      )
    }

    if (!codigos || codigos.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum código disponível' },
        { status: 404 }
      )
    }

    const dataExpiracao = new Date(codigos[0].data_expiracao)
    const dataExpiracaoFormatada = dataExpiracao.toLocaleDateString('pt-BR')

    // Templates de mensagem
    const templates = {
      simples: (codigo: string) => `🔥 CONVITE EXCLUSIVO - ORDINÁRIO BAR

Você foi selecionado(a) para fazer parte do nosso programa VIP!

🎯 APENAS 100 VAGAS DISPONÍVEIS
💰 Pague R$ 100, Ganhe R$ 150 em créditos
👑 Acesso VIP + Benefícios exclusivos

Seu código exclusivo: ${codigo}

🚀 Acesse: zykor.com.br/fidelidade
⏰ Válido até: ${dataExpiracaoFormatada}

Não perca sua vaga!`,

      completo: (codigo: string) => `🍻 CONVITE EXCLUSIVO VIP - ORDINÁRIO BAR 🍻

Olá! Você foi ESPECIALMENTE SELECIONADO(A) para fazer parte do círculo exclusivo de apenas 100 pessoas no programa VIP do Ordinário Bar! 🔥

🎯 SUA VANTAGEM EXCLUSIVA:
💰 Pague apenas R$ 100
💎 Receba R$ 150 em créditos
📈 50% de retorno GARANTIDO todo mês
👑 Status VIP com benefícios exclusivos

🔐 SEU CÓDIGO PESSOAL: ${codigo}

🚀 COMO ATIVAR:
1️⃣ Acesse: zykor.com.br/fidelidade
2️⃣ Digite seu código exclusivo
3️⃣ Complete o cadastro
4️⃣ Realize o pagamento
5️⃣ Receba seus créditos instantaneamente!

⚡ BENEFÍCIOS VIP:
• R$ 150 em créditos mensais
• Desconto em bebidas premium
• Acesso prioritário em eventos
• Cartão digital personalizado
• Atendimento VIP exclusivo

⏰ URGENTE: Válido apenas até ${dataExpiracaoFormatada}
🎯 Apenas 100 vagas disponíveis

Não perca essa oportunidade única! 
Seja VIP do Ordinário Bar! 🍺👑`,

      csv: (codigo: string) => `${codigo},${dataExpiracaoFormatada},"Convite VIP Ordinário Bar"`
    }

    // Gerar mensagens
    const mensagens = codigos.map(item => ({
      codigo: item.codigo,
      mensagem: templates[formato as keyof typeof templates](item.codigo),
      data_expiracao: item.data_expiracao
    }))

    // Estatísticas
    const stats = {
      total_disponiveis: codigos.length,
      formato_usado: formato,
      data_expiracao: dataExpiracaoFormatada,
      gerado_em: new Date().toISOString()
    }

    if (formato === 'csv') {
      // Retornar como CSV
      const csvHeader = 'Codigo,DataExpiracao,Titulo'
      const csvContent = [csvHeader, ...mensagens.map(m => m.mensagem)].join('\n')
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="codigos-whatsapp-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      estatisticas: stats,
      mensagens: mensagens
    })

  } catch (error) {
    console.error('Erro ao gerar mensagens:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Marcar códigos específicos como "enviados" (adicionar observação)
export async function POST(request: NextRequest) {
  try {
    const { codigos_enviados, observacao = 'Enviado via WhatsApp' } = await request.json()

    if (!codigos_enviados || !Array.isArray(codigos_enviados) || codigos_enviados.length === 0) {
      return NextResponse.json(
        { error: 'Lista de códigos é obrigatória' },
        { status: 400 }
      )
    }

    // Atualizar observação dos códigos
    const { data, error } = await supabase
      .from('fidelidade_codigos_convite')
      .update({
        observacoes: observacao,
        updated_at: new Date().toISOString()
      })
      .in('codigo', codigos_enviados)
      .eq('usado', false)
      .eq('ativo', true)
      .select('codigo')

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar códigos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      codigos_atualizados: data?.length || 0,
      codigos: data?.map(c => c.codigo) || [],
      observacao_adicionada: observacao
    })

  } catch (error) {
    console.error('Erro ao marcar códigos como enviados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
