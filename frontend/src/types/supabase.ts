export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      usuarios_bar: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          bar_id: number | null
          bio: string | null
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']