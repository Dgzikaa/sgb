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
      receitas: {
        Row: {
          id: number
          bar_id: number
          receita_codigo: string
          receita_nome: string
          receita_categoria: string | null
          tipo_local: string | null
          rendimento_esperado: number | null
          observacoes: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id: number
          receita_codigo: string
          receita_nome: string
          receita_categoria?: string | null
          tipo_local?: string | null
          rendimento_esperado?: number | null
          observacoes?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number
          receita_codigo?: string
          receita_nome?: string
          receita_categoria?: string | null
          tipo_local?: string | null
          rendimento_esperado?: number | null
          observacoes?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receitas_insumos: {
        Row: {
          id: number
          receita_id: number
          insumo_id: number | null
          receita_insumo_id: number | null
          quantidade_necessaria: number
          unidade_medida: string | null
          is_chefe: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          receita_id: number
          insumo_id?: number | null
          receita_insumo_id?: number | null
          quantidade_necessaria: number
          unidade_medida?: string | null
          is_chefe?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          receita_id?: number
          insumo_id?: number | null
          receita_insumo_id?: number | null
          quantidade_necessaria?: number
          unidade_medida?: string | null
          is_chefe?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      insumos: {
        Row: {
          id: number
          bar_id: number
          codigo: string
          nome: string
          tipo_local: string | null
          categoria: string | null
          unidade_medida: string | null
          custo_unitario: number | null
          observacoes: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id: number
          codigo: string
          nome: string
          tipo_local?: string | null
          categoria?: string | null
          unidade_medida?: string | null
          custo_unitario?: number | null
          observacoes?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number
          codigo?: string
          nome?: string
          tipo_local?: string | null
          categoria?: string | null
          unidade_medida?: string | null
          custo_unitario?: number | null
          observacoes?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      producoes: {
        Row: {
          id: number
          bar_id: number
          receita_codigo: string
          receita_nome: string
          receita_categoria: string | null
          criado_por_nome: string | null
          inicio_producao: string | null
          fim_producao: string | null
          peso_bruto_proteina: number | null
          peso_limpo_proteina: number | null
          rendimento_real: number | null
          rendimento_esperado: number | null
          percentual_aderencia_receita: number | null
          observacoes: string | null
          insumo_chefe_id: number | null
          insumo_chefe_nome: string | null
          peso_insumo_chefe: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id: number
          receita_codigo: string
          receita_nome: string
          receita_categoria?: string | null
          criado_por_nome?: string | null
          inicio_producao?: string | null
          fim_producao?: string | null
          peso_bruto_proteina?: number | null
          peso_limpo_proteina?: number | null
          rendimento_real?: number | null
          rendimento_esperado?: number | null
          percentual_aderencia_receita?: number | null
          observacoes?: string | null
          insumo_chefe_id?: number | null
          insumo_chefe_nome?: string | null
          peso_insumo_chefe?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number
          receita_codigo?: string
          receita_nome?: string
          receita_categoria?: string | null
          criado_por_nome?: string | null
          inicio_producao?: string | null
          fim_producao?: string | null
          peso_bruto_proteina?: number | null
          peso_limpo_proteina?: number | null
          rendimento_real?: number | null
          rendimento_esperado?: number | null
          percentual_aderencia_receita?: number | null
          observacoes?: string | null
          insumo_chefe_id?: number | null
          insumo_chefe_nome?: string | null
          peso_insumo_chefe?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      producoes_insumos: {
        Row: {
          id: number
          producao_id: number
          insumo_id: number
          insumo_codigo: string | null
          insumo_nome: string
          quantidade_necessaria: number | null
          quantidade_calculada: number | null
          quantidade_real: number | null
          unidade_medida: string | null
          is_chefe: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          producao_id: number
          insumo_id: number
          insumo_codigo?: string | null
          insumo_nome: string
          quantidade_necessaria?: number | null
          quantidade_calculada?: number | null
          quantidade_real?: number | null
          unidade_medida?: string | null
          is_chefe?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          producao_id?: number
          insumo_id?: number
          insumo_codigo?: string | null
          insumo_nome?: string
          quantidade_necessaria?: number | null
          quantidade_calculada?: number | null
          quantidade_real?: number | null
          unidade_medida?: string | null
          is_chefe?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      contagem_estoque_insumos: {
        Row: {
          id: number
          bar_id: number
          insumo_id: number
          data_contagem: string
          estoque_inicial: number | null
          estoque_final: number
          quantidade_pedido: number | null
          consumo_calculado: number | null
          custo_total: number | null
          tipo_local: string | null
          categoria: string | null
          unidade_medida: string | null
          custo_unitario: number | null
          observacoes: string | null
          usuario_contagem: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bar_id: number
          insumo_id: number
          data_contagem: string
          estoque_inicial?: number | null
          estoque_final: number
          quantidade_pedido?: number | null
          consumo_calculado?: number | null
          custo_total?: number | null
          tipo_local?: string | null
          categoria?: string | null
          unidade_medida?: string | null
          custo_unitario?: number | null
          observacoes?: string | null
          usuario_contagem?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          bar_id?: number
          insumo_id?: number
          data_contagem?: string
          estoque_inicial?: number | null
          estoque_final?: number
          quantidade_pedido?: number | null
          consumo_calculado?: number | null
          custo_total?: number | null
          tipo_local?: string | null
          categoria?: string | null
          unidade_medida?: string | null
          custo_unitario?: number | null
          observacoes?: string | null
          usuario_contagem?: string | null
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
