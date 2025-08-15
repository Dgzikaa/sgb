'use client';

/**
 * Sistema de Background Sync para Zykor
 * Sincroniza dados quando a conexão é restaurada
 */

export interface SyncTask {
  id: string;
  type: 'checklist' | 'vendas' | 'evento' | 'produto' | 'config';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface SyncResult {
  success: boolean;
  taskId: string;
  error?: string;
  data?: any;
}

export class ZykorBackgroundSync {
  private static instance: ZykorBackgroundSync;
  private syncTasks: Map<string, SyncTask> = new Map();
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private storage = {
    key: 'zykor-sync-tasks',
    get: (): SyncTask[] => {
      try {
        const stored = localStorage.getItem(this.storage.key);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
    set: (tasks: SyncTask[]) => {
      try {
        localStorage.setItem(this.storage.key, JSON.stringify(tasks));
      } catch (error) {
        console.error('Erro ao salvar tasks de sync:', error);
      }
    }
  };

  public static getInstance(): ZykorBackgroundSync {
    if (!ZykorBackgroundSync.instance) {
      ZykorBackgroundSync.instance = new ZykorBackgroundSync();
    }
    return ZykorBackgroundSync.instance;
  }

  constructor() {
    this.loadStoredTasks();
    this.setupNetworkListeners();
  }

  /**
   * Inicializa o sistema de background sync
   */
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers não suportados - Background sync limitado');
      return false;
    }

    try {
      // Registrar service worker se necessário
      const registration = await navigator.serviceWorker.ready;
      
      // Configurar listeners
      this.setupServiceWorkerListeners(registration);
      
      // Tentar sincronizar tarefas pendentes
      if (this.isOnline) {
        await this.syncPendingTasks();
      }

      console.log('✅ Background sync inicializado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar background sync:', error);
      return false;
    }
  }

  /**
   * Adiciona uma tarefa para sincronização
   */
  async addSyncTask(
    type: SyncTask['type'],
    action: SyncTask['action'],
    data: any,
    priority: SyncTask['priority'] = 'normal'
  ): Promise<string> {
    const taskId = `${type}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task: SyncTask = {
      id: taskId,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: priority === 'critical' ? 10 : priority === 'high' ? 5 : 3,
      priority
    };

    this.syncTasks.set(taskId, task);
    this.persistTasks();

    // Tentar sincronizar imediatamente se online
    if (this.isOnline && !this.syncInProgress) {
      await this.syncPendingTasks();
    }

    return taskId;
  }

  /**
   * Métodos de conveniência para diferentes tipos de sync
   */
  async syncChecklistCompletion(checklistId: string, data: any): Promise<string> {
    return this.addSyncTask('checklist', 'update', {
      checklistId,
      completedAt: new Date().toISOString(),
      ...data
    }, 'high');
  }

  async syncVendaData(vendaId: string, vendaData: any): Promise<string> {
    return this.addSyncTask('vendas', 'create', {
      vendaId,
      ...vendaData,
      syncedAt: new Date().toISOString()
    }, 'critical');
  }

  async syncEventoUpdate(eventoId: string, updates: any): Promise<string> {
    return this.addSyncTask('evento', 'update', {
      eventoId,
      ...updates,
      updatedAt: new Date().toISOString()
    }, 'normal');
  }

  async syncProdutoUpdate(produtoId: string, produtoData: any): Promise<string> {
    return this.addSyncTask('produto', 'update', {
      produtoId,
      ...produtoData,
      updatedAt: new Date().toISOString()
    }, 'normal');
  }

  async syncConfigUpdate(configKey: string, configValue: any): Promise<string> {
    return this.addSyncTask('config', 'update', {
      key: configKey,
      value: configValue,
      updatedAt: new Date().toISOString()
    }, 'high');
  }

  /**
   * Sincroniza todas as tarefas pendentes
   */
  async syncPendingTasks(): Promise<SyncResult[]> {
    if (this.syncInProgress || !this.isOnline) {
      return [];
    }

    this.syncInProgress = true;
    const results: SyncResult[] = [];

    try {
      // Ordenar por prioridade
      const tasksList = Array.from(this.syncTasks.values()).sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const task of tasksList) {
        const result = await this.syncTask(task);
        results.push(result);

        if (result.success) {
          this.syncTasks.delete(task.id);
        } else {
          task.retries++;
          if (task.retries >= task.maxRetries) {
            console.error(`Task ${task.id} falhou definitivamente após ${task.retries} tentativas`);
            this.syncTasks.delete(task.id);
          }
        }
      }

      this.persistTasks();
      console.log(`✅ Sync concluído: ${results.filter(r => r.success).length}/${results.length} sucessos`);

    } catch (error) {
      console.error('❌ Erro durante sync:', error);
    } finally {
      this.syncInProgress = false;
    }

    return results;
  }

  /**
   * Sincroniza uma tarefa específica
   */
  private async syncTask(task: SyncTask): Promise<SyncResult> {
    try {
      const endpoint = this.getEndpointForTask(task);
      const method = this.getMethodForAction(task.action);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task.data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      return {
        success: true,
        taskId: task.id,
        data: responseData
      };

    } catch (error) {
      console.error(`❌ Erro ao sincronizar task ${task.id}:`, error);
      return {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Retorna o endpoint correto para cada tipo de tarefa
   */
  private getEndpointForTask(task: SyncTask): string {
    const endpoints = {
      checklist: '/api/operacional/checklists',
      vendas: '/api/relatorios/tempo',
      evento: '/api/gestao/eventos',
      produto: '/api/operacional/produtos',
      config: '/api/configuracoes'
    };

    let baseEndpoint = endpoints[task.type];

    // Adicionar ID para updates e deletes
    if (task.action === 'update' || task.action === 'delete') {
      const id = task.data[`${task.type}Id`] || task.data.id;
      if (id) {
        baseEndpoint += `/${id}`;
      }
    }

    return baseEndpoint;
  }

  /**
   * Retorna o método HTTP correto para cada ação
   */
  private getMethodForAction(action: SyncTask['action']): string {
    const methods = {
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE'
    };
    return methods[action];
  }

  /**
   * Configura listeners de rede
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada - iniciando sync');
      this.isOnline = true;
      this.syncPendingTasks();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Conexão perdida - modo offline ativado');
      this.isOnline = false;
    });
  }

  /**
   * Configura listeners do service worker
   */
  private setupServiceWorkerListeners(registration: ServiceWorkerRegistration): void {
    // Escutar mensagens do service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      if (type === 'background-sync-complete') {
        console.log('✅ Background sync via SW completado:', data);
      }
    });

    // Registrar background sync se suportado
    if ('sync' in registration) {
      // O service worker pode registrar eventos de background sync
      console.log('✅ Background Sync API disponível');
    }
  }

  /**
   * Carrega tarefas armazenadas
   */
  private loadStoredTasks(): void {
    const storedTasks = this.storage.get();
    this.syncTasks.clear();
    
    storedTasks.forEach(task => {
      this.syncTasks.set(task.id, task);
    });

    console.log(`📋 Carregadas ${storedTasks.length} tarefas de sync`);
  }

  /**
   * Persiste tarefas no localStorage
   */
  private persistTasks(): void {
    const tasksArray = Array.from(this.syncTasks.values());
    this.storage.set(tasksArray);
  }

  /**
   * Retorna estatísticas de sync
   */
  getStats() {
    const tasks = Array.from(this.syncTasks.values());
    return {
      total: tasks.length,
      byType: tasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Limpa todas as tarefas
   */
  clearAllTasks(): void {
    this.syncTasks.clear();
    this.persistTasks();
    console.log('🧹 Todas as tarefas de sync foram removidas');
  }

  /**
   * Remove uma tarefa específica
   */
  removeTask(taskId: string): boolean {
    const removed = this.syncTasks.delete(taskId);
    if (removed) {
      this.persistTasks();
      console.log(`🗑️ Tarefa ${taskId} removida`);
    }
    return removed;
  }
}

// Hook para usar background sync
export function useBackgroundSync() {
  const syncManager = ZykorBackgroundSync.getInstance();

  return {
    initialize: () => syncManager.initialize(),
    addTask: (type: SyncTask['type'], action: SyncTask['action'], data: any, priority?: SyncTask['priority']) =>
      syncManager.addSyncTask(type, action, data, priority),
    
    // Métodos específicos
    syncChecklist: (checklistId: string, data: any) => syncManager.syncChecklistCompletion(checklistId, data),
    syncVenda: (vendaId: string, data: any) => syncManager.syncVendaData(vendaId, data),
    syncEvento: (eventoId: string, data: any) => syncManager.syncEventoUpdate(eventoId, data),
    syncProduto: (produtoId: string, data: any) => syncManager.syncProdutoUpdate(produtoId, data),
    syncConfig: (key: string, value: any) => syncManager.syncConfigUpdate(key, value),
    
    // Controle
    sync: () => syncManager.syncPendingTasks(),
    getStats: () => syncManager.getStats(),
    clearAll: () => syncManager.clearAllTasks(),
    removeTask: (taskId: string) => syncManager.removeTask(taskId)
  };
}

export default ZykorBackgroundSync;
