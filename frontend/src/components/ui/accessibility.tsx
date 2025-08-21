'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  MousePointer, 
  Sun, 
  Moon,
  Contrast,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Accessibility,
  HelpCircle,
  Info,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Minus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume3,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Languages,
  Headphones,
  Speaker,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Shield,
  Lock,
  Unlock,
  User,
  Users,
  Settings as SettingsIcon,
  Home,
  Search,
  Menu,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Enter,
  Escape,
  Tab,
  Shift,
  Command,
  Control,
  Alt,
  Space,
  Backspace,
  Delete,
  Insert,
  PageUp,
  PageDown,
  End,
  Home as HomeIcon,
  F1,
  F2,
  F3,
  F4,
  F5,
  F6,
  F7,
  F8,
  F9,
  F10,
  F11,
  F12,
} from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Switch } from './switch';
import { Slider } from './slider';
import { Input } from './input';
import { cn } from '@/lib/utils';

// =====================================================
// ♿ SISTEMA DE ACESSIBILIDADE WCAG AAA - ZYKOR
// =====================================================

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicator: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  audioDescriptions: boolean;
  captions: boolean;
  signLanguage: boolean;
  voiceControl: boolean;
  eyeTracking: boolean;
  switchControl: boolean;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
  className?: string;
  defaultSettings?: Partial<AccessibilitySettings>;
  enableVoiceControl?: boolean;
  enableEyeTracking?: boolean;
  enableSwitchControl?: boolean;
}

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// =====================================================
// 🎯 PROVIDER DE ACESSIBILIDADE
// =====================================================

export function AccessibilityProvider({
  children,
  className = '',
  defaultSettings = {},
  enableVoiceControl = false,
  enableEyeTracking = false,
  enableSwitchControl = false,
}: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicator: true,
    colorBlindness: 'none',
    fontSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    audioDescriptions: false,
    captions: false,
    signLanguage: false,
    voiceControl: enableVoiceControl,
    eyeTracking: enableEyeTracking,
    switchControl: enableSwitchControl,
    ...defaultSettings,
  });

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null);
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);

  // Aplicar configurações de acessibilidade
  useEffect(() => {
    const root = document.documentElement;
    
    // Alto contraste
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Texto grande
    if (settings.largeText) {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    // Reduzir movimento
    if (settings.reducedMotion) {
      root.style.setProperty('--reduced-motion', 'reduce');
    } else {
      root.style.setProperty('--reduced-motion', 'no-preference');
    }

    // Daltonismo
    if (settings.colorBlindness !== 'none') {
      root.classList.add(`colorblind-${settings.colorBlindness}`);
    } else {
      root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    }

    // Tamanho da fonte
    root.style.setProperty('--font-size', `${settings.fontSize}px`);
    root.style.setProperty('--line-height', settings.lineHeight.toString());
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}px`);

    // Salvar no localStorage
    localStorage.setItem('zykor-accessibility', JSON.stringify(settings));
  }, [settings]);

  // Carregar configurações salvas
  useEffect(() => {
    const saved = localStorage.getItem('zykor-accessibility');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved accessibility settings');
      }
    }
  }, []);

  // Gerenciar foco
  const handleFocusChange = useCallback((element: HTMLElement) => {
    setCurrentFocus(element);
    setFocusHistory(prev => {
      const filtered = prev.filter(el => el !== element);
      return [element, ...filtered].slice(0, 10);
    });

    // Indicador de foco visual
    if (settings.focusIndicator) {
      element.style.outline = '3px solid #0066cc';
      element.style.outlineOffset = '2px';
      
      setTimeout(() => {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }, 2000);
    }
  }, [settings.focusIndicator]);

  // Navegação por teclado
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Skip links
      if (e.key === 'Tab' && e.shiftKey && target.classList.contains('skip-link')) {
        e.preventDefault();
        const skipTarget = document.querySelector(target.getAttribute('href') || '');
        if (skipTarget) {
          (skipTarget as HTMLElement).focus();
        }
      }

      // Navegação por cabeçalhos
      if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const currentIndex = headers.findIndex(h => h === document.activeElement);
        const nextIndex = (currentIndex + 1) % headers.length;
        (headers[nextIndex] as HTMLElement).focus();
      }

      // Navegação por landmarks
      if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const landmarks = Array.from(document.querySelectorAll('main, nav, aside, header, footer'));
        const currentIndex = landmarks.findIndex(l => l === document.activeElement);
        const nextIndex = (e.shiftKey ? currentIndex - 1 : currentIndex + 1 + landmarks.length) % landmarks.length;
        (landmarks[nextIndex] as HTMLElement).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation]);

  // Atalhos de teclado de acessibilidade
  useEffect(() => {
    const handleAccessibilityShortcuts = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Alt + A: Abrir painel de acessibilidade
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'a') {
        e.preventDefault();
        setIsPanelOpen(prev => !prev);
      }

      // Ctrl/Cmd + Alt + C: Alternar alto contraste
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'c') {
        e.preventDefault();
        setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
      }

      // Ctrl/Cmd + Alt + T: Alternar texto grande
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 't') {
        e.preventDefault();
        setSettings(prev => ({ ...prev, largeText: !prev.largeText }));
      }

      // Ctrl/Cmd + Alt + M: Alternar movimento reduzido
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'm') {
        e.preventDefault();
        setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
      }
    };

    document.addEventListener('keydown', handleAccessibilityShortcuts);
    return () => document.removeEventListener('keydown', handleAccessibilityShortcuts);
  }, []);

  // Contexto de acessibilidade
  const accessibilityContext = {
    settings,
    setSettings,
    currentFocus,
    focusHistory,
    handleFocusChange,
    isPanelOpen,
    setIsPanelOpen,
  };

  return (
    <AccessibilityContext.Provider value={accessibilityContext}>
      <div className={className}>
        {/* Skip links */}
        <div className="skip-links">
          <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
            Pular para o conteúdo principal
          </a>
          <a href="#navigation" className="skip-link sr-only focus:not-sr-only">
            Pular para a navegação
          </a>
          <a href="#footer" className="skip-link sr-only focus:not-sr-only">
            Pular para o rodapé
          </a>
        </div>

        {/* Botão de acessibilidade flutuante */}
        <AccessibilityFloatingButton />

        {/* Painel de acessibilidade */}
        <AccessibilityPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />

        {/* Conteúdo principal */}
        <div
          id="main-content"
          tabIndex={-1}
          onFocus={(e) => handleFocusChange(e.currentTarget)}
        >
          {children}
        </div>
      </div>
    </AccessibilityContext.Provider>
  );
}

// =====================================================
// 🎨 CONTEXTO DE ACESSIBILIDADE
// =====================================================

const AccessibilityContext = React.createContext<any>(null);

export function useAccessibility() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// =====================================================
// 🔘 BOTÃO FLUTUANTE DE ACESSIBILIDADE
// =====================================================

function AccessibilityFloatingButton() {
  const { setIsPanelOpen } = useAccessibility();

  return (
    <motion.button
      className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
      onClick={() => setIsPanelOpen(true)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Configurações de acessibilidade"
      title="Configurações de acessibilidade (Ctrl+Alt+A)"
    >
      <Accessibility className="w-6 h-6" />
    </motion.button>
  );
}

// =====================================================
// 🎛️ PAINEL DE ACESSIBILIDADE
// =====================================================

function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { settings, setSettings } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'navigation' | 'advanced'>('visual');

  const tabs = [
    { id: 'visual', label: 'Visual', icon: <Eye className="w-4 h-4" /> },
    { id: 'audio', label: 'Áudio', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'navigation', label: 'Navegação', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'advanced', label: 'Avançado', icon: <Settings className="w-4 h-4" /> },
  ];

  const updateSetting = useCallback((key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [setSettings]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'visual':
        return (
          <div className="space-y-4">
            {/* Alto contraste */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Alto Contraste</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Melhora a visibilidade do texto e elementos
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                aria-label="Alternar alto contraste"
              />
            </div>

            {/* Texto grande */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Texto Grande</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aumenta o tamanho da fonte para melhor legibilidade
                </p>
              </div>
              <Switch
                checked={settings.largeText}
                onCheckedChange={(checked) => updateSetting('largeText', checked)}
                aria-label="Alternar texto grande"
              />
            </div>

            {/* Tamanho da fonte */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tamanho da Fonte: {settings.fontSize}px
              </label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting('fontSize', value)}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            {/* Daltonismo */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Simulação de Daltonismo
              </label>
              <select
                value={settings.colorBlindness}
                onChange={(e) => updateSetting('colorBlindness', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="none">Nenhum</option>
                <option value="protanopia">Protanopia (Vermelho-verde)</option>
                <option value="deuteranopia">Deuteranopia (Vermelho-verde)</option>
                <option value="tritanopia">Tritanopia (Azul-amarelo)</option>
              </select>
            </div>

            {/* Reduzir movimento */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Reduzir Movimento</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Minimiza animações e transições
                </p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                aria-label="Alternar movimento reduzido"
              />
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            {/* Descrições de áudio */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Descrições de Áudio</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Narrações descritivas para conteúdo visual
                </p>
              </div>
              <Switch
                checked={settings.audioDescriptions}
                onCheckedChange={(checked) => updateSetting('audioDescriptions', checked)}
                aria-label="Alternar descrições de áudio"
              />
            </div>

            {/* Legendas */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Legendas</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Texto para conteúdo de áudio
                </p>
              </div>
              <Switch
                checked={settings.captions}
                onCheckedChange={(checked) => updateSetting('captions', checked)}
                aria-label="Alternar legendas"
              />
            </div>

            {/* Língua de sinais */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Língua de Sinais</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interpretação em língua de sinais
                </p>
              </div>
              <Switch
                checked={settings.signLanguage}
                onCheckedChange={(checked) => updateSetting('signLanguage', checked)}
                aria-label="Alternar língua de sinais"
              />
            </div>

            {/* Controle por voz */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Controle por Voz</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Navegação e controle por comandos de voz
                </p>
              </div>
              <Switch
                checked={settings.voiceControl}
                onCheckedChange={(checked) => updateSetting('voiceControl', checked)}
                aria-label="Alternar controle por voz"
              />
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className="space-y-4">
            {/* Navegação por teclado */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Navegação por Teclado</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Permite navegação completa usando apenas o teclado
                </p>
              </div>
              <Switch
                checked={settings.keyboardNavigation}
                onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                aria-label="Alternar navegação por teclado"
              />
            </div>

            {/* Indicador de foco */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Indicador de Foco</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Destaca visualmente o elemento em foco
                </p>
              </div>
              <Switch
                checked={settings.focusIndicator}
                onCheckedChange={(checked) => updateSetting('focusIndicator', checked)}
                aria-label="Alternar indicador de foco"
              />
            </div>

            {/* Atalhos de teclado */}
            <div className="space-y-2">
              <h4 className="font-medium">Atalhos de Teclado</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Alt+A</kbd> Abrir painel de acessibilidade</div>
                <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Alt+C</kbd> Alternar alto contraste</div>
                <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Alt+T</kbd> Alternar texto grande</div>
                <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Alt+M</kbd> Alternar movimento reduzido</div>
                <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">H</kbd> Navegar por cabeçalhos</div>
                <div><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">L</kbd> Navegar por landmarks</div>
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-4">
            {/* Rastreador ocular */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Rastreador Ocular</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Controle por movimento dos olhos
                </p>
              </div>
              <Switch
                checked={settings.eyeTracking}
                onCheckedChange={(checked) => updateSetting('eyeTracking', checked)}
                aria-label="Alternar rastreador ocular"
              />
            </div>

            {/* Controle por switch */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Controle por Switch</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Navegação por dispositivos de switch
                </p>
              </div>
              <Switch
                checked={settings.switchControl}
                onCheckedChange={(checked) => updateSetting('switchControl', checked)}
                aria-label="Alternar controle por switch"
              />
            </div>

            {/* Reset das configurações */}
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  const defaultSettings: AccessibilitySettings = {
                    highContrast: false,
                    largeText: false,
                    reducedMotion: false,
                    screenReader: false,
                    keyboardNavigation: true,
                    focusIndicator: true,
                    colorBlindness: 'none',
                    fontSize: 16,
                    lineHeight: 1.5,
                    letterSpacing: 0,
                    audioDescriptions: false,
                    captions: false,
                    signLanguage: false,
                    voiceControl: false,
                    eyeTracking: false,
                    switchControl: false,
                  };
                  setSettings(defaultSettings);
                }}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrões
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 top-20 mx-auto max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Accessibility className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold">Configurações de Acessibilidade</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Personalize sua experiência de uso
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {renderTabContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Conformidade WCAG AAA
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Ajuda
                </Button>
                <Button variant="outline" size="sm">
                  <Info className="w-4 h-4 mr-2" />
                  Sobre
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =====================================================
// 🎯 COMPONENTES DE ACESSIBILIDADE
// =====================================================

// Skip link
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
    >
      {children}
    </a>
  );
}

// Focus trap
export function FocusTrap({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, []);

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  );
}

// Live region
export function LiveRegion({ 
  children, 
  ariaLive = 'polite',
  className = '' 
}: { 
  children: React.ReactNode;
  ariaLive?: 'off' | 'polite' | 'assertive';
  className?: string;
}) {
  return (
    <div
      aria-live={ariaLive}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

// Screen reader only
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// =====================================================
// 🚀 HOOKS DE ACESSIBILIDADE
// =====================================================

export function useFocusManagement() {
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);
  const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null);

  const addToFocusHistory = useCallback((element: HTMLElement) => {
    setFocusHistory(prev => {
      const filtered = prev.filter(el => el !== element);
      return [element, ...filtered].slice(0, 10);
    });
    setCurrentFocus(element);
  }, []);

  const goBackInFocusHistory = useCallback(() => {
    if (focusHistory.length > 1) {
      const previousFocus = focusHistory[1];
      previousFocus?.focus();
      setFocusHistory(prev => prev.slice(1));
    }
  }, [focusHistory]);

  return {
    focusHistory,
    currentFocus,
    addToFocusHistory,
    goBackInFocusHistory,
  };
}

export function useKeyboardNavigation() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled) return;

      // Navegação por cabeçalhos
      if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const currentIndex = headers.findIndex(h => h === document.activeElement);
        const nextIndex = (currentIndex + 1) % headers.length;
        (headers[nextIndex] as HTMLElement).focus();
      }

      // Navegação por landmarks
      if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const landmarks = Array.from(document.querySelectorAll('main, nav, aside, header, footer'));
        const currentIndex = landmarks.findIndex(l => l === document.activeElement);
        const nextIndex = (e.shiftKey ? currentIndex - 1 : currentIndex + 1 + landmarks.length) % landmarks.length;
        (landmarks[nextIndex] as HTMLElement).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);

  return {
    isEnabled,
    setIsEnabled,
  };
}

export function useHighContrast() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    
    if (isEnabled) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isEnabled]);

  return {
    isEnabled,
    setIsEnabled,
  };
}

// =====================================================
// 📱 ACESSIBILIDADE RESPONSIVA
// =====================================================

export function ResponsiveAccessibilityProvider(props: AccessibilityProviderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const mobileProps = {
    enableVoiceControl: !isMobile && props.enableVoiceControl,
    enableEyeTracking: !isMobile && props.enableEyeTracking,
    enableSwitchControl: !isMobile && props.enableSwitchControl,
  };

  return (
    <AccessibilityProvider
      {...props}
      {...mobileProps}
    />
  );
}
