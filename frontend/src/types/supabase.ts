export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: "XX" }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
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
        }
        Relationships: []
      }
      tempo: {
        Row: {
          id: number
          bar_id: number | null
          data: string | null
          t0_lancamento: string | null
          t1_prodini: string | null
          t2_prodfim: string | null
          t3_entrega: string | null
          usr_lancou: string | null
          usr_produziu: string | null
          usr_entregou: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data?: string | null
          t0_lancamento?: string | null
          t1_prodini?: string | null
          t2_prodfim?: string | null
          t3_entrega?: string | null
          usr_lancou?: string | null
          usr_produziu?: string | null
          usr_entregou?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data?: string | null
          t0_lancamento?: string | null
          t1_prodini?: string | null
          t2_prodfim?: string | null
          t3_entrega?: string | null
          usr_lancou?: string | null
          usr_produziu?: string | null
          usr_entregou?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      periodo: {
        Row: {
          id: number
          bar_id: number | null
          data: string | null
          pessoas: number | null
          valor: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data?: string | null
          pessoas?: number | null
          valor?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data?: string | null
          pessoas?: number | null
          valor?: number | null
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
          pessoas: number | null
          percent: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data?: string | null
          pessoas?: number | null
          percent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data?: string | null
          pessoas?: number | null
          percent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      getin_reservas: {
        Row: {
          id: number
          bar_id: number | null
          cliente_nome: string | null
          cliente_email: string | null
          cliente_telefone: string | null
          data_reserva: string | null
          hora_reserva: string | null
          pessoas: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          cliente_nome?: string | null
          cliente_email?: string | null
          cliente_telefone?: string | null
          data_reserva?: string | null
          hora_reserva?: string | null
          pessoas?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          cliente_nome?: string | null
          cliente_email?: string | null
          cliente_telefone?: string | null
          data_reserva?: string | null
          hora_reserva?: string | null
          pessoas?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      yuzer_analitico: {
        Row: {
          id: number
          bar_id: number | null
          data: string | null
          produto: string | null
          quantidade: number | null
          valor: number | null
          created_at: string | null
          updated_at: string | null
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
        }
        Relationships: []
      }
      bar_api_configs: {
        Row: {
          id: number
          bar_id: number | null
          sistema: string | null
          configuracoes: Json | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          sistema?: string | null
          configuracoes?: Json | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          sistema?: string | null
          configuracoes?: Json | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bar_notification_configs: {
        Row: {
          id: number
          bar_id: number | null
          tipo: string | null
          configuracoes: Json | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          tipo?: string | null
          configuracoes?: Json | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          tipo?: string | null
          configuracoes?: Json | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bar_stats: {
        Row: {
          id: number
          bar_id: number | null
          data: string | null
          faturamento: number | null
          pessoas: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          data?: string | null
          faturamento?: number | null
          pessoas?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          data?: string | null
          faturamento?: number | null
          pessoas?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          nome: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          nome?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          nome?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_lgpd_settings: {
        Row: {
          id: string
          user_id: string | null
          configuracoes: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string | null
          configuracoes: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string | null
          session_data: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lgpd_audit_log: {
        Row: {
          id: string
          user_id: string | null
          acao: string | null
          dados: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          acao?: string | null
          dados?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          acao?: string | null
          dados?: Json | null
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
          id: string
          checklist_id: string | null
          user_id: string | null
          status: string | null
          dados: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          checklist_id?: string | null
          user_id?: string | null
          status?: string | null
          dados?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          checklist_id?: string | null
          user_id?: string | null
          status?: string | null
          dados?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          titulo: string | null
          mensagem: string | null
          tipo: string | null
          lida: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          titulo?: string | null
          mensagem?: string | null
          tipo?: string | null
          lida?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          titulo?: string | null
          mensagem?: string | null
          tipo?: string | null
          lida?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      uploads: {
        Row: {
          id: string
          user_id: string | null
          filename: string | null
          file_path: string | null
          file_size: number | null
          mime_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          filename?: string | null
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          filename?: string | null
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      whatsapp_configuracoes: {
        Row: {
          id: number
          bar_id: number | null
          configuracoes: Json | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          configuracoes?: Json | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          configuracoes?: Json | null
          ativo?: boolean | null
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bar_id?: number | null
          numero?: string | null
          mensagem?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bar_id?: number | null
          numero?: string | null
          mensagem?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_contatos: {
        Row: {
          id: string
          bar_id: number | null
          nome: string | null
          numero: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          numero?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          numero?: string | null
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          template?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bar_id?: number | null
          nome?: string | null
          template?: string | null
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
          data_producao: string | null
          quantidade: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          data_producao?: string | null
          quantidade?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          data_producao?: string | null
          quantidade?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      producao_insumos_calculados: {
        Row: {
          id: number
          producao_id: number | null
          insumo_id: number | null
          quantidade_calculada: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          producao_id?: number | null
          insumo_id?: number | null
          quantidade_calculada?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          producao_id?: number | null
          insumo_id?: number | null
          quantidade_calculada?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          id: number
          bar_id: number | null
          nome: string | null
          preco: number | null
          categoria: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          preco?: number | null
          categoria?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          preco?: number | null
          categoria?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insumos: {
        Row: {
          id: number
          bar_id: number | null
          nome: string | null
          unidade: string | null
          preco_unitario: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          unidade?: string | null
          preco_unitario?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          nome?: string | null
          unidade?: string | null
          preco_unitario?: number | null
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          produto_id?: number | null
          insumo_id?: number | null
          quantidade?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          produto_id?: number | null
          insumo_id?: number | null
          quantidade?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs_sistema: {
        Row: {
          id: number
          nivel: string | null
          mensagem: string | null
          dados: Json | null
          created_at: string | null
        }
        Insert: {
          id?: number
          nivel?: string | null
          mensagem?: string | null
          dados?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: number
          nivel?: string | null
          mensagem?: string | null
          dados?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      sympla_participantes: {
        Row: {
          id: number
          evento_id: string | null
          nome: string | null
          email: string | null
          checkin: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          evento_id?: string | null
          nome?: string | null
          email?: string | null
          checkin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          evento_id?: string | null
          nome?: string | null
          email?: string | null
          checkin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sympla_pedidos: {
        Row: {
          id: number
          evento_id: string | null
          pedido_id: string | null
          valor: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          evento_id?: string | null
          pedido_id?: string | null
          valor?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          evento_id?: string | null
          pedido_id?: string | null
          valor?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sympla_sync_logs: {
        Row: {
          id: number
          evento_id: string | null
          status: string | null
          detalhes: Json | null
          created_at: string | null
        }
        Insert: {
          id?: number
          evento_id?: string | null
          status?: string | null
          detalhes?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: number
          evento_id?: string | null
          status?: string | null
          detalhes?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      checklist_funcionario: {
        Row: {
          id: string
          funcionario_id: string | null
          checklist_id: string | null
          status: string | null
          dados: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          funcionario_id?: string | null
          checklist_id?: string | null
          status?: string | null
          dados?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          funcionario_id?: string | null
          checklist_id?: string | null
          status?: string | null
          dados?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cliente_visitas: {
        Row: {
          id: number
          bar_id: number | null
          cliente_id: string | null
          data_visita: string | null
          valor_gasto: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id?: number | null
          cliente_id?: string | null
          data_visita?: string | null
          valor_gasto?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number | null
          cliente_id?: string | null
          data_visita?: string | null
          valor_gasto?: number | null
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          nome?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          nome?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
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
      api_credentials: {
        Row: {
          access_token: string | null
          ambiente: string | null
          api_key: string | null
          api_token: string | null
          ativo: boolean | null
          atualizado_em: string | null
          authorization_code: string | null
          bar_id: number | null
          base_url: string | null
          client_id: string | null
          client_secret: string | null
          configuracoes: Json | null
          criado_em: string | null
          empresa_cnpj: string | null
          empresa_id: string | null
          empresa_nome: string | null
          expires_at: string | null
          id: number
          last_token_refresh: string | null
          oauth_state: string | null
          password: string | null
          redirect_uri: string | null
          refresh_token: string | null
          scopes: string | null
          sistema: string
          token_refresh_count: number | null
          token_type: string | null
          username: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          ambiente?: string | null
          api_key?: string | null
          api_token?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          authorization_code?: string | null
          bar_id?: number | null
          base_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          configuracoes?: Json | null
          criado_em?: string | null
          empresa_cnpj?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          expires_at?: string | null
          id?: number
          last_token_refresh?: string | null
          oauth_state?: string | null
          password?: string | null
          redirect_uri?: string | null
          refresh_token?: string | null
          scopes?: string | null
          sistema: string
          token_refresh_count?: number | null
          token_type?: string | null
          username?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          ambiente?: string | null
          api_key?: string | null
          api_token?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          authorization_code?: string | null
          bar_id?: number | null
          base_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          configuracoes?: Json | null
          criado_em?: string | null
          empresa_cnpj?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          expires_at?: string | null
          id?: number
          last_token_refresh?: string | null
          oauth_state?: string | null
          password?: string | null
          redirect_uri?: string | null
          refresh_token?: string | null
          scopes?: string | null
          sistema?: string
          token_refresh_count?: number | null
          token_type?: string | null
          username?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_credentials_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
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
