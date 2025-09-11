export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bars: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cnpj: string | null
          config: Json | null
          criado_em: string | null
          endereco: string | null
          id: number
          metas: Json | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cnpj?: string | null
          config?: Json | null
          criado_em?: string | null
          endereco?: string | null
          id?: number
          metas?: Json | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cnpj?: string | null
          config?: Json | null
          criado_em?: string | null
          endereco?: string | null
          id?: number
          metas?: Json | null
          nome?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          alert_id: string | null
          checklist_id: string | null
          delivered_at: string | null
          execution_id: string | null
          id: string
          message: string
          provider: string
          provider_response: Json | null
          read_at: string | null
          sent_at: string | null
          status: string | null
          to_number: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          alert_id?: string | null
          checklist_id?: string | null
          delivered_at?: string | null
          execution_id?: string | null
          id?: string
          message: string
          provider: string
          provider_response?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          to_number: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          alert_id?: string | null
          checklist_id?: string | null
          delivered_at?: string | null
          execution_id?: string | null
          id?: string
          message?: string
          provider?: string
          provider_response?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contahub_analitico: {
        Row: {
          ano: number | null
          bar_id: number | null
          comandaorigem: string | null
          created_at: string | null
          custo: number | null
          desconto: number | null
          grp_desc: string | null
          id: number
          itemorigem: string | null
          itm: number | null
          itm_obs: string | null
          loc_desc: string | null
          mes: number | null
          prd: string | null
          prd_desc: string | null
          prefixo: string | null
          qtd: number | null
          tipo: string | null
          tipovenda: string | null
          trn: number | null
          trn_desc: string | null
          trn_dtgerencial: string | null
          updated_at: string | null
          usr_lancou: string | null
          valorfinal: number | null
          vd_localizacao: string | null
          vd_mesadesc: string | null
          itm_valorfinal: number | null
          itm_qtd: number | null
        }
        Insert: {
          ano?: number | null
          bar_id?: number | null
          comandaorigem?: string | null
          created_at?: string | null
          custo?: number | null
          desconto?: number | null
          grp_desc?: string | null
          id?: number
          itemorigem?: string | null
          itm?: number | null
          itm_obs?: string | null
          loc_desc?: string | null
          mes?: number | null
          prd?: string | null
          prd_desc?: string | null
          prefixo?: string | null
          qtd?: number | null
          tipo?: string | null
          tipovenda?: string | null
          trn?: number | null
          trn_desc?: string | null
          trn_dtgerencial?: string | null
          updated_at?: string | null
          usr_lancou?: string | null
          valorfinal?: number | null
          vd_localizacao?: string | null
          vd_mesadesc?: string | null
          itm_valorfinal?: number | null
          itm_qtd?: number | null
        }
        Update: {
          ano?: number | null
          bar_id?: number | null
          comandaorigem?: string | null
          created_at?: string | null
          custo?: number | null
          desconto?: number | null
          grp_desc?: string | null
          id?: number
          itemorigem?: string | null
          itm?: number | null
          itm_obs?: string | null
          loc_desc?: string | null
          mes?: number | null
          prd?: string | null
          prd_desc?: string | null
          prefixo?: string | null
          qtd?: number | null
          tipo?: string | null
          tipovenda?: string | null
          trn?: number | null
          trn_desc?: string | null
          trn_dtgerencial?: string | null
          updated_at?: string | null
          usr_lancou?: string | null
          valorfinal?: number | null
          vd_localizacao?: string | null
          vd_mesadesc?: string | null
          itm_valorfinal?: number | null
          itm_qtd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contahub_analitico_bar_id"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      contahub_periodo: {
        Row: {
          bar_id: number | null
          cht_nome: string | null
          cli_dtnasc: string | null
          cli_email: string | null
          cli_fone: string | null
          cli_nome: string | null
          created_at: string | null
          dt_contabil: string | null
          dt_gerencial: string | null
          id: number
          motivo: string | null
          pessoas: number | null
          qtd_itens: number | null
          semana: number | null
          tipovenda: string | null
          ultimo_pedido: string | null
          updated_at: string | null
          usr_abriu: string | null
          vd_dtcontabil: string | null
          vd_localizacao: string | null
          vd_mesadesc: string | null
          vr_couvert: number | null
          vr_desconto: number | null
          vr_pagamentos: number | null
          vr_produtos: number | null
          vr_repique: number | null
          vr_taxa: number | null
          vr_acrescimo: number | null
          vr_total: number | null
        }
        Insert: {
          bar_id?: number | null
          cht_nome?: string | null
          cli_dtnasc?: string | null
          cli_email?: string | null
          cli_fone?: string | null
          cli_nome?: string | null
          created_at?: string | null
          dt_contabil?: string | null
          dt_gerencial?: string | null
          id?: number
          motivo?: string | null
          pessoas?: number | null
          qtd_itens?: number | null
          semana?: number | null
          tipovenda?: string | null
          ultimo_pedido?: string | null
          updated_at?: string | null
          usr_abriu?: string | null
          vd_dtcontabil?: string | null
          vd_localizacao?: string | null
          vd_mesadesc?: string | null
          vr_couvert?: number | null
          vr_desconto?: number | null
          vr_pagamentos?: number | null
          vr_produtos?: number | null
          vr_repique?: number | null
          vr_taxa?: number | null
          vr_acrescimo?: number | null
          vr_total?: number | null
        }
        Update: {
          bar_id?: number | null
          cht_nome?: string | null
          cli_dtnasc?: string | null
          cli_email?: string | null
          cli_fone?: string | null
          cli_nome?: string | null
          created_at?: string | null
          dt_contabil?: string | null
          dt_gerencial?: string | null
          id?: number
          motivo?: string | null
          pessoas?: number | null
          qtd_itens?: number | null
          semana?: number | null
          tipovenda?: string | null
          ultimo_pedido?: string | null
          updated_at?: string | null
          usr_abriu?: string | null
          vd_dtcontabil?: string | null
          vd_localizacao?: string | null
          vd_mesadesc?: string | null
          vr_couvert?: number | null
          vr_desconto?: number | null
          vr_pagamentos?: number | null
          vr_produtos?: number | null
          vr_repique?: number | null
          vr_taxa?: number | null
          vr_acrescimo?: number | null
          vr_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contahub_periodo_bar_id"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      contahub_tempo: {
        Row: {
          ano: number | null
          bar_id: number | null
          categoria: string | null
          created_at: string | null
          data: string | null
          dds: number | null
          dia: string | null
          diadasemana: string | null
          grp_desc: string | null
          hora: string | null
          id: number
          itm: string | null
          itm_qtd: number | null
          loc_desc: string | null
          mes: number | null
          prd: number | null
          prd_desc: string | null
          prd_idexterno: string | null
          prefixo: string | null
          t0_lancamento: string | null
          t0_t1: number | null
          t0_t2: number | null
          t0_t3: number | null
          t1_prodini: string | null
          t1_t2: number | null
          t1_t3: number | null
          t2_prodfim: string | null
          t2_t3: number | null
          t3_entrega: string | null
          tipovenda: string | null
          updated_at: string | null
          usr_abriu: string | null
          usr_entregou: string | null
          usr_lancou: string | null
          usr_produziu: string | null
          usr_transfcancelou: string | null
          vd_localizacao: string | null
          vd_mesadesc: string | null
        }
        Insert: {
          ano?: number | null
          bar_id?: number | null
          categoria?: string | null
          created_at?: string | null
          data?: string | null
          dds?: number | null
          dia?: string | null
          diadasemana?: string | null
          grp_desc?: string | null
          hora?: string | null
          id?: number
          itm?: string | null
          itm_qtd?: number | null
          loc_desc?: string | null
          mes?: number | null
          prd?: number | null
          prd_desc?: string | null
          prd_idexterno?: string | null
          prefixo?: string | null
          t0_lancamento?: string | null
          t0_t1?: number | null
          t0_t2?: number | null
          t0_t3?: number | null
          t1_prodini?: string | null
          t1_t2?: number | null
          t1_t3?: number | null
          t2_prodfim?: string | null
          t2_t3?: number | null
          t3_entrega?: string | null
          tipovenda?: string | null
          updated_at?: string | null
          usr_abriu?: string | null
          usr_entregou?: string | null
          usr_lancou?: string | null
          usr_produziu?: string | null
          usr_transfcancelou?: string | null
          vd_localizacao?: string | null
          vd_mesadesc?: string | null
        }
        Update: {
          ano?: number | null
          bar_id?: number | null
          categoria?: string | null
          created_at?: string | null
          data?: string | null
          dds?: number | null
          dia?: string | null
          diadasemana?: string | null
          grp_desc?: string | null
          hora?: string | null
          id?: number
          itm?: string | null
          itm_qtd?: number | null
          loc_desc?: string | null
          mes?: number | null
          prd?: number | null
          prd_desc?: string | null
          prd_idexterno?: string | null
          prefixo?: string | null
          t0_lancamento?: string | null
          t0_t1?: number | null
          t0_t2?: number | null
          t0_t3?: number | null
          t1_prodini?: string | null
          t1_t2?: number | null
          t1_t3?: number | null
          t2_prodfim?: string | null
          t2_t3?: number | null
          t3_entrega?: string | null
          tipovenda?: string | null
          updated_at?: string | null
          usr_abriu?: string | null
          usr_entregou?: string | null
          usr_lancou?: string | null
          usr_produziu?: string | null
          usr_transfcancelou?: string | null
          vd_localizacao?: string | null
          vd_mesadesc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contahub_tempo_bar_id"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      contahub_pagamentos: {
        Row: {
          autorizacao: string | null
          bar_id: number | null
          cartao: string | null
          cli: number | null
          cliente: string | null
          created_at: string | null
          dt_credito: string | null
          dt_gerencial: string | null
          dt_transacao: string | null
          hr_lancamento: string | null
          hr_transacao: string | null
          id: number
          liquido: number | null
          meio: string | null
          mesa: string | null
          motivodesconto: string | null
          pag: string | null
          perc: number | null
          taxa: number | null
          tipo: string | null
          trn: string | null
          updated_at: string | null
          usr_abriu: string | null
          usr_aceitou: string | null
          usr_lancou: string | null
          valor: number | null
          vd: string | null
          vr_pagamentos: number | null
        }
        Insert: {
          autorizacao?: string | null
          bar_id?: number | null
          cartao?: string | null
          cli?: number | null
          cliente?: string | null
          created_at?: string | null
          dt_credito?: string | null
          dt_gerencial?: string | null
          dt_transacao?: string | null
          hr_lancamento?: string | null
          hr_transacao?: string | null
          id?: number
          liquido?: number | null
          meio?: string | null
          mesa?: string | null
          motivodesconto?: string | null
          pag?: string | null
          perc?: number | null
          taxa?: number | null
          tipo?: string | null
          trn?: string | null
          updated_at?: string | null
          usr_abriu?: string | null
          usr_aceitou?: string | null
          usr_lancou?: string | null
          valor?: number | null
          vd?: string | null
          vr_pagamentos?: number | null
        }
        Update: {
          autorizacao?: string | null
          bar_id?: number | null
          cartao?: string | null
          cli?: number | null
          cliente?: string | null
          created_at?: string | null
          dt_credito?: string | null
          dt_gerencial?: string | null
          dt_transacao?: string | null
          hr_lancamento?: string | null
          hr_transacao?: string | null
          id?: number
          liquido?: number | null
          meio?: string | null
          mesa?: string | null
          motivodesconto?: string | null
          pag?: string | null
          perc?: number | null
          taxa?: number | null
          tipo?: string | null
          trn?: string | null
          updated_at?: string | null
          usr_abriu?: string | null
          usr_aceitou?: string | null
          usr_lancou?: string | null
          valor?: number | null
          vd?: string | null
          vr_pagamentos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contahub_pagamentos_bar_id"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      contahub_fatporhora: {
        Row: {
          bar_id: number | null
          created_at: string | null
          dds: number | null
          dia: string | null
          hora: number | null
          id: number
          qtd: number | null
          updated_at: string | null
          valor: number | null
          vd_dtgerencial: string | null
        }
        Insert: {
          bar_id?: number | null
          created_at?: string | null
          dds?: number | null
          dia?: string | null
          hora?: number | null
          id?: number
          qtd?: number | null
          updated_at?: string | null
          valor?: number | null
          vd_dtgerencial?: string | null
        }
        Update: {
          bar_id?: number | null
          created_at?: string | null
          dds?: number | null
          dia?: string | null
          hora?: number | null
          id?: number
          qtd?: number | null
          updated_at?: string | null
          valor?: number | null
          vd_dtgerencial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contahub_fatporhora_bar_id"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      sympla_bilheteria: {
        Row: {
          id: number
          bar_id: number | null
          data_evento: string | null
          total_liquido: number | null
          qtd_checkins_realizados: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data_evento?: string | null
          total_liquido?: number | null
          qtd_checkins_realizados?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data_evento?: string | null
          total_liquido?: number | null
          qtd_checkins_realizados?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      eventos_base: {
        Row: {
          artista: string | null
          ativo: boolean | null
          atualizado_em: string | null
          bar_id: number
          c_art: number | null
          c_artistico_plan: number | null
          c_prod: number | null
          calculado_em: string | null
          cl_plan: number | null
          cl_real: number | null
          criado_em: string | null
          data_evento: string
          dia_semana: string | null
          fat_19h: number | null
          fat_19h_percent: number | null
          faturamento_bar: number | null
          faturamento_bar_manual: number | null
          faturamento_couvert: number | null
          faturamento_couvert_manual: number | null
          genero: string | null
          id: number
          lot_max: number | null
          m1_r: number | null
          nome: string
          observacoes: string | null
          percent_art_fat: number | null
          percent_b: number | null
          percent_c: number | null
          percent_d: number | null
          precisa_recalculo: boolean | null
          real_r: number | null
          res_p: number | null
          res_tot: number | null
          semana: number | null
          sympla_checkins: number | null
          sympla_liquido: number | null
          t_bar: number | null
          t_coz: number | null
          t_medio: number | null
          tb_plan: number | null
          tb_real: number | null
          tb_real_calculado: number | null
          te_plan: number | null
          te_real: number | null
          te_real_calculado: number | null
          versao_calculo: number | null
          yuzer_ingressos: number | null
          yuzer_liquido: number | null
        }
        Insert: {
          artista?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id: number
          c_art?: number | null
          c_artistico_plan?: number | null
          c_prod?: number | null
          calculado_em?: string | null
          cl_plan?: number | null
          cl_real?: number | null
          criado_em?: string | null
          data_evento: string
          dia_semana?: string | null
          fat_19h?: number | null
          fat_19h_percent?: number | null
          faturamento_bar?: number | null
          faturamento_bar_manual?: number | null
          faturamento_couvert?: number | null
          faturamento_couvert_manual?: number | null
          genero?: string | null
          id?: number
          lot_max?: number | null
          m1_r?: number | null
          nome: string
          observacoes?: string | null
          percent_art_fat?: number | null
          percent_b?: number | null
          percent_c?: number | null
          percent_d?: number | null
          precisa_recalculo?: boolean | null
          real_r?: number | null
          res_p?: number | null
          res_tot?: number | null
          semana?: number | null
          sympla_checkins?: number | null
          sympla_liquido?: number | null
          t_bar?: number | null
          t_coz?: number | null
          t_medio?: number | null
          tb_plan?: number | null
          tb_real?: number | null
          tb_real_calculado?: number | null
          te_plan?: number | null
          te_real?: number | null
          te_real_calculado?: number | null
          versao_calculo?: number | null
          yuzer_ingressos?: number | null
          yuzer_liquido?: number | null
        }
        Update: {
          artista?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id?: number
          c_art?: number | null
          c_artistico_plan?: number | null
          c_prod?: number | null
          calculado_em?: string | null
          cl_plan?: number | null
          cl_real?: number | null
          criado_em?: string | null
          data_evento?: string
          dia_semana?: string | null
          fat_19h?: number | null
          fat_19h_percent?: number | null
          faturamento_bar?: number | null
          faturamento_bar_manual?: number | null
          faturamento_couvert?: number | null
          faturamento_couvert_manual?: number | null
          genero?: string | null
          id?: number
          lot_max?: number | null
          m1_r?: number | null
          nome?: string
          observacoes?: string | null
          percent_art_fat?: number | null
          percent_b?: number | null
          percent_c?: number | null
          percent_d?: number | null
          precisa_recalculo?: boolean | null
          real_r?: number | null
          res_p?: number | null
          res_tot?: number | null
          semana?: number | null
          sympla_checkins?: number | null
          sympla_liquido?: number | null
          t_bar?: number | null
          t_coz?: number | null
          t_medio?: number | null
          tb_plan?: number | null
          tb_real?: number | null
          tb_real_calculado?: number | null
          te_plan?: number | null
          te_real?: number | null
          te_real_calculado?: number | null
          versao_calculo?: number | null
          yuzer_ingressos?: number | null
          yuzer_liquido?: number | null
        }
        Relationships: []
      }
      usuarios_bar: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          bar_id: number | null
          bio: string | null
          biometric_credentials: Json | null
          celular: string | null
          cep: string | null
          cidade: string | null
          conta_verificada: boolean | null
          cpf: string | null
          criado_em: string | null
          data_nascimento: string | null
          email: string
          endereco: string | null
          estado: string | null
          foto_perfil: string | null
          id: number
          modulos_permitidos: Json | null
          nome: string | null
          observacoes: string | null
          preferencias: Json | null
          role: string | null
          senha_redefinida: boolean | null
          telefone: string | null
          ultima_atividade: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id?: number | null
          bio?: string | null
          biometric_credentials?: Json | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          conta_verificada?: boolean | null
          cpf?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          estado?: string | null
          foto_perfil?: string | null
          id?: number
          modulos_permitidos?: Json | null
          nome?: string | null
          observacoes?: string | null
          preferencias?: Json | null
          role?: string | null
          senha_redefinida?: boolean | null
          telefone?: string | null
          ultima_atividade?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id?: number | null
          bio?: string | null
          biometric_credentials?: Json | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          conta_verificada?: boolean | null
          cpf?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          estado?: string | null
          foto_perfil?: string | null
          id?: number
          modulos_permitidos?: Json | null
          nome?: string | null
          observacoes?: string | null
          preferencias?: Json | null
          role?: string | null
          senha_redefinida?: boolean | null
          telefone?: string | null
          ultima_atividade?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_bar_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contatos: {
        Row: {
          id: string
          bar_id: number | null
          nome: string | null
          numero: string | null
          numero_whatsapp: string | null
          nome_contato: string | null
          aceita_notificacoes: boolean | null
          aceita_lembretes: boolean | null
          aceita_relatorios: boolean | null
          usuarios_bar: Json | null
          dias_semana: string | null
          horario_inicio: string | null
          horario_fim: string | null
          total_mensagens_enviadas: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          numero?: string | null
          numero_whatsapp?: string | null
          nome_contato?: string | null
          aceita_notificacoes?: boolean | null
          aceita_lembretes?: boolean | null
          aceita_relatorios?: boolean | null
          usuarios_bar?: Json | null
          dias_semana?: string | null
          horario_inicio?: string | null
          horario_fim?: string | null
          total_mensagens_enviadas?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          numero?: string | null
          numero_whatsapp?: string | null
          nome_contato?: string | null
          aceita_notificacoes?: boolean | null
          aceita_lembretes?: boolean | null
          aceita_relatorios?: boolean | null
          usuarios_bar?: Json | null
          dias_semana?: string | null
          horario_inicio?: string | null
          horario_fim?: string | null
          total_mensagens_enviadas?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          id: string
          bar_id: number | null
          nome: string | null
          template: string | null
          name: string | null
          body_text: string | null
          parameters: string | null
          variables_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          template?: string | null
          name?: string | null
          body_text?: string | null
          parameters?: string | null
          variables_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          template?: string | null
          name?: string | null
          body_text?: string | null
          parameters?: string | null
          variables_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_mensagens: {
        Row: {
          id: string
          bar_id: number | null
          numero: string | null
          mensagem: string | null
          status: string | null
          contato_id: string | null
          tipo_mensagem: string | null
          template_name: string | null
          conteudo: string | null
          template_parameters: string | null
          modulo: string | null
          checklist_id: number | null
          checklist_execucao_id: number | null
          destinatario: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bar_id?: number | null
          numero?: string | null
          mensagem?: string | null
          status?: string | null
          contato_id?: string | null
          tipo_mensagem?: string | null
          template_name?: string | null
          conteudo?: string | null
          template_parameters?: string | null
          modulo?: string | null
          checklist_id?: number | null
          checklist_execucao_id?: number | null
          destinatario?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bar_id?: number | null
          numero?: string | null
          mensagem?: string | null
          status?: string | null
          contato_id?: string | null
          tipo_mensagem?: string | null
          template_name?: string | null
          conteudo?: string | null
          template_parameters?: string | null
          modulo?: string | null
          checklist_id?: number | null
          checklist_execucao_id?: number | null
          destinatario?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receitas: {
        Row: {
          id: number
          produto_id: number | null
          insumo_id: number | null
          quantidade: number | null
          receita_codigo: string | null
          receita_nome: string | null
          receita_categoria: string | null
          insumo_chefe_id: number | null
          rendimento_esperado: number | null
          quantidade_necessaria: number | null
          ativo: boolean | null
          tipo_local: string | null
          insumos: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          produto_id?: number | null
          insumo_id?: number | null
          quantidade?: number | null
          receita_codigo?: string | null
          receita_nome?: string | null
          receita_categoria?: string | null
          insumo_chefe_id?: number | null
          rendimento_esperado?: number | null
          quantidade_necessaria?: number | null
          ativo?: boolean | null
          tipo_local?: string | null
          insumos?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          produto_id?: number | null
          insumo_id?: number | null
          quantidade?: number | null
          receita_codigo?: string | null
          receita_nome?: string | null
          receita_categoria?: string | null
          insumo_chefe_id?: number | null
          rendimento_esperado?: number | null
          quantidade_necessaria?: number | null
          ativo?: boolean | null
          tipo_local?: string | null
          insumos?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      producoes: {
        Row: {
          id: number
          bar_id: number | null
          nome: string | null
          receita_codigo: string | null
          receita_nome: string | null
          receita_categoria: string | null
          criado_por_nome: string | null
          data_producao: string | null
          quantidade: number | null
          quantidade_esperada: number | null
          desvio: number | null
          percentual_desvio: number | null
          status: string | null
          observacoes: string | null
          inicio_producao: string | null
          fim_producao: string | null
          peso_bruto_proteina: number | null
          peso_limpo_proteina: number | null
          peso_bruto_carboidrato: number | null
          peso_limpo_carboidrato: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          receita_codigo?: string | null
          receita_nome?: string | null
          receita_categoria?: string | null
          criado_por_nome?: string | null
          data_producao?: string | null
          quantidade?: number | null
          quantidade_esperada?: number | null
          desvio?: number | null
          percentual_desvio?: number | null
          status?: string | null
          observacoes?: string | null
          inicio_producao?: string | null
          fim_producao?: string | null
          peso_bruto_proteina?: number | null
          peso_limpo_proteina?: number | null
          peso_bruto_carboidrato?: number | null
          peso_limpo_carboidrato?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          receita_codigo?: string | null
          receita_nome?: string | null
          receita_categoria?: string | null
          criado_por_nome?: string | null
          data_producao?: string | null
          quantidade?: number | null
          quantidade_esperada?: number | null
          desvio?: number | null
          percentual_desvio?: number | null
          status?: string | null
          observacoes?: string | null
          inicio_producao?: string | null
          fim_producao?: string | null
          peso_bruto_proteina?: number | null
          peso_limpo_proteina?: number | null
          peso_bruto_carboidrato?: number | null
          peso_limpo_carboidrato?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          email: string | null
          nome: string | null
          role: string | null
          nivel_acesso: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          nome?: string | null
          role?: string | null
          nivel_acesso?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          nome?: string | null
          role?: string | null
          nivel_acesso?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analitico: {
        Row: {
          id: number
          bar_id: number | null
          data: string | null
          produto: string | null
          quantidade: number | null
          valor: number | null
          created_at: string | null
          updated_at: string | null
          vd_dtgerencial: string | null
          usr_lancou: string | null
          valorfinal: number | null
          qtd: number | null
          prd_desc: string | null
          grp_desc: string | null
          itm_qtd: number | null
          itm_valorfinal: number | null
          vd_mesadesc: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data?: string | null
          produto?: string | null
          quantidade?: number | null
          valor?: number | null
          created_at?: string | null
          updated_at?: string | null
          vd_dtgerencial?: string | null
          usr_lancou?: string | null
          valorfinal?: number | null
          qtd?: number | null
          prd_desc?: string | null
          grp_desc?: string | null
          itm_qtd?: number | null
          itm_valorfinal?: number | null
          vd_mesadesc?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data?: string | null
          produto?: string | null
          quantidade?: number | null
          valor?: number | null
          created_at?: string | null
          updated_at?: string | null
          vd_dtgerencial?: string | null
          usr_lancou?: string | null
          valorfinal?: number | null
          qtd?: number | null
          prd_desc?: string | null
          grp_desc?: string | null
          itm_qtd?: number | null
          itm_valorfinal?: number | null
          vd_mesadesc?: string | null
        }
        Relationships: []
      }
      tempo: {
        Row: {
          id: number
          bar_id: number | null
          t0_lancamento: string | null
          usr_lancou: string | null
          t1_t2: number | null
          prd_desc: string | null
          vd_mesadesc: string | null
          grp_desc: string | null
          loc_desc: string | null
          t0_t1: number | null
          t0_t2: number | null
          t0_t3: number | null
          t1_prodini: string | null
          t1_t3: number | null
          t2_prodfim: string | null
          t2_t3: number | null
          t3_entrega: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          t0_lancamento?: string | null
          usr_lancou?: string | null
          t1_t2?: number | null
          prd_desc?: string | null
          vd_mesadesc?: string | null
          grp_desc?: string | null
          loc_desc?: string | null
          t0_t1?: number | null
          t0_t2?: number | null
          t0_t3?: number | null
          t1_prodini?: string | null
          t1_t3?: number | null
          t2_prodfim?: string | null
          t2_t3?: number | null
          t3_entrega?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          t0_lancamento?: string | null
          usr_lancou?: string | null
          t1_t2?: number | null
          prd_desc?: string | null
          vd_mesadesc?: string | null
          grp_desc?: string | null
          loc_desc?: string | null
          t0_t1?: number | null
          t0_t2?: number | null
          t0_t3?: number | null
          t1_prodini?: string | null
          t1_t3?: number | null
          t2_prodfim?: string | null
          t2_t3?: number | null
          t3_entrega?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      periodo: {
        Row: {
          id: number
          bar_id: number | null
          dt_gerencial: string | null
          pessoas: number | null
          vr_pagamentos: number | null
          vr_couvert: number | null
          cli_cel: string | null
          vr_taxa: number | null
          vr_acrescimo: number | null
          vr_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          dt_gerencial?: string | null
          pessoas?: number | null
          vr_pagamentos?: number | null
          vr_couvert?: number | null
          cli_cel?: string | null
          vr_taxa?: number | null
          vr_acrescimo?: number | null
          vr_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          dt_gerencial?: string | null
          pessoas?: number | null
          vr_pagamentos?: number | null
          vr_couvert?: number | null
          cli_cel?: string | null
          vr_taxa?: number | null
          vr_acrescimo?: number | null
          vr_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          id: number
          bar_id: number | null
          liquido: number | null
          total_liquido: number | null
          valor_total: number | null
          vr_couvert: number | null
          vr_pagamentos: number | null
          vr_desconto: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          liquido?: number | null
          total_liquido?: number | null
          valor_total?: number | null
          vr_couvert?: number | null
          vr_pagamentos?: number | null
          vr_desconto?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          liquido?: number | null
          total_liquido?: number | null
          valor_total?: number | null
          vr_couvert?: number | null
          vr_pagamentos?: number | null
          vr_desconto?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pessoas_diario_corrigido: {
        Row: {
          id: number
          bar_id: number | null
          data: string | null
          total_pessoas_bruto: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data?: string | null
          total_pessoas_bruto?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data?: string | null
          total_pessoas_bruto?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      getin_reservas: {
        Row: {
          id: number
          bar_id: number | null
          phone: string | null
          name: string | null
          date: string | null
          people: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          phone?: string | null
          name?: string | null
          date?: string | null
          people?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          phone?: string | null
          name?: string | null
          date?: string | null
          people?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      yuzer_analitico: {
        Row: {
          id: number
          bar_id: number | null
          data_pedido: string | null
          valor_total: number | null
          pedido_id: string | null
          produto_nome: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data_pedido?: string | null
          valor_total?: number | null
          pedido_id?: string | null
          produto_nome?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data_pedido?: string | null
          valor_total?: number | null
          pedido_id?: string | null
          produto_nome?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cliente_visitas: {
        Row: {
          id: number
          bar_id: number | null
          data_visita: string | null
          pessoas_na_mesa: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data_visita?: string | null
          pessoas_na_mesa?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data_visita?: string | null
          pessoas_na_mesa?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      eventos: {
        Row: {
          id: number
          bar_id: number | null
          nome: string | null
          data_evento: string | null
          artista: string | null
          faturamento: number | null
          nome_evento: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          data_evento?: string | null
          artista?: string | null
          faturamento?: number | null
          nome_evento?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          data_evento?: string | null
          artista?: string | null
          faturamento?: number | null
          nome_evento?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          id: number
          bar_id: number | null
          configuracoes: Json
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          configuracoes?: Json
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          configuracoes?: Json
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receitas_produtos: {
        Row: {
          id: number
          produto_id: number | null
          insumo_id: number | null
          quantidade: number | null
          receita_codigo: string | null
          receita_nome: string | null
          receita_categoria: string | null
          produto_codigo: string | null
          produto_nome: string | null
          insumo_codigo: string | null
          insumo_nome: string | null
          quantidade_receita: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          produto_id?: number | null
          insumo_id?: number | null
          quantidade?: number | null
          receita_codigo?: string | null
          receita_nome?: string | null
          receita_categoria?: string | null
          produto_codigo?: string | null
          produto_nome?: string | null
          insumo_codigo?: string | null
          insumo_nome?: string | null
          quantidade_receita?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          produto_id?: number | null
          insumo_id?: number | null
          quantidade?: number | null
          receita_codigo?: string | null
          receita_nome?: string | null
          receita_categoria?: string | null
          produto_codigo?: string | null
          produto_nome?: string | null
          insumo_codigo?: string | null
          insumo_nome?: string | null
          quantidade_receita?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_credentials: {
        Row: {
          id: number
          bar_id: number | null
          service: string | null
          credentials: Json | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          service?: string | null
          credentials?: Json | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          service?: string | null
          credentials?: Json | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          id: number
          bar_id: number | null
          codigo: string | null
          nome: string | null
          tipo: string | null
          categoria: string | null
          preco: number | null
          ativo: boolean | null
          grupo: string | null
          quantidade_base: number | null
          rendimento_percentual: number | null
          unidade_final: string | null
          receitas: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          codigo?: string | null
          nome?: string | null
          tipo?: string | null
          categoria?: string | null
          preco?: number | null
          ativo?: boolean | null
          grupo?: string | null
          quantidade_base?: number | null
          rendimento_percentual?: number | null
          unidade_final?: string | null
          receitas?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          codigo?: string | null
          nome?: string | null
          tipo?: string | null
          categoria?: string | null
          preco?: number | null
          ativo?: boolean | null
          grupo?: string | null
          quantidade_base?: number | null
          rendimento_percentual?: number | null
          unidade_final?: string | null
          receitas?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insumos: {
        Row: {
          id: number
          bar_id: number | null
          codigo: string | null
          nome: string | null
          tipo: string | null
          unidade: string | null
          preco: number | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          codigo?: string | null
          nome?: string | null
          tipo?: string | null
          unidade?: string | null
          preco?: number | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          codigo?: string | null
          nome?: string | null
          tipo?: string | null
          unidade?: string | null
          preco?: number | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      producao_insumos_calculados: {
        Row: {
          id: number
          bar_id: number | null
          producao_id: number | null
          insumo_id: number | null
          quantidade_calculada: number | null
          custo_unitario: number | null
          custo_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          producao_id?: number | null
          insumo_id?: number | null
          quantidade_calculada?: number | null
          custo_unitario?: number | null
          custo_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          producao_id?: number | null
          insumo_id?: number | null
          quantidade_calculada?: number | null
          custo_unitario?: number | null
          custo_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklists: {
        Row: {
          id: number
          bar_id: number | null
          titulo: string | null
          descricao: string | null
          status: string | null
          prazo: string | null
          prioridade: string | null
          responsavel_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          titulo?: string | null
          descricao?: string | null
          status?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          titulo?: string | null
          descricao?: string | null
          status?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_funcionario: {
        Row: {
          id: number
          bar_id: number | null
          titulo: string | null
          descricao: string | null
          status: string | null
          prazo: string | null
          prioridade: string | null
          responsavel_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          titulo?: string | null
          descricao?: string | null
          status?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          titulo?: string | null
          descricao?: string | null
          status?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sympla_participantes: {
        Row: {
          id: number
          bar_id: number | null
          evento_id: string | null
          nome: string | null
          email: string | null
          telefone: string | null
          documento: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          evento_id?: string | null
          nome?: string | null
          email?: string | null
          telefone?: string | null
          documento?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          evento_id?: string | null
          nome?: string | null
          email?: string | null
          telefone?: string | null
          documento?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sympla_pedidos: {
        Row: {
          id: number
          bar_id: number | null
          evento_id: string | null
          pedido_id: string | null
          status: string | null
          valor_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          evento_id?: string | null
          pedido_id?: string | null
          status?: string | null
          valor_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          evento_id?: string | null
          pedido_id?: string | null
          status?: string | null
          valor_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sympla_sync_logs: {
        Row: {
          id: number
          bar_id: number | null
          evento_id: string | null
          status: string | null
          mensagem: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          evento_id?: string | null
          status?: string | null
          mensagem?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          evento_id?: string | null
          status?: string | null
          mensagem?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      whatsapp_configuracoes: {
        Row: {
          id: string
          bar_id: number | null
          api_version: string | null
          phone_number_id: string | null
          access_token: string | null
          idioma: string | null
          rate_limit_per_minute: number | null
          template_prefix: string | null
          max_retry_attempts: number | null
          retry_delay_seconds: number | null
          webhook_url: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bar_id?: number | null
          api_version?: string | null
          phone_number_id?: string | null
          access_token?: string | null
          idioma?: string | null
          rate_limit_per_minute?: number | null
          template_prefix?: string | null
          max_retry_attempts?: number | null
          retry_delay_seconds?: number | null
          webhook_url?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bar_id?: number | null
          api_version?: string | null
          phone_number_id?: string | null
          access_token?: string | null
          idioma?: string | null
          rate_limit_per_minute?: number | null
          template_prefix?: string | null
          max_retry_attempts?: number | null
          retry_delay_seconds?: number | null
          webhook_url?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs_sistema: {
        Row: {
          id: number
          bar_id: number | null
          tipo: string | null
          descricao: string | null
          dados: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          tipo?: string | null
          descricao?: string | null
          dados?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          tipo?: string | null
          descricao?: string | null
          dados?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lgpd_audit_log: {
        Row: {
          id: number
          user_id: string | null
          action: string | null
          table_name: string | null
          record_id: string | null
          data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          action?: string | null
          table_name?: string | null
          record_id?: string | null
          data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          action?: string | null
          table_name?: string | null
          record_id?: string | null
          data?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_bars: {
        Row: {
          id: number
          user_id: string | null
          bar_id: number | null
          role: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          bar_id?: number | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          bar_id?: number | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_executions: {
        Row: {
          id: number
          checklist_id: number | null
          user_id: string | null
          status: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          checklist_id?: number | null
          user_id?: string | null
          status?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          checklist_id?: number | null
          user_id?: string | null
          status?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: number
          user_id: string | null
          title: string | null
          message: string | null
          type: string | null
          read: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          title?: string | null
          message?: string | null
          type?: string | null
          read?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          title?: string | null
          message?: string | null
          type?: string | null
          read?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      uploads: {
        Row: {
          id: number
          user_id: string | null
          filename: string | null
          path: string | null
          size: number | null
          mime_type: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          filename?: string | null
          path?: string | null
          size?: number | null
          mime_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          filename?: string | null
          path?: string | null
          size?: number | null
          mime_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
