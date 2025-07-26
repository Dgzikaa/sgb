// Tipos gerados do Supabase
// ATENÇÃO: Este arquivo é gerado automaticamente. Não edite manualmente!

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      // ... existing tables ...
      eventos: {
        Row: {
          id: number
          data_evento: string
          dia_semana: string | null
          semana: number | null
          nome: string
          artista: string | null
          genero: string | null
          observacoes: string | null
          criado_em: string | null
          atualizado_em: string | null
          // Novas colunas de indicadores
          real_r: number | null
          m1_r: number | null
          cl_plan: number | null
          cl_real: number | null
          res_tot: number | null
          res_p: number | null
          lot_max: number | null
          te_plan: number | null
          te_real: number | null
          tb_plan: number | null
          tb_real: number | null
          t_medio: number | null
          c_art: number | null
          c_prod: number | null
          percent_art_fat: number | null
          percent_b: number | null
          percent_d: number | null
          percent_c: number | null
          t_coz: number | null
          t_bar: number | null
          fat_19h: number | null
        }
        Insert: {
          id?: number
          data_evento: string
          dia_semana?: string | null
          semana?: number | null
          nome: string
          artista?: string | null
          genero?: string | null
          observacoes?: string | null
          criado_em?: string | null
          atualizado_em?: string | null
          // Novas colunas de indicadores
          real_r?: number | null
          m1_r?: number | null
          cl_plan?: number | null
          cl_real?: number | null
          res_tot?: number | null
          res_p?: number | null
          lot_max?: number | null
          te_plan?: number | null
          te_real?: number | null
          tb_plan?: number | null
          tb_real?: number | null
          t_medio?: number | null
          c_art?: number | null
          c_prod?: number | null
          percent_art_fat?: number | null
          percent_b?: number | null
          percent_d?: number | null
          percent_c?: number | null
          t_coz?: number | null
          t_bar?: number | null
          fat_19h?: number | null
        }
        Update: {
          id?: number
          data_evento?: string
          dia_semana?: string | null
          semana?: number | null
          nome?: string
          artista?: string | null
          genero?: string | null
          observacoes?: string | null
          criado_em?: string | null
          atualizado_em?: string | null
          // Novas colunas de indicadores
          real_r?: number | null
          m1_r?: number | null
          cl_plan?: number | null
          cl_real?: number | null
          res_tot?: number | null
          res_p?: number | null
          lot_max?: number | null
          te_plan?: number | null
          te_real?: number | null
          tb_plan?: number | null
          tb_real?: number | null
          t_medio?: number | null
          c_art?: number | null
          c_prod?: number | null
          percent_art_fat?: number | null
          percent_b?: number | null
          percent_d?: number | null
          percent_c?: number | null
          t_coz?: number | null
          t_bar?: number | null
          fat_19h?: number | null
        }
        Relationships: []
      }
      // ... other tables ...
    }
    // ... rest of the types ...
  }
}
