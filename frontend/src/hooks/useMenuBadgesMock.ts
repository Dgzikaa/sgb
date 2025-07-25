'use client';

import { useState, useEffect } from 'react';

interface MenuBadges {
  home: number;
  checklist: number;
  producao: number;
  windsor: number;
  marketing: number;
  configuracoes: number;
  checklistAbertura: number;
  checklistFuncionario: number;
  producaoReceitas: number;
  producaoTerminal: number;
  windsorAnalytics: number;
  marketingWindsor: number;
  configChecklists: number;
  configMetas: number;
  configIntegracoes: number;
  configSeguranca: number;
  configWhatsapp: number;
  configContahub: number;
  configMeta: number;
  configTemplates: number;
  configAnalytics: number;
  configCache: number;
  configPwa: number;
  configBulkActions: number;
}

export function useMenuBadgesMock() {
  const [badges, setBadges] = useState<MenuBadges>({
    home: 0,
    checklist: 0,
    producao: 0,
    windsor: 0,
    marketing: 0,
    configuracoes: 0,
    checklistAbertura: 0,
    checklistFuncionario: 0,
    producaoReceitas: 0,
    producaoTerminal: 0,
    windsorAnalytics: 0,
    marketingWindsor: 0,
    configChecklists: 0,
    configMetas: 0,
    configIntegracoes: 0,
    configSeguranca: 0,
    configWhatsapp: 0,
    configContahub: 0,
    configMeta: 0,
    configTemplates: 0,
    configAnalytics: 0,
    configCache: 0,
    configPwa: 0,
    configBulkActions: 0,
  });

  useEffect(() => {
    // Simular badges com valores mocados
    const mockBadges: MenuBadges = {
      home: 2,
      checklist: 5,
      producao: 3,
      windsor: 1,
      marketing: 4,
      configuracoes: 8,
      checklistAbertura: 3,
      checklistFuncionario: 2,
      producaoReceitas: 2,
      producaoTerminal: 1,
      windsorAnalytics: 1,
      marketingWindsor: 4,
      configChecklists: 2,
      configMetas: 1,
      configIntegracoes: 1,
      configSeguranca: 0,
      configWhatsapp: 1,
      configContahub: 1,
      configMeta: 0,
      configTemplates: 1,
      configAnalytics: 1,
      configCache: 0,
      configPwa: 0,
      configBulkActions: 0,
    };

    setBadges(mockBadges);
  }, []);

  return {
    badges,
    refreshBadge: () => {},
    refreshAllBadges: () => {},
    isLoading: false,
  };
}
