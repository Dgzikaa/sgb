'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { ReactNode } from 'react';

// Função utilitária para acessar navigator com segurança
const getSafeUserAgent = (): string => {
  if (typeof window === 'undefined' || !navigator) {
    return 'Server';
  }
  return navigator.userAgent;
};

// Tipos de consentimento LGPD
export type ConsentType =
  | 'essential' // Cookies essenciais (sempre ativo)
  | 'analytics' // Google Analytics, métricas
  | 'marketing' // Marketing, remarketing
  | 'preferences' // Preferências do usuário
  | 'functional'; // Funcionalidades extras

export interface LGPDConsent {
  type: ConsentType;
  granted: boolean;
  timestamp: Date;
  version: string;
  ip?: string;
  userAgent?: string;
}

export interface LGPDUserRights {
  accessData: () => Promise<unknown>; // Art. 15 - Acesso aos dados
  portabilityData: () => Promise<Blob>; // Art. 20 - Portabilidade
  rectifyData: (data: unknown) => Promise<void>; // Art. 16 - Retificação
  deleteData: () => Promise<void>; // Art. 17 - Exclusão
  restrictProcessing: () => Promise<void>; // Art. 18 - Limitação
  objectProcessing: () => Promise<void>; // Art. 21 - Oposição
}

export interface LGPDSettings {
  consents: Record<ConsentType, LGPDConsent>;
  bannerShown: boolean;
  lastUpdated: Date;
  version: string;
  userId?: string;
}

// Contexto LGPD
interface LGPDContextType {
  settings: LGPDSettings;
  hasConsent: (type: ConsentType) => boolean;
  grantConsent: (type: ConsentType) => Promise<void>;
  revokeConsent: (type: ConsentType) => Promise<void>;
  updateConsents: (
    consents: Partial<Record<ConsentType, boolean>>
  ) => Promise<void>;
  showBanner: boolean;
  dismissBanner: () => void;
  exerciseRights: LGPDUserRights;
  isLoading: boolean;
  error: string | null;
}

const LGPDContext = createContext<LGPDContextType | null>(null);

// Hook principal
export function useLGPD(): LGPDContextType {
  const context = useContext(LGPDContext);
  if (!context) {
    throw new Error('useLGPD must be used within LGPDProvider');
  }
  return context;
}

// Configurações padrão
const DEFAULT_SETTINGS: LGPDSettings = {
  consents: {
    essential: {
      type: 'essential',
      granted: true, // Sempre obrigatório
      timestamp: new Date(),
      version: '1.0',
    },
    analytics: {
      type: 'analytics',
      granted: false,
      timestamp: new Date(),
      version: '1.0',
    },
    marketing: {
      type: 'marketing',
      granted: false,
      timestamp: new Date(),
      version: '1.0',
    },
    preferences: {
      type: 'preferences',
      granted: false,
      timestamp: new Date(),
      version: '1.0',
    },
    functional: {
      type: 'functional',
      granted: false,
      timestamp: new Date(),
      version: '1.0',
    },
  },
  bannerShown: false,
  lastUpdated: new Date(),
  version: '1.0',
};

// Hook de implementação
export function useLGPDImplementation() {
  const [settings, setSettings] = useState<LGPDSettings>(DEFAULT_SETTINGS);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar configurações do localStorage/servidor
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        // Primeiro, verificar localStorage
        const stored = localStorage.getItem('lgpd_settings');
        let localSettings = stored ? JSON.parse(stored) : null;

        // Verificar se há configurações no servidor (se usuário logado)
        const userId = localStorage.getItem('user_id');
        if (userId) {
          try {
            const response = await fetch('/api/lgpd/settings', {
              credentials: 'include',
            });

            if (response.ok) {
              const serverSettings = await response.json();
              // Servidor tem prioridade sobre localStorage
              localSettings = serverSettings;
            }
          } catch (serverError) {
            console.warn(
              'Erro ao carregar configurações LGPD do servidor:',
              serverError
            );
          }
        }

        if (localSettings) {
          // Verificar se versão mudou (necessário re-consentimento)
          if (localSettings.version !== DEFAULT_SETTINGS.version) {
            setShowBanner(true);
          } else {
            setShowBanner(!localSettings.bannerShown);
          }

          setSettings({
            ...localSettings,
            consents: {
              ...DEFAULT_SETTINGS.consents,
              ...localSettings.consents,
            },
          });
        } else {
          // Primeira visita - mostrar banner
          setShowBanner(true);
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        setError('Erro ao carregar configurações de privacidade');
        console.error('Erro LGPD:', err);
        setShowBanner(true);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Salvar configurações
  const saveSettings = useCallback(async (newSettings: LGPDSettings) => {
    try {
      // Salvar no localStorage
      localStorage.setItem('lgpd_settings', JSON.stringify(newSettings));

      // Salvar no servidor se usuário logado
      const userId = localStorage.getItem('user_id');
      if (userId) {
        await fetch('/api/lgpd/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(newSettings),
        });
      }

      // Log de auditoria
      await fetch('/api/lgpd/audit-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'consent_updated',
          details: newSettings.consents,
          timestamp: new Date(),
          ip: await getClientIP(),
          userAgent: getSafeUserAgent(),
        }),
      });
    } catch (err) {
      console.error('Erro ao salvar configurações LGPD:', err);
    }
  }, []);

  // Verificar consentimento
  const hasConsent = useCallback(
    (type: ConsentType): boolean => {
      return settings.consents[type]?.granted || false;
    },
    [settings.consents]
  );

  // Conceder consentimento
  const grantConsent = useCallback(
    async (type: ConsentType) => {
      const clientIP = await getClientIP();

      const newConsent: LGPDConsent = {
        type,
        granted: true,
        timestamp: new Date(),
        version: DEFAULT_SETTINGS.version,
        ip: clientIP,
        userAgent: getSafeUserAgent(),
      };

      const newSettings = {
        ...settings,
        consents: {
          ...settings.consents,
          [type]: newConsent,
        },
        lastUpdated: new Date(),
      };

      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // Revogar consentimento
  const revokeConsent = useCallback(
    async (type: ConsentType) => {
      // Essential não pode ser revogado
      if (type === 'essential') return;

      const clientIP = await getClientIP();

      const newConsent: LGPDConsent = {
        type,
        granted: false,
        timestamp: new Date(),
        version: DEFAULT_SETTINGS.version,
        ip: clientIP,
        userAgent: getSafeUserAgent(),
      };

      const newSettings = {
        ...settings,
        consents: {
          ...settings.consents,
          [type]: newConsent,
        },
        lastUpdated: new Date(),
      };

      setSettings(newSettings);
      await saveSettings(newSettings);

      // Limpar cookies específicos do tipo revogado
      clearCookiesByType(type);
    },
    [settings, saveSettings]
  );

  // Atualizar múltiplos consentimentos
  const updateConsents = useCallback(
    async (consents: Partial<Record<ConsentType, boolean>>) => {
      const newConsents = { ...settings.consents };
      const clientIP = await getClientIP();

      Object.entries(consents).forEach(([type, granted]) => {
        if (type === 'essential' && !granted) return; // Essential sempre true

        newConsents[type as ConsentType] = {
          type: type as ConsentType,
          granted: granted || false,
          timestamp: new Date(),
          version: DEFAULT_SETTINGS.version,
          ip: clientIP,
          userAgent: getSafeUserAgent(),
        };
      });

      const newSettings = {
        ...settings,
        consents: newConsents,
        lastUpdated: new Date(),
      };

      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // Dispensar banner
  const dismissBanner = useCallback(() => {
    const newSettings = {
      ...settings,
      bannerShown: true,
      lastUpdated: new Date(),
    };

    setSettings(newSettings);
    saveSettings(newSettings);
    setShowBanner(false);
  }, [settings, saveSettings]);

  // Direitos do usuário (Art. 18 LGPD)
  const exerciseRights: LGPDUserRights = {
    // Direito de acesso (Art. 15)
    accessData: async () => {
      const response = await fetch('/api/lgpd/data-access', {
        credentials: 'include',
      });
      return await response.json();
    },

    // Portabilidade (Art. 20)
    portabilityData: async () => {
      const response = await fetch('/api/lgpd/data-portability', {
        credentials: 'include',
      });
      return await response.blob();
    },

    // Retificação (Art. 16)
    rectifyData: async (data: unknown) => {
      await fetch('/api/lgpd/data-rectification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
    },

    // Exclusão (Art. 17)
    deleteData: async () => {
      await fetch('/api/lgpd/data-deletion', {
        method: 'DELETE',
        credentials: 'include',
      });

      // Limpar dados locais
      localStorage.clear();
      sessionStorage.clear();

      // Recarregar página
      window.location.reload();
    },

    // Limitação do tratamento (Art. 18)
    restrictProcessing: async () => {
      await fetch('/api/lgpd/restrict-processing', {
        method: 'POST',
        credentials: 'include',
      });
    },

    // Oposição ao tratamento (Art. 21)
    objectProcessing: async () => {
      await fetch('/api/lgpd/object-processing', {
        method: 'POST',
        credentials: 'include',
      });
    },
  };

  return {
    settings,
    hasConsent,
    grantConsent,
    revokeConsent,
    updateConsents,
    showBanner,
    dismissBanner,
    exerciseRights,
    isLoading,
    error,
  };
}

// Utilitários
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('/api/utils/client-ip');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

function clearCookiesByType(type: ConsentType) {
  const cookiePatterns = {
    analytics: ['_ga', '_gid', '_gat', 'gtm'],
    marketing: ['_fbp', '_fbc', 'ads'],
    preferences: ['theme', 'lang'],
    functional: ['session', 'temp'],
  };

  const patterns = cookiePatterns[type as keyof typeof cookiePatterns];
  if (!patterns) return;

  document.cookie.split(';').forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();

    if (patterns.some(pattern => cookieName.includes(pattern))) {
      // Deletar cookie
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.split('.').slice(-2).join('.')};`;
    }
  });
}

// Provider Component
export function LGPDProvider({ children }: { children: ReactNode }) {
  const lgpdImplementation = useLGPDImplementation();

  return (
    <LGPDContext.Provider value={lgpdImplementation}>
      {children}
    </LGPDContext.Provider>
  );
}
