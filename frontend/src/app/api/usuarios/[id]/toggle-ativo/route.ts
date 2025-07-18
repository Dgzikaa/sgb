import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tipos auxiliares para usuÃÂ¡rio WhatsApp
interface UsuarioWhatsapp {
  id: string;
  nome: string;
  email: string;
  celular?: string;
  ativo: boolean;
  cargo?: string;
  departamento?: string;
  whatsapp?: string;
  whatsapp_valido?: boolean;
}

// GET - Listar funcionÃÂ¡ÃÂ¡rios com WhatsApp cadastrado
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const barId = searchParams.get('bar_id')
    const includeWithout = searchParams.get('include_without') === 'true'

    let query = supabase
      .from('usuarios_bar')
      .select('id, nome, email, celular, ativo, cargo, departamento')
      .eq('ativo', true)

    if (barId) {
      query = query.eq('bar_id', barId)
    }

    const { data: usuarios, error } = await query

    if (error) {
      console.error('Erro ao buscar usuÃÂ¡ÃÂ¡rios:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar usuÃÂ¡ÃÂ¡rios' },
        { status: 500 }
      )
    }

    // Filtrar e categorizar usuÃÂ¡ÃÂ¡rios
    const usuariosComWhatsApp = (usuarios as UsuarioWhatsapp[] | undefined)?.filter((u: UsuarioWhatsapp) =>
      u.whatsapp &&
      typeof u.whatsapp === 'string' &&
      u.whatsapp.replace(/\D/g, '').length >= 10
    ) || [];

    const usuariosSemWhatsApp = (usuarios as UsuarioWhatsapp[] | undefined)?.filter((u: UsuarioWhatsapp) =>
      !u.whatsapp ||
      typeof u.whatsapp !== 'string' ||
      u.whatsapp.replace(/\D/g, '').length < 10
    ) || [];

    // Validar nÃÂ¡ÃÂºmeros de WhatsApp
    const usuariosValidados = usuariosComWhatsApp.map((usuario: UsuarioWhatsapp) => ({
      ...usuario,
      whatsapp_valido: usuario.whatsapp && usuario.whatsapp.replace(/\D/g, '').length >= 10
    }));

    const response: unknown = {
      success: true,
      com_whatsapp: usuariosValidados,
      total_com_whatsapp: usuariosValidados.length,
      total_whatsapp_valido: usuariosValidados.filter((u) => u.whatsapp_valido).length
    };

    if (includeWithout) {
      response.sem_whatsapp = usuariosSemWhatsApp
      response.total_sem_whatsapp = usuariosSemWhatsApp.length
    }

    response.total_usuarios = usuarios?.length || 0

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao buscar usuÃÂ¡ÃÂ¡rios com WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}

// POST - Atualizar mÃÂ¡ÃÂºltiplos usuÃÂ¡ÃÂ¡rios (para operaÃÂ¡ÃÂ§ÃÂ¡ÃÂµes em lote)
export async function POST(req: NextRequest) {
  try {
    const { operacao, usuarios } = await req.json()

    if (operacao === 'validar_whatsapp') {
      // Validar nÃÂ¡ÃÂºmeros WhatsApp em lote
      const resultados = []

      for (const usuario of usuarios as UsuarioWhatsapp[]) {
        const numero = usuario.celular?.replace(/\D/g, '');
        if (!numero || numero.length !== 11) {
          resultados.push({
            id: usuario.id,
            valido: false,
            erro: 'NÃÂ¡ÃÂºmero invÃÂ¡ÃÂ¡lido'
          });
          continue;
        }
        try {
          // Aqui vocÃÂ¡ÃÂª poderia fazer uma validaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o real via API
          // Por enquanto, apenas validaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o de formato
          const isValid = parseInt(numero.substring(0, 2)) >= 11 && 
                         parseInt(numero.substring(0, 2)) <= 99 &&
                         numero[2] === '9';
          resultados.push({
            id: usuario.id,
            valido: isValid,
            numero: numero
          });
        } catch (error) {
          resultados.push({
            id: usuario.id,
            valido: false,
            erro: 'Erro na validaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o'
          });
        }
      }

      return NextResponse.json({
        success: true,
        resultados
      })
    }

    return NextResponse.json(
      { success: false, error: 'OperaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o nÃÂ¡ÃÂ£o suportada' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro na operaÃÂ¡ÃÂ§ÃÂ¡ÃÂ£o em lote:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
} 
