// Sistema de Compliance LGPD para Zykor
export interface DataSubject {
  id: string;
  email: string;
  name: string;
  phone?: string;
  document?: string;
  createdAt: number;
  lastActivity: number;
  consents: ConsentRecord[];
  dataProcessing: DataProcessingRecord[];
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  purpose: string;
  legalBasis: LegalBasis;
  consentGiven: boolean;
  consentDate: number;
  withdrawnDate?: number;
  source: string; // 'web', 'app', 'admin', 'import'
  ipAddress?: string;
  userAgent?: string;
  version: string; // versão do termo de consentimento
}

export interface DataProcessingRecord {
  id: string;
  dataSubjectId: string;
  activity: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  timestamp: number;
  processingSystem: string;
  retentionPeriod?: number; // em meses
  automated: boolean;
  metadata: Record<string, any>;
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataCategory: DataCategory;
  retentionPeriod: number; // em meses
  automaticDeletion: boolean;
  legalBasis: LegalBasis;
  exceptions: string[];
}

export interface PrivacyRequest {
  id: string;
  dataSubjectId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestDate: number;
  completionDate?: number;
  description: string;
  response?: string;
  handledBy?: string;
  urgency: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
}

export type LegalBasis = 
  | 'consent' 
  | 'contract' 
  | 'legal_obligation' 
  | 'vital_interests' 
  | 'public_task' 
  | 'legitimate_interests';

export type DataCategory = 
  | 'identification' 
  | 'contact' 
  | 'financial' 
  | 'behavioral' 
  | 'location' 
  | 'biometric' 
  | 'health' 
  | 'preferences'
  | 'usage_analytics';

// Configuração LGPD
export interface LGPDConfig {
  dataController: {
    name: string;
    document: string;
    address: string;
    email: string;
    phone: string;
    dpoEmail: string;
  };
  automaticDeletion: boolean;
  consentValidityMonths: number;
  responseDeadlineDays: number;
  auditLogRetentionMonths: number;
}

const DEFAULT_CONFIG: LGPDConfig = {
  dataController: {
    name: 'Zykor Tecnologia Ltda',
    document: '00.000.000/0001-00',
    address: 'São Paulo, SP',
    email: 'privacidade@zykor.com.br',
    phone: '+55 11 9999-9999',
    dpoEmail: 'dpo@zykor.com.br'
  },
  automaticDeletion: true,
  consentValidityMonths: 24,
  responseDeadlineDays: 15,
  auditLogRetentionMonths: 60
};

// Políticas de retenção padrão
const DEFAULT_RETENTION_POLICIES: DataRetentionPolicy[] = [
  {
    id: 'identification_data',
    name: 'Dados de Identificação',
    description: 'Nome, CPF, RG, dados pessoais básicos',
    dataCategory: 'identification',
    retentionPeriod: 60, // 5 anos
    automaticDeletion: true,
    legalBasis: 'legal_obligation',
    exceptions: ['legal_proceedings', 'tax_obligations']
  },
  {
    id: 'contact_data',
    name: 'Dados de Contato',
    description: 'Email, telefone, endereço',
    dataCategory: 'contact',
    retentionPeriod: 36, // 3 anos
    automaticDeletion: true,
    legalBasis: 'legitimate_interests',
    exceptions: ['active_customer']
  },
  {
    id: 'financial_data',
    name: 'Dados Financeiros',
    description: 'Informações de pagamento, transações',
    dataCategory: 'financial',
    retentionPeriod: 60, // 5 anos (obrigação legal)
    automaticDeletion: false,
    legalBasis: 'legal_obligation',
    exceptions: ['tax_obligations', 'anti_fraud']
  },
  {
    id: 'behavioral_data',
    name: 'Dados Comportamentais',
    description: 'Preferências, histórico de uso',
    dataCategory: 'behavioral',
    retentionPeriod: 24, // 2 anos
    automaticDeletion: true,
    legalBasis: 'legitimate_interests',
    exceptions: ['consent_given']
  },
  {
    id: 'analytics_data',
    name: 'Dados de Analytics',
    description: 'Métricas de uso, logs de acesso',
    dataCategory: 'usage_analytics',
    retentionPeriod: 12, // 1 ano
    automaticDeletion: true,
    legalBasis: 'legitimate_interests',
    exceptions: ['security_incidents']
  }
];

export class LGPDManager {
  private config: LGPDConfig;
  private dataSubjects = new Map<string, DataSubject>();
  private privacyRequests = new Map<string, PrivacyRequest>();
  private retentionPolicies = new Map<string, DataRetentionPolicy>();
  private auditLog: Array<{
    timestamp: number;
    action: string;
    dataSubjectId?: string;
    details: Record<string, any>;
    userId?: string;
  }> = [];

  constructor(config: Partial<LGPDConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeRetentionPolicies();
  }

  // Registrar consentimento
  recordConsent(
    dataSubjectId: string,
    purpose: string,
    legalBasis: LegalBasis = 'consent',
    source = 'web',
    ipAddress?: string,
    userAgent?: string
  ): ConsentRecord {
    const consent: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataSubjectId,
      purpose,
      legalBasis,
      consentGiven: true,
      consentDate: Date.now(),
      source,
      ipAddress,
      userAgent,
      version: '1.0'
    };

    const dataSubject = this.getOrCreateDataSubject(dataSubjectId);
    dataSubject.consents.push(consent);
    this.dataSubjects.set(dataSubjectId, dataSubject);

    this.logAudit('consent_recorded', dataSubjectId, {
      purpose,
      legalBasis,
      source
    });

    console.log(`✅ Consentimento registrado: ${dataSubjectId} - ${purpose}`);
    return consent;
  }

  // Retirar consentimento
  withdrawConsent(dataSubjectId: string, purpose: string): boolean {
    const dataSubject = this.dataSubjects.get(dataSubjectId);
    if (!dataSubject) return false;

    const consent = dataSubject.consents.find(
      c => c.purpose === purpose && c.consentGiven && !c.withdrawnDate
    );

    if (consent) {
      consent.consentGiven = false;
      consent.withdrawnDate = Date.now();

      this.logAudit('consent_withdrawn', dataSubjectId, { purpose });
      console.log(`❌ Consentimento retirado: ${dataSubjectId} - ${purpose}`);

      // Verificar se precisa parar processamento
      this.handleConsentWithdrawal(dataSubjectId, purpose);
      return true;
    }

    return false;
  }

  // Registrar atividade de processamento
  recordDataProcessing(
    dataSubjectId: string,
    activity: string,
    purpose: string,
    legalBasis: LegalBasis,
    dataCategories: DataCategory[],
    processingSystem: string,
    automated = false,
    metadata: Record<string, any> = {}
  ): DataProcessingRecord {
    const record: DataProcessingRecord = {
      id: `processing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataSubjectId,
      activity,
      purpose,
      legalBasis,
      dataCategories,
      timestamp: Date.now(),
      processingSystem,
      automated,
      metadata
    };

    const dataSubject = this.getOrCreateDataSubject(dataSubjectId);
    dataSubject.dataProcessing.push(record);
    this.dataSubjects.set(dataSubjectId, dataSubject);

    this.logAudit('data_processing', dataSubjectId, {
      activity,
      purpose,
      dataCategories,
      processingSystem
    });

    return record;
  }

  // Criar solicitação de titular
  createPrivacyRequest(
    dataSubjectId: string,
    type: PrivacyRequest['type'],
    description: string,
    urgency: PrivacyRequest['urgency'] = 'medium'
  ): PrivacyRequest {
    const request: PrivacyRequest = {
      id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataSubjectId,
      type,
      status: 'pending',
      requestDate: Date.now(),
      description,
      urgency,
      metadata: {}
    };

    this.privacyRequests.set(request.id, request);

    this.logAudit('privacy_request_created', dataSubjectId, {
      requestId: request.id,
      type,
      description,
      urgency
    });

    console.log(`📋 Solicitação LGPD criada: ${type} - ${dataSubjectId}`);
    return request;
  }

  // Processar solicitação de acesso (Art. 15)
  async processAccessRequest(requestId: string): Promise<any> {
    const request = this.privacyRequests.get(requestId);
    if (!request || request.type !== 'access') {
      throw new Error('Solicitação de acesso não encontrada');
    }

    const dataSubject = this.dataSubjects.get(request.dataSubjectId);
    if (!dataSubject) {
      throw new Error('Titular dos dados não encontrado');
    }

    // Atualizar status
    request.status = 'in_progress';
    this.privacyRequests.set(requestId, request);

    // Coletar todos os dados
    const personalData = {
      basicInfo: {
        id: dataSubject.id,
        email: dataSubject.email,
        name: dataSubject.name,
        phone: dataSubject.phone,
        document: dataSubject.document,
        createdAt: new Date(dataSubject.createdAt).toISOString(),
        lastActivity: new Date(dataSubject.lastActivity).toISOString()
      },
      consents: dataSubject.consents.map(consent => ({
        purpose: consent.purpose,
        legalBasis: consent.legalBasis,
        consentGiven: consent.consentGiven,
        consentDate: new Date(consent.consentDate).toISOString(),
        withdrawnDate: consent.withdrawnDate ? new Date(consent.withdrawnDate).toISOString() : null,
        source: consent.source,
        version: consent.version
      })),
      dataProcessing: dataSubject.dataProcessing.map(processing => ({
        activity: processing.activity,
        purpose: processing.purpose,
        legalBasis: processing.legalBasis,
        dataCategories: processing.dataCategories,
        timestamp: new Date(processing.timestamp).toISOString(),
        processingSystem: processing.processingSystem,
        automated: processing.automated
      })),
      retentionInfo: this.getRetentionInfo(request.dataSubjectId)
    };

    // Completar solicitação
    request.status = 'completed';
    request.completionDate = Date.now();
    request.response = 'Dados pessoais fornecidos conforme solicitado';
    this.privacyRequests.set(requestId, request);

    this.logAudit('access_request_completed', request.dataSubjectId, {
      requestId,
      dataExported: Object.keys(personalData)
    });

    return personalData;
  }

  // Processar solicitação de exclusão (Art. 16)
  async processErasureRequest(requestId: string, handledBy?: string): Promise<boolean> {
    const request = this.privacyRequests.get(requestId);
    if (!request || request.type !== 'erasure') {
      throw new Error('Solicitação de exclusão não encontrada');
    }

    const dataSubject = this.dataSubjects.get(request.dataSubjectId);
    if (!dataSubject) {
      throw new Error('Titular dos dados não encontrado');
    }

    // Verificar se pode excluir (verificar bases legais)
    const canErase = this.canEraseData(request.dataSubjectId);
    if (!canErase.allowed) {
      request.status = 'rejected';
      request.response = `Exclusão não permitida: ${canErase.reason}`;
      request.completionDate = Date.now();
      this.privacyRequests.set(requestId, request);
      return false;
    }

    // Atualizar status
    request.status = 'in_progress';
    request.handledBy = handledBy;
    this.privacyRequests.set(requestId, request);

    // Executar exclusão
    const deletionResult = await this.executeDataDeletion(request.dataSubjectId);

    // Completar solicitação
    request.status = 'completed';
    request.completionDate = Date.now();
    request.response = `Dados excluídos com sucesso. Sistemas afetados: ${deletionResult.systemsAffected.join(', ')}`;
    this.privacyRequests.set(requestId, request);

    this.logAudit('erasure_request_completed', request.dataSubjectId, {
      requestId,
      systemsAffected: deletionResult.systemsAffected,
      handledBy
    });

    console.log(`🗑️ Dados excluídos: ${request.dataSubjectId}`);
    return true;
  }

  // Verificar conformidade LGPD
  checkCompliance(): {
    overall: 'compliant' | 'non_compliant' | 'partial';
    issues: string[];
    recommendations: string[];
    stats: any;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const now = Date.now();

    // Verificar consentimentos expirados
    let expiredConsents = 0;
    let pendingRequests = 0;
    let overdueRequests = 0;

    for (const dataSubject of this.dataSubjects.values()) {
      // Verificar consentimentos
      for (const consent of dataSubject.consents) {
        if (consent.consentGiven && consent.legalBasis === 'consent') {
          const ageMonths = (now - consent.consentDate) / (1000 * 60 * 60 * 24 * 30);
          if (ageMonths > this.config.consentValidityMonths) {
            expiredConsents++;
          }
        }
      }
    }

    // Verificar solicitações pendentes
    for (const request of this.privacyRequests.values()) {
      if (request.status === 'pending') {
        pendingRequests++;
        
        const daysSinceRequest = (now - request.requestDate) / (1000 * 60 * 60 * 24);
        if (daysSinceRequest > this.config.responseDeadlineDays) {
          overdueRequests++;
        }
      }
    }

    // Verificar políticas de retenção
    const dataToDelete = this.identifyDataForDeletion();

    // Gerar issues
    if (expiredConsents > 0) {
      issues.push(`${expiredConsents} consentimentos expirados encontrados`);
      recommendations.push('Renovar consentimentos expirados ou excluir dados');
    }

    if (overdueRequests > 0) {
      issues.push(`${overdueRequests} solicitações LGPD em atraso`);
      recommendations.push('Processar solicitações pendentes dentro do prazo');
    }

    if (dataToDelete.length > 0) {
      issues.push(`${dataToDelete.length} registros devem ser excluídos por política de retenção`);
      recommendations.push('Executar exclusão automática conforme políticas');
    }

    // Verificar DPO configurado
    if (!this.config.dataController.dpoEmail) {
      issues.push('DPO (Data Protection Officer) não configurado');
      recommendations.push('Configurar contato do DPO');
    }

    const overall = issues.length === 0 ? 'compliant' : 
                   issues.length <= 2 ? 'partial' : 'non_compliant';

    return {
      overall,
      issues,
      recommendations,
      stats: {
        totalDataSubjects: this.dataSubjects.size,
        totalConsents: Array.from(this.dataSubjects.values())
          .reduce((sum, ds) => sum + ds.consents.length, 0),
        expiredConsents,
        pendingRequests,
        overdueRequests,
        dataToDelete: dataToDelete.length
      }
    };
  }

  // Executar limpeza automática
  async executeAutomaticCleanup(): Promise<{
    deletedRecords: number;
    expiredConsents: number;
    processedRequests: number;
  }> {
    let deletedRecords = 0;
    let expiredConsents = 0;
    let processedRequests = 0;

    // Identificar dados para exclusão
    const dataToDelete = this.identifyDataForDeletion();
    
    for (const item of dataToDelete) {
      try {
        await this.executeDataDeletion(item.dataSubjectId);
        deletedRecords++;
      } catch (error) {
        console.error(`Erro ao excluir dados de ${item.dataSubjectId}:`, error);
      }
    }

    // Processar consentimentos expirados
    for (const [dataSubjectId, dataSubject] of this.dataSubjects.entries()) {
      for (const consent of dataSubject.consents) {
        if (this.isConsentExpired(consent)) {
          this.withdrawConsent(dataSubjectId, consent.purpose);
          expiredConsents++;
        }
      }
    }

    console.log(`🧹 Limpeza automática: ${deletedRecords} registros, ${expiredConsents} consentimentos`);

    return {
      deletedRecords,
      expiredConsents,
      processedRequests
    };
  }

  // Métodos privados
  private getOrCreateDataSubject(id: string): DataSubject {
    let dataSubject = this.dataSubjects.get(id);
    
    if (!dataSubject) {
      dataSubject = {
        id,
        email: '',
        name: '',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        consents: [],
        dataProcessing: []
      };
      this.dataSubjects.set(id, dataSubject);
    }

    return dataSubject;
  }

  private initializeRetentionPolicies(): void {
    DEFAULT_RETENTION_POLICIES.forEach(policy => {
      this.retentionPolicies.set(policy.id, policy);
    });
  }

  private logAudit(action: string, dataSubjectId?: string, details: Record<string, any> = {}, userId?: string): void {
    this.auditLog.push({
      timestamp: Date.now(),
      action,
      dataSubjectId,
      details,
      userId
    });

    // Limitar tamanho do log
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  private handleConsentWithdrawal(dataSubjectId: string, purpose: string): void {
    // Implementar ações quando consentimento é retirado
    // Ex: parar processamento, notificar sistemas, etc.
    console.log(`🛑 Processamento pausado: ${dataSubjectId} - ${purpose}`);
  }

  private getRetentionInfo(dataSubjectId: string): any {
    const dataSubject = this.dataSubjects.get(dataSubjectId);
    if (!dataSubject) return {};

    const retentionInfo: Record<string, any> = {};
    
    for (const [policyId, policy] of this.retentionPolicies.entries()) {
      retentionInfo[policy.dataCategory] = {
        retentionPeriod: `${policy.retentionPeriod} meses`,
        automaticDeletion: policy.automaticDeletion,
        legalBasis: policy.legalBasis
      };
    }

    return retentionInfo;
  }

  private canEraseData(dataSubjectId: string): { allowed: boolean; reason?: string } {
    const dataSubject = this.dataSubjects.get(dataSubjectId);
    if (!dataSubject) return { allowed: false, reason: 'Titular não encontrado' };

    // Verificar se há obrigações legais que impedem exclusão
    const legalObligations = dataSubject.dataProcessing.filter(
      p => p.legalBasis === 'legal_obligation'
    );

    if (legalObligations.length > 0) {
      return { 
        allowed: false, 
        reason: 'Dados necessários para cumprimento de obrigação legal' 
      };
    }

    return { allowed: true };
  }

  private async executeDataDeletion(dataSubjectId: string): Promise<{ systemsAffected: string[] }> {
    // Simular exclusão em múltiplos sistemas
    const systemsAffected = ['database', 'cache', 'analytics', 'backups'];
    
    // Remover do gerenciador local
    this.dataSubjects.delete(dataSubjectId);
    
    // Aqui implementar exclusão real nos sistemas
    // - Database principal
    // - Cache Redis
    // - Analytics
    // - Backups
    
    return { systemsAffected };
  }

  private identifyDataForDeletion(): Array<{ dataSubjectId: string; reason: string }> {
    const now = Date.now();
    const dataToDelete: Array<{ dataSubjectId: string; reason: string }> = [];

    for (const [dataSubjectId, dataSubject] of this.dataSubjects.entries()) {
      // Verificar políticas de retenção
      const lastActivity = dataSubject.lastActivity;
      const monthsInactive = (now - lastActivity) / (1000 * 60 * 60 * 24 * 30);

      // Se inativo por mais de 36 meses e sem consentimento válido
      if (monthsInactive > 36) {
        const hasValidConsent = dataSubject.consents.some(
          c => c.consentGiven && !this.isConsentExpired(c)
        );

        if (!hasValidConsent) {
          dataToDelete.push({
            dataSubjectId,
            reason: 'Inativo por mais de 36 meses sem consentimento válido'
          });
        }
      }
    }

    return dataToDelete;
  }

  private isConsentExpired(consent: ConsentRecord): boolean {
    if (consent.legalBasis !== 'consent') return false;
    
    const ageMonths = (Date.now() - consent.consentDate) / (1000 * 60 * 60 * 24 * 30);
    return ageMonths > this.config.consentValidityMonths;
  }
}

// Instância global
export const lgpdManager = new LGPDManager();

// Hook para React
export const useLGPD = () => {
  return {
    recordConsent: lgpdManager.recordConsent.bind(lgpdManager),
    withdrawConsent: lgpdManager.withdrawConsent.bind(lgpdManager),
    recordDataProcessing: lgpdManager.recordDataProcessing.bind(lgpdManager),
    createPrivacyRequest: lgpdManager.createPrivacyRequest.bind(lgpdManager),
    checkCompliance: lgpdManager.checkCompliance.bind(lgpdManager),
    executeAutomaticCleanup: lgpdManager.executeAutomaticCleanup.bind(lgpdManager)
  };
};
