/**
 * ContaHub Service Helper
 * Gerencia integração com ContaHub e detecta quando está em modo manutenção
 */

export interface ContaHubStatus {
  disponivel: boolean;
  motivo?: string;
  detalhes?: {
    email_configurado: boolean;
    senha_configurada: boolean;
  };
}

export interface ContaHubResponse<T = (unknown)> {
  success: boolean;
  data?: T;
  message: string;
  manutencao?: boolean;
  status?: ContaHubStatus;
}

/**
 * Verifica se o ContaHub está disponível (variáveis de ambiente configuradas)
 */
export function verificarStatusContaHub(): ContaHubStatus {
  const email = process.env.CONTAHUB_EMAIL;
  const senha = process.env.CONTAHUB_PASSWORD;
  
  const emailConfigurado = !!email;
  const senhaConfigurada = !!senha;
  const disponivel = emailConfigurado && senhaConfigurada;
  
  return {
    disponivel,
    motivo: !disponivel ? 'Credenciais do ContaHub temporariamente indisponíveis' : undefined,
    detalhes: {
      email_configurado: emailConfigurado,
      senha_configurada: senhaConfigurada
    }
  };
}

/**
 * Cria uma resposta padrão para quando ContaHub está em manutenção
 */
export function criarRespostaManutencao<T = (unknown)>(acao: string): ContaHubResponse<T> {
  const status = verificarStatusContaHub();
  
  return {
    success: false,
    message: `${acao} temporariamente indisponível - ContaHub em manutenção`,
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
 * Verifica se deve executar operação ContaHub ou retornar modo manutenção
 */
export function verificarDisponibilidadeContaHub(acao: string): ContaHubResponse | null {
  const status = verificarStatusContaHub();
  
  if (!status.disponivel) {
    return criarRespostaManutencao(acao);
  }
  
  return null; // ContaHub disponível, pode prosseguir
} 
