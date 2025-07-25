'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
} from 'lucide-react';

// =====================================================
// 📱 PREVIEW MOBILE PARA CHECKLIST
// =====================================================
// Mostra como o checklist ficará no celular durante a criação

interface PreviewItem {
  id: string;
  titulo: string;
  tipo: string;
  obrigatorio: boolean;
  opcoes?: string[];
  placeholder?: string;
  secao?: string;
}

interface MobilePreviewProps {
  titulo: string;
  descricao?: string;
  itens: PreviewItem[];
  showPreview: boolean;
  onTogglePreview: (show: boolean) => void;
}

export default function MobilePreview({
  titulo,
  descricao,
  itens,
  showPreview,
  onTogglePreview,
}: MobilePreviewProps) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(
    'mobile'
  );
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  const getDeviceStyles = () => {
    switch (deviceType) {
      case 'mobile':
        return {
          width: '375px',
          height: '667px',
          aspectRatio: '375/667',
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          aspectRatio: '768/1024',
        };
      case 'desktop':
        return {
          width: '1200px',
          height: '800px',
          aspectRatio: '1200/800',
        };
    }
  };

  const renderItemField = (item: PreviewItem) => {
    const baseClass = 'w-full p-3 border rounded-lg';
    const fieldClass = darkMode
      ? `${baseClass} bg-gray-800 border-gray-600 text-white`
      : `${baseClass} bg-white border-gray-300`;

    switch (item.tipo) {
      case 'sim_nao':
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 touch-manipulation h-12"
              disabled
            >
              ✅ Sim
            </Button>
            <Button
              variant="outline"
              className="flex-1 touch-manipulation h-12"
              disabled
            >
              ❌ Não
            </Button>
          </div>
        );

      case 'texto':
        return (
          <input
            type="text"
            placeholder={item.placeholder || 'Digite aqui...'}
            className={fieldClass}
            disabled
          />
        );

      case 'numero':
        return (
          <input
            type="number"
            placeholder={item.placeholder || '0'}
            className={fieldClass}
            disabled
          />
        );

      case 'data':
        return <input type="date" className={fieldClass} disabled />;

      case 'foto_camera':
        return (
          <Button
            variant="outline"
            className="w-full h-24 touch-manipulation"
            disabled
          >
            📷 Tirar Foto
          </Button>
        );

      case 'foto_upload':
        return (
          <Button
            variant="outline"
            className="w-full h-24 touch-manipulation"
            disabled
          >
            🖼️ Enviar Imagem
          </Button>
        );

      case 'avaliacao':
        return (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className="text-2xl touch-manipulation p-2"
                disabled
              >
                ⭐
              </button>
            ))}
          </div>
        );

      case 'assinatura':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center">
            <span className="text-gray-500">✍️ Área de Assinatura</span>
          </div>
        );

      default:
        return (
          <input
            type="text"
            placeholder="Campo genérico"
            className={fieldClass}
            disabled
          />
        );
    }
  };

  const groupedItems = itens.reduce(
    (acc, item) => {
      const secao = item.secao || 'Geral';
      if (!acc[secao]) {
        acc[secao] = [];
      }
      acc[secao].push(item);
      return acc;
    },
    {} as Record<string, PreviewItem[]>
  );

  if (!showPreview) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => onTogglePreview(true)}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg touch-manipulation"
          size="lg"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Mobile
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full max-h-full overflow-hidden">
        {/* Header do Preview */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">Preview Mobile</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de Dispositivo */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={deviceType === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceType('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceType === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceType('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceType === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceType('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>

            {/* Controles de Zoom */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Dark</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            {/* Fechar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTogglePreview(false)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-4 overflow-auto max-h-[80vh]">
          <div
            className="mx-auto border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg"
            style={{
              ...getDeviceStyles(),
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Simulação da Tela */}
            <div
              className={`h-full overflow-auto ${
                darkMode ? 'bg-gray-900' : 'bg-gray-50'
              }`}
            >
              {/* Header do App */}
              <div
                className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b`}
              >
                <h1
                  className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {titulo || 'Checklist'}
                </h1>
                {descricao && (
                  <p
                    className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {descricao}
                  </p>
                )}
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-4">
                {Object.entries(groupedItems).map(([secao, items]) => (
                  <div key={secao}>
                    {/* Título da Seção */}
                    <h2
                      className={`text-base font-semibold mb-3 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {secao}
                    </h2>

                    {/* Itens da Seção */}
                    <div className="space-y-3">
                      {items.map(item => (
                        <Card
                          key={item.id}
                          className={
                            darkMode
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-white'
                          }
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3
                                  className={`text-sm font-medium ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {item.titulo}
                                </h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {item.tipo}
                                  </Badge>
                                  {item.obrigatorio && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">
                                      *
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {renderItemField(item)}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Botão de Envio */}
                <div className="pt-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 touch-manipulation"
                    size="lg"
                    disabled
                  >
                    Enviar Checklist
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Informações */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            📱 Preview: {deviceType} • {itens.length} itens • Zoom:{' '}
            {Math.round(zoom * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// 🎯 HOOK PARA GERENCIAR PREVIEW
// =====================================================

export function useMobilePreview() {
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    titulo: string;
    descricao?: string;
    itens: PreviewItem[];
  }>({
    titulo: '',
    itens: [],
  });

  const updatePreview = (data: Partial<typeof previewData>) => {
    setPreviewData(prev => ({ ...prev, ...data }));
  };

  const togglePreview = (show?: boolean) => {
    setShowPreview(show ?? !showPreview);
  };

  return {
    showPreview,
    previewData,
    updatePreview,
    togglePreview,
  };
}
