// Sistema de Notificações Push do Browser
// Permite notificações inteligentes mesmo com o app minimizado

interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class ZykorNotifications {
  private permission: NotificationPermission = 'default';
  private swRegistration: ServiceWorkerRegistration | null = null;

  async init(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Navegador não suporta notificações');
      return false;
    }

    this.permission = Notification.permission;

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    // Registrar Service Worker para notificações persistentes
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado para notificações');
      } catch (error) {
        console.warn('Service Worker não disponível:', error);
      }
    }

    return this.permission === 'granted';
  }

  get isSupported(): boolean {
    return 'Notification' in window;
  }

  get isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;
    
    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }

  // Enviar notificação simples
  async send(config: NotificationConfig): Promise<Notification | null> {
    if (!this.isPermissionGranted) {
      console.warn('Permissão de notificação não concedida');
      return null;
    }

    const options: NotificationOptions = {
      body: config.body,
      icon: config.icon || '/logo.png',
      badge: config.badge || '/badge.png',
      tag: config.tag,
      data: config.data,
      requireInteraction: config.requireInteraction || false,
      silent: config.silent || false,
    };

    // Usar Service Worker se disponível (para notificações persistentes)
    if (this.swRegistration) {
      try {
        // ServiceWorkerRegistration.showNotification suporta actions
        const swOptions = {
          ...options,
          actions: config.actions
        } as NotificationOptions & { actions?: NotificationAction[] };
        await this.swRegistration.showNotification(config.title, swOptions);
        return null;
      } catch (error) {
        console.warn('Fallback para notificação simples');
      }
    }

    // Fallback para Notification API direta
    return new Notification(config.title, options);
  }

  // Notificação de alerta de CMV
  async alertaCMV(cmv: number): Promise<void> {
    if (cmv > 38) {
      await this.send({
        title: '🚨 CMV Crítico!',
        body: `CMV em ${cmv.toFixed(1)}% - 4pp acima da meta! Ação imediata necessária.`,
        tag: 'alerta-cmv',
        requireInteraction: true,
        data: { tipo: 'cmv', valor: cmv }
      });
    } else if (cmv > 34) {
      await this.send({
        title: '⚠️ CMV Acima da Meta',
        body: `CMV em ${cmv.toFixed(1)}% - ${(cmv - 34).toFixed(1)}pp acima da meta.`,
        tag: 'alerta-cmv',
        data: { tipo: 'cmv', valor: cmv }
      });
    }
  }

  // Notificação de meta batida
  async metaBatida(faturamento: number, meta: number): Promise<void> {
    const atingimento = (faturamento / meta * 100).toFixed(0);
    await this.send({
      title: '🎉 Meta Batida!',
      body: `Parabéns! Atingimos ${atingimento}% da meta hoje (${this.formatCurrency(faturamento)})`,
      tag: 'meta-batida',
      data: { tipo: 'meta', faturamento, meta }
    });
  }

  // Notificação de resumo diário
  async resumoDiario(dados: { 
    faturamento: number; 
    publico: number; 
    ticketMedio: number;
    atingimento: number;
  }): Promise<void> {
    await this.send({
      title: '📊 Resumo do Dia',
      body: `Faturamento: ${this.formatCurrency(dados.faturamento)} | Público: ${dados.publico} | Ticket: ${this.formatCurrency(dados.ticketMedio)} | Meta: ${dados.atingimento.toFixed(0)}%`,
      tag: 'resumo-diario',
      data: { tipo: 'resumo', ...dados }
    });
  }

  // Notificação de insight do agente
  async insightAgente(insight: { titulo: string; descricao: string; tipo: string }): Promise<void> {
    await this.send({
      title: `💡 ${insight.titulo}`,
      body: insight.descricao,
      tag: 'insight-agente',
      data: { categoria: 'insight', ...insight }
    });
  }

  // Notificação de sync completo
  async syncCompleto(fonte: string): Promise<void> {
    await this.send({
      title: '✅ Sincronização Completa',
      body: `Dados do ${fonte} atualizados com sucesso.`,
      tag: 'sync-completo',
      silent: true,
      data: { tipo: 'sync', fonte }
    });
  }

  // Notificação de erro
  async erro(mensagem: string): Promise<void> {
    await this.send({
      title: '❌ Erro no Sistema',
      body: mensagem,
      tag: 'erro',
      requireInteraction: true,
      data: { tipo: 'erro' }
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  }
}

// Exportar instância singleton
export const notifications = new ZykorNotifications();

// Hook para uso em componentes React
import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const granted = await notifications.init();
      setIsSupported(notifications.isSupported);
      setIsPermissionGranted(granted);
      setIsInitialized(true);
    };
    init();
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await notifications.requestPermission();
    setIsPermissionGranted(granted);
    return granted;
  }, []);

  const send = useCallback(async (config: NotificationConfig) => {
    return notifications.send(config);
  }, []);

  return {
    isSupported,
    isPermissionGranted,
    isInitialized,
    requestPermission,
    send,
    alertaCMV: notifications.alertaCMV.bind(notifications),
    metaBatida: notifications.metaBatida.bind(notifications),
    resumoDiario: notifications.resumoDiario.bind(notifications),
    insightAgente: notifications.insightAgente.bind(notifications),
    syncCompleto: notifications.syncCompleto.bind(notifications),
    erro: notifications.erro.bind(notifications)
  };
}
