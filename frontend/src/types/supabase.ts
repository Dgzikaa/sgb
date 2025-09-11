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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][TableName] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
