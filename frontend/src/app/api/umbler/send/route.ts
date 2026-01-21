import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/umbler/send
 * Envia mensagem via Umbler (single ou bulk)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id, mode, to_phone, message, destinatarios, template_mensagem, variaveis, campanha_id, delay_ms } = body;

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 });
    }

    if (!mode || !['single', 'bulk'].includes(mode)) {
      return NextResponse.json({ error: 'mode deve ser "single" ou "bulk"' }, { status: 400 });
    }

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('umbler_config')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .eq('ativo', true)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Umbler não configurado para este bar' },
        { status: 400 }
      );
    }

    // ========================================
    // MODO SINGLE
    // ========================================
    if (mode === 'single') {
      if (!to_phone || !message) {
        return NextResponse.json(
          { error: 'to_phone e message são obrigatórios para modo single' },
          { status: 400 }
        );
      }

      const result = await sendUmblerMessage(config, to_phone, message);

      // Salvar mensagem no banco
      if (result.success) {
        await supabase
          .from('umbler_mensagens')
          .insert({
            id: result.messageId || `single_${Date.now()}`,
            bar_id: parseInt(bar_id),
            channel_id: config.channel_id,
            direcao: 'saida',
            tipo_remetente: 'campanha',
            contato_telefone: normalizePhone(to_phone),
            tipo_mensagem: 'text',
            conteudo: message,
            status: 'enviada',
            enviada_em: new Date().toISOString()
          });
      }

      return NextResponse.json(result);
    }

    // ========================================
    // MODO BULK
    // ========================================
    if (mode === 'bulk') {
      if (!destinatarios || destinatarios.length === 0) {
        return NextResponse.json(
          { error: 'destinatarios é obrigatório para modo bulk' },
          { status: 400 }
        );
      }

      if (!template_mensagem) {
        return NextResponse.json(
          { error: 'template_mensagem é obrigatório para modo bulk' },
          { status: 400 }
        );
      }

      // Se tem campanha_id, atualizar status
      if (campanha_id) {
        await supabase
          .from('umbler_campanhas')
          .update({
            status: 'em_execucao',
            iniciado_em: new Date().toISOString()
          })
          .eq('id', campanha_id);
      }

      const results = {
        total: destinatarios.length,
        enviados: 0,
        erros: 0,
        detalhes: [] as Array<{
          telefone: string;
          success: boolean;
          messageId?: string;
          error?: string;
        }>
      };

      const delayMs = delay_ms || 1000;

      for (let i = 0; i < destinatarios.length; i++) {
        const dest = destinatarios[i];
        const telefoneNormalizado = normalizePhone(dest.telefone);

        // Substituir variáveis na mensagem
        let mensagemFinal = template_mensagem;
        const primeiroNome = dest.nome?.split(' ')[0] || 'Cliente';

        mensagemFinal = mensagemFinal.replace(/\{nome\}/gi, primeiroNome);
        mensagemFinal = mensagemFinal.replace(/\{telefone\}/gi, dest.telefone);

        if (variaveis) {
          for (const [key, value] of Object.entries(variaveis)) {
            mensagemFinal = mensagemFinal.replace(new RegExp(`\\{${key}\\}`, 'gi'), String(value));
          }
        }

        try {
          const result = await sendUmblerMessage(config, telefoneNormalizado, mensagemFinal);

          results.detalhes.push({
            telefone: dest.telefone,
            success: result.success,
            messageId: result.messageId,
            error: result.error
          });

          if (result.success) {
            results.enviados++;

            // Salvar mensagem
            await supabase
              .from('umbler_mensagens')
              .insert({
                id: result.messageId || `bulk_${Date.now()}_${i}`,
                bar_id: parseInt(bar_id),
                channel_id: config.channel_id,
                direcao: 'saida',
                tipo_remetente: 'campanha',
                contato_telefone: telefoneNormalizado,
                contato_nome: dest.nome,
                tipo_mensagem: 'text',
                conteudo: mensagemFinal,
                status: 'enviada',
                campanha_id: campanha_id,
                enviada_em: new Date().toISOString()
              });

            // Atualizar destinatário da campanha
            if (campanha_id) {
              await supabase
                .from('umbler_campanha_destinatarios')
                .update({
                  status: 'enviado',
                  mensagem_id: result.messageId,
                  enviado_em: new Date().toISOString()
                })
                .eq('campanha_id', campanha_id)
                .eq('telefone', telefoneNormalizado);
            }
          } else {
            results.erros++;

            if (campanha_id) {
              await supabase
                .from('umbler_campanha_destinatarios')
                .update({
                  status: 'erro',
                  erro_mensagem: result.error
                })
                .eq('campanha_id', campanha_id)
                .eq('telefone', telefoneNormalizado);
            }
          }

          // Rate limiting
          if (i < destinatarios.length - 1 && delayMs > 0) {
            await delay(delayMs);
          }

          // Atualizar progresso a cada 10 mensagens
          if ((i + 1) % 10 === 0 && campanha_id) {
            await supabase
              .from('umbler_campanhas')
              .update({
                enviados: results.enviados,
                erros: results.erros
              })
              .eq('id', campanha_id);
          }

        } catch (error) {
          results.erros++;
          results.detalhes.push({
            telefone: dest.telefone,
            success: false,
            error: String(error)
          });
        }
      }

      // Atualizar campanha com totais finais
      if (campanha_id) {
        await supabase
          .from('umbler_campanhas')
          .update({
            status: 'concluida',
            enviados: results.enviados,
            erros: results.erros,
            finalizado_em: new Date().toISOString()
          })
          .eq('id', campanha_id);
      }

      return NextResponse.json({
        success: true,
        ...results
      });
    }

    return NextResponse.json({ error: 'Modo inválido' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API Umbler Send:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

interface UmblerConfig {
  api_token: string;
  organization_id: string;
  phone_number: string;
  channel_id: string;
}

async function sendUmblerMessage(
  config: UmblerConfig,
  toPhone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://app-utalk.umbler.com/api/v1/messages/simplified/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ToPhone: normalizePhone(toPhone),
        FromPhone: normalizePhone(config.phone_number),
        OrganizationId: config.organization_id,
        Message: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Umbler API:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.id || data.messageId || data.Id
    };

  } catch (error) {
    console.error('Erro ao enviar mensagem Umbler:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  let normalized = phone.replace(/\D/g, '');
  if (normalized.length === 11) {
    normalized = '55' + normalized;
  } else if (normalized.length === 10) {
    normalized = '55' + normalized;
  }
  return normalized;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
