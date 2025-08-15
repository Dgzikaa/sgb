'use client';

/**
 * Sistema de Share API nativa para Zykor
 * Permite compartilhamento de relatórios e dados via APIs nativas do navegador
 */

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

export interface ZykorShareConfig {
  type: 'relatorio' | 'evento' | 'analytics' | 'checklist' | 'financeiro';
  format: 'link' | 'pdf' | 'excel' | 'image' | 'json';
  data: any;
  title: string;
  description: string;
}

export class ZykorShareAPI {
  private static instance: ZykorShareAPI;

  public static getInstance(): ZykorShareAPI {
    if (!ZykorShareAPI.instance) {
      ZykorShareAPI.instance = new ZykorShareAPI();
    }
    return ZykorShareAPI.instance;
  }

  /**
   * Verifica se a Web Share API está disponível
   */
  isShareSupported(): boolean {
    return 'share' in navigator;
  }

  /**
   * Verifica se compartilhamento de arquivos está disponível
   */
  isFileShareSupported(): boolean {
    return 'canShare' in navigator && 'share' in navigator;
  }

  /**
   * Compartilha dados usando a Share API nativa
   */
  async share(shareData: ShareData): Promise<boolean> {
    if (!this.isShareSupported()) {
      // Fallback para compartilhamento manual
      return this.fallbackShare(shareData);
    }

    try {
      await navigator.share(shareData);
      console.log('✅ Conteúdo compartilhado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao compartilhar:', error);
      
      // Fallback em caso de erro
      return this.fallbackShare(shareData);
    }
  }

  /**
   * Compartilha relatório do Zykor
   */
  async shareZykorReport(config: ZykorShareConfig): Promise<boolean> {
    const { type, format, data, title, description } = config;

    try {
      let shareData: ShareData;

      switch (format) {
        case 'link':
          shareData = await this.generateShareLink(type, data, title, description);
          break;
        
        case 'pdf':
          shareData = await this.generatePDFShare(type, data, title, description);
          break;
        
        case 'excel':
          shareData = await this.generateExcelShare(type, data, title, description);
          break;
        
        case 'image':
          shareData = await this.generateImageShare(type, data, title, description);
          break;
        
        case 'json':
          shareData = await this.generateJSONShare(type, data, title, description);
          break;
        
        default:
          throw new Error(`Formato ${format} não suportado`);
      }

      return await this.share(shareData);

    } catch (error) {
      console.error('❌ Erro ao compartilhar relatório Zykor:', error);
      return false;
    }
  }

  /**
   * Métodos específicos para cada tipo de relatório
   */
  async shareVendasReport(periodoInicio: string, periodoFim: string, dadosVendas: any): Promise<boolean> {
    return this.shareZykorReport({
      type: 'relatorio',
      format: 'pdf',
      data: { periodoInicio, periodoFim, dadosVendas },
      title: `Relatório de Vendas - ${periodoInicio} a ${periodoFim}`,
      description: `Relatório completo de vendas do período ${periodoInicio} a ${periodoFim} - gerado pelo Zykor`
    });
  }

  async shareEventoDetails(evento: any): Promise<boolean> {
    return this.shareZykorReport({
      type: 'evento',
      format: 'link',
      data: evento,
      title: `Evento: ${evento.nome}`,
      description: `Detalhes do evento ${evento.nome} - ${evento.data} - via Zykor`
    });
  }

  async shareAnalyticsData(metricas: any, periodo: string): Promise<boolean> {
    return this.shareZykorReport({
      type: 'analytics',
      format: 'excel',
      data: { metricas, periodo },
      title: `Analytics - ${periodo}`,
      description: `Dados analíticos completos do período ${periodo} - gerado pelo Zykor`
    });
  }

  async shareChecklistResults(checklist: any, resultados: any): Promise<boolean> {
    return this.shareZykorReport({
      type: 'checklist',
      format: 'pdf',
      data: { checklist, resultados },
      title: `Checklist: ${checklist.nome}`,
      description: `Resultados do checklist ${checklist.nome} - via Zykor`
    });
  }

  async shareFinanceiroReport(relatorio: any, periodo: string): Promise<boolean> {
    return this.shareZykorReport({
      type: 'financeiro',
      format: 'excel',
      data: { relatorio, periodo },
      title: `Relatório Financeiro - ${periodo}`,
      description: `Relatório financeiro completo do período ${periodo} - gerado pelo Zykor`
    });
  }

  /**
   * Gera link de compartilhamento
   */
  private async generateShareLink(type: string, data: any, title: string, description: string): Promise<ShareData> {
    // Gerar URL temporária para visualização
    const shareUrl = await this.createTemporaryShareUrl(type, data);
    
    return {
      title,
      text: description,
      url: shareUrl
    };
  }

  /**
   * Gera compartilhamento de PDF
   */
  private async generatePDFShare(type: string, data: any, title: string, description: string): Promise<ShareData> {
    // Gerar PDF
    const pdfBlob = await this.generatePDF(type, data);
    const pdfFile = new File([pdfBlob], `${title}.pdf`, { type: 'application/pdf' });

    return {
      title,
      text: description,
      files: [pdfFile]
    };
  }

  /**
   * Gera compartilhamento de Excel
   */
  private async generateExcelShare(type: string, data: any, title: string, description: string): Promise<ShareData> {
    // Gerar Excel
    const excelBlob = await this.generateExcel(type, data);
    const excelFile = new File([excelBlob], `${title}.xlsx`, { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    return {
      title,
      text: description,
      files: [excelFile]
    };
  }

  /**
   * Gera compartilhamento de imagem
   */
  private async generateImageShare(type: string, data: any, title: string, description: string): Promise<ShareData> {
    // Gerar imagem (screenshot ou gráfico)
    const imageBlob = await this.generateImage(type, data);
    const imageFile = new File([imageBlob], `${title}.png`, { type: 'image/png' });

    return {
      title,
      text: description,
      files: [imageFile]
    };
  }

  /**
   * Gera compartilhamento de JSON
   */
  private async generateJSONShare(type: string, data: any, title: string, description: string): Promise<ShareData> {
    const jsonData = JSON.stringify(data, null, 2);
    const jsonBlob = new Blob([jsonData], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], `${title}.json`, { type: 'application/json' });

    return {
      title,
      text: description,
      files: [jsonFile]
    };
  }

  /**
   * Cria URL temporária para compartilhamento
   */
  private async createTemporaryShareUrl(type: string, data: any): Promise<string> {
    try {
      const response = await fetch('/api/share/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) throw new Error('Erro ao criar link');

      const { shareId } = await response.json();
      return `${window.location.origin}/share/${shareId}`;
      
    } catch (error) {
      console.error('Erro ao criar URL de compartilhamento:', error);
      return window.location.href;
    }
  }

  /**
   * Gera PDF do relatório
   */
  private async generatePDF(type: string, data: any): Promise<Blob> {
    try {
      const response = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) throw new Error('Erro ao gerar PDF');

      return await response.blob();
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback: criar PDF simples
      return this.createSimplePDF(data);
    }
  }

  /**
   * Gera Excel do relatório
   */
  private async generateExcel(type: string, data: any): Promise<Blob> {
    try {
      const response = await fetch('/api/reports/generate-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) throw new Error('Erro ao gerar Excel');

      return await response.blob();
      
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      // Fallback: criar CSV simples
      return this.createSimpleCSV(data);
    }
  }

  /**
   * Gera imagem do relatório (screenshot ou gráfico)
   */
  private async generateImage(type: string, data: any): Promise<Blob> {
    try {
      // Tentar capturar screenshot da página atual
      if ('getDisplayMedia' in navigator.mediaDevices) {
        return await this.captureScreenshot();
      }
      
      // Fallback: gerar gráfico simples
      return await this.generateChart(data);
      
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      // Fallback: imagem placeholder
      return this.createPlaceholderImage();
    }
  }

  /**
   * Fallback para navegadores sem Share API
   */
  private async fallbackShare(shareData: ShareData): Promise<boolean> {
    try {
      if (shareData.url) {
        // Copiar URL para clipboard
        await navigator.clipboard.writeText(shareData.url);
        this.showShareDialog('Link copiado para a área de transferência!');
        return true;
      }

      if (shareData.files && shareData.files.length > 0) {
        // Trigger download dos arquivos
        shareData.files.forEach(file => {
          const url = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        });
        return true;
      }

      // Fallback final: copiar texto
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
      this.showShareDialog('Texto copiado para a área de transferência!');
      return true;

    } catch (error) {
      console.error('Erro no fallback de compartilhamento:', error);
      return false;
    }
  }

  /**
   * Métodos auxiliares para fallbacks
   */
  private createSimplePDF(data: any): Blob {
    const content = `Relatório Zykor\n\nDados:\n${JSON.stringify(data, null, 2)}`;
    return new Blob([content], { type: 'text/plain' });
  }

  private createSimpleCSV(data: any): Blob {
    let csv = 'Relatório Zykor\n\n';
    
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      csv += headers.join(',') + '\n';
      data.forEach(row => {
        csv += headers.map(header => row[header] || '').join(',') + '\n';
      });
    } else {
      csv += 'Chave,Valor\n';
      Object.entries(data).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
    }

    return new Blob([csv], { type: 'text/csv' });
  }

  private async captureScreenshot(): Promise<Blob> {
    // Implementação simplificada - seria necessário uma lib específica
    return new Blob(['Screenshot não disponível'], { type: 'text/plain' });
  }

  private async generateChart(data: any): Promise<Blob> {
    // Implementação simplificada - seria necessário uma lib de gráficos
    return new Blob(['Gráfico não disponível'], { type: 'text/plain' });
  }

  private createPlaceholderImage(): Blob {
    // Criar canvas simples com texto
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, 0, 400, 200);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Relatório Zykor', 200, 100);

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  }

  private showShareDialog(message: string): void {
    // Mostrar notificação simples
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Zykor', {
        body: message,
        icon: '/logos/zykor-logo.png'
      });
    } else {
      // Fallback: alert ou toast
      alert(message);
    }
  }
}

// Hook para usar Share API
export function useShareAPI() {
  const shareManager = ZykorShareAPI.getInstance();

  return {
    isSupported: () => shareManager.isShareSupported(),
    isFileShareSupported: () => shareManager.isFileShareSupported(),
    share: (data: ShareData) => shareManager.share(data),
    shareReport: (config: ZykorShareConfig) => shareManager.shareZykorReport(config),
    
    // Métodos específicos
    shareVendas: (inicio: string, fim: string, dados: any) => 
      shareManager.shareVendasReport(inicio, fim, dados),
    shareEvento: (evento: any) => shareManager.shareEventoDetails(evento),
    shareAnalytics: (metricas: any, periodo: string) => 
      shareManager.shareAnalyticsData(metricas, periodo),
    shareChecklist: (checklist: any, resultados: any) => 
      shareManager.shareChecklistResults(checklist, resultados),
    shareFinanceiro: (relatorio: any, periodo: string) => 
      shareManager.shareFinanceiroReport(relatorio, periodo)
  };
}

export default ZykorShareAPI;
