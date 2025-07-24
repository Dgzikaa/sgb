// =====================================================
// 🇧🇷 TIMEZONE UTILS - BRASÍLIA (UTC-3)
// Centraliza todas as operações de data/hora no timezone do Brasil
// =====================================================

export const BRASIL_TIMEZONE = 'America/Sao_Paulo';
export const BRASIL_LOCALE = 'pt-BR';

// =====================================================
// 📅 FUNÇÕES DE DATA
// =====================================================

/**
 * Retorna a data/hora atual no timezone do Brasil
 */
export function agora(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BRASIL_TIMEZONE }));
}

/**
 * Converte qualquer data para o timezone do Brasil
 */
export function paraBrasilia(data: string | Date): Date {
  const dateObj = typeof data === 'string' ? new Date(data) : data;
  return new Date(dateObj.toLocaleString("en-US", { timeZone: BRASIL_TIMEZONE }));
}

/**
 * Formata data no padrão brasileiro
 */
export function formatarData(data: string | Date): string {
  if (!data) return 'N/A';
  
  try {
    const dateObj = paraBrasilia(data);
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat(BRASIL_LOCALE, {
      timeZone: BRASIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  } catch {
    return 'N/A';
  }
}

/**
 * Formata data e hora no padrão brasileiro
 */
export function formatarDataHora(data: string | Date): string {
  if (!data) return 'N/A';
  
  try {
    const dateObj = paraBrasilia(data);
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat(BRASIL_LOCALE, {
      timeZone: BRASIL_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch {
    return 'N/A';
  }
}

/**
 * Formata apenas a hora no padrão brasileiro
 */
export function formatarHora(data: string | Date): string {
  if (!data) return 'N/A';
  
  try {
    const dateObj = paraBrasilia(data);
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat(BRASIL_LOCALE, {
      timeZone: BRASIL_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch {
    return 'N/A';
  }
}

/**
 * Retorna timestamp ISO no timezone do Brasil
 */
export function timestampBrasilia(): string {
  return agora().toISOString();
}

/**
 * Converte data para string ISO mantendo timezone do Brasil
 */
export function paraISOBrasilia(data: string | Date): string {
  return paraBrasilia(data).toISOString();
}

// =====================================================
// 📊 FUNÇÕES DE RELATÓRIO
// =====================================================

/**
 * Retorna data de hoje no formato YYYY-MM-DD (Brasil)
 */
export function dataHojeBrasil(): string {
  const hoje = agora();
  return hoje.toISOString().split('T')[0];
}

/**
 * Retorna primeiro dia do mês atual (Brasil)
 */
export function primeiroDiaDoMes(): string {
  const hoje = agora();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Retorna último dia do mês atual (Brasil)
 */
export function ultimoDiaDoMes(): string {
  const hoje = agora();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
}

/**
 * Retorna primeira segunda-feira da semana atual (Brasil)
 */
export function inicioSemana(): string {
  const hoje = agora();
  const diaSemana = hoje.getDay(); // 0 = domingo
  const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segundaFeira = new Date(hoje);
  segundaFeira.setDate(hoje.getDate() + diasParaSegunda);
  return segundaFeira.toISOString().split('T')[0];
}

/**
 * Retorna domingo da semana atual (Brasil)
 */
export function fimSemana(): string {
  const hoje = agora();
  const diaSemana = hoje.getDay();
  const diasParaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
  const domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() + diasParaDomingo);
  return domingo.toISOString().split('T')[0];
}

// =====================================================
// ⏰ FUNÇÕES DE TEMPO
// =====================================================

/**
 * Formata diferença de tempo em português
 */
export function formatarTempoRelativo(dataString: string): string {
  const data = paraBrasilia(dataString);
  const agoraBrasil = agora();
  const diff = agoraBrasil.getTime() - data.getTime();
  
  const minutos = Math.floor(diff / (1000 * 60));
  const horas = Math.floor(diff / (1000 * 60 * 60));
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `${minutos}min`;
  if (horas < 24) return `${horas}h`;
  if (dias < 7) return `${dias}d`;
  
  return formatarData(data);
}

/**
 * Verifica se é horário comercial no Brasil (8h-18h)
 */
export function isHorarioComercial(): boolean {
  const agoraBrasil = agora();
  const hora = agoraBrasil.getHours();
  return hora >= 8 && hora < 18;
}

/**
 * Verifica se é horário de relatório matinal (8h)
 */
export function isHorarioRelatorioMatinal(): boolean {
  const agoraBrasil = agora();
  return agoraBrasil.getHours() === 8;
}

// =====================================================
// 🔧 CONFIGURAÇÕES PARA COMPONENTES
// =====================================================

/**
 * Configuração padrão para Intl.DateTimeFormat (Brasil)
 */
export const formatoBrasileiroData = {
  timeZone: BRASIL_TIMEZONE,
  locale: BRASIL_LOCALE,
  day: '2-digit' as const,
  month: '2-digit' as const,
  year: 'numeric' as const
};

/**
 * Configuração padrão para Intl.DateTimeFormat com hora (Brasil)
 */
export const formatoBrasileiroDataHora = {
  timeZone: BRASIL_TIMEZONE,
  locale: BRASIL_LOCALE,
  day: '2-digit' as const,
  month: '2-digit' as const,
  year: 'numeric' as const,
  hour: '2-digit' as const,
  minute: '2-digit' as const
};

/**
 * Lista dos dias da semana em português
 */
export const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Lista dos meses em português
 */
export const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// =====================================================
// 📱 FUNÇÕES PARA LOGS E DEBUG
// =====================================================

/**
 * Log com timestamp do Brasil
 */
export function logBrasilia(message: string, ...args: unknown[]): void {
  const timestamp = formatarDataHora(agora());
  console.log(`[${timestamp}] ${message}`, ...args);
}

/**
 * Retorna informações de timezone para debug
 */
export function debugTimezone(): object {
  const agoraBrasil = agora();
  const agoraUTC = new Date();
  
  return {
    utc: agoraUTC.toISOString(),
    brasil: agoraBrasil.toISOString(),
    brasil_formatado: formatarDataHora(agoraBrasil),
    timezone: BRASIL_TIMEZONE,
    locale: BRASIL_LOCALE,
    offset_horas: (agoraUTC.getTime() - agoraBrasil.getTime()) / (1000 * 60 * 60)
  };
} 
