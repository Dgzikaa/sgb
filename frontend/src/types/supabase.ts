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
      _backup_webhook_configs: {
        Row: {
          atualizado_em: string | null
          bar_id: string | null
          configuracoes: Json | null
          criado_em: string | null
          id: string
        }
        Insert: {
          atualizado_em?: string | null
          bar_id?: string | null
          configuracoes?: Json | null
          criado_em?: string | null
          id?: string
        }
        Update: {
          atualizado_em?: string | null
          bar_id?: string | null
          configuracoes?: Json | null
          criado_em?: string | null
          id?: string
        }
        Relationships: []
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
      audit_trail: {
        Row: {
          bar_id: number | null
          category: string
          changes: Json | null
          created_at: string | null
          description: string
          endpoint: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string | null
          request_id: string | null
          session_id: string | null
          severity: string
          table_name: string | null
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          bar_id?: number | null
          category: string
          changes?: Json | null
          created_at?: string | null
          description: string
          endpoint?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string
          table_name?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          bar_id?: number | null
          category?: string
          changes?: Json | null
          created_at?: string | null
          description?: string
          endpoint?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string
          table_name?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_checklists: {
        Row: {
          bar_id: number
          criado_em: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: unknown
          registro_id: string
          tabela_afetada: string
          tipo_acao: Database["public"]["Enums"]["tipo_acao_enum"]
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          bar_id: number
          criado_em?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id: string
          tabela_afetada: string
          tipo_acao: Database["public"]["Enums"]["tipo_acao_enum"]
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          bar_id?: number
          criado_em?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id?: string
          tabela_afetada?: string
          tipo_acao?: Database["public"]["Enums"]["tipo_acao_enum"]
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_checklists_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          bar_id: number
          criado_em: string | null
          detalhes: Json | null
          erro_mensagem: string | null
          finalizado_em: string | null
          id: number
          job_id: string | null
          operacao: string
          registros_processados: number | null
          sistema: string
          status: string
          tempo_execucao: unknown
        }
        Insert: {
          bar_id: number
          criado_em?: string | null
          detalhes?: Json | null
          erro_mensagem?: string | null
          finalizado_em?: string | null
          id?: number
          job_id?: string | null
          operacao: string
          registros_processados?: number | null
          sistema: string
          status: string
          tempo_execucao?: unknown
        }
        Update: {
          bar_id?: number
          criado_em?: string | null
          detalhes?: Json | null
          erro_mensagem?: string | null
          finalizado_em?: string | null
          id?: number
          job_id?: string | null
          operacao?: string
          registros_processados?: number | null
          sistema?: string
          status?: string
          tempo_execucao?: unknown
        }
        Relationships: []
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
      checklist_agendamentos: {
        Row: {
          bar_id: number
          checklist_id: string
          criado_em: string | null
          criado_por: string
          data_agendada: string
          deadline: string | null
          id: string
          observacoes: string | null
          prioridade: Database["public"]["Enums"]["prioridade_enum"]
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_agendamento_enum"]
        }
        Insert: {
          bar_id: number
          checklist_id: string
          criado_em?: string | null
          criado_por: string
          data_agendada: string
          deadline?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_enum"]
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_agendamento_enum"]
        }
        Update: {
          bar_id?: number
          checklist_id?: string
          criado_em?: string | null
          criado_por?: string
          data_agendada?: string
          deadline?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_enum"]
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_agendamento_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "checklist_agendamentos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_agendamentos_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_auto_executions: {
        Row: {
          alerta_enviado: boolean | null
          checklist_agendamento_id: string | null
          checklist_execucao_id: string | null
          checklist_schedule_id: string | null
          criado_em: string | null
          data_alerta: string | null
          data_limite: string | null
          id: string
          notificacao_enviada: boolean | null
          status: string | null
        }
        Insert: {
          alerta_enviado?: boolean | null
          checklist_agendamento_id?: string | null
          checklist_execucao_id?: string | null
          checklist_schedule_id?: string | null
          criado_em?: string | null
          data_alerta?: string | null
          data_limite?: string | null
          id?: string
          notificacao_enviada?: boolean | null
          status?: string | null
        }
        Update: {
          alerta_enviado?: boolean | null
          checklist_agendamento_id?: string | null
          checklist_execucao_id?: string | null
          checklist_schedule_id?: string | null
          criado_em?: string | null
          data_alerta?: string | null
          data_limite?: string | null
          id?: string
          notificacao_enviada?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_auto_executions_checklist_agendamento_id_fkey"
            columns: ["checklist_agendamento_id"]
            isOneToOne: false
            referencedRelation: "checklist_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_auto_executions_checklist_schedule_id_fkey"
            columns: ["checklist_schedule_id"]
            isOneToOne: false
            referencedRelation: "checklist_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_automation_logs: {
        Row: {
          checklist_auto_execution_id: string | null
          checklist_schedule_id: string | null
          criado_em: string | null
          dados: Json | null
          id: string
          mensagem: string | null
          nivel: string | null
          tipo: string
        }
        Insert: {
          checklist_auto_execution_id?: string | null
          checklist_schedule_id?: string | null
          criado_em?: string | null
          dados?: Json | null
          id?: string
          mensagem?: string | null
          nivel?: string | null
          tipo: string
        }
        Update: {
          checklist_auto_execution_id?: string | null
          checklist_schedule_id?: string | null
          criado_em?: string | null
          dados?: Json | null
          id?: string
          mensagem?: string | null
          nivel?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_automation_logs_checklist_auto_execution_id_fkey"
            columns: ["checklist_auto_execution_id"]
            isOneToOne: false
            referencedRelation: "checklist_auto_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_automation_logs_checklist_schedule_id_fkey"
            columns: ["checklist_schedule_id"]
            isOneToOne: false
            referencedRelation: "checklist_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_itens: {
        Row: {
          condicional: Json | null
          criado_em: string | null
          descricao: string | null
          id: string
          obrigatorio: boolean
          opcoes: Json | null
          ordem: number
          secao_id: string
          tipo: Database["public"]["Enums"]["tipo_campo_enum"]
          titulo: string
          validacao: Json | null
        }
        Insert: {
          condicional?: Json | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem: number
          secao_id: string
          tipo: Database["public"]["Enums"]["tipo_campo_enum"]
          titulo: string
          validacao?: Json | null
        }
        Update: {
          condicional?: Json | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          secao_id?: string
          tipo?: Database["public"]["Enums"]["tipo_campo_enum"]
          titulo?: string
          validacao?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_itens_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "checklist_secoes"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_schedules: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          bar_id: number | null
          checklist_id: string | null
          configuracao_frequencia: Json
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          frequencia: string
          hora_execucao: string
          id: string
          prioridade: string | null
          proxima_execucao_em: string | null
          responsaveis_whatsapp: Json | null
          tempo_alerta_horas: number | null
          tempo_limite_horas: number | null
          titulo: string
          ultima_execucao_em: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id?: number | null
          checklist_id?: string | null
          configuracao_frequencia?: Json
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          frequencia: string
          hora_execucao?: string
          id?: string
          prioridade?: string | null
          proxima_execucao_em?: string | null
          responsaveis_whatsapp?: Json | null
          tempo_alerta_horas?: number | null
          tempo_limite_horas?: number | null
          titulo: string
          ultima_execucao_em?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id?: number | null
          checklist_id?: string | null
          configuracao_frequencia?: Json
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          frequencia?: string
          hora_execucao?: string
          id?: string
          prioridade?: string | null
          proxima_execucao_em?: string | null
          responsaveis_whatsapp?: Json | null
          tempo_alerta_horas?: number | null
          tempo_limite_horas?: number | null
          titulo?: string
          ultima_execucao_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_schedules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_schedules_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_secoes: {
        Row: {
          checklist_id: string
          configuracoes: Json | null
          cor: string
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          checklist_id: string
          configuracoes?: Json | null
          cor?: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          checklist_id?: string
          configuracoes?: Json | null
          cor?: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "checklist_secoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          atualizado_em: string | null
          bar_id: number
          configuracoes: Json | null
          criado_em: string | null
          criado_por: string
          descricao: string | null
          eh_template: boolean
          frequencia: Database["public"]["Enums"]["frequencia_enum"]
          id: string
          nome: string
          prioridade: Database["public"]["Enums"]["prioridade_enum"]
          responsavel_padrao: string | null
          setor: string
          status: Database["public"]["Enums"]["status_checklist_enum"]
          template_origem: string | null
          tempo_estimado: number
          tipo: Database["public"]["Enums"]["tipo_checklist_enum"]
          versao: number
        }
        Insert: {
          atualizado_em?: string | null
          bar_id: number
          configuracoes?: Json | null
          criado_em?: string | null
          criado_por: string
          descricao?: string | null
          eh_template?: boolean
          frequencia: Database["public"]["Enums"]["frequencia_enum"]
          id?: string
          nome: string
          prioridade?: Database["public"]["Enums"]["prioridade_enum"]
          responsavel_padrao?: string | null
          setor: string
          status?: Database["public"]["Enums"]["status_checklist_enum"]
          template_origem?: string | null
          tempo_estimado?: number
          tipo: Database["public"]["Enums"]["tipo_checklist_enum"]
          versao?: number
        }
        Update: {
          atualizado_em?: string | null
          bar_id?: number
          configuracoes?: Json | null
          criado_em?: string | null
          criado_por?: string
          descricao?: string | null
          eh_template?: boolean
          frequencia?: Database["public"]["Enums"]["frequencia_enum"]
          id?: string
          nome?: string
          prioridade?: Database["public"]["Enums"]["prioridade_enum"]
          responsavel_padrao?: string | null
          setor?: string
          status?: Database["public"]["Enums"]["status_checklist_enum"]
          template_origem?: string | null
          tempo_estimado?: number
          tipo?: Database["public"]["Enums"]["tipo_checklist_enum"]
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "checklists_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_template_origem_fkey"
            columns: ["template_origem"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      cmv_semanal: {
        Row: {
          ano: number
          bar_id: number
          cmv_alimentos: number | null
          cmv_bebidas: number | null
          cmv_calculado: number | null
          cmv_descartaveis: number | null
          cmv_outros: number | null
          cmv_percentual: number | null
          compras_periodo: number | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          estoque_final: number | null
          estoque_inicial: number | null
          id: number
          observacoes: string | null
          responsavel: string | null
          semana: number
          status: string | null
          updated_at: string | null
          vendas_brutas: number | null
          vendas_liquidas: number | null
        }
        Insert: {
          ano: number
          bar_id: number
          cmv_alimentos?: number | null
          cmv_bebidas?: number | null
          cmv_calculado?: number | null
          cmv_descartaveis?: number | null
          cmv_outros?: number | null
          cmv_percentual?: number | null
          compras_periodo?: number | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          estoque_final?: number | null
          estoque_inicial?: number | null
          id?: number
          observacoes?: string | null
          responsavel?: string | null
          semana: number
          status?: string | null
          updated_at?: string | null
          vendas_brutas?: number | null
          vendas_liquidas?: number | null
        }
        Update: {
          ano?: number
          bar_id?: number
          cmv_alimentos?: number | null
          cmv_bebidas?: number | null
          cmv_calculado?: number | null
          cmv_descartaveis?: number | null
          cmv_outros?: number | null
          cmv_percentual?: number | null
          compras_periodo?: number | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          estoque_final?: number | null
          estoque_inicial?: number | null
          id?: number
          observacoes?: string | null
          responsavel?: string | null
          semana?: number
          status?: string | null
          updated_at?: string | null
          vendas_brutas?: number | null
          vendas_liquidas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cmv_semanal_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      contagem_estoque_insumos: {
        Row: {
          bar_id: number
          categoria: string | null
          consumo_periodo: number | null
          created_at: string | null
          custo_unitario: number | null
          data_contagem: string
          estoque_final: number
          estoque_inicial: number | null
          id: number
          insumo_codigo: string
          insumo_id: number
          insumo_nome: string
          observacoes: string | null
          quantidade_pedido: number | null
          tipo_local: string
          unidade_medida: string
          updated_at: string | null
          usuario_contagem: string | null
          valor_consumo: number | null
        }
        Insert: {
          bar_id?: number
          categoria?: string | null
          consumo_periodo?: number | null
          created_at?: string | null
          custo_unitario?: number | null
          data_contagem: string
          estoque_final: number
          estoque_inicial?: number | null
          id?: number
          insumo_codigo: string
          insumo_id: number
          insumo_nome: string
          observacoes?: string | null
          quantidade_pedido?: number | null
          tipo_local: string
          unidade_medida: string
          updated_at?: string | null
          usuario_contagem?: string | null
          valor_consumo?: number | null
        }
        Update: {
          bar_id?: number
          categoria?: string | null
          consumo_periodo?: number | null
          created_at?: string | null
          custo_unitario?: number | null
          data_contagem?: string
          estoque_final?: number
          estoque_inicial?: number | null
          id?: number
          insumo_codigo?: string
          insumo_id?: number
          insumo_nome?: string
          observacoes?: string | null
          quantidade_pedido?: number | null
          tipo_local?: string
          unidade_medida?: string
          updated_at?: string | null
          usuario_contagem?: string | null
          valor_consumo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contagem_estoque_insumos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      contahub_alertas: {
        Row: {
          created_at: string | null
          data_evento: string
          descricao: string | null
          detalhes: Json | null
          diferenca: number | null
          id: number
          resolvido_em: string | null
          severidade: string
          status: string | null
          tipo_alerta: string
          titulo: string
          valor_atual: number | null
          valor_esperado: number | null
        }
        Insert: {
          created_at?: string | null
          data_evento: string
          descricao?: string | null
          detalhes?: Json | null
          diferenca?: number | null
          id?: number
          resolvido_em?: string | null
          severidade: string
          status?: string | null
          tipo_alerta: string
          titulo: string
          valor_atual?: number | null
          valor_esperado?: number | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string
          descricao?: string | null
          detalhes?: Json | null
          diferenca?: number | null
          id?: number
          resolvido_em?: string | null
          severidade?: string
          status?: string | null
          tipo_alerta?: string
          titulo?: string
          valor_atual?: number | null
          valor_esperado?: number | null
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
      contahub_correction_logs: {
        Row: {
          created_at: string | null
          data_evento: string
          detalhes: Json | null
          diferenca: number | null
          id: number
          status: string
          valor_banco_anterior: number | null
          valor_banco_corrigido: number | null
          valor_contahub_atual: number | null
        }
        Insert: {
          created_at?: string | null
          data_evento: string
          detalhes?: Json | null
          diferenca?: number | null
          id?: number
          status: string
          valor_banco_anterior?: number | null
          valor_banco_corrigido?: number | null
          valor_contahub_atual?: number | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string
          detalhes?: Json | null
          diferenca?: number | null
          id?: number
          status?: string
          valor_banco_anterior?: number | null
          valor_banco_corrigido?: number | null
          valor_contahub_atual?: number | null
        }
        Relationships: []
      }
      contahub_corrections: {
        Row: {
          aplicado_em: string | null
          aplicado_por: string | null
          data_evento: string
          diferenca: number
          id: number
          motivo: string
          valor_anterior: number
          valor_contahub: number
          valor_corrigido: number
        }
        Insert: {
          aplicado_em?: string | null
          aplicado_por?: string | null
          data_evento: string
          diferenca: number
          id?: number
          motivo: string
          valor_anterior: number
          valor_contahub: number
          valor_corrigido: number
        }
        Update: {
          aplicado_em?: string | null
          aplicado_por?: string | null
          data_evento?: string
          diferenca?: number
          id?: number
          motivo?: string
          valor_anterior?: number
          valor_contahub?: number
          valor_corrigido?: number
        }
        Relationships: []
      }
      contahub_fatporhora: {
        Row: {
          bar_id: number | null
          created_at: string | null
          dds: number | null
          dia: string | null
          hora: number | null
          id: number
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
      contahub_processing_queue: {
        Row: {
          bar_id: number
          batch_size: number | null
          completed_at: string | null
          created_at: string | null
          data_date: string
          data_type: string
          error_message: string | null
          id: string
          processed_count: number | null
          raw_data_id: number | null
          retry_count: number | null
          started_at: string | null
          status: string
          total_count: number | null
          updated_at: string | null
          worker_function: string | null
        }
        Insert: {
          bar_id: number
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string | null
          data_date: string
          data_type: string
          error_message?: string | null
          id?: string
          processed_count?: number | null
          raw_data_id?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          total_count?: number | null
          updated_at?: string | null
          worker_function?: string | null
        }
        Update: {
          bar_id?: number
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string | null
          data_date?: string
          data_type?: string
          error_message?: string | null
          id?: string
          processed_count?: number | null
          raw_data_id?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          total_count?: number | null
          updated_at?: string | null
          worker_function?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contahub_processing_queue_raw_data_id_fkey"
            columns: ["raw_data_id"]
            isOneToOne: false
            referencedRelation: "contahub_raw_data"
            referencedColumns: ["id"]
          },
        ]
      }
      contahub_prodporhora: {
        Row: {
          bar_id: number
          created_at: string | null
          data_gerencial: string
          grupo_descricao: string | null
          hora: number
          id: number
          idempotency_key: string | null
          produto_descricao: string
          produto_id: string
          quantidade: number
          updated_at: string | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          data_gerencial: string
          grupo_descricao?: string | null
          hora: number
          id?: number
          idempotency_key?: string | null
          produto_descricao: string
          produto_id: string
          quantidade: number
          updated_at?: string | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          data_gerencial?: string
          grupo_descricao?: string | null
          hora?: number
          id?: number
          idempotency_key?: string | null
          produto_descricao?: string
          produto_id?: string
          quantidade?: number
          updated_at?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: []
      }
      contahub_quality_monitor: {
        Row: {
          created_at: string | null
          data_evento: string
          detalhes: Json | null
          diferenca: number | null
          id: number
          percentual_precisao: number | null
          status_qualidade: string
          tipo_validacao: string
          valor_atual: number | null
          valor_esperado: number | null
        }
        Insert: {
          created_at?: string | null
          data_evento: string
          detalhes?: Json | null
          diferenca?: number | null
          id?: number
          percentual_precisao?: number | null
          status_qualidade: string
          tipo_validacao: string
          valor_atual?: number | null
          valor_esperado?: number | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string
          detalhes?: Json | null
          diferenca?: number | null
          id?: number
          percentual_precisao?: number | null
          status_qualidade?: string
          tipo_validacao?: string
          valor_atual?: number | null
          valor_esperado?: number | null
        }
        Relationships: []
      }
      contahub_raw_data: {
        Row: {
          bar_id: number
          created_at: string | null
          data_date: string
          data_type: string
          grupo_filtro: string | null
          id: number
          processed: boolean | null
          processed_at: string | null
          raw_json: Json
          record_count: number | null
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          data_date: string
          data_type: string
          grupo_filtro?: string | null
          id?: number
          processed?: boolean | null
          processed_at?: string | null
          raw_json: Json
          record_count?: number | null
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          data_date?: string
          data_type?: string
          grupo_filtro?: string | null
          id?: number
          processed?: boolean | null
          processed_at?: string | null
          raw_json?: Json
          record_count?: number | null
        }
        Relationships: []
      }
      contahub_retry_control: {
        Row: {
          created_at: string | null
          data_evento: string
          detalhes: Json | null
          id: number
          max_tentativas: number | null
          proxima_tentativa: string | null
          status: string | null
          tentativa_atual: number | null
          tipo_sync: string
          ultimo_erro: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_evento: string
          detalhes?: Json | null
          id?: number
          max_tentativas?: number | null
          proxima_tentativa?: string | null
          status?: string | null
          tentativa_atual?: number | null
          tipo_sync: string
          ultimo_erro?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string
          detalhes?: Json | null
          id?: number
          max_tentativas?: number | null
          proxima_tentativa?: string | null
          status?: string | null
          tentativa_atual?: number | null
          tipo_sync?: string
          ultimo_erro?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contahub_stockout: {
        Row: {
          bar_id: number
          created_at: string | null
          data_consulta: string
          emp: number | null
          hora_consulta: string
          id: number
          loc: number | null
          loc_desc: string | null
          loc_inativo: string | null
          loc_statusimpressao: string | null
          prd: number | null
          prd_agrupaimpressao: string | null
          prd_ativo: string | null
          prd_balanca: string | null
          prd_cardapioonline: string | null
          prd_contagemehperda: string | null
          prd_controlaestoque: string | null
          prd_delivery: string | null
          prd_desc: string | null
          prd_disponivelonline: string | null
          prd_entregaimediata: string | null
          prd_estoque: number | null
          prd_naodesmembra: string | null
          prd_naoimprimeficha: string | null
          prd_naoimprimeproducao: string | null
          prd_nfecofins: number | null
          prd_nfecsosn: string | null
          prd_nfecstpiscofins: string | null
          prd_nfeicms: number | null
          prd_nfencm: string | null
          prd_nfeorigem: string | null
          prd_nfepis: number | null
          prd_opcoes: string | null
          prd_precovenda: number | null
          prd_produzido: string | null
          prd_qtddouble: string | null
          prd_semcustoestoque: string | null
          prd_semrepique: string | null
          prd_servico: string | null
          prd_unid: string | null
          prd_validaestoquevenda: string | null
          prd_venda: string | null
          prd_venda180: number | null
          prd_venda30: number | null
          prd_venda7: number | null
          prd_zeraestoquenacompra: string | null
          raw_data: Json | null
          updated_at: string | null
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          data_consulta: string
          emp?: number | null
          hora_consulta?: string
          id?: number
          loc?: number | null
          loc_desc?: string | null
          loc_inativo?: string | null
          loc_statusimpressao?: string | null
          prd?: number | null
          prd_agrupaimpressao?: string | null
          prd_ativo?: string | null
          prd_balanca?: string | null
          prd_cardapioonline?: string | null
          prd_contagemehperda?: string | null
          prd_controlaestoque?: string | null
          prd_delivery?: string | null
          prd_desc?: string | null
          prd_disponivelonline?: string | null
          prd_entregaimediata?: string | null
          prd_estoque?: number | null
          prd_naodesmembra?: string | null
          prd_naoimprimeficha?: string | null
          prd_naoimprimeproducao?: string | null
          prd_nfecofins?: number | null
          prd_nfecsosn?: string | null
          prd_nfecstpiscofins?: string | null
          prd_nfeicms?: number | null
          prd_nfencm?: string | null
          prd_nfeorigem?: string | null
          prd_nfepis?: number | null
          prd_opcoes?: string | null
          prd_precovenda?: number | null
          prd_produzido?: string | null
          prd_qtddouble?: string | null
          prd_semcustoestoque?: string | null
          prd_semrepique?: string | null
          prd_servico?: string | null
          prd_unid?: string | null
          prd_validaestoquevenda?: string | null
          prd_venda?: string | null
          prd_venda180?: number | null
          prd_venda30?: number | null
          prd_venda7?: number | null
          prd_zeraestoquenacompra?: string | null
          raw_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          data_consulta?: string
          emp?: number | null
          hora_consulta?: string
          id?: number
          loc?: number | null
          loc_desc?: string | null
          loc_inativo?: string | null
          loc_statusimpressao?: string | null
          prd?: number | null
          prd_agrupaimpressao?: string | null
          prd_ativo?: string | null
          prd_balanca?: string | null
          prd_cardapioonline?: string | null
          prd_contagemehperda?: string | null
          prd_controlaestoque?: string | null
          prd_delivery?: string | null
          prd_desc?: string | null
          prd_disponivelonline?: string | null
          prd_entregaimediata?: string | null
          prd_estoque?: number | null
          prd_naodesmembra?: string | null
          prd_naoimprimeficha?: string | null
          prd_naoimprimeproducao?: string | null
          prd_nfecofins?: number | null
          prd_nfecsosn?: string | null
          prd_nfecstpiscofins?: string | null
          prd_nfeicms?: number | null
          prd_nfencm?: string | null
          prd_nfeorigem?: string | null
          prd_nfepis?: number | null
          prd_opcoes?: string | null
          prd_precovenda?: number | null
          prd_produzido?: string | null
          prd_qtddouble?: string | null
          prd_semcustoestoque?: string | null
          prd_semrepique?: string | null
          prd_servico?: string | null
          prd_unid?: string | null
          prd_validaestoquevenda?: string | null
          prd_venda?: string | null
          prd_venda180?: number | null
          prd_venda30?: number | null
          prd_venda7?: number | null
          prd_zeraestoquenacompra?: string | null
          raw_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
      contahub_validation_logs: {
        Row: {
          acao_tomada: string | null
          data_evento: string
          data_validacao: string | null
          diferenca_registros: number | null
          diferenca_valor: number | null
          id: number
          observacoes: string | null
          status_integridade: string
          validado_por: string | null
        }
        Insert: {
          acao_tomada?: string | null
          data_evento: string
          data_validacao?: string | null
          diferenca_registros?: number | null
          diferenca_valor?: number | null
          id?: number
          observacoes?: string | null
          status_integridade: string
          validado_por?: string | null
        }
        Update: {
          acao_tomada?: string | null
          data_evento?: string
          data_validacao?: string | null
          diferenca_registros?: number | null
          diferenca_valor?: number | null
          id?: number
          observacoes?: string | null
          status_integridade?: string
          validado_por?: string | null
        }
        Relationships: []
      }
      custos_mensais_diluidos: {
        Row: {
          ano: number
          ativo: boolean | null
          bar_id: number
          created_at: string | null
          descricao: string
          id: number
          mes: number
          observacoes: string | null
          parcela_atual: number | null
          tipo_diluicao: string
          total_parcelas: number | null
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          ano: number
          ativo?: boolean | null
          bar_id: number
          created_at?: string | null
          descricao: string
          id?: number
          mes: number
          observacoes?: string | null
          parcela_atual?: number | null
          tipo_diluicao: string
          total_parcelas?: number | null
          updated_at?: string | null
          valor_total: number
        }
        Update: {
          ano?: number
          ativo?: boolean | null
          bar_id?: number
          created_at?: string | null
          descricao?: string
          id?: number
          mes?: number
          observacoes?: string | null
          parcela_atual?: number | null
          tipo_diluicao?: string
          total_parcelas?: number | null
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_mensais_diluidos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      desempenho_semanal: {
        Row: {
          adm_fixo: number | null
          adm_mkt_semana: number | null
          ano: number
          atingimento: number | null
          atracoes_eventos: number | null
          atrasos_bar: number | null
          atrasos_cozinha: number | null
          avaliacoes_5_google_trip: number | null
          bar_id: number | null
          clientes_atendidos: number | null
          clientes_ativos: number | null
          cmo: number | null
          cmo_custo: number | null
          cmv: number | null
          cmv_global_real: number | null
          cmv_limpo: number | null
          cmv_rs: number | null
          cmv_teorico: number | null
          comissao: number | null
          consumacao_sem_socio: number | null
          couvert_atracoes: number | null
          created_at: string | null
          custo_atracao_faturamento: number | null
          data_fim: string
          data_inicio: string
          escritorio_central: number | null
          faturamento_bar: number | null
          faturamento_cmovivel: number | null
          faturamento_entrada: number | null
          faturamento_total: number | null
          id: number
          imposto: number | null
          lucro_rs: number | null
          m_alcance: number | null
          m_cliques: number | null
          m_conversas_iniciadas: number | null
          m_cpm: number | null
          m_ctr: number | null
          m_custo_por_clique: number | null
          m_frequencia: number | null
          m_valor_investido: number | null
          manutencao: number | null
          marketing_fixo: number | null
          materiais: number | null
          media_avaliacoes_google: number | null
          meta_semanal: number | null
          nota_felicidade_equipe: number | null
          nps_reservas: number | null
          numero_semana: number
          o_alcance: number | null
          o_compartilhamento: number | null
          o_engajamento: number | null
          o_interacao: number | null
          o_num_posts: number | null
          o_num_stories: number | null
          o_visu_stories: number | null
          observacoes: string | null
          ocupacao: number | null
          perc_bebidas: number | null
          perc_clientes_novos: number | null
          perc_comida: number | null
          perc_drinks: number | null
          perc_faturamento_ate_19h: number | null
          perc_happy_hour: number | null
          pro_labore: number | null
          qtde_itens_bar: number | null
          qtde_itens_cozinha: number | null
          qui_sab_dom: number | null
          reservas_presentes: number | null
          reservas_totais: number | null
          retencao_1m: number | null
          retencao_2m: number | null
          rh_estorno_outros_operacao: number | null
          stockout_bar: number | null
          stockout_comidas: number | null
          stockout_drinks: number | null
          tempo_saida_bar: number | null
          tempo_saida_cozinha: number | null
          ticket_medio: number | null
          tm_bar: number | null
          tm_entrada: number | null
          updated_at: string | null
          utensilios: number | null
          venda_balcao: number | null
        }
        Insert: {
          adm_fixo?: number | null
          adm_mkt_semana?: number | null
          ano: number
          atingimento?: number | null
          atracoes_eventos?: number | null
          atrasos_bar?: number | null
          atrasos_cozinha?: number | null
          avaliacoes_5_google_trip?: number | null
          bar_id?: number | null
          clientes_atendidos?: number | null
          clientes_ativos?: number | null
          cmo?: number | null
          cmo_custo?: number | null
          cmv?: number | null
          cmv_global_real?: number | null
          cmv_limpo?: number | null
          cmv_rs?: number | null
          cmv_teorico?: number | null
          comissao?: number | null
          consumacao_sem_socio?: number | null
          couvert_atracoes?: number | null
          created_at?: string | null
          custo_atracao_faturamento?: number | null
          data_fim: string
          data_inicio: string
          escritorio_central?: number | null
          faturamento_bar?: number | null
          faturamento_cmovivel?: number | null
          faturamento_entrada?: number | null
          faturamento_total?: number | null
          id?: number
          imposto?: number | null
          lucro_rs?: number | null
          m_alcance?: number | null
          m_cliques?: number | null
          m_conversas_iniciadas?: number | null
          m_cpm?: number | null
          m_ctr?: number | null
          m_custo_por_clique?: number | null
          m_frequencia?: number | null
          m_valor_investido?: number | null
          manutencao?: number | null
          marketing_fixo?: number | null
          materiais?: number | null
          media_avaliacoes_google?: number | null
          meta_semanal?: number | null
          nota_felicidade_equipe?: number | null
          nps_reservas?: number | null
          numero_semana: number
          o_alcance?: number | null
          o_compartilhamento?: number | null
          o_engajamento?: number | null
          o_interacao?: number | null
          o_num_posts?: number | null
          o_num_stories?: number | null
          o_visu_stories?: number | null
          observacoes?: string | null
          ocupacao?: number | null
          perc_bebidas?: number | null
          perc_clientes_novos?: number | null
          perc_comida?: number | null
          perc_drinks?: number | null
          perc_faturamento_ate_19h?: number | null
          perc_happy_hour?: number | null
          pro_labore?: number | null
          qtde_itens_bar?: number | null
          qtde_itens_cozinha?: number | null
          qui_sab_dom?: number | null
          reservas_presentes?: number | null
          reservas_totais?: number | null
          retencao_1m?: number | null
          retencao_2m?: number | null
          rh_estorno_outros_operacao?: number | null
          stockout_bar?: number | null
          stockout_comidas?: number | null
          stockout_drinks?: number | null
          tempo_saida_bar?: number | null
          tempo_saida_cozinha?: number | null
          ticket_medio?: number | null
          tm_bar?: number | null
          tm_entrada?: number | null
          updated_at?: string | null
          utensilios?: number | null
          venda_balcao?: number | null
        }
        Update: {
          adm_fixo?: number | null
          adm_mkt_semana?: number | null
          ano?: number
          atingimento?: number | null
          atracoes_eventos?: number | null
          atrasos_bar?: number | null
          atrasos_cozinha?: number | null
          avaliacoes_5_google_trip?: number | null
          bar_id?: number | null
          clientes_atendidos?: number | null
          clientes_ativos?: number | null
          cmo?: number | null
          cmo_custo?: number | null
          cmv?: number | null
          cmv_global_real?: number | null
          cmv_limpo?: number | null
          cmv_rs?: number | null
          cmv_teorico?: number | null
          comissao?: number | null
          consumacao_sem_socio?: number | null
          couvert_atracoes?: number | null
          created_at?: string | null
          custo_atracao_faturamento?: number | null
          data_fim?: string
          data_inicio?: string
          escritorio_central?: number | null
          faturamento_bar?: number | null
          faturamento_cmovivel?: number | null
          faturamento_entrada?: number | null
          faturamento_total?: number | null
          id?: number
          imposto?: number | null
          lucro_rs?: number | null
          m_alcance?: number | null
          m_cliques?: number | null
          m_conversas_iniciadas?: number | null
          m_cpm?: number | null
          m_ctr?: number | null
          m_custo_por_clique?: number | null
          m_frequencia?: number | null
          m_valor_investido?: number | null
          manutencao?: number | null
          marketing_fixo?: number | null
          materiais?: number | null
          media_avaliacoes_google?: number | null
          meta_semanal?: number | null
          nota_felicidade_equipe?: number | null
          nps_reservas?: number | null
          numero_semana?: number
          o_alcance?: number | null
          o_compartilhamento?: number | null
          o_engajamento?: number | null
          o_interacao?: number | null
          o_num_posts?: number | null
          o_num_stories?: number | null
          o_visu_stories?: number | null
          observacoes?: string | null
          ocupacao?: number | null
          perc_bebidas?: number | null
          perc_clientes_novos?: number | null
          perc_comida?: number | null
          perc_drinks?: number | null
          perc_faturamento_ate_19h?: number | null
          perc_happy_hour?: number | null
          pro_labore?: number | null
          qtde_itens_bar?: number | null
          qtde_itens_cozinha?: number | null
          qui_sab_dom?: number | null
          reservas_presentes?: number | null
          reservas_totais?: number | null
          retencao_1m?: number | null
          retencao_2m?: number | null
          rh_estorno_outros_operacao?: number | null
          stockout_bar?: number | null
          stockout_comidas?: number | null
          stockout_drinks?: number | null
          tempo_saida_bar?: number | null
          tempo_saida_cozinha?: number | null
          ticket_medio?: number | null
          tm_bar?: number | null
          tm_entrada?: number | null
          updated_at?: string | null
          utensilios?: number | null
          venda_balcao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "desempenho_semanal_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_manual: {
        Row: {
          atualizado_em: string | null
          categoria: string
          categoria_macro: string
          criado_em: string | null
          data_competencia: string
          descricao: string
          id: number
          observacoes: string | null
          usuario_criacao: string | null
          valor: number
        }
        Insert: {
          atualizado_em?: string | null
          categoria: string
          categoria_macro: string
          criado_em?: string | null
          data_competencia: string
          descricao: string
          id?: number
          observacoes?: string | null
          usuario_criacao?: string | null
          valor: number
        }
        Update: {
          atualizado_em?: string | null
          categoria?: string
          categoria_macro?: string
          criado_em?: string | null
          data_competencia?: string
          descricao?: string
          id?: number
          observacoes?: string | null
          usuario_criacao?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_dre_manual_categoria"
            columns: ["categoria"]
            isOneToOne: false
            referencedRelation: "nibo_categorias"
            referencedColumns: ["categoria_nome"]
          },
        ]
      }
      estoque_insumos: {
        Row: {
          bar_id: number
          categoria: string
          codigo: string
          created_at: string | null
          custo_total: number | null
          custo_unitario: number | null
          data_contagem: string
          descricao: string
          diferenca: number | null
          entrada: number | null
          estoque_anterior: number | null
          estoque_atual: number
          estoque_final: number | null
          estoque_inicial: number | null
          estoque_teorico: number | null
          id: number
          observacoes: string | null
          preco_unitario: number | null
          produto: string | null
          responsavel_contagem: string | null
          saida: number | null
          status: string | null
          subcategoria: string | null
          unidade_medida: string
          updated_at: string | null
          usuario_contagem: string | null
          valor_estoque: number | null
        }
        Insert: {
          bar_id: number
          categoria: string
          codigo: string
          created_at?: string | null
          custo_total?: number | null
          custo_unitario?: number | null
          data_contagem: string
          descricao: string
          diferenca?: number | null
          entrada?: number | null
          estoque_anterior?: number | null
          estoque_atual: number
          estoque_final?: number | null
          estoque_inicial?: number | null
          estoque_teorico?: number | null
          id?: number
          observacoes?: string | null
          preco_unitario?: number | null
          produto?: string | null
          responsavel_contagem?: string | null
          saida?: number | null
          status?: string | null
          subcategoria?: string | null
          unidade_medida: string
          updated_at?: string | null
          usuario_contagem?: string | null
          valor_estoque?: number | null
        }
        Update: {
          bar_id?: number
          categoria?: string
          codigo?: string
          created_at?: string | null
          custo_total?: number | null
          custo_unitario?: number | null
          data_contagem?: string
          descricao?: string
          diferenca?: number | null
          entrada?: number | null
          estoque_anterior?: number | null
          estoque_atual?: number
          estoque_final?: number | null
          estoque_inicial?: number | null
          estoque_teorico?: number | null
          id?: number
          observacoes?: string | null
          preco_unitario?: number | null
          produto?: string | null
          responsavel_contagem?: string | null
          saida?: number | null
          status?: string | null
          subcategoria?: string | null
          unidade_medida?: string
          updated_at?: string | null
          usuario_contagem?: string | null
          valor_estoque?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_insumos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
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
      execucoes_automaticas: {
        Row: {
          created_at: string | null
          data_execucao: string
          erro: string | null
          hora_execucao: string
          id: number
          resultado: Json | null
          status: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_execucao: string
          erro?: string | null
          hora_execucao: string
          id?: number
          resultado?: Json | null
          status?: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_execucao?: string
          erro?: string | null
          hora_execucao?: string
          id?: number
          resultado?: Json | null
          status?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      getin_reservations: {
        Row: {
          bar_id: number | null
          confirmation_sent: boolean | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          id: number
          info: string | null
          no_show: boolean | null
          no_show_eligible: boolean | null
          no_show_hours: number | null
          no_show_tax: number | null
          nps_answered: boolean | null
          nps_url: string | null
          people: number | null
          raw_data: Json | null
          reservation_date: string | null
          reservation_id: string
          reservation_time: string | null
          sector_id: string | null
          sector_name: string | null
          status: string | null
          unit_city_name: string | null
          unit_coordinates_lat: number | null
          unit_coordinates_lng: number | null
          unit_cover_image: string | null
          unit_cuisine_name: string | null
          unit_full_address: string | null
          unit_id: string | null
          unit_name: string | null
          unit_profile_image: string | null
          unit_zipcode: string | null
          updated_at: string | null
        }
        Insert: {
          bar_id?: number | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: number
          info?: string | null
          no_show?: boolean | null
          no_show_eligible?: boolean | null
          no_show_hours?: number | null
          no_show_tax?: number | null
          nps_answered?: boolean | null
          nps_url?: string | null
          people?: number | null
          raw_data?: Json | null
          reservation_date?: string | null
          reservation_id: string
          reservation_time?: string | null
          sector_id?: string | null
          sector_name?: string | null
          status?: string | null
          unit_city_name?: string | null
          unit_coordinates_lat?: number | null
          unit_coordinates_lng?: number | null
          unit_cover_image?: string | null
          unit_cuisine_name?: string | null
          unit_full_address?: string | null
          unit_id?: string | null
          unit_name?: string | null
          unit_profile_image?: string | null
          unit_zipcode?: string | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: number
          info?: string | null
          no_show?: boolean | null
          no_show_eligible?: boolean | null
          no_show_hours?: number | null
          no_show_tax?: number | null
          nps_answered?: boolean | null
          nps_url?: string | null
          people?: number | null
          raw_data?: Json | null
          reservation_date?: string | null
          reservation_id?: string
          reservation_time?: string | null
          sector_id?: string | null
          sector_name?: string | null
          status?: string | null
          unit_city_name?: string | null
          unit_coordinates_lat?: number | null
          unit_coordinates_lng?: number | null
          unit_cover_image?: string | null
          unit_cuisine_name?: string | null
          unit_full_address?: string | null
          unit_id?: string | null
          unit_name?: string | null
          unit_profile_image?: string | null
          unit_zipcode?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "getin_reservations_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      getin_sync_logs: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          id: number
          reservas_atualizadas: number | null
          reservas_extraidas: number | null
          reservas_novas: number | null
          status: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          id?: number
          reservas_atualizadas?: number | null
          reservas_extraidas?: number | null
          reservas_novas?: number | null
          status: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          id?: number
          reservas_atualizadas?: number | null
          reservas_extraidas?: number | null
          reservas_novas?: number | null
          status?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      getin_units: {
        Row: {
          about: string | null
          address: string | null
          amenities: Json | null
          bar_id: number | null
          city_slug: string | null
          complement: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          cover_image: string | null
          created_at: string | null
          cuisine_name: string | null
          full_address: string | null
          id: number
          name: string | null
          neighborhood: string | null
          number: string | null
          opening_hours_description: string | null
          payment_description: string | null
          price_range: string | null
          price_range_description: string | null
          profile_image: string | null
          raw_data: Json | null
          reservation_config: Json | null
          slug: string | null
          telephone: string | null
          timezone: string | null
          unit_id: string
          updated_at: string | null
          website: string | null
          zipcode: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          amenities?: Json | null
          bar_id?: number | null
          city_slug?: string | null
          complement?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          cover_image?: string | null
          created_at?: string | null
          cuisine_name?: string | null
          full_address?: string | null
          id?: number
          name?: string | null
          neighborhood?: string | null
          number?: string | null
          opening_hours_description?: string | null
          payment_description?: string | null
          price_range?: string | null
          price_range_description?: string | null
          profile_image?: string | null
          raw_data?: Json | null
          reservation_config?: Json | null
          slug?: string | null
          telephone?: string | null
          timezone?: string | null
          unit_id: string
          updated_at?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          amenities?: Json | null
          bar_id?: number | null
          city_slug?: string | null
          complement?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          cover_image?: string | null
          created_at?: string | null
          cuisine_name?: string | null
          full_address?: string | null
          id?: number
          name?: string | null
          neighborhood?: string | null
          number?: string | null
          opening_hours_description?: string | null
          payment_description?: string | null
          price_range?: string | null
          price_range_description?: string | null
          profile_image?: string | null
          raw_data?: Json | null
          reservation_config?: Json | null
          slug?: string | null
          telephone?: string | null
          timezone?: string | null
          unit_id?: string
          updated_at?: string | null
          website?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "getin_units_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          ativo: boolean | null
          bar_id: number
          categoria: string | null
          codigo: string
          created_at: string | null
          custo_unitario: number | null
          id: number
          nome: string
          observacoes: string | null
          tipo_local: string | null
          unidade_medida: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bar_id?: number
          categoria?: string | null
          codigo: string
          created_at?: string | null
          custo_unitario?: number | null
          id?: number
          nome: string
          observacoes?: string | null
          tipo_local?: string | null
          unidade_medida?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bar_id?: number
          categoria?: string | null
          codigo?: string
          created_at?: string | null
          custo_unitario?: number | null
          id?: number
          nome?: string
          observacoes?: string | null
          tipo_local?: string | null
          unidade_medida?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nibo_agendamentos: {
        Row: {
          anexos: Json | null
          atualizado_em: string | null
          bar_id: number | null
          categoria_id: string | null
          categoria_nome: string | null
          centro_custo_config: Json | null
          centro_custo_id: string | null
          centro_custo_nome: string | null
          conta_bancaria_id: string | null
          conta_bancaria_id_interno: number | null
          conta_bancaria_nome: string | null
          criado_em: string | null
          data_atualizacao: string | null
          data_competencia: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          deletado: boolean | null
          descricao: string | null
          frequencia_recorrencia: string | null
          id: number
          nibo_id: string
          numero_documento: string | null
          numero_parcela: number | null
          observacoes: string | null
          recorrencia_config: Json | null
          recorrente: boolean | null
          stakeholder_id: string | null
          stakeholder_id_interno: number | null
          stakeholder_nome: string | null
          stakeholder_tipo: string | null
          status: string
          tags: Json | null
          tipo: string
          titulo: string | null
          total_parcelas: number | null
          usuario_atualizacao: string | null
          valor: number
          valor_pago: number | null
        }
        Insert: {
          anexos?: Json | null
          atualizado_em?: string | null
          bar_id?: number | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_config?: Json | null
          centro_custo_id?: string | null
          centro_custo_nome?: string | null
          conta_bancaria_id?: string | null
          conta_bancaria_id_interno?: number | null
          conta_bancaria_nome?: string | null
          criado_em?: string | null
          data_atualizacao?: string | null
          data_competencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          deletado?: boolean | null
          descricao?: string | null
          frequencia_recorrencia?: string | null
          id?: number
          nibo_id: string
          numero_documento?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          recorrencia_config?: Json | null
          recorrente?: boolean | null
          stakeholder_id?: string | null
          stakeholder_id_interno?: number | null
          stakeholder_nome?: string | null
          stakeholder_tipo?: string | null
          status: string
          tags?: Json | null
          tipo: string
          titulo?: string | null
          total_parcelas?: number | null
          usuario_atualizacao?: string | null
          valor: number
          valor_pago?: number | null
        }
        Update: {
          anexos?: Json | null
          atualizado_em?: string | null
          bar_id?: number | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_config?: Json | null
          centro_custo_id?: string | null
          centro_custo_nome?: string | null
          conta_bancaria_id?: string | null
          conta_bancaria_id_interno?: number | null
          conta_bancaria_nome?: string | null
          criado_em?: string | null
          data_atualizacao?: string | null
          data_competencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          deletado?: boolean | null
          descricao?: string | null
          frequencia_recorrencia?: string | null
          id?: number
          nibo_id?: string
          numero_documento?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          recorrencia_config?: Json | null
          recorrente?: boolean | null
          stakeholder_id?: string | null
          stakeholder_id_interno?: number | null
          stakeholder_nome?: string | null
          stakeholder_tipo?: string | null
          status?: string
          tags?: Json | null
          tipo?: string
          titulo?: string | null
          total_parcelas?: number | null
          usuario_atualizacao?: string | null
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nibo_agendamentos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      nibo_background_jobs: {
        Row: {
          bar_id: number
          batch_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: number
          job_type: string
          processed_records: number | null
          started_at: string | null
          status: string | null
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          bar_id: number
          batch_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          job_type: string
          processed_records?: number | null
          started_at?: string | null
          status?: string | null
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number
          batch_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          job_type?: string
          processed_records?: number | null
          started_at?: string | null
          status?: string | null
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nibo_categorias: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          categoria_macro: string
          categoria_nome: string
          criado_em: string | null
          id: number
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_macro: string
          categoria_nome: string
          criado_em?: string | null
          id?: number
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          categoria_macro?: string
          categoria_nome?: string
          criado_em?: string | null
          id?: number
        }
        Relationships: []
      }
      nibo_logs_sincronizacao: {
        Row: {
          bar_id: number | null
          criado_em: string | null
          data_fim: string | null
          data_inicio: string | null
          duracao_segundos: number | null
          id: number
          mensagem_erro: string | null
          registros_erro: number | null
          registros_processados: number | null
          status: string
          tipo_sincronizacao: string
          total_registros: number | null
        }
        Insert: {
          bar_id?: number | null
          criado_em?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          duracao_segundos?: number | null
          id?: number
          mensagem_erro?: string | null
          registros_erro?: number | null
          registros_processados?: number | null
          status: string
          tipo_sincronizacao: string
          total_registros?: number | null
        }
        Update: {
          bar_id?: number | null
          criado_em?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          duracao_segundos?: number | null
          id?: number
          mensagem_erro?: string | null
          registros_erro?: number | null
          registros_processados?: number | null
          status?: string
          tipo_sincronizacao?: string
          total_registros?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nibo_logs_sincronizacao_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      nibo_raw_data: {
        Row: {
          bar_id: number
          created_at: string | null
          data_type: string
          end_date: string
          id: number
          processed: boolean | null
          processed_at: string | null
          raw_json: Json
          record_count: number | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          data_type: string
          end_date: string
          id?: number
          processed?: boolean | null
          processed_at?: string | null
          raw_json: Json
          record_count?: number | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          data_type?: string
          end_date?: string
          id?: number
          processed?: boolean | null
          processed_at?: string | null
          raw_json?: Json
          record_count?: number | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nibo_stakeholders: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          bar_id: number | null
          criado_em: string | null
          documento_numero: string | null
          documento_tipo: string | null
          email: string | null
          endereco: Json | null
          id: number
          informacoes_bancarias: Json | null
          nibo_id: string
          nome: string
          pix_chave: string | null
          pix_tipo: string | null
          raw_data: Json | null
          telefone: string | null
          tipo: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id?: number | null
          criado_em?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          email?: string | null
          endereco?: Json | null
          id?: number
          informacoes_bancarias?: Json | null
          nibo_id: string
          nome: string
          pix_chave?: string | null
          pix_tipo?: string | null
          raw_data?: Json | null
          telefone?: string | null
          tipo?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          bar_id?: number | null
          criado_em?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          email?: string | null
          endereco?: Json | null
          id?: number
          informacoes_bancarias?: Json | null
          nibo_id?: string
          nome?: string
          pix_chave?: string | null
          pix_tipo?: string | null
          raw_data?: Json | null
          telefone?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nibo_stakeholders_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          agendada_para: string | null
          bar_id: number
          canais: string[]
          criada_em: string | null
          dados: Json | null
          enviada_em: string | null
          id: string
          lida_em: string | null
          mensagem: string
          status: Database["public"]["Enums"]["status_notificacao_enum"]
          tipo: Database["public"]["Enums"]["tipo_notificacao_enum"]
          titulo: string
          usuario_id: string
        }
        Insert: {
          agendada_para?: string | null
          bar_id: number
          canais?: string[]
          criada_em?: string | null
          dados?: Json | null
          enviada_em?: string | null
          id?: string
          lida_em?: string | null
          mensagem: string
          status?: Database["public"]["Enums"]["status_notificacao_enum"]
          tipo: Database["public"]["Enums"]["tipo_notificacao_enum"]
          titulo: string
          usuario_id: string
        }
        Update: {
          agendada_para?: string | null
          bar_id?: number
          canais?: string[]
          criada_em?: string | null
          dados?: Json | null
          enviada_em?: string | null
          id?: string
          lida_em?: string | null
          mensagem?: string
          status?: Database["public"]["Enums"]["status_notificacao_enum"]
          tipo?: Database["public"]["Enums"]["tipo_notificacao_enum"]
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_bar"
            referencedColumns: ["user_id"]
          },
        ]
      }
      nps: {
        Row: {
          bar_id: number
          conectado_colegas: number | null
          created_at: string | null
          data_pesquisa: string
          empresa_se_preocupa: number | null
          funcionario_nome: string
          id: number
          media_geral: number | null
          qual_sua_area_atuacao: number | null
          quando_identifico: number | null
          quorum: number | null
          relacionamento_positivo: number | null
          resultado_percentual: number | null
          setor: string
          sinto_me_motivado: number | null
          updated_at: string | null
        }
        Insert: {
          bar_id: number
          conectado_colegas?: number | null
          created_at?: string | null
          data_pesquisa: string
          empresa_se_preocupa?: number | null
          funcionario_nome: string
          id?: number
          media_geral?: number | null
          qual_sua_area_atuacao?: number | null
          quando_identifico?: number | null
          quorum?: number | null
          relacionamento_positivo?: number | null
          resultado_percentual?: number | null
          setor: string
          sinto_me_motivado?: number | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number
          conectado_colegas?: number | null
          created_at?: string | null
          data_pesquisa?: string
          empresa_se_preocupa?: number | null
          funcionario_nome?: string
          id?: number
          media_geral?: number | null
          qual_sua_area_atuacao?: number | null
          quando_identifico?: number | null
          quorum?: number | null
          relacionamento_positivo?: number | null
          resultado_percentual?: number | null
          setor?: string
          sinto_me_motivado?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nps_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentacao: {
        Row: {
          ano: number
          atualizado_em: string | null
          bar_id: number
          categoria_id: number | null
          categoria_nome: string
          criado_em: string | null
          diferenca: number | null
          id: string
          mes: number
          observacoes: string | null
          percentual_realizado: number | null
          subcategoria: string | null
          tipo: string
          valor_planejado: number | null
          valor_realizado: number | null
        }
        Insert: {
          ano: number
          atualizado_em?: string | null
          bar_id: number
          categoria_id?: number | null
          categoria_nome: string
          criado_em?: string | null
          diferenca?: number | null
          id?: string
          mes: number
          observacoes?: string | null
          percentual_realizado?: number | null
          subcategoria?: string | null
          tipo: string
          valor_planejado?: number | null
          valor_realizado?: number | null
        }
        Update: {
          ano?: number
          atualizado_em?: string | null
          bar_id?: number
          categoria_id?: number | null
          categoria_nome?: string
          criado_em?: string | null
          diferenca?: number | null
          id?: string
          mes?: number
          observacoes?: string | null
          percentual_realizado?: number | null
          subcategoria?: string | null
          tipo?: string
          valor_planejado?: number | null
          valor_realizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentacao_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      permanent_tokens: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          last_used: string | null
          token_name: string
          token_value: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          last_used?: string | null
          token_name: string
          token_value: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          last_used?: string | null
          token_name?: string
          token_value?: string
        }
        Relationships: []
      }
      pesquisa_felicidade: {
        Row: {
          bar_id: number
          created_at: string | null
          data_pesquisa: string
          eu_com_colega_relacionamento: number | null
          eu_com_empresa_pertencimento: number | null
          eu_com_gestor_lideranca: number | null
          eu_comigo_engajamento: number | null
          funcionario_nome: string
          id: number
          justica_reconhecimento: number | null
          media_geral: number | null
          quorum: number | null
          resultado_percentual: number | null
          setor: string
          updated_at: string | null
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          data_pesquisa: string
          eu_com_colega_relacionamento?: number | null
          eu_com_empresa_pertencimento?: number | null
          eu_com_gestor_lideranca?: number | null
          eu_comigo_engajamento?: number | null
          funcionario_nome: string
          id?: number
          justica_reconhecimento?: number | null
          media_geral?: number | null
          quorum?: number | null
          resultado_percentual?: number | null
          setor: string
          updated_at?: string | null
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          data_pesquisa?: string
          eu_com_colega_relacionamento?: number | null
          eu_com_empresa_pertencimento?: number | null
          eu_com_gestor_lideranca?: number | null
          eu_comigo_engajamento?: number | null
          funcionario_nome?: string
          id?: number
          justica_reconhecimento?: number | null
          media_geral?: number | null
          quorum?: number | null
          resultado_percentual?: number | null
          setor?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pesquisa_felicidade_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_enviados: {
        Row: {
          bar_id: number | null
          beneficiario: Json | null
          created_at: string | null
          data_envio: string | null
          id: string
          status: string | null
          txid: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          bar_id?: number | null
          beneficiario?: Json | null
          created_at?: string | null
          data_envio?: string | null
          id?: string
          status?: string | null
          txid: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          bar_id?: number | null
          beneficiario?: Json | null
          created_at?: string | null
          data_envio?: string | null
          id?: string
          status?: string | null
          txid?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pix_enviados_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      producoes: {
        Row: {
          bar_id: number
          created_at: string | null
          criado_por_nome: string | null
          fim_producao: string | null
          id: number
          inicio_producao: string | null
          insumo_chefe_id: number | null
          insumo_chefe_nome: string | null
          observacoes: string | null
          percentual_aderencia_receita: number | null
          peso_bruto_proteina: number | null
          peso_insumo_chefe: number | null
          peso_limpo_proteina: number | null
          receita_categoria: string | null
          receita_codigo: string
          receita_nome: string
          rendimento_esperado: number | null
          rendimento_real: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          criado_por_nome?: string | null
          fim_producao?: string | null
          id?: number
          inicio_producao?: string | null
          insumo_chefe_id?: number | null
          insumo_chefe_nome?: string | null
          observacoes?: string | null
          percentual_aderencia_receita?: number | null
          peso_bruto_proteina?: number | null
          peso_insumo_chefe?: number | null
          peso_limpo_proteina?: number | null
          receita_categoria?: string | null
          receita_codigo: string
          receita_nome: string
          rendimento_esperado?: number | null
          rendimento_real?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          criado_por_nome?: string | null
          fim_producao?: string | null
          id?: number
          inicio_producao?: string | null
          insumo_chefe_id?: number | null
          insumo_chefe_nome?: string | null
          observacoes?: string | null
          percentual_aderencia_receita?: number | null
          peso_bruto_proteina?: number | null
          peso_insumo_chefe?: number | null
          peso_limpo_proteina?: number | null
          receita_categoria?: string | null
          receita_codigo?: string
          receita_nome?: string
          rendimento_esperado?: number | null
          rendimento_real?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      producoes_insumos: {
        Row: {
          created_at: string | null
          id: number
          insumo_codigo: string | null
          insumo_id: number
          insumo_nome: string
          is_chefe: boolean | null
          producao_id: number
          quantidade_calculada: number | null
          quantidade_necessaria: number | null
          quantidade_real: number | null
          unidade_medida: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          insumo_codigo?: string | null
          insumo_id: number
          insumo_nome: string
          is_chefe?: boolean | null
          producao_id: number
          quantidade_calculada?: number | null
          quantidade_necessaria?: number | null
          quantidade_real?: number | null
          unidade_medida?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          insumo_codigo?: string | null
          insumo_id?: number
          insumo_nome?: string
          is_chefe?: boolean | null
          producao_id?: number
          quantidade_calculada?: number | null
          quantidade_necessaria?: number | null
          quantidade_real?: number | null
          unidade_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producoes_insumos_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "producoes"
            referencedColumns: ["id"]
          },
        ]
      }
      recalculo_eventos_log: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          executado_em: string | null
          id: number
          observacoes: string | null
          tempo_execucao_segundos: number | null
          tipo_execucao: string
          total_erros: number | null
          total_processados: number | null
          total_sucesso: number | null
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          executado_em?: string | null
          id?: number
          observacoes?: string | null
          tempo_execucao_segundos?: number | null
          tipo_execucao: string
          total_erros?: number | null
          total_processados?: number | null
          total_sucesso?: number | null
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          executado_em?: string | null
          id?: number
          observacoes?: string | null
          tempo_execucao_segundos?: number | null
          tipo_execucao?: string
          total_erros?: number | null
          total_processados?: number | null
          total_sucesso?: number | null
        }
        Relationships: []
      }
      receitas: {
        Row: {
          ativo: boolean | null
          bar_id: number
          created_at: string | null
          id: number
          observacoes: string | null
          receita_categoria: string | null
          receita_codigo: string
          receita_nome: string
          rendimento_esperado: number | null
          tipo_local: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bar_id: number
          created_at?: string | null
          id?: number
          observacoes?: string | null
          receita_categoria?: string | null
          receita_codigo: string
          receita_nome: string
          rendimento_esperado?: number | null
          tipo_local?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bar_id?: number
          created_at?: string | null
          id?: number
          observacoes?: string | null
          receita_categoria?: string | null
          receita_codigo?: string
          receita_nome?: string
          rendimento_esperado?: number | null
          tipo_local?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receitas_insumos: {
        Row: {
          created_at: string | null
          id: number
          insumo_id: number | null
          is_chefe: boolean | null
          quantidade_necessaria: number
          receita_id: number
          receita_insumo_id: number | null
          unidade_medida: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          insumo_id?: number | null
          is_chefe?: boolean | null
          quantidade_necessaria: number
          receita_id: number
          receita_insumo_id?: number | null
          unidade_medida?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          insumo_id?: number | null
          is_chefe?: boolean | null
          quantidade_necessaria?: number
          receita_id?: number
          receita_insumo_id?: number | null
          unidade_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receitas_insumos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_insumos_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_insumos_receita_insumo_id_fkey"
            columns: ["receita_insumo_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_results: {
        Row: {
          audit_date: string | null
          fix_status: string | null
          fixed_issues: number | null
          id: number
          notes: string | null
          remaining_issues: number | null
          security_issue_type: string | null
          total_issues: number | null
        }
        Insert: {
          audit_date?: string | null
          fix_status?: string | null
          fixed_issues?: number | null
          id?: number
          notes?: string | null
          remaining_issues?: number | null
          security_issue_type?: string | null
          total_issues?: number | null
        }
        Update: {
          audit_date?: string | null
          fix_status?: string | null
          fixed_issues?: number | null
          id?: number
          notes?: string | null
          remaining_issues?: number | null
          security_issue_type?: string | null
          total_issues?: number | null
        }
        Relationships: []
      }
      security_config_pending: {
        Row: {
          completed_at: string | null
          config_name: string
          config_type: string
          created_at: string | null
          current_status: string | null
          dashboard_path: string | null
          description: string | null
          id: number
          notes: string | null
          priority: string | null
        }
        Insert: {
          completed_at?: string | null
          config_name: string
          config_type: string
          created_at?: string | null
          current_status?: string | null
          dashboard_path?: string | null
          description?: string | null
          id?: number
          notes?: string | null
          priority?: string | null
        }
        Update: {
          completed_at?: string | null
          config_name?: string
          config_type?: string
          created_at?: string | null
          current_status?: string | null
          dashboard_path?: string | null
          description?: string | null
          id?: number
          notes?: string | null
          priority?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          action_taken: string | null
          bar_id: number | null
          category: string
          created_at: string | null
          details: Json | null
          endpoint: string | null
          event_id: string
          event_type: string
          id: string
          ip_address: unknown
          level: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number | null
          timestamp: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          bar_id?: number | null
          category: string
          created_at?: string | null
          details?: Json | null
          endpoint?: string | null
          event_id: string
          event_type: string
          id?: string
          ip_address?: unknown
          level: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          timestamp?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          bar_id?: number | null
          category?: string
          created_at?: string | null
          details?: Json | null
          endpoint?: string | null
          event_id?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          level?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          timestamp?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      security_metrics: {
        Row: {
          access_events: number | null
          api_abuse_events: number | null
          auth_events: number | null
          backup_events: number | null
          bar_id: number | null
          blocked_ips: number | null
          created_at: string | null
          critical_events: number | null
          date: string
          failed_logins: number | null
          id: string
          info_events: number | null
          injection_events: number | null
          rate_limit_events: number | null
          system_events: number | null
          total_events: number | null
          unique_ips: number | null
          updated_at: string | null
          warning_events: number | null
        }
        Insert: {
          access_events?: number | null
          api_abuse_events?: number | null
          auth_events?: number | null
          backup_events?: number | null
          bar_id?: number | null
          blocked_ips?: number | null
          created_at?: string | null
          critical_events?: number | null
          date: string
          failed_logins?: number | null
          id?: string
          info_events?: number | null
          injection_events?: number | null
          rate_limit_events?: number | null
          system_events?: number | null
          total_events?: number | null
          unique_ips?: number | null
          updated_at?: string | null
          warning_events?: number | null
        }
        Update: {
          access_events?: number | null
          api_abuse_events?: number | null
          auth_events?: number | null
          backup_events?: number | null
          bar_id?: number | null
          blocked_ips?: number | null
          created_at?: string | null
          critical_events?: number | null
          date?: string
          failed_logins?: number | null
          id?: string
          info_events?: number | null
          injection_events?: number | null
          rate_limit_events?: number | null
          system_events?: number | null
          total_events?: number | null
          unique_ips?: number | null
          updated_at?: string | null
          warning_events?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "security_metrics_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      security_monitoring: {
        Row: {
          check_description: string | null
          check_type: string
          checked_at: string | null
          details: Json | null
          id: string
          status: string
        }
        Insert: {
          check_description?: string | null
          check_type: string
          checked_at?: string | null
          details?: Json | null
          id?: string
          status: string
        }
        Update: {
          check_description?: string | null
          check_type?: string
          checked_at?: string | null
          details?: Json | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      semanas_referencia: {
        Row: {
          criado_em: string | null
          data_fim: string
          data_inicio: string
          periodo_formatado: string | null
          semana: number
        }
        Insert: {
          criado_em?: string | null
          data_fim: string
          data_inicio: string
          periodo_formatado?: string | null
          semana: number
        }
        Update: {
          criado_em?: string | null
          data_fim?: string
          data_inicio?: string
          periodo_formatado?: string | null
          semana?: number
        }
        Relationships: []
      }
      sistema_kpis: {
        Row: {
          atualizado_em: string | null
          bar_id: number
          categoria_kpi: string
          criado_em: string | null
          data_referencia: string
          descricao: string | null
          id: number
          nome_kpi: string
          percentual_atingido: number | null
          periodo_tipo: string | null
          status_meta: string | null
          unidade: string | null
          valor_atual: number
          valor_maximo: number | null
          valor_meta: number
          valor_minimo: number | null
        }
        Insert: {
          atualizado_em?: string | null
          bar_id: number
          categoria_kpi: string
          criado_em?: string | null
          data_referencia?: string
          descricao?: string | null
          id?: number
          nome_kpi: string
          percentual_atingido?: number | null
          periodo_tipo?: string | null
          status_meta?: string | null
          unidade?: string | null
          valor_atual: number
          valor_maximo?: number | null
          valor_meta: number
          valor_minimo?: number | null
        }
        Update: {
          atualizado_em?: string | null
          bar_id?: number
          categoria_kpi?: string
          criado_em?: string | null
          data_referencia?: string
          descricao?: string | null
          id?: number
          nome_kpi?: string
          percentual_atingido?: number | null
          periodo_tipo?: string | null
          status_meta?: string | null
          unidade?: string | null
          valor_atual?: number
          valor_maximo?: number | null
          valor_meta?: number
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sistema_kpis_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      sympla_eventos: {
        Row: {
          bar_id: number | null
          categoria_primaria: string | null
          categoria_secundaria: string | null
          created_at: string | null
          dados_endereco: Json | null
          dados_host: Json | null
          data_fim: string | null
          data_inicio: string | null
          evento_sympla_id: string
          evento_url: string | null
          id: number
          imagem_url: string | null
          nome_evento: string
          publicado: boolean | null
          raw_data: Json | null
          reference_id: number | null
          updated_at: string | null
        }
        Insert: {
          bar_id?: number | null
          categoria_primaria?: string | null
          categoria_secundaria?: string | null
          created_at?: string | null
          dados_endereco?: Json | null
          dados_host?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          evento_sympla_id: string
          evento_url?: string | null
          id?: number
          imagem_url?: string | null
          nome_evento: string
          publicado?: boolean | null
          raw_data?: Json | null
          reference_id?: number | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number | null
          categoria_primaria?: string | null
          categoria_secundaria?: string | null
          created_at?: string | null
          dados_endereco?: Json | null
          dados_host?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          evento_sympla_id?: string
          evento_url?: string | null
          id?: number
          imagem_url?: string | null
          nome_evento?: string
          publicado?: boolean | null
          raw_data?: Json | null
          reference_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sympla_participantes: {
        Row: {
          bar_id: number | null
          created_at: string | null
          dados_ticket: Json | null
          data_checkin: string | null
          email: string | null
          evento_sympla_id: string
          fez_checkin: boolean | null
          id: number
          nome_completo: string | null
          numero_ticket: string | null
          participante_sympla_id: string
          pedido_id: string | null
          raw_data: Json | null
          status_pedido: string | null
          tipo_ingresso: string | null
          updated_at: string | null
        }
        Insert: {
          bar_id?: number | null
          created_at?: string | null
          dados_ticket?: Json | null
          data_checkin?: string | null
          email?: string | null
          evento_sympla_id: string
          fez_checkin?: boolean | null
          id?: number
          nome_completo?: string | null
          numero_ticket?: string | null
          participante_sympla_id: string
          pedido_id?: string | null
          raw_data?: Json | null
          status_pedido?: string | null
          tipo_ingresso?: string | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number | null
          created_at?: string | null
          dados_ticket?: Json | null
          data_checkin?: string | null
          email?: string | null
          evento_sympla_id?: string
          fez_checkin?: boolean | null
          id?: number
          nome_completo?: string | null
          numero_ticket?: string | null
          participante_sympla_id?: string
          pedido_id?: string | null
          raw_data?: Json | null
          status_pedido?: string | null
          tipo_ingresso?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sympla_participantes_evento_sympla_id_fkey"
            columns: ["evento_sympla_id"]
            isOneToOne: false
            referencedRelation: "sympla_eventos"
            referencedColumns: ["evento_sympla_id"]
          },
          {
            foreignKeyName: "sympla_participantes_evento_sympla_id_fkey"
            columns: ["evento_sympla_id"]
            isOneToOne: false
            referencedRelation: "sympla_resumo"
            referencedColumns: ["evento_sympla_id"]
          },
        ]
      }
      sympla_pedidos: {
        Row: {
          bar_id: number | null
          created_at: string | null
          dados_comprador: Json | null
          dados_utm: Json | null
          data_pedido: string | null
          email_comprador: string | null
          evento_sympla_id: string
          id: number
          nome_comprador: string | null
          pedido_sympla_id: string
          raw_data: Json | null
          status_pedido: string | null
          taxa_sympla: number | null
          tipo_transacao: string | null
          updated_at: string | null
          valor_bruto: number | null
          valor_liquido: number | null
        }
        Insert: {
          bar_id?: number | null
          created_at?: string | null
          dados_comprador?: Json | null
          dados_utm?: Json | null
          data_pedido?: string | null
          email_comprador?: string | null
          evento_sympla_id: string
          id?: number
          nome_comprador?: string | null
          pedido_sympla_id: string
          raw_data?: Json | null
          status_pedido?: string | null
          taxa_sympla?: number | null
          tipo_transacao?: string | null
          updated_at?: string | null
          valor_bruto?: number | null
          valor_liquido?: number | null
        }
        Update: {
          bar_id?: number | null
          created_at?: string | null
          dados_comprador?: Json | null
          dados_utm?: Json | null
          data_pedido?: string | null
          email_comprador?: string | null
          evento_sympla_id?: string
          id?: number
          nome_comprador?: string | null
          pedido_sympla_id?: string
          raw_data?: Json | null
          status_pedido?: string | null
          taxa_sympla?: number | null
          tipo_transacao?: string | null
          updated_at?: string | null
          valor_bruto?: number | null
          valor_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sympla_pedidos_evento_sympla_id_fkey"
            columns: ["evento_sympla_id"]
            isOneToOne: false
            referencedRelation: "sympla_eventos"
            referencedColumns: ["evento_sympla_id"]
          },
          {
            foreignKeyName: "sympla_pedidos_evento_sympla_id_fkey"
            columns: ["evento_sympla_id"]
            isOneToOne: false
            referencedRelation: "sympla_resumo"
            referencedColumns: ["evento_sympla_id"]
          },
        ]
      }
      sync_logs_contahub: {
        Row: {
          bar_id: number | null
          created_at: string | null
          data_sync: string
          detalhes: Json | null
          duracao_segundos: number | null
          erro: string | null
          fim_execucao: string | null
          id: number
          inicio_execucao: string | null
          request_id: string | null
          session_token: string | null
          stack_trace: string | null
          status: string
          total_analitico: number | null
          total_fatporhora: number | null
          total_pagamentos: number | null
          total_periodo: number | null
          total_registros: number | null
          total_tempo: number | null
          triggered_by: string | null
          updated_at: string | null
        }
        Insert: {
          bar_id?: number | null
          created_at?: string | null
          data_sync: string
          detalhes?: Json | null
          duracao_segundos?: number | null
          erro?: string | null
          fim_execucao?: string | null
          id?: number
          inicio_execucao?: string | null
          request_id?: string | null
          session_token?: string | null
          stack_trace?: string | null
          status: string
          total_analitico?: number | null
          total_fatporhora?: number | null
          total_pagamentos?: number | null
          total_periodo?: number | null
          total_registros?: number | null
          total_tempo?: number | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number | null
          created_at?: string | null
          data_sync?: string
          detalhes?: Json | null
          duracao_segundos?: number | null
          erro?: string | null
          fim_execucao?: string | null
          id?: number
          inicio_execucao?: string | null
          request_id?: string | null
          session_token?: string | null
          stack_trace?: string | null
          status?: string
          total_analitico?: number | null
          total_fatporhora?: number | null
          total_pagamentos?: number | null
          total_periodo?: number | null
          total_registros?: number | null
          total_tempo?: number | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      template_tags: {
        Row: {
          cor: string | null
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string | null
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string | null
          criado_em?: string | null
          id?: string
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
      windsor_datav2: {
        Row: {
          campaign: string | null
          campaign_bid_strategy: string | null
          campaign_budget_remaining: number | null
          campaign_buying_type: string | null
          campaign_configured_status: string | null
          campaign_created_time: string | null
          campaign_daily_budget: number | null
          campaign_effective_status: string | null
          campaign_id: string | null
          campaign_lifetime_budget: number | null
          campaign_objective: string | null
          campaign_start_time: string | null
          campaign_stop_time: string | null
          campaignid: string | null
          date: string | null
          id: number
          objective: string | null
          spend: number | null
          totalcost: number | null
        }
        Insert: {
          campaign?: string | null
          campaign_bid_strategy?: string | null
          campaign_budget_remaining?: number | null
          campaign_buying_type?: string | null
          campaign_configured_status?: string | null
          campaign_created_time?: string | null
          campaign_daily_budget?: number | null
          campaign_effective_status?: string | null
          campaign_id?: string | null
          campaign_lifetime_budget?: number | null
          campaign_objective?: string | null
          campaign_start_time?: string | null
          campaign_stop_time?: string | null
          campaignid?: string | null
          date?: string | null
          id?: number
          objective?: string | null
          spend?: number | null
          totalcost?: number | null
        }
        Update: {
          campaign?: string | null
          campaign_bid_strategy?: string | null
          campaign_budget_remaining?: number | null
          campaign_buying_type?: string | null
          campaign_configured_status?: string | null
          campaign_created_time?: string | null
          campaign_daily_budget?: number | null
          campaign_effective_status?: string | null
          campaign_id?: string | null
          campaign_lifetime_budget?: number | null
          campaign_objective?: string | null
          campaign_start_time?: string | null
          campaign_stop_time?: string | null
          campaignid?: string | null
          date?: string | null
          id?: number
          objective?: string | null
          spend?: number | null
          totalcost?: number | null
        }
        Relationships: []
      }
      windsor_google: {
        Row: {
          date: string | null
          id: number
          review_average_rating: number | null
          review_average_rating_total: number | null
          review_comment: string | null
          review_count: number | null
          review_create_time: string | null
          review_id: string | null
          review_reviewer: string | null
          review_star_rating: string | null
          review_total_count: number | null
          review_update_time: string | null
          search_keyword: string | null
          source: string | null
        }
        Insert: {
          date?: string | null
          id?: number
          review_average_rating?: number | null
          review_average_rating_total?: number | null
          review_comment?: string | null
          review_count?: number | null
          review_create_time?: string | null
          review_id?: string | null
          review_reviewer?: string | null
          review_star_rating?: string | null
          review_total_count?: number | null
          review_update_time?: string | null
          search_keyword?: string | null
          source?: string | null
        }
        Update: {
          date?: string | null
          id?: number
          review_average_rating?: number | null
          review_average_rating_total?: number | null
          review_comment?: string | null
          review_count?: number | null
          review_create_time?: string | null
          review_id?: string | null
          review_reviewer?: string | null
          review_star_rating?: string | null
          review_total_count?: number | null
          review_update_time?: string | null
          search_keyword?: string | null
          source?: string | null
        }
        Relationships: []
      }
      windsor_instagram_followers: {
        Row: {
          account_id: string | null
          account_name: string | null
          biography: string | null
          date: string | null
          follower_count_1d: number | null
          followers_count: number | null
          follows_count: number | null
          id: number
          legacy_user_id: string | null
          media_count: number | null
          name: string | null
          reach: number | null
          reach_1d: number | null
          user_id: string | null
          user_name: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          biography?: string | null
          date?: string | null
          follower_count_1d?: number | null
          followers_count?: number | null
          follows_count?: number | null
          id?: number
          legacy_user_id?: string | null
          media_count?: number | null
          name?: string | null
          reach?: number | null
          reach_1d?: number | null
          user_id?: string | null
          user_name?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          biography?: string | null
          date?: string | null
          follower_count_1d?: number | null
          followers_count?: number | null
          follows_count?: number | null
          id?: number
          legacy_user_id?: string | null
          media_count?: number | null
          name?: string | null
          reach?: number | null
          reach_1d?: number | null
          user_id?: string | null
          user_name?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      windsor_instagram_followers_daily: {
        Row: {
          date: string | null
          follower_count_1d: number | null
          id: number
          reach: number | null
          reach_1d: number | null
        }
        Insert: {
          date?: string | null
          follower_count_1d?: number | null
          id?: number
          reach?: number | null
          reach_1d?: number | null
        }
        Update: {
          date?: string | null
          follower_count_1d?: number | null
          id?: number
          reach?: number | null
          reach_1d?: number | null
        }
        Relationships: []
      }
      windsor_instagram_stories: {
        Row: {
          date: string | null
          id: number
          review_average_rating: number | null
          review_average_rating_total: number | null
          review_comment: string | null
          review_count: number | null
          review_create_time: string | null
          review_id: string | null
          review_reviewer: string | null
          review_star_rating: string | null
          review_total_count: number | null
          review_update_time: string | null
          search_keyword: string | null
          source: string | null
        }
        Insert: {
          date?: string | null
          id?: number
          review_average_rating?: number | null
          review_average_rating_total?: number | null
          review_comment?: string | null
          review_count?: number | null
          review_create_time?: string | null
          review_id?: string | null
          review_reviewer?: string | null
          review_star_rating?: string | null
          review_total_count?: number | null
          review_update_time?: string | null
          search_keyword?: string | null
          source?: string | null
        }
        Update: {
          date?: string | null
          id?: number
          review_average_rating?: number | null
          review_average_rating_total?: number | null
          review_comment?: string | null
          review_count?: number | null
          review_create_time?: string | null
          review_id?: string | null
          review_reviewer?: string | null
          review_star_rating?: string | null
          review_total_count?: number | null
          review_update_time?: string | null
          search_keyword?: string | null
          source?: string | null
        }
        Relationships: []
      }
      yuzer_eventos: {
        Row: {
          bar_id: number
          company_document: string | null
          company_name: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          evento_id: number
          id: number
          nome_evento: string | null
          raw_data: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bar_id: number
          company_document?: string | null
          company_name?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          evento_id: number
          id?: number
          nome_evento?: string | null
          raw_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bar_id?: number
          company_document?: string | null
          company_name?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          evento_id?: number
          id?: number
          nome_evento?: string | null
          raw_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      yuzer_fatporhora: {
        Row: {
          bar_id: number
          created_at: string | null
          data_evento: string
          evento_id: number
          faturamento: number | null
          hora: number
          hora_formatada: string | null
          id: number
          raw_data: Json | null
          updated_at: string | null
          vendas: number | null
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          data_evento: string
          evento_id: number
          faturamento?: number | null
          hora: number
          hora_formatada?: string | null
          id?: number
          raw_data?: Json | null
          updated_at?: string | null
          vendas?: number | null
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          data_evento?: string
          evento_id?: number
          faturamento?: number | null
          hora?: number
          hora_formatada?: string | null
          id?: number
          raw_data?: Json | null
          updated_at?: string | null
          vendas?: number | null
        }
        Relationships: []
      }
      yuzer_pagamento: {
        Row: {
          aluguel_equipamentos: number | null
          bar_id: number
          created_at: string | null
          credito: number | null
          data_evento: string
          debito: number | null
          desconto_credito: number | null
          desconto_debito_pix: number | null
          dinheiro: number | null
          evento_id: number
          faturamento_bruto: number | null
          id: number
          pix: number | null
          producao: number | null
          qtd_maquinas: number | null
          quantidade_pedidos: number | null
          raw_data: Json | null
          repasse_liquido: number | null
          taxa_maquinas_calculada: number | null
          total_cancelado: number | null
          total_descontos: number | null
          updated_at: string | null
          valor_liquido: number | null
        }
        Insert: {
          aluguel_equipamentos?: number | null
          bar_id: number
          created_at?: string | null
          credito?: number | null
          data_evento: string
          debito?: number | null
          desconto_credito?: number | null
          desconto_debito_pix?: number | null
          dinheiro?: number | null
          evento_id: number
          faturamento_bruto?: number | null
          id?: number
          pix?: number | null
          producao?: number | null
          qtd_maquinas?: number | null
          quantidade_pedidos?: number | null
          raw_data?: Json | null
          repasse_liquido?: number | null
          taxa_maquinas_calculada?: number | null
          total_cancelado?: number | null
          total_descontos?: number | null
          updated_at?: string | null
          valor_liquido?: number | null
        }
        Update: {
          aluguel_equipamentos?: number | null
          bar_id?: number
          created_at?: string | null
          credito?: number | null
          data_evento?: string
          debito?: number | null
          desconto_credito?: number | null
          desconto_debito_pix?: number | null
          dinheiro?: number | null
          evento_id?: number
          faturamento_bruto?: number | null
          id?: number
          pix?: number | null
          producao?: number | null
          qtd_maquinas?: number | null
          quantidade_pedidos?: number | null
          raw_data?: Json | null
          repasse_liquido?: number | null
          taxa_maquinas_calculada?: number | null
          total_cancelado?: number | null
          total_descontos?: number | null
          updated_at?: string | null
          valor_liquido?: number | null
        }
        Relationships: []
      }
      yuzer_produtos: {
        Row: {
          bar_id: number
          categoria: string | null
          created_at: string | null
          data_evento: string
          eh_ingresso: boolean | null
          evento_id: number
          id: number
          percentual: number | null
          produto_id: number
          produto_nome: string | null
          quantidade: number | null
          raw_data: Json | null
          subcategoria: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          bar_id: number
          categoria?: string | null
          created_at?: string | null
          data_evento: string
          eh_ingresso?: boolean | null
          evento_id: number
          id?: number
          percentual?: number | null
          produto_id: number
          produto_nome?: string | null
          quantidade?: number | null
          raw_data?: Json | null
          subcategoria?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          bar_id?: number
          categoria?: string | null
          created_at?: string | null
          data_evento?: string
          eh_ingresso?: boolean | null
          evento_id?: number
          id?: number
          percentual?: number | null
          produto_id?: number
          produto_nome?: string | null
          quantidade?: number | null
          raw_data?: Json | null
          subcategoria?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      yuzer_sync_logs: {
        Row: {
          bar_id: number
          created_at: string | null
          detalhes: Json | null
          erro: string | null
          id: number
          periodo_fim: string | null
          periodo_inicio: string | null
          registros_inseridos: number | null
          registros_processados: number | null
          status: string
          tempo_execucao_ms: number | null
          tipo_sync: string
        }
        Insert: {
          bar_id: number
          created_at?: string | null
          detalhes?: Json | null
          erro?: string | null
          id?: number
          periodo_fim?: string | null
          periodo_inicio?: string | null
          registros_inseridos?: number | null
          registros_processados?: number | null
          status: string
          tempo_execucao_ms?: number | null
          tipo_sync: string
        }
        Update: {
          bar_id?: number
          created_at?: string | null
          detalhes?: Json | null
          erro?: string | null
          id?: number
          periodo_fim?: string | null
          periodo_inicio?: string | null
          registros_inseridos?: number | null
          registros_processados?: number | null
          status?: string
          tempo_execucao_ms?: number | null
          tipo_sync?: string
        }
        Relationships: []
      }
    }
    Views: {
      sympla_resumo: {
        Row: {
          checkins_realizados: number | null
          data_fim: string | null
          data_inicio: string | null
          evento_sympla_id: string | null
          nome_evento: string | null
          receita_total: number | null
          total_participantes: number | null
        }
        Relationships: []
      }
      token_status: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          last_used: string | null
          status: string | null
          token_name: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          last_used?: string | null
          status?: never
          token_name?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          last_used?: string | null
          status?: never
          token_name?: string | null
        }
        Relationships: []
      }
      view_dre: {
        Row: {
          ano: number | null
          categoria_macro: string | null
          mes: number | null
          total_registros: number | null
          total_valor: number | null
        }
        Relationships: []
      }
      view_stockout_por_categoria: {
        Row: {
          categoria_grupo: string | null
          data_consulta: string | null
          ordem: number | null
          percentual_stockout: number | null
          produtos_stockout: number | null
          total_produtos_ativos: number | null
        }
        Relationships: []
      }
      view_top_produtos: {
        Row: {
          bar_id: number | null
          custo_total: number | null
          grupo: string | null
          margem_lucro_percentual: number | null
          primeira_venda: string | null
          produto: string | null
          quantidade_total: number | null
          total_vendas: number | null
          ultima_venda: string | null
          valor_total: number | null
          vendas_por_dia: Json | null
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
      view_visao_geral_anual: {
        Row: {
          ano: number | null
          bar_id: number | null
          faturamento_contahub: number | null
          faturamento_sympla: number | null
          faturamento_total: number | null
          faturamento_yuzer: number | null
          pessoas_contahub: number | null
          pessoas_sympla: number | null
          pessoas_total: number | null
          pessoas_yuzer: number | null
          reputacao_media: number | null
        }
        Relationships: []
      }
      whatsapp_active_alerts: {
        Row: {
          alert_id: string | null
          checklist_id: string | null
          execution_id: string | null
          id: string | null
          message: string | null
          sent_at: string | null
          status: string | null
          to_number: string | null
          type: string | null
        }
        Insert: {
          alert_id?: string | null
          checklist_id?: string | null
          execution_id?: string | null
          id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string | null
          type?: string | null
        }
        Update: {
          alert_id?: string | null
          checklist_id?: string | null
          execution_id?: string | null
          id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string | null
          type?: string | null
        }
        Relationships: []
      }
      whatsapp_message_stats: {
        Row: {
          date: string | null
          delivered_messages: number | null
          failed_messages: number | null
          pending_messages: number | null
          sent_messages: number | null
          total_messages: number | null
        }
        Relationships: []
      }
      whatsapp_pending_reminders: {
        Row: {
          checklist_id: string | null
          execution_id: string | null
          id: string | null
          message: string | null
          sent_at: string | null
          status: string | null
          to_number: string | null
        }
        Insert: {
          checklist_id?: string | null
          execution_id?: string | null
          id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string | null
        }
        Update: {
          checklist_id?: string | null
          execution_id?: string | null
          id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string | null
          to_number?: string | null
        }
        Relationships: []
      }
      yuzer_resumo2: {
        Row: {
          data_evento: string | null
          evento_id: number | null
          faturamento_bruto: number | null
          nome_evento: string | null
          quantidade_pedidos: number | null
          status_evento: string | null
          valor_liquido: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_api_credentials:
        | {
            Args: { p_bar_id: number }
            Returns: {
              access_token: string
              ambiente: string
              ativo: boolean
              atualizado_em: string
              authorization_code: string
              bar_id: number
              base_url: string
              client_id: string
              client_secret: string
              criado_em: string
              empresa_cnpj: string
              empresa_id: string
              empresa_nome: string
              expires_at: string
              id: number
              last_token_refresh: string
              oauth_state: string
              redirect_uri: string
              refresh_token: string
              scopes: string
              sistema: string
              token_refresh_count: number
              token_type: string
            }[]
          }
        | {
            Args: { p_ambiente: string; p_bar_id: number; p_sistema: string }
            Returns: {
              access_token: string
              ambiente: string
              ativo: boolean
              atualizado_em: string
              authorization_code: string
              bar_id: number
              base_url: string
              client_id: string
              client_secret: string
              criado_em: string
              empresa_cnpj: string
              empresa_id: string
              empresa_nome: string
              expires_at: string
              id: number
              last_token_refresh: string
              oauth_state: string
              redirect_uri: string
              refresh_token: string
              scopes: string
              sistema: string
              token_refresh_count: number
              token_type: string
            }[]
          }
      admin_get_credentials_by_bar:
        | {
            Args: { p_bar_id: number }
            Returns: {
              access_token: string
              ativo: boolean
              auth_url: string
              bar_id: number
              client_id: string
              client_secret: string
              created_at: string
              expires_at: string
              id: number
              nome: string
              redirect_uri: string
              refresh_token: string
              scope: string
              token_url: string
              updated_at: string
            }[]
          }
        | {
            Args: { p_ambiente: string; p_bar_id: number; p_sistema: string }
            Returns: {
              access_token: string
              ambiente: string
              ativo: boolean
              atualizado_em: string
              authorization_code: string
              bar_id: number
              base_url: string
              client_id: string
              client_secret: string
              criado_em: string
              empresa_cnpj: string
              empresa_id: string
              empresa_nome: string
              expires_at: string
              id: number
              last_token_refresh: string
              oauth_state: string
              redirect_uri: string
              refresh_token: string
              scopes: string
              sistema: string
              token_refresh_count: number
              token_type: string
            }[]
          }
      admin_get_credentials_by_state: {
        Args: {
          p_ambiente: string
          p_bar_id: number
          p_oauth_state: string
          p_sistema: string
        }
        Returns: {
          access_token: string
          ambiente: string
          bar_id: number
          client_id: string
          client_secret: string
          id: number
          oauth_state: string
          redirect_uri: string
          refresh_token: string
          sistema: string
        }[]
      }
      admin_save_tokens: {
        Args: {
          p_access_token: string
          p_authorization_code: string
          p_credential_id: number
          p_expires_at: string
          p_refresh_token: string
          p_token_type: string
        }
        Returns: undefined
      }
      admin_upsert_api_credentials: {
        Args: {
          p_ambiente: string
          p_ativo: boolean
          p_bar_id: number
          p_base_url: string
          p_client_id: string
          p_client_secret: string
          p_oauth_state?: string
          p_redirect_uri: string
          p_scopes: string
          p_sistema: string
        }
        Returns: number
      }
      advanced_system_health: { Args: never; Returns: Json }
      agendar_reprocessamento_automatico: {
        Args: { data_evento: string }
        Returns: string
      }
      agora_brasil: { Args: never; Returns: string }
      aplicar_desconto_qr: {
        Args: {
          p_bar_id?: number
          p_funcionario_id?: string
          p_qr_token: string
          p_valor_desconto: number
        }
        Returns: Json
      }
      auto_recalculo_eventos_pendentes:
        | {
            Args: never
            Returns: {
              detalhes: Json
              tempo_execucao_segundos: number
              total_erros: number
              total_processados: number
              total_sucesso: number
            }[]
          }
        | {
            Args: { p_tipo_execucao?: string }
            Returns: {
              detalhes: Json
              log_id: number
              tempo_execucao_segundos: number
              total_erros: number
              total_processados: number
              total_sucesso: number
            }[]
          }
      auto_update_tempo_dia_date: { Args: never; Returns: string }
      buscar_retry_pendentes: {
        Args: never
        Returns: {
          data_evento: string
          detalhes: Json
          id: number
          max_tentativas: number
          proxima_tentativa: string
          tentativa_atual: number
          tipo_sync: string
          ultimo_erro: string
        }[]
      }
      calcular_atrasos_periodo: {
        Args: { p_bar_id?: number; p_data_fim: string; p_data_inicio: string }
        Returns: {
          atrasos_bar: number
          atrasos_cozinha: number
        }[]
      }
      calcular_proxima_execucao: {
        Args: {
          configuracao_frequencia: Json
          frequencia: string
          hora_execucao: string
          ultima_execucao?: string
        }
        Returns: string
      }
      calcular_totais_contaazul: {
        Args: {
          bar_id_param: number
          data_fim_param: string
          data_inicio_param: string
        }
        Returns: {
          qtd_despesas: number
          qtd_receitas: number
          saldo_liquido: number
          total_despesas: number
          total_receitas: number
          total_registros: number
        }[]
      }
      calculate_evento_metrics: {
        Args: { evento_id: number }
        Returns: undefined
      }
      calculate_rolling_stddev: {
        Args: {
          p_bar_id: number
          p_metric_name: string
          p_window_days?: number
        }
        Returns: number
      }
      check_automation_health: { Args: never; Returns: Json }
      check_eventos_cache_status: {
        Args: never
        Returns: {
          registros_cache: number
          status: string
          tabela: string
          ultima_atualizacao: string
        }[]
      }
      cleanup_contahub_duplicates: { Args: never; Returns: Json }
      cleanup_expired_cache: { Args: never; Returns: string }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_backups: {
        Args: { retention_days?: number }
        Returns: {
          deleted_backups: number
          deleted_files: number
        }[]
      }
      compress_old_raw_data: { Args: never; Returns: string }
      consultar_qr_fidelidade: {
        Args: {
          p_bar_id?: number
          p_funcionario_id?: string
          p_ip_origem?: unknown
          p_qr_token: string
        }
        Returns: Json
      }
      contahub_historical_sync: {
        Args: { p_bar_id?: number; p_data_date: string }
        Returns: number
      }
      contahub_weekly_correction: { Args: never; Returns: Json }
      contahub_weekly_correction_with_api: { Args: never; Returns: Json }
      creditar_mensalidade_automatica: { Args: never; Returns: undefined }
      detect_trend: {
        Args: { p_bar_id: number; p_days?: number; p_metric_name: string }
        Returns: string
      }
      exec_sql: { Args: { sql: string }; Returns: undefined }
      executar_coleta_contaazul_v3_com_discord: { Args: never; Returns: string }
      executar_coleta_contaazul_v4_com_discord: { Args: never; Returns: string }
      executar_reprocessamento_diario: {
        Args: never
        Returns: {
          eventos_processados: string[]
          tempo_execucao: unknown
          total_marcados: number
          total_processados: number
        }[]
      }
      executar_sync_prodporhora_diario: { Args: never; Returns: Json }
      executar_validacao_completa: { Args: never; Returns: string }
      execute_security_monitoring: { Args: never; Returns: Json }
      fix_cron_jobs_admin: { Args: never; Returns: Json }
      formatar_data_brasil: { Args: { data: string }; Returns: string }
      generate_permanent_service_token: { Args: never; Returns: string }
      generate_security_report: {
        Args: never
        Returns: {
          details: string
          issue_type: string
          status: string
        }[]
      }
      get_current_service_token: { Args: never; Returns: string }
      get_dre_consolidada: {
        Args: { p_ano: number; p_mes: number }
        Returns: {
          atividade: string
          categoria_dre: string
          origem: string
          valor_automatico: number
          valor_manual: number
          valor_total: number
        }[]
      }
      get_resumo_semanal_produtos: {
        Args: {
          p_bar_id?: number
          p_data_final: string
          p_data_inicial: string
        }
        Returns: {
          data_exemplo: string
          dia_semana: string
          faturamento_total: number
          grupo_produto: string
          horario_pico: number
          produto_mais_vendido: string
          produtos_unicos: number
          quantidade_pico: number
          total_produtos_vendidos: number
        }[]
      }
      get_service_role_key: { Args: never; Returns: string }
      historico_recalculo_automatico: {
        Args: { p_dias?: number }
        Returns: {
          data: string
          execucoes: number
          tempo_medio_segundos: number
          tipos_execucao: string[]
          total_erros: number
          total_eventos_processados: number
          total_sucessos: number
        }[]
      }
      insert_raw_data_without_trigger: {
        Args: {
          p_bar_id: number
          p_data_date: string
          p_data_type: string
          p_processed?: boolean
          p_raw_json?: Json
        }
        Returns: number
      }
      install_extension_safely: {
        Args: { extension_name: string }
        Returns: undefined
      }
      limpar_retry_antigos: { Args: never; Returns: number }
      limpar_valor_monetario: { Args: { valor_texto: string }; Returns: number }
      log_audit_event: {
        Args: {
          p_bar_id: number
          p_category?: string
          p_changes?: Json
          p_description?: string
          p_endpoint?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_method?: string
          p_new_values?: Json
          p_old_values?: Json
          p_operation: string
          p_record_id?: string
          p_request_id?: string
          p_session_id?: string
          p_severity?: string
          p_table_name?: string
          p_user_agent?: string
          p_user_email?: string
          p_user_id?: string
          p_user_role?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          event_description: string
          event_type: string
          metadata?: Json
          user_id?: string
        }
        Returns: undefined
      }
      marcar_eventos_para_reprocessamento_diario: {
        Args: never
        Returns: string
      }
      mark_security_config_completed: {
        Args: { completion_notes?: string; config_id: number }
        Returns: undefined
      }
      process_analitico_data: {
        Args: { p_bar_id: number; p_data_array: Json; p_data_date: string }
        Returns: number
      }
      process_fatporhora_data: {
        Args: { p_bar_id: number; p_data_array: Json; p_data_date: string }
        Returns: number
      }
      process_pagamentos_data: {
        Args: { p_bar_id: number; p_data_array: Json; p_data_date: string }
        Returns: number
      }
      process_periodo_data: {
        Args: { p_bar_id: number; p_data_array: Json; p_data_date: string }
        Returns: number
      }
      process_tempo_data: {
        Args: { p_bar_id: number; p_data_array: Json; p_data_date: string }
        Returns: number
      }
      processar_eventos_diario_cron: { Args: never; Returns: string }
      processar_eventos_pendentes: {
        Args: { limite?: number }
        Returns: {
          evento_id: number
          processados: number
        }[]
      }
      processar_pagamento_aprovado: {
        Args: {
          p_credito_mensal?: number
          p_membro_id: string
          p_valor_pagamento: number
        }
        Returns: Json
      }
      processar_transacao_fidelidade: {
        Args: {
          p_aprovado_por?: string
          p_bar_id?: number
          p_descricao?: string
          p_membro_id: string
          p_origem?: string
          p_tipo: string
          p_valor: number
        }
        Returns: Json
      }
      recalcular_eventos_pendentes: { Args: never; Returns: number }
      refresh_eventos_cache: {
        Args: { p_bar_id?: number; p_data_fim?: string; p_data_inicio?: string }
        Returns: number
      }
      refresh_eventos_cache_mes: {
        Args: { p_ano: number; p_mes: number }
        Returns: number
      }
      registrar_falha_sync: {
        Args: {
          data_evento: string
          detalhes_json?: Json
          erro_descricao: string
          tipo_sync: string
        }
        Returns: undefined
      }
      registrar_sucesso_sync: {
        Args: { data_evento: string; detalhes_json?: Json; tipo_sync: string }
        Returns: undefined
      }
      registrar_validacao_automatica: {
        Args: { p_data_evento: string; p_valor_esperado: number }
        Returns: undefined
      }
      run_security_checks: {
        Args: never
        Returns: {
          check_name: string
          message: string
          status: string
        }[]
      }
      safe_int: { Args: { text_val: string }; Returns: number }
      safe_numeric: { Args: { text_val: string }; Returns: number }
      status_calculos_eventos: {
        Args: never
        Returns: {
          eventos_calculados: number
          eventos_pendentes: number
          total_eventos: number
          ultima_atualizacao: string
          versao_calculo_atual: number
        }[]
      }
      status_recalculo_automatico: {
        Args: never
        Returns: {
          eventos_pendentes: number
          eventos_processados_hoje: number
          jobs_ativos: number
          proxima_execucao_continuo: string
          proxima_execucao_pos_contahub: string
          tipo_ultima_execucao: string
          ultima_execucao: string
        }[]
      }
      sync_contahub_daily: { Args: never; Returns: undefined }
      sync_contahub_prodporhora_daily: { Args: never; Returns: undefined }
      sync_eventos_after_contahub: {
        Args: { p_bar_id?: number; p_data_evento: string }
        Returns: Json
      }
      sync_getin_continuous: { Args: never; Returns: Json }
      sync_nibo_continuous: { Args: never; Returns: Json }
      sync_nibo_monthly_validation: { Args: never; Returns: Json }
      sync_nibo_monthly_validation_conditional: { Args: never; Returns: Json }
      trigger_nibo_orchestrator: { Args: { p_batch_id: string }; Returns: Json }
      update_daily_security_metrics: { Args: never; Returns: undefined }
      update_service_token: { Args: { new_token: string }; Returns: boolean }
      upsert_getin_reserva:
        | {
            Args: {
              p_dados_brutos?: Json
              p_data_reserva: string
              p_email?: string
              p_external_id?: string
              p_horario: string
              p_mesa?: string
              p_nome_cliente: string
              p_observacoes?: string
              p_origem?: string
              p_pessoas: number
              p_status: string
              p_telefone?: string
            }
            Returns: {
              inserted: boolean
              reserva_id: number
            }[]
          }
        | {
            Args: {
              p_bar_id: number
              p_cliente_email: string
              p_cliente_nome: string
              p_cliente_telefone: string
              p_data_reserva: string
              p_hora_reserva: string
              p_id_externo: string
              p_mesa_numero: string
              p_numero_pessoas: number
              p_observacoes: string
              p_raw_data: Json
              p_status: string
              p_unit_id: string
              p_unit_name: string
              p_valor_consumacao: number
              p_valor_entrada: number
            }
            Returns: number
          }
      validar_integridade_contahub: {
        Args: { data_inicio?: string }
        Returns: {
          data_evento: string
          diferenca_registros: number
          diferenca_valor: number
          precisa_correcao: boolean
          registros_coletados: number
          registros_processados: number
          status_integridade: string
          valor_atual: number
          valor_esperado: number
        }[]
      }
      validar_valores_contahub: {
        Args: { data_evento: string; valor_esperado: number }
        Returns: {
          data_validacao: string
          diferenca: number
          percentual_diferenca: number
          requer_correcao: boolean
          status_validacao: string
          valor_banco: number
          valor_sistema: number
        }[]
      }
      validate_views_security: {
        Args: never
        Returns: {
          is_secure: boolean
          security_status: string
          view_name: string
        }[]
      }
      verificar_execucoes_pendentes: {
        Args: never
        Returns: {
          data_execucao: string
          execucao_id: number
          resultado_execucao: Json
          status_execucao: string
        }[]
      }
      verify_security_status: {
        Args: never
        Returns: {
          category: string
          secure_items: number
          status: string
          total_items: number
        }[]
      }
    }
    Enums: {
      frequencia_enum:
        | "diaria"
        | "semanal"
        | "quinzenal"
        | "mensal"
        | "bimestral"
        | "trimestral"
        | "conforme_necessario"
      nivel_acesso_enum: "admin" | "gerente" | "supervisor" | "funcionario"
      prioridade_enum: "baixa" | "media" | "alta" | "critica"
      status_agendamento_enum:
        | "agendado"
        | "executando"
        | "concluido"
        | "atrasado"
        | "cancelado"
      status_checklist_enum: "ativo" | "inativo" | "rascunho" | "arquivado"
      status_execucao_enum:
        | "iniciado"
        | "em_andamento"
        | "concluido"
        | "cancelado"
        | "com_problemas"
      status_notificacao_enum: "pendente" | "enviada" | "lida" | "erro"
      status_usuario_enum: "ativo" | "inativo" | "suspenso"
      tipo_acao_enum:
        | "criar"
        | "editar"
        | "excluir"
        | "executar"
        | "cancelar"
        | "aprovar"
        | "rejeitar"
      tipo_campo_enum:
        | "texto"
        | "numero"
        | "sim_nao"
        | "data"
        | "assinatura"
        | "foto_camera"
        | "foto_upload"
        | "avaliacao"
        | "multipla_escolha"
        | "checkbox_list"
      tipo_checklist_enum:
        | "abertura"
        | "fechamento"
        | "manutencao"
        | "qualidade"
        | "seguranca"
        | "limpeza"
        | "auditoria"
      tipo_notificacao_enum:
        | "lembrete"
        | "atraso"
        | "problema"
        | "conclusao"
        | "sistema"
    }
    CompositeTypes: {
      [_ in never]: never
    }
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

export const Constants = {
  public: {
    Enums: {
      frequencia_enum: [
        "diaria",
        "semanal",
        "quinzenal",
        "mensal",
        "bimestral",
        "trimestral",
        "conforme_necessario",
      ],
      nivel_acesso_enum: ["admin", "gerente", "supervisor", "funcionario"],
      prioridade_enum: ["baixa", "media", "alta", "critica"],
      status_agendamento_enum: [
        "agendado",
        "executando",
        "concluido",
        "atrasado",
        "cancelado",
      ],
      status_checklist_enum: ["ativo", "inativo", "rascunho", "arquivado"],
      status_execucao_enum: [
        "iniciado",
        "em_andamento",
        "concluido",
        "cancelado",
        "com_problemas",
      ],
      status_notificacao_enum: ["pendente", "enviada", "lida", "erro"],
      status_usuario_enum: ["ativo", "inativo", "suspenso"],
      tipo_acao_enum: [
        "criar",
        "editar",
        "excluir",
        "executar",
        "cancelar",
        "aprovar",
        "rejeitar",
      ],
      tipo_campo_enum: [
        "texto",
        "numero",
        "sim_nao",
        "data",
        "assinatura",
        "foto_camera",
        "foto_upload",
        "avaliacao",
        "multipla_escolha",
        "checkbox_list",
      ],
      tipo_checklist_enum: [
        "abertura",
        "fechamento",
        "manutencao",
        "qualidade",
        "seguranca",
        "limpeza",
        "auditoria",
      ],
      tipo_notificacao_enum: [
        "lembrete",
        "atraso",
        "problema",
        "conclusao",
        "sistema",
      ],
    },
  },
} as const
