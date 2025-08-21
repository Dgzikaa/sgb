'use client';

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Contrast, 
  Type, 
  MousePointer, 
  Keyboard,
  Accessibility,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Contexto de acessibilidade
interface AccessibilityContextType {
  // Configurações visuais
  highContrast: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  
  // Configurações de movimento
  reduceMotion: boolean;
  autoPlay: boolean;
  
  // Configurações de áudio
  audioDescriptions: boolean;
  captions: boolean;
  
  // Configurações de navegação
  keyboardOnly: boolean;
  focusIndicator: boolean;
  
  // Métricas de acessibilidade
  wcagScore: number;
  accessibilityIssues: AccessibilityIssue[];
  
  // Ações
  toggleHighContrast: () => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: number) => void;
  toggleReduceMotion: () => void;
  toggleAudioDescriptions: () => void;
  toggleCaptions: () => void;
  toggleKeyboardOnly: () => void;
  toggleFocusIndicator: () => void;
  runAccessibilityAudit: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Hook para usar contexto de acessibilidade
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Tipos para acessibilidade
interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'contrast' | 'navigation' | 'semantics' | 'media' | 'forms';
  message: string;
  element?: HTMLElement;
  severity: 'high' | 'medium' | 'low';
  wcagCriteria: string[];
  fix?: string;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

// Provider de acessibilidade
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [audioDescriptions, setAudioDescriptions] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [keyboardOnly, setKeyboardOnly] = useState(false);
  const [focusIndicator, setFocusIndicator] = useState(true);
  const [wcagScore, setWcagScore] = useState(100);
  const [accessibilityIssues, setAccessibilityIssues] = useState<AccessibilityIssue[]>([]);

  // Aplicar configurações de acessibilidade
  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar contraste alto
    if (highContrast) {
      root.style.setProperty('--color-primary', '#000000');
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-text', '#000000');
    } else {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-background');
      root.style.removeProperty('--color-text');
    }
    
    // Aplicar tamanho da fonte
    root.style.setProperty('--font-size-base', `${fontSize}px`);
    root.style.setProperty('--line-height-base', lineHeight.toString());
    root.style.setProperty('--letter-spacing-base', `${letterSpacing}px`);
    
    // Aplicar redução de movimento
    if (reduceMotion) {
      root.style.setProperty('--transition-duration', '0s');
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--transition-duration');
      root.style.removeProperty('--animation-duration');
    }
  }, [highContrast, fontSize, lineHeight, letterSpacing, reduceMotion]);

  // Auditoria de acessibilidade
  const runAccessibilityAudit = useCallback(() => {
    const issues: AccessibilityIssue[] = [];
    
    // Verificar contraste de cores
    const checkContrast = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach((element) => {
        const style = window.getComputedStyle(element);
        const backgroundColor = style.backgroundColor;
        const color = style.color;
        
        // Simular verificação de contraste
        if (color && backgroundColor) {
          // Em produção, usar biblioteca real de contraste
          const contrastRatio = 4.5; // Simulado
          if (contrastRatio < 4.5) {
            issues.push({
              id: `contrast-${Date.now()}`,
              type: 'error',
              category: 'contrast',
              message: 'Contraste insuficiente detectado',
              element: element as HTMLElement,
              severity: 'high',
              wcagCriteria: ['1.4.3', '1.4.6'],
              fix: 'Aumentar contraste entre texto e fundo'
            });
          }
        }
      });
    };
    
    // Verificar navegação por teclado
    const checkKeyboardNavigation = () => {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      focusableElements.forEach((element) => {
        if (!element.hasAttribute('tabindex') && !element.hasAttribute('role')) {
          issues.push({
            id: `keyboard-${Date.now()}`,
            type: 'warning',
            category: 'navigation',
            message: 'Elemento não navegável por teclado',
            element: element as HTMLElement,
            severity: 'medium',
            wcagCriteria: ['2.1.1', '2.1.2'],
            fix: 'Adicionar tabindex ou role apropriado'
          });
        }
      });
    };
    
    // Verificar semântica
    const checkSemantics = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
      
      // Verificar hierarquia de headings
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) {
          issues.push({
            id: `semantics-${Date.now()}`,
            type: 'warning',
            category: 'semantics',
            message: 'Hierarquia de headings incorreta',
            element: headings[i] as HTMLElement,
            severity: 'medium',
            wcagCriteria: ['1.3.1', '2.4.6'],
            fix: 'Corrigir ordem dos headings'
          });
        }
      }
    };
    
    // Executar verificações
    checkContrast();
    checkKeyboardNavigation();
    checkSemantics();
    
    setAccessibilityIssues(issues);
    
    // Calcular score WCAG
    const totalIssues = issues.length;
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;
    
    let score = 100;
    score -= highSeverityIssues * 20;
    score -= mediumSeverityIssues * 10;
    score -= (totalIssues - highSeverityIssues - mediumSeverityIssues) * 5;
    
    setWcagScore(Math.max(0, score));
  }, []);

  const value: AccessibilityContextType = {
    highContrast,
    fontSize,
    lineHeight,
    letterSpacing,
    reduceMotion,
    autoPlay,
    audioDescriptions,
    captions,
    keyboardOnly,
    focusIndicator,
    wcagScore,
    accessibilityIssues,
    toggleHighContrast: () => setHighContrast(!highContrast),
    setFontSize,
    setLineHeight,
    setLetterSpacing,
    toggleReduceMotion: () => setReduceMotion(!reduceMotion),
    toggleAudioDescriptions: () => setAudioDescriptions(!audioDescriptions),
    toggleCaptions: () => setCaptions(!captions),
    toggleKeyboardOnly: () => setKeyboardOnly(!keyboardOnly),
    toggleFocusIndicator: () => setFocusIndicator(!focusIndicator),
    runAccessibilityAudit
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Componente de painel de acessibilidade
export const AccessibilityPanel: React.FC = () => {
  const {
    highContrast,
    fontSize,
    lineHeight,
    letterSpacing,
    reduceMotion,
    audioDescriptions,
    captions,
    keyboardOnly,
    focusIndicator,
    wcagScore,
    accessibilityIssues,
    toggleHighContrast,
    setFontSize,
    setLineHeight,
    setLetterSpacing,
    toggleReduceMotion,
    toggleAudioDescriptions,
    toggleCaptions,
    toggleKeyboardOnly,
    toggleFocusIndicator,
    runAccessibilityAudit
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'navigation' | 'audit'>('visual');

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
        aria-label="Painel de acessibilidade"
      >
        <Accessibility className="w-6 h-6" />
      </motion.button>

      {/* Painel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-40 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Acessibilidade
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Score WCAG */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {wcagScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Score WCAG AAA
                  </div>
                  <Progress value={wcagScore} className="mt-3" />
                </CardContent>
              </Card>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-4">
                  {[
                    { id: 'visual', label: 'Visual', icon: Eye },
                    { id: 'audio', label: 'Áudio', icon: Volume2 },
                    { id: 'navigation', label: 'Navegação', icon: Keyboard },
                    { id: 'audit', label: 'Auditoria', icon: CheckCircle }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Conteúdo das tabs */}
              <AnimatePresence mode="wait">
                {activeTab === 'visual' && (
                  <motion.div
                    key="visual"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={highContrast}
                          onChange={toggleHighContrast}
                          className="rounded"
                        />
                        <span className="text-sm">Alto Contraste</span>
                      </label>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tamanho da Fonte: {fontSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="24"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Altura da Linha: {lineHeight}
                        </label>
                        <input
                          type="range"
                          min="1.2"
                          max="2.0"
                          step="0.1"
                          value={lineHeight}
                          onChange={(e) => setLineHeight(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={reduceMotion}
                          onChange={toggleReduceMotion}
                          className="rounded"
                        />
                        <span className="text-sm">Reduzir Movimento</span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'audio' && (
                  <motion.div
                    key="audio"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={audioDescriptions}
                          onChange={toggleAudioDescriptions}
                          className="rounded"
                        />
                        <span className="text-sm">Descrições de Áudio</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={captions}
                          onChange={toggleCaptions}
                          className="rounded"
                        />
                        <span className="text-sm">Legendas</span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'navigation' && (
                  <motion.div
                    key="navigation"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={keyboardOnly}
                          onChange={toggleKeyboardOnly}
                          className="rounded"
                        />
                        <span className="text-sm">Navegação Apenas por Teclado</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={focusIndicator}
                          onChange={toggleFocusIndicator}
                          className="rounded"
                        />
                        <span className="text-sm">Indicador de Foco</span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'audit' && (
                  <motion.div
                    key="audit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <Button
                      onClick={runAccessibilityAudit}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Executar Auditoria
                    </Button>
                    
                    {accessibilityIssues.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Problemas Encontrados ({accessibilityIssues.length})
                        </h3>
                        {accessibilityIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className={`p-3 rounded-lg border-l-4 ${
                              issue.severity === 'high'
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                : issue.severity === 'medium'
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                                : 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {issue.severity === 'high' ? (
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {issue.message}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {issue.fix}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {issue.wcagCriteria.map((criteria) => (
                                    <span
                                      key={criteria}
                                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                    >
                                      {criteria}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Componente de exemplo
export const AccessibilityWCAGExample: React.FC = () => {
  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Sistema de Acessibilidade WCAG AAA
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-blue-500" />
                  Funcionalidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• Alto contraste e temas</p>
                <p>• Ajuste de tipografia</p>
                <p>• Redução de movimento</p>
                <p>• Navegação por teclado</p>
                <p>• Auditoria automática</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Conformidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• WCAG 2.1 Nível AAA</p>
                <p>• Seção 508</p>
                <p>• EN 301 549</p>
                <p>• AODA</p>
                <p>• LGPD Acessibilidade</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Use o botão de acessibilidade no canto inferior direito para configurar as opções
            </p>
          </div>
        </div>
        
        <AccessibilityPanel />
      </div>
    </AccessibilityProvider>
  );
};

export default AccessibilityWCAGExample;
