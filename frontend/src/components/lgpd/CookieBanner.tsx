'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useLGPD } from '@/hooks/useLGPD';
import { Shield, X, CheckCircle, AlertTriangle } from 'lucide-react';

export function CookieBanner() {
  const { showBanner, dismissBanner, updateConsents, hasConsent, isLoading } =
    useLGPD();

  const [showDetails, setShowDetails] = useState(false);
  const [tempConsents, setTempConsents] = useState({
    analytics: hasConsent('analytics'),
    marketing: hasConsent('marketing'),
    preferences: hasConsent('preferences'),
    functional: hasConsent('functional'),
  });

  if (!showBanner || isLoading) return null;

  const handleAcceptAll = async () => {
    await updateConsents({
      analytics: true,
      marketing: true,
      preferences: true,
      functional: true,
    });
    dismissBanner();
  };

  const handleAcceptEssential = async () => {
    await updateConsents({
      analytics: false,
      marketing: false,
      preferences: false,
      functional: false,
    });
    dismissBanner();
  };

  const handleCustomSave = async () => {
    await updateConsents(tempConsents);
    dismissBanner();
    setShowDetails(false);
  };

  if (showDetails) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🔒 Configurações de Privacidade
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas preferências de cookies conforme a LGPD
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  type: 'essential',
                  name: 'Essenciais',
                  description: 'Necessários para funcionamento',
                  required: true,
                },
                {
                  type: 'analytics',
                  name: 'Analytics',
                  description: 'Análise de uso',
                  required: false,
                },
                {
                  type: 'marketing',
                  name: 'Marketing',
                  description: 'Publicidade personalizada',
                  required: false,
                },
                {
                  type: 'preferences',
                  name: 'Preferências',
                  description: 'Configurações pessoais',
                  required: false,
                },
                {
                  type: 'functional',
                  name: 'Funcionais',
                  description: 'Recursos extras',
                  required: false,
                },
              ].map(cookie => (
                <div
                  key={cookie.type}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {cookie.name}
                      {cookie.required && (
                        <Badge className="ml-2 text-xs bg-red-100 text-red-800">
                          Obrigatório
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cookie.description}
                    </p>
                  </div>
                  <Switch
                    checked={
                      cookie.required ||
                      tempConsents[cookie.type as keyof typeof tempConsents]
                    }
                    disabled={cookie.required}
                    onCheckedChange={checked => {
                      if (!cookie.required) {
                        setTempConsents(prev => ({
                          ...prev,
                          [cookie.type]: checked,
                        }));
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCustomSave}>Salvar Preferências</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Banner Principal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        <Card className="max-w-6xl mx-auto border-none shadow-none bg-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Ícone e título */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🍪</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Cookies e Privacidade
                  </h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    LGPD Conforme
                  </Badge>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua
                  experiência, personalizar conteúdo e analisar o tráfego. Você
                  pode escolher quais cookies aceitar conforme seus direitos da{' '}
                  <strong>LGPD</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Seus dados são tratados com segurança conforme nossa
                  </span>
                  <button
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    onClick={() =>
                      window.open('/politica-privacidade', '_blank')
                    }
                  >
                    Política de Privacidade
                  </button>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptEssential}
                  className="w-full sm:w-auto text-xs"
                >
                  Apenas Essenciais
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="w-full sm:w-auto text-xs"
                >
                  Personalizar
                </Button>

                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700"
                >
                  Aceitar Todos
                </Button>
              </div>
            </div>

            {/* Informações legais */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>🔒 Dados criptografados e seguros</span>
                <span>📞 DPO: privacy@seusite.com</span>
                <span>⚖️ Conforme LGPD nº 13.709/2018</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40 pointer-events-none" />
    </>
  );
}
