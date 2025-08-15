'use client';

/**
 * Sistema avançado de Push Notifications para Zykor
 * Implementa Web Push API com service workers
 */

export interface PushNotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

export interface ZykorNotificationData {
  type: 'evento' | 'vendas' | 'checklist' | 'sistema' | 'financeiro';
  barId?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class ZykorPushNotifications {
  private static instance: ZykorPushNotifications;
  private registration: ServiceWorkerRegistration | null = null;

  public static getInstance(): ZykorPushNotifications {
    if (!ZykorPushNotifications.instance) {
      ZykorPushNotifications.instance = new ZykorPushNotifications();
    }
    return ZykorPushNotifications.instance;
  }

  /**
   * Inicializa o sistema de push notifications
   */
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications não suportadas neste navegador');
      return false;
    }

    try {
      // Registrar service worker se não estiver registrado
      this.registration = await navigator.serviceWorker.ready;
      
      // Configurar listeners de mensagens
      this.setupMessageListeners();
      
      console.log('✅ Push notifications inicializadas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar push notifications:', error);
      return false;
    }
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notificações não suportadas');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  /**
   * Verifica se as notificações estão habilitadas
   */
  isEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Envia notificação local
   */
  async sendLocalNotification(config: PushNotificationConfig): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Notificações não habilitadas');
    }

    if (!this.registration) {
      throw new Error('Service Worker não registrado');
    }

    // Configuração padrão para Zykor
    const defaultConfig: Partial<PushNotificationConfig> = {
      icon: '/logos/logo_zykor.png',
      badge: '/favicons/zykor/favicon.ico',
      requireInteraction: false,
      tag: 'zykor-notification'
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Enviar via service worker para melhor controle
    await this.registration.showNotification(finalConfig.title, {
      body: finalConfig.body,
      icon: finalConfig.icon,
      badge: finalConfig.badge,
      image: finalConfig.image,
      tag: finalConfig.tag,
      requireInteraction: finalConfig.requireInteraction,
      actions: finalConfig.actions,
      data: finalConfig.data,
      timestamp: Date.now()
    });
  }

  /**
   * Envia notificação específica do Zykor
   */
  async sendZykorNotification(
    config: PushNotificationConfig,
    zykorData: ZykorNotificationData
  ): Promise<void> {
    const enhancedConfig = {
      ...config,
      data: {
        ...config.data,
        zykor: zykorData,
        timestamp: Date.now()
      },
      tag: `zykor-${zykorData.type}-${zykorData.barId || 'system'}`,
      actions: this.getDefaultActions(zykorData.type)
    };

    await this.sendLocalNotification(enhancedConfig);
  }

  /**
   * Notificações predefinidas para diferentes tipos de eventos
   */
  async notifyEventUpdate(eventName: string, status: string, barId: number): Promise<void> {
    await this.sendZykorNotification(
      {
        title: '🎵 Evento Atualizado',
        body: `${eventName} agora está ${status}`,
        requireInteraction: true
      },
      {
        type: 'evento',
        barId,
        priority: 'normal',
        actionUrl: `/gestao/eventos/${barId}`
      }
    );
  }

  async notifyHighSales(amount: number, barName: string, barId: number): Promise<void> {
    await this.sendZykorNotification(
      {
        title: '💰 Vendas Excepcionais!',
        body: `${barName} atingiu R$ ${amount.toLocaleString()} hoje!`,
        requireInteraction: true
      },
      {
        type: 'vendas',
        barId,
        priority: 'high',
        actionUrl: `/relatorios/tempo?bar=${barId}`
      }
    );
  }

  async notifyChecklistPending(checklistName: string, barId: number): Promise<void> {
    await this.sendZykorNotification(
      {
        title: '📋 Checklist Pendente',
        body: `${checklistName} precisa ser completado`,
        requireInteraction: false
      },
      {
        type: 'checklist',
        barId,
        priority: 'normal',
        actionUrl: `/operacoes/checklists?bar=${barId}`
      }
    );
  }

  async notifySystemAlert(message: string, priority: ZykorNotificationData['priority'] = 'normal'): Promise<void> {
    await this.sendZykorNotification(
      {
        title: '🔔 Sistema Zykor',
        body: message,
        requireInteraction: priority === 'urgent'
      },
      {
        type: 'sistema',
        priority,
        actionUrl: '/configuracoes'
      }
    );
  }

  async notifyFinancialAlert(message: string, amount: number, barId: number): Promise<void> {
    await this.sendZykorNotification(
      {
        title: '💳 Alerta Financeiro',
        body: `${message} - R$ ${amount.toLocaleString()}`,
        requireInteraction: true
      },
      {
        type: 'financeiro',
        barId,
        priority: 'high',
        actionUrl: `/estrategico/orcamentacao?bar=${barId}`
      }
    );
  }

  /**
   * Configurar listeners para mensagens do service worker
   */
  private setupMessageListeners(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'notification-click':
          this.handleNotificationClick(data);
          break;
        case 'notification-close':
          this.handleNotificationClose(data);
          break;
        default:
          console.log('Mensagem SW não reconhecida:', type);
      }
    });
  }

  /**
   * Manipula cliques em notificações
   */
  private handleNotificationClick(data: any): void {
    const zykorData = data.zykor as ZykorNotificationData;
    
    if (zykorData?.actionUrl) {
      // Navegar para a URL especificada
      window.open(zykorData.actionUrl, '_blank');
    }

    // Log para analytics
    console.log('Notificação clicada:', zykorData);
  }

  /**
   * Manipula fechamento de notificações
   */
  private handleNotificationClose(data: any): void {
    // Log para analytics
    console.log('Notificação fechada:', data);
  }

  /**
   * Retorna ações padrão baseadas no tipo de notificação
   */
  private getDefaultActions(type: ZykorNotificationData['type']): NotificationAction[] {
    const actions: Record<string, NotificationAction[]> = {
      evento: [
        { action: 'view', title: '👁️ Ver Evento', icon: '/icons/eye.png' },
        { action: 'dismiss', title: '❌ Dispensar', icon: '/icons/dismiss.png' }
      ],
      vendas: [
        { action: 'view-report', title: '📊 Ver Relatório', icon: '/icons/chart.png' },
        { action: 'dismiss', title: '❌ OK', icon: '/icons/dismiss.png' }
      ],
      checklist: [
        { action: 'complete', title: '✅ Completar', icon: '/icons/check.png' },
        { action: 'later', title: '⏰ Depois', icon: '/icons/clock.png' }
      ],
      sistema: [
        { action: 'view', title: '🔧 Ver Configurações', icon: '/icons/settings.png' },
        { action: 'dismiss', title: '❌ OK', icon: '/icons/dismiss.png' }
      ],
      financeiro: [
        { action: 'view-budget', title: '💰 Ver Orçamento', icon: '/icons/money.png' },
        { action: 'dismiss', title: '❌ OK', icon: '/icons/dismiss.png' }
      ]
    };

    return actions[type] || actions.sistema;
  }

  /**
   * Limpar todas as notificações
   */
  async clearAllNotifications(): Promise<void> {
    if (!this.registration) return;

    const notifications = await this.registration.getNotifications();
    notifications.forEach(notification => notification.close());
  }

  /**
   * Agendar notificação para o futuro
   */
  async scheduleNotification(
    config: PushNotificationConfig,
    zykorData: ZykorNotificationData,
    delay: number
  ): Promise<void> {
    setTimeout(async () => {
      await this.sendZykorNotification(config, zykorData);
    }, delay);
  }
}

// Hook para usar push notifications
export function usePushNotifications() {
  const pushManager = ZykorPushNotifications.getInstance();

  return {
    initialize: () => pushManager.initialize(),
    requestPermission: () => pushManager.requestPermission(),
    isEnabled: () => pushManager.isEnabled(),
    sendNotification: (config: PushNotificationConfig) => pushManager.sendLocalNotification(config),
    sendZykorNotification: (config: PushNotificationConfig, data: ZykorNotificationData) => 
      pushManager.sendZykorNotification(config, data),
    
    // Métodos de conveniência
    notifyEventUpdate: (eventName: string, status: string, barId: number) =>
      pushManager.notifyEventUpdate(eventName, status, barId),
    notifyHighSales: (amount: number, barName: string, barId: number) =>
      pushManager.notifyHighSales(amount, barName, barId),
    notifyChecklistPending: (checklistName: string, barId: number) =>
      pushManager.notifyChecklistPending(checklistName, barId),
    notifySystemAlert: (message: string, priority?: ZykorNotificationData['priority']) =>
      pushManager.notifySystemAlert(message, priority),
    notifyFinancialAlert: (message: string, amount: number, barId: number) =>
      pushManager.notifyFinancialAlert(message, amount, barId),
    
    clearAll: () => pushManager.clearAllNotifications(),
    schedule: (config: PushNotificationConfig, data: ZykorNotificationData, delay: number) =>
      pushManager.scheduleNotification(config, data, delay)
  };
}

export default ZykorPushNotifications;
