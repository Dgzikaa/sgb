'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { 
  Hand, 
  Move, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move as Swipe,
  Hand as Touch,
  Smartphone,
  Tablet,
  Monitor,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Rotate3D,
  Rotate3D as Rotate,
  Minus,
  Minus as Pinch,
  Hand as Gesture
} from 'lucide-react';

// Tipos para gestos
type GestureType = 
  | 'swipe' 
  | 'pinch' 
  | 'rotate' 
  | 'pan' 
  | 'tap' 
  | 'long-press'
  | 'double-tap'
  | 'multi-touch';

interface GestureProps {
  children: React.ReactNode;
  onGesture?: (gesture: string, data: any) => void;
  className?: string;
  disabled?: boolean;
}

interface SwipeProps extends GestureProps {
  direction?: 'horizontal' | 'vertical' | 'both';
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface PinchProps extends GestureProps {
  minScale?: number;
  maxScale?: number;
  onPinch?: (scale: number) => void;
}

interface RotateProps extends GestureProps {
  onRotate?: (angle: number) => void;
}

interface PanProps extends GestureProps {
  bounds?: { left: number; right: number; top: number; bottom: number };
  onPan?: (position: { x: number; y: number }) => void;
}

// Hook para detectar dispositivo mobile
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /mobile|android|iphone|ipad|phone/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || isTouchDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Hook para gestos de swipe
export const useSwipe = (options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}) => {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = options;
  const startX = useMotionValue(0);
  const startY = useMotionValue(0);
  const currentX = useMotionValue(0);
  const currentY = useMotionValue(0);

  const handlePanStart = useCallback((event: any, info: PanInfo) => {
    startX.set(info.point.x);
    startY.set(info.point.y);
    currentX.set(info.point.x);
    currentY.set(info.point.y);
  }, [startX, startY, currentX, currentY]);

  const handlePanUpdate = useCallback((event: any, info: PanInfo) => {
    currentX.set(info.point.x);
    currentY.set(info.point.y);
  }, [currentX, currentY]);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const deltaX = info.point.x - startX.get();
    const deltaY = info.point.y - startY.get();
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > threshold || absDeltaY > threshold) {
      if (absDeltaX > absDeltaY) {
        // Swipe horizontal
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Swipe vertical
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
  }, [startX, startY, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    handlePanStart,
    handlePanUpdate,
    handlePanEnd
  };
};

// Hook para gestos de pinch
export const usePinch = (options: {
  minScale?: number;
  maxScale?: number;
  onPinch?: (scale: number) => void;
}) => {
  const { minScale = 0.5, maxScale = 3, onPinch } = options;
  const scale = useMotionValue(1);
  const springScale = useSpring(scale, { stiffness: 300, damping: 30 });

  const handlePinch = useCallback((event: any, info: any) => {
    const newScale = Math.max(minScale, Math.min(maxScale, info.scale));
    scale.set(newScale);
    onPinch?.(newScale);
  }, [scale, minScale, maxScale, onPinch]);

  return {
    scale: springScale,
    handlePinch
  };
};

// Hook para gestos de rotação
export const useRotate = (options: {
  onRotate?: (angle: number) => void;
}) => {
  const { onRotate } = options;
  const rotation = useMotionValue(0);
  const springRotation = useSpring(rotation, { stiffness: 200, damping: 25 });

  const handleRotate = useCallback((event: any, info: any) => {
    const newRotation = info.rotation;
    rotation.set(newRotation);
    onRotate?.(newRotation);
  }, [rotation, onRotate]);

  return {
    rotation: springRotation,
    handleRotate
  };
};

// Componente de swipe
export const Swipeable: React.FC<SwipeProps> = ({
  children,
  direction = 'both',
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onGesture,
  className = '',
  disabled = false
}) => {
  const { handlePanStart, handlePanUpdate, handlePanEnd } = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold
  });

  const handleGesture = useCallback((gesture: string, data: any) => {
    onGesture?.(gesture, data);
  }, [onGesture]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      onPanStart={handlePanStart}
      onPanUpdate={handlePanUpdate}
      onPanEnd={handlePanEnd}
      style={{
        touchAction: direction === 'horizontal' ? 'pan-y' : direction === 'vertical' ? 'pan-x' : 'none'
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente de pinch
export const Pinchable: React.FC<PinchProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  onPinch,
  onGesture,
  className = '',
  disabled = false
}) => {
  const { scale, handlePinch } = usePinch({
    minScale,
    maxScale,
    onPinch
  });

  const handleGesture = useCallback((gesture: string, data: any) => {
    onGesture?.(gesture, data);
  }, [onGesture]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ scale }}
      onPinch={handlePinch}
    >
      {children}
    </motion.div>
  );
};

// Componente de rotação
export const Rotatable: React.FC<RotateProps> = ({
  children,
  onRotate,
  onGesture,
  className = '',
  disabled = false
}) => {
  const { rotation, handleRotate } = useRotate({ onRotate });

  const handleGesture = useCallback((gesture: string, data: any) => {
    onGesture?.(gesture, data);
  }, [onGesture]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ rotate: rotation }}
      onRotate={handleRotate}
    >
      {children}
    </motion.div>
  );
};

// Componente de pan
export const Pannable: React.FC<PanProps> = ({
  children,
  bounds,
  onPan,
  onGesture,
  className = '',
  disabled = false
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const handlePan = useCallback((event: any, info: PanInfo) => {
    const newX = info.point.x;
    const newY = info.point.y;

    if (bounds) {
      x.set(Math.max(bounds.left, Math.min(bounds.right, newX)));
      y.set(Math.max(bounds.top, Math.min(bounds.bottom, newY)));
    } else {
      x.set(newX);
      y.set(newY);
    }

    onPan?.({ x: springX.get(), y: springY.get() });
  }, [x, y, springX, springY, bounds, onPan]);

  const handleGesture = useCallback((gesture: string, data: any) => {
    onGesture?.(gesture, data);
  }, [onGesture]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onPan={handlePan}
      drag
      dragConstraints={bounds}
      dragElastic={0.1}
    >
      {children}
    </motion.div>
  );
};

// Componente de gestos combinados
export const GestureHandler: React.FC<{
  children: React.ReactNode;
  onGesture?: (gesture: string, data: any) => void;
  className?: string;
  swipeEnabled?: boolean;
  pinchEnabled?: boolean;
  rotateEnabled?: boolean;
  panEnabled?: boolean;
}> = ({
  children,
  onGesture,
  className = '',
  swipeEnabled = true,
  pinchEnabled = true,
  rotateEnabled = true,
  panEnabled = true
}) => {
  const [gestureData, setGestureData] = useState<any>({});
  const isMobile = useIsMobile();

  const handleGesture = useCallback((gesture: string, data: any) => {
    setGestureData(prev => ({ ...prev, [gesture]: data }));
    onGesture?.(gesture, data);
  }, [onGesture]);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {swipeEnabled && (
        <Swipeable onGesture={handleGesture}>
          {pinchEnabled && (
            <Pinchable onGesture={handleGesture}>
              {rotateEnabled && (
                <Rotatable onGesture={handleGesture}>
                  {panEnabled && (
                    <Pannable onGesture={handleGesture}>
                      {children}
                    </Pannable>
                  )}
                </Rotatable>
              )}
            </Pinchable>
          )}
        </Swipeable>
      )}
    </div>
  );
};

// Componente de exemplo de gestos
export const MobileGesturesExample: React.FC = () => {
  const [activeGestures, setActiveGestures] = useState<string[]>([]);
  const [gestureHistory, setGestureHistory] = useState<Array<{ gesture: string; timestamp: number; data: any }>>([]);
  const [currentScale, setCurrentScale] = useState(1);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();

  const handleGesture = useCallback((gesture: string, data: any) => {
    setActiveGestures(prev => [...new Set([...prev, gesture])]);
    setGestureHistory(prev => [
      { gesture, timestamp: Date.now(), data },
      ...prev.slice(0, 9) // Manter apenas os últimos 10 gestos
    ]);

    // Atualizar estado baseado no tipo de gesto
    switch (gesture) {
      case 'pinch':
        setCurrentScale(data);
        break;
      case 'rotate':
        setCurrentRotation(data);
        break;
      case 'pan':
        setCurrentPosition(data);
        break;
    }
  }, []);

  const clearGestures = () => {
    setActiveGestures([]);
    setGestureHistory([]);
    setCurrentScale(1);
    setCurrentRotation(0);
    setCurrentPosition({ x: 0, y: 0 });
  };

  const gestureTypes = [
    { type: 'swipe', icon: <Swipe className="w-5 h-5" />, label: 'Swipe' },
    { type: 'pinch', icon: <Pinch className="w-5 h-5" />, label: 'Pinch' },
    { type: 'rotate', icon: <Rotate className="w-5 h-5" />, label: 'Rotate' },
    { type: 'pan', icon: <Move className="w-5 h-5" />, label: 'Pan' },
    { type: 'tap', icon: <Touch className="w-5 h-5" />, label: 'Tap' },
    { type: 'long-press', icon: <Hand className="w-5 h-5" />, label: 'Long Press' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Gestos Mobile
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Experimente gestos touch em dispositivos móveis
          </p>
          
          {/* Indicador de dispositivo */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {isMobile ? (
              <>
                <Smartphone className="w-5 h-5 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Dispositivo Mobile Detectado
                </span>
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  Use um dispositivo mobile para testar gestos
                </span>
              </>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={clearGestures}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Limpar Gestos
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Área de teste de gestos */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Área de Teste
          </h2>

          {/* Card interativo */}
          <GestureHandler
            onGesture={handleGesture}
            className="w-full"
          >
            <motion.div
              className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl cursor-grab active:cursor-grabbing"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="h-full flex flex-col items-center justify-center text-white p-6 text-center">
                <Gesture className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Teste seus Gestos</h3>
                <p className="text-sm opacity-90">
                  {isMobile 
                    ? 'Faça swipe, pinch, rotate e pan neste card'
                    : 'Use um dispositivo mobile para testar gestos'
                  }
                </p>
                
                {/* Indicadores de estado */}
                <div className="mt-4 space-y-2 text-sm">
                  <div>Escala: {currentScale.toFixed(2)}x</div>
                  <div>Rotação: {currentRotation.toFixed(1)}°</div>
                  <div>Posição: ({currentPosition.x.toFixed(0)}, {currentPosition.y.toFixed(0)})</div>
                </div>
              </div>
            </motion.div>
          </GestureHandler>

          {/* Instruções */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Como usar:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• <strong>Swipe:</strong> Deslize em qualquer direção</li>
              <li>• <strong>Pinch:</strong> Aproxime ou afaste os dedos</li>
              <li>• <strong>Rotate:</strong> Gire com dois dedos</li>
              <li>• <strong>Pan:</strong> Arraste para mover</li>
              <li>• <strong>Tap:</strong> Toque simples</li>
              <li>• <strong>Long Press:</strong> Pressione e segure</li>
            </ul>
          </div>
        </div>

        {/* Painel de informações */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Informações dos Gestos
          </h2>

          {/* Gestos ativos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Gestos Ativos
            </h3>
            {activeGestures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeGestures.map((gesture) => (
                  <span
                    key={gesture}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-medium rounded-full"
                  >
                    {gesture}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhum gesto detectado ainda
              </p>
            )}
          </div>

          {/* Histórico de gestos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Histórico de Gestos
            </h3>
            {gestureHistory.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {gestureHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.gesture}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhum gesto registrado
              </p>
            )}
          </div>

          {/* Tipos de gestos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Tipos de Gestos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {gestureTypes.map((gesture) => (
                <div
                  key={gesture.type}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-blue-500">{gesture.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {gesture.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer com informações */}
      <div className="max-w-6xl mx-auto mt-12 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Sobre Gestos Mobile
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Este sistema detecta automaticamente dispositivos touch e habilita gestos avançados.
            Os gestos são processados em tempo real e fornecem feedback visual imediato.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileGesturesExample;
