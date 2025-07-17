/**
 * ContaHub Service Helper
 * Gerencia integraÃ§Ã£o com ContaHub e detecta quando estÃ¡ em modo manutenÃ§Ã£o
 */

export interface ContaHubStatus {
  disponivel: boolean;
  motivo?: string;
  detalhes?: {
    email_configurado: boolean;
    senha_configurada: boolean;
  };
}

export interface ContaHubResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  manutencao?: boolean;
  status?: ContaHubStatus;
}

/**
 * Verifica se o ContaHub estÃ¡ disponÃ­vel (variÃ¡veis de ambiente configuradas)
 */
export function verificarStatusContaHub(): ContaHubStatus {
  const email = process.env.CONTAHUB_EMAIL;
  const senha = process.env.CONTAHUB_PASSWORD;
  
  const emailConfigurado = !!email;
  const senhaConfigurada = !!senha;
  const disponivel = emailConfigurado && senhaConfigurada;
  
  return {
    disponivel,
    motivo: !disponivel ? 'Credenciais do ContaHub temporariamente indisponÃ­veis' : undefined,
    detalhes: {
      email_configurado: emailConfigurado,
      senha_configurada: senhaConfigurada
    }
  };
}

/**
 * Cria uma resposta padrÃ£o para quando ContaHub estÃ¡ em manutenÃ§Ã£o
 */
export function criarRespostaManutencao<T = any>(acao: string): ContaHubResponse<T> {
  const status = verificarStatusContaHub();
  
  return {
    success: false,
    message: `${acao} temporariamente indisponÃ­vel - ContaHub em manutenÃ§Ã£o`,
    manutencao: true,
    status
  };
}

/**
 * Cria uma resposta de sucesso para ContaHub
 */
export function criarRespostaSucesso<T>(data: T, message: string): ContaHubResponse<T> {
  return {
    success: true,
    data,
    message,
    manutencao: false
  };
}

/**
 * Verifica se deve executar operaÃ§Ã£o ContaHub ou retornar modo manutenÃ§Ã£o
 */
export function verificarDisponibilidadeContaHub(acao: string): ContaHubResponse | null {
  const status = verificarStatusContaHub();
  
  if (!status.disponivel) {
    return criarRespostaManutencao(acao);
  }
  
  return null; // ContaHub disponÃ­vel, pode prosseguir
} 
