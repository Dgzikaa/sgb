// Tipos para a tabela eventos com as novas colunas de indicadores
export interface Evento {
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
  
  // Novas colunas de indicadores financeiros e operacionais
  real_r: number | null           // Real (R$) - Faturamento real do evento
  m1_r: number | null             // M1 (R$) - Meta 1 do evento
  cl_plan: number | null          // Cl.Plan - Cliente planejado
  cl_real: number | null          // Cl.Real - Cliente real
  res_tot: number | null          // Res.Tot - Reservas totais
  res_p: number | null            // Res.P - Reservas pagas
  lot_max: number | null          // Lot.Max - Lotação máxima
  te_plan: number | null          // T.E.Plan - Ticket médio planejado
  te_real: number | null          // T.E.Real - Ticket médio real
  tb_plan: number | null          // T.B.Plan - Ticket bebida planejado
  tb_real: number | null          // T.B.Real - Ticket bebida real
  t_medio: number | null          // T.Médio - Ticket médio geral
  c_art: number | null            // C.Art - Custo artista
  c_prod: number | null           // C.Prod - Custo produção
  percent_art_fat: number | null  // %Art/Fat - Percentual artista sobre faturamento
  percent_b: number | null        // %B - Percentual bebida
  percent_d: number | null        // %D - Percentual despesa
  percent_c: number | null        // %C - Percentual custo
  t_coz: number | null            // T.Coz - Ticket cozinha
  t_bar: number | null            // T.Bar - Ticket bar
  fat_19h: number | null          // Fat.19h - Faturamento às 19h
}

export interface EventoInsert {
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

export interface EventoUpdate {
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

// Tipos para o calendário
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    id: number
    nome: string
    artista: string | null
    genero: string | null
    observacoes: string | null
    // Novos campos de indicadores
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
} 