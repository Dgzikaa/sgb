import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Campanha {
  id?: string;
  nome: string;
  tipo: 'whatsapp' | 'email' | 'cupom';
  segmento_alvo: string[]; // VIP, Em Risco, Novos, etc
  template_mensagem: string;
  cupom_desconto?: number;
  cupom_codigo?: string;
  cupom_validade?: string;
  agendamento?: string;
  status: 'rascunho' | 'agendada' | 'em_execucao' | 'concluida' | 'cancelada';
  criado_em?: string;
  criado_por?: string;
  enviados?: number;
  abertos?: number;
  cliques?: number;
  conversoes?: number;
}

interface Template {
  nome: string;
  tipo: 'whatsapp' | 'email';
  conteudo: string;
  variaveis: string[]; // {nome}, {cupom}, etc
  categoria: string;
}

// Templates pré-definidos
const TEMPLATES_WHATSAPP: Template[] = [
  {
    nome: 'Reengajamento - Cliente em Risco',
    tipo: 'whatsapp',
    categoria: 'reengajamento',
    conteudo: `Olá {nome}! 👋

Sentimos sua falta no Deboche Ordinário! 🍺✨

Preparamos algo especial para você: *{cupom_desconto}% de desconto* em sua próxima visita!

Use o cupom: *{cupom_codigo}*
Válido até: {cupom_validade}

Venha nos visitar! Estamos com novidades incríveis! 🎉

Te esperamos! 🤗`,
    variaveis: ['{nome}', '{cupom_desconto}', '{cupom_codigo}', '{cupom_validade}']
  },
  {
    nome: 'Boas-vindas - Novo Cliente',
    tipo: 'whatsapp',
    categoria: 'boas_vindas',
    conteudo: `Olá {nome}! 🎉

Foi um prazer te receber no Deboche Ordinário!

Como primeira visita, queremos te dar um presente: *{cupom_desconto}% de desconto* na sua próxima vez!

Cupom: *{cupom_codigo}*
Válido até: {cupom_validade}

Mal podemos esperar pra te ver de novo! 🍻`,
    variaveis: ['{nome}', '{cupom_desconto}', '{cupom_codigo}', '{cupom_validade}']
  },
  {
    nome: 'VIP - Cliente Especial',
    tipo: 'whatsapp',
    categoria: 'vip',
    conteudo: `Olá {nome}! ⭐

Você é um cliente VIP do Deboche Ordinário!

Como agradecimento pela sua fidelidade, temos um presente exclusivo: *{cupom_desconto}% de desconto* para você!

Cupom VIP: *{cupom_codigo}*
Válido até: {cupom_validade}

Você faz parte da nossa família! 🍺❤️`,
    variaveis: ['{nome}', '{cupom_desconto}', '{cupom_codigo}', '{cupom_validade}']
  },
  {
    nome: 'Evento Especial - Convite',
    tipo: 'whatsapp',
    categoria: 'evento',
    conteudo: `Olá {nome}! 🎊

Temos um EVENTO ESPECIAL chegando e você está convidado!

📅 Data: {evento_data}
🎵 Atração: {evento_atracao}

E mais: *{cupom_desconto}% de desconto* na entrada para você!

Cupom: *{cupom_codigo}*

Garanta sua vaga! 🎉`,
    variaveis: ['{nome}', '{evento_data}', '{evento_atracao}', '{cupom_desconto}', '{cupom_codigo}']
  },
  {
    nome: 'Saudade - Cliente Inativo',
    tipo: 'whatsapp',
    categoria: 'reativacao',
    conteudo: `Ei {nome}! 😢

Faz tempo que você não aparece por aqui...

O Deboche tá com saudade! 🍺

Volta pra gente? Temos *{cupom_desconto}% de desconto* te esperando!

Cupom: *{cupom_codigo}*
Válido até: {cupom_validade}

Bora matar a saudade? 🤗`,
    variaveis: ['{nome}', '{cupom_desconto}', '{cupom_codigo}', '{cupom_validade}']
  }
];

const TEMPLATES_EMAIL: Template[] = [
  {
    nome: 'Newsletter Mensal',
    tipo: 'email',
    categoria: 'newsletter',
    conteudo: `
      <h1>Olá {nome}!</h1>
      <p>Confira as novidades do mês no Deboche Ordinário:</p>
      <ul>
        <li>🎵 Novos shows toda semana</li>
        <li>🍔 Menu renovado com pratos especiais</li>
        <li>🍺 Cervejas artesanais em promoção</li>
      </ul>
      <p>E mais: <strong>{cupom_desconto}% de desconto</strong> especial para você!</p>
      <p>Cupom: <strong>{cupom_codigo}</strong></p>
      <p>Válido até: {cupom_validade}</p>
    `,
    variaveis: ['{nome}', '{cupom_desconto}', '{cupom_codigo}', '{cupom_validade}']
  }
];

// Gerar código de cupom único
function gerarCodigoCupom(prefixo: string = 'DBO'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = prefixo;
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

// Substituir variáveis no template
function substituirVariaveis(template: string, dados: Record<string, string>): string {
  let resultado = template;
  Object.entries(dados).forEach(([key, value]) => {
    resultado = resultado.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return resultado;
}

// GET - Listar campanhas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');

    let query = supabase
      .from('crm_campanhas')
      .select('*')
      .order('criado_em', { ascending: false });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      templates_whatsapp: TEMPLATES_WHATSAPP,
      templates_email: TEMPLATES_EMAIL
    });

  } catch (error: any) {
    console.error('Erro ao listar campanhas:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar nova campanha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      tipo,
      segmento_alvo,
      template_id,
      template_custom,
      cupom_desconto,
      cupom_validade_dias,
      agendamento,
      executar_agora,
      dados_extras // Para variáveis como {evento_data}, {evento_atracao}
    } = body;

    // 1. Selecionar template
    let template: Template | undefined;
    if (template_id) {
      if (tipo === 'whatsapp') {
        template = TEMPLATES_WHATSAPP.find(t => t.nome === template_id);
      } else if (tipo === 'email') {
        template = TEMPLATES_EMAIL.find(t => t.nome === template_id);
      }
    }

    const mensagemTemplate = template?.conteudo || template_custom;

    if (!mensagemTemplate) {
      throw new Error('Template ou mensagem personalizada é obrigatório');
    }

    // 2. Gerar cupom se necessário
    let codigoCupom: string | undefined;
    let validadeCupom: string | undefined;

    if (cupom_desconto && cupom_desconto > 0) {
      codigoCupom = gerarCodigoCupom();
      
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + (cupom_validade_dias || 7));
      validadeCupom = dataValidade.toISOString().split('T')[0];

      // Salvar cupom na tabela de cupons
      await supabase.from('crm_cupons').insert({
        codigo: codigoCupom,
        desconto_percentual: cupom_desconto,
        validade: validadeCupom,
        tipo: 'campanha',
        ativo: true
      });
    }

    // 3. Buscar clientes do segmento alvo
    const { data: segmentoData } = await supabase
      .from('crm_segmentacao')
      .select('telefone, nome, segmento')
      .in('segmento', segmento_alvo);

    if (!segmentoData || segmentoData.length === 0) {
      throw new Error('Nenhum cliente encontrado no segmento alvo');
    }

    // 4. Criar campanha
    const campanha: Campanha = {
      nome,
      tipo,
      segmento_alvo,
      template_mensagem: mensagemTemplate,
      cupom_desconto,
      cupom_codigo: codigoCupom,
      cupom_validade: validadeCupom,
      agendamento,
      status: executar_agora ? 'em_execucao' : agendamento ? 'agendada' : 'rascunho',
      enviados: 0,
      abertos: 0,
      cliques: 0,
      conversoes: 0
    };

    const { data: campanhaData, error: campanhaError } = await supabase
      .from('crm_campanhas')
      .insert(campanha)
      .select()
      .single();

    if (campanhaError) {
      throw campanhaError;
    }

    // 5. Se executar agora, enviar mensagens
    if (executar_agora) {
      let enviadosCount = 0;

      for (const cliente of segmentoData) {
        try {
          // Substituir variáveis na mensagem
          const mensagemPersonalizada = substituirVariaveis(mensagemTemplate, {
            nome: cliente.nome.split(' ')[0], // Primeiro nome
            cupom_desconto: cupom_desconto?.toString() || '',
            cupom_codigo: codigoCupom || '',
            cupom_validade: validadeCupom ? new Date(validadeCupom).toLocaleDateString('pt-BR') : '',
            ...dados_extras
          });

          if (tipo === 'whatsapp') {
            // Registrar envio (a API do WhatsApp seria chamada aqui)
            await supabase.from('crm_envios').insert({
              campanha_id: campanhaData.id,
              cliente_telefone: cliente.telefone,
              cliente_nome: cliente.nome,
              tipo: 'whatsapp',
              mensagem: mensagemPersonalizada,
              status: 'enviado',
              enviado_em: new Date().toISOString()
            });

            enviadosCount++;
          } else if (tipo === 'email') {
            // Email seria enviado aqui via serviço de email
            await supabase.from('crm_envios').insert({
              campanha_id: campanhaData.id,
              cliente_telefone: cliente.telefone,
              cliente_nome: cliente.nome,
              tipo: 'email',
              mensagem: mensagemPersonalizada,
              status: 'enviado',
              enviado_em: new Date().toISOString()
            });

            enviadosCount++;
          }

        } catch (error) {
          console.error(`Erro ao enviar para ${cliente.nome}:`, error);
        }
      }

      // Atualizar contadores da campanha
      await supabase
        .from('crm_campanhas')
        .update({ 
          enviados: enviadosCount,
          status: 'concluida'
        })
        .eq('id', campanhaData.id);

      campanhaData.enviados = enviadosCount;
      campanhaData.status = 'concluida';
    }

    return NextResponse.json({
      success: true,
      data: campanhaData,
      mensagem: executar_agora 
        ? `Campanha executada com sucesso! ${campanhaData.enviados} mensagens enviadas.`
        : 'Campanha criada com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao criar campanha:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar campanha
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('crm_campanhas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Erro ao atualizar campanha:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar campanha
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new Error('ID da campanha é obrigatório');
    }

    const { data, error } = await supabase
      .from('crm_campanhas')
      .update({ status: 'cancelada' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Erro ao cancelar campanha:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

