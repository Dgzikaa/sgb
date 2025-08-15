'use client';

/**
 * Sistema de Badging API para Zykor
 * Mostra notificações no ícone do app (PWA)
 */

export interface BadgeData {
  count: number;
  type: 'info' | 'warning' | 'error' | 'success';
  source: 'checklist' | 'vendas' | 'eventos' | 'sistema' | 'financeiro';
}

export class ZykorBadgeAPI {
  private static instance: ZykorBadgeAPI;
  private currentBadgeCount: number = 0;
  private badgeData: Map<string, BadgeData> = new Map();

  public static getInstance(): ZykorBadgeAPI {
    if (!ZykorBadgeAPI.instance) {
      ZykorBadgeAPI.instance = new ZykorBadgeAPI();
    }
    return ZykorBadgeAPI.instance;
  }

  /**
   * Verifica se a Badging API está disponível
   */
  isBadgingSupported(): boolean {
    return 'setAppBadge' in navigator;
  }

  /**
   * Define badge no ícone do app
   */
  async setBadge(count?: number): Promise<boolean> {
    if (!this.isBadgingSupported()) {
      console.warn('Badging API não suportada neste navegador');
      return false;
    }

    try {
      if (count === undefined || count === 0) {
        await (navigator as any).clearAppBadge();
        this.currentBadgeCount = 0;
        console.log('🏷️ Badge removido');
      } else {
        await (navigator as any).setAppBadge(count);
        this.currentBadgeCount = count;
        console.log(`🏷️ Badge definido: ${count}`);
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao definir badge:', error);
      return false;
    }
  }

  /**
   * Remove badge do ícone
   */
  async clearBadge(): Promise<boolean> {
    return this.setBadge(0);
  }

  /**
   * Adiciona dados de badge por fonte
   */
  addBadgeData(source: BadgeData['source'], data: BadgeData): void {
    this.badgeData.set(source, data);
    this.updateBadgeFromData();
  }

  /**
   * Remove dados de badge por fonte
   */
  removeBadgeData(source: BadgeData['source']): void {
    this.badgeData.delete(source);
    this.updateBadgeFromData();
  }

  /**
   * Atualiza badge baseado em todos os dados
   */
  private updateBadgeFromData(): void {
    const totalCount = Array.from(this.badgeData.values())
      .reduce((sum, data) => sum + data.count, 0);
    
    this.setBadge(totalCount);
  }

  /**
   * Métodos específicos para diferentes tipos de notificação
   */
  async updateChecklistBadge(pendingCount: number): Promise<void> {
    this.addBadgeData('checklist', {
      count: pendingCount,
      type: pendingCount > 0 ? 'warning' : 'success',
      source: 'checklist'
    });
  }

  async updateVendasBadge(newSalesCount: number): Promise<void> {
    this.addBadgeData('vendas', {
      count: newSalesCount,
      type: newSalesCount > 0 ? 'info' : 'success',
      source: 'vendas'
    });
  }

  async updateEventosBadge(eventosHoje: number): Promise<void> {
    this.addBadgeData('eventos', {
      count: eventosHoje,
      type: eventosHoje > 0 ? 'info' : 'success',
      source: 'eventos'
    });
  }

  async updateSistemaBadge(alertsCount: number): Promise<void> {
    this.addBadgeData('sistema', {
      count: alertsCount,
      type: alertsCount > 0 ? 'error' : 'success',
      source: 'sistema'
    });
  }

  async updateFinanceiroBadge(pendingFinanceCount: number): Promise<void> {
    this.addBadgeData('financeiro', {
      count: pendingFinanceCount,
      type: pendingFinanceCount > 0 ? 'warning' : 'success',
      source: 'financeiro'
    });
  }

  /**
   * Atualiza badge baseado em dados do sistema Zykor
   */
  async updateFromZykorData(data: {
    checklistsPendentes?: number;
    vendasNovas?: number;
    eventosHoje?: number;
    alertasSistema?: number;
    pendenciasFinanceiras?: number;
  }): Promise<void> {
    const {
      checklistsPendentes = 0,
      vendasNovas = 0,
      eventosHoje = 0,
      alertasSistema = 0,
      pendenciasFinanceiras = 0
    } = data;

    // Atualizar cada fonte individualmente
    await Promise.all([
      this.updateChecklistBadge(checklistsPendentes),
      this.updateVendasBadge(vendasNovas),
      this.updateEventosBadge(eventosHoje),
      this.updateSistemaBadge(alertasSistema),
      this.updateFinanceiroBadge(pendenciasFinanceiras)
    ]);
  }

  /**
   * Incrementa badge de uma fonte específica
   */
  async incrementBadge(source: BadgeData['source'], increment: number = 1): Promise<void> {
    const currentData = this.badgeData.get(source);
    
    if (currentData) {
      currentData.count += increment;
      this.addBadgeData(source, currentData);
    } else {
      this.addBadgeData(source, {
        count: increment,
        type: 'info',
        source
      });
    }
  }

  /**
   * Decrementa badge de uma fonte específica
   */
  async decrementBadge(source: BadgeData['source'], decrement: number = 1): Promise<void> {
    const currentData = this.badgeData.get(source);
    
    if (currentData) {
      currentData.count = Math.max(0, currentData.count - decrement);
      
      if (currentData.count === 0) {
        this.removeBadgeData(source);
      } else {
        this.addBadgeData(source, currentData);
      }
    }
  }

  /**
   * Obtém estatísticas atuais do badge
   */
  getStats() {
    const badgeDataArray = Array.from(this.badgeData.values());
    
    return {
      total: this.currentBadgeCount,
      bySource: Object.fromEntries(this.badgeData),
      byType: badgeDataArray.reduce((acc, data) => {
        acc[data.type] = (acc[data.type] || 0) + data.count;
        return acc;
      }, {} as Record<string, number>),
      isSupported: this.isBadgingSupported()
    };
  }

  /**
   * Reseta todos os badges
   */
  async resetAllBadges(): Promise<void> {
    this.badgeData.clear();
    await this.clearBadge();
    console.log('🧹 Todos os badges foram resetados');
  }

  /**
   * Simula atualização automática baseada em APIs
   */
  async autoUpdateFromAPIs(): Promise<void> {
    try {
      // Buscar dados de diferentes APIs do Zykor
      const [checklistsRes, eventosRes, alertasRes] = await Promise.allSettled([
        fetch('/api/operacional/checklists/pending-count'),
        fetch('/api/gestao/eventos/today-count'),
        fetch('/api/configuracoes/system-alerts/count')
      ]);

      const updates: any = {};

      // Processar checklists pendentes
      if (checklistsRes.status === 'fulfilled' && checklistsRes.value.ok) {
        const { count } = await checklistsRes.value.json();
        updates.checklistsPendentes = count;
      }

      // Processar eventos de hoje
      if (eventosRes.status === 'fulfilled' && eventosRes.value.ok) {
        const { count } = await eventosRes.value.json();
        updates.eventosHoje = count;
      }

      // Processar alertas do sistema
      if (alertasRes.status === 'fulfilled' && alertasRes.value.ok) {
        const { count } = await alertasRes.value.json();
        updates.alertasSistema = count;
      }

      await this.updateFromZykorData(updates);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar badges automaticamente:', error);
    }
  }

  /**
   * Agenda atualização automática periódica
   */
  startAutoUpdate(intervalMinutes: number = 5): void {
    // Atualizar imediatamente
    this.autoUpdateFromAPIs();

    // Agendar atualizações periódicas
    setInterval(() => {
      this.autoUpdateFromAPIs();
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Auto-update de badges iniciado (${intervalMinutes} min)`);
  }
}

// Hook para usar Badging API
export function useBadgeAPI() {
  const badgeManager = ZykorBadgeAPI.getInstance();

  return {
    isSupported: () => badgeManager.isBadgingSupported(),
    setBadge: (count?: number) => badgeManager.setBadge(count),
    clearBadge: () => badgeManager.clearBadge(),
    
    // Métodos específicos por fonte
    updateChecklist: (count: number) => badgeManager.updateChecklistBadge(count),
    updateVendas: (count: number) => badgeManager.updateVendasBadge(count),
    updateEventos: (count: number) => badgeManager.updateEventosBadge(count),
    updateSistema: (count: number) => badgeManager.updateSistemaBadge(count),
    updateFinanceiro: (count: number) => badgeManager.updateFinanceiroBadge(count),
    
    // Controle
    increment: (source: BadgeData['source'], amount?: number) => 
      badgeManager.incrementBadge(source, amount),
    decrement: (source: BadgeData['source'], amount?: number) => 
      badgeManager.decrementBadge(source, amount),
    
    // Atualização em lote
    updateFromData: (data: any) => badgeManager.updateFromZykorData(data),
    autoUpdate: () => badgeManager.autoUpdateFromAPIs(),
    startAutoUpdate: (interval?: number) => badgeManager.startAutoUpdate(interval),
    
    // Informações
    getStats: () => badgeManager.getStats(),
    resetAll: () => badgeManager.resetAllBadges()
  };
}

export default ZykorBadgeAPI;
