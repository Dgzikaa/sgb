/**
 * ContaHub Service Helper
 * Gerencia integraá§á£o com ContaHub e detecta quando está¡ em modo manutená§á£o
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
 * Verifica se o ContaHub está¡ disponá­vel (variá¡veis de ambiente configuradas)
 */
export function verificarStatusContaHub(): ContaHubStatus {
  const email = process.env.CONTAHUB_EMAIL;
  const senha = process.env.CONTAHUB_PASSWORD;
  
  const emailConfigurado = !!email;
  const senhaConfigurada = !!senha;
  const disponivel = emailConfigurado && senhaConfigurada;
  
  return {
    disponivel,
    motivo: !disponivel ? 'Credenciais do ContaHub temporariamente indisponá­veis' : undefined,
    detalhes: {
      email_configurado: emailConfigurado,
      senha_configurada: senhaConfigurada
    }
  };
}

/**
 * Cria uma resposta padrá£o para quando ContaHub está¡ em manutená§á£o
 */
export function criarRespostaManutencao<T = any>(acao: string): ContaHubResponse<T> {
  const status = verificarStatusContaHub();
  
  return {
    success: false,
    message: `${acao} temporariamente indisponá­vel - ContaHub em manutená§á£o`,
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
 * Verifica se deve executar operaá§á£o ContaHub ou retornar modo manutená§á£o
 */
export function verificarDisponibilidadeContaHub(acao: string): ContaHubResponse | null {
  const status = verificarStatusContaHub();
  
  if (!status.disponivel) {
    return criarRespostaManutencao(acao);
  }
  
  return null; // ContaHub disponá­vel, pode prosseguir
} 
