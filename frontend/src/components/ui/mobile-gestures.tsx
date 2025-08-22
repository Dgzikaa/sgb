'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

// =====================================================
// 📱 SISTEMA DE GESTOS MOBILE - ZYKOR
// =====================================================

interface GestureProps {
  children: React.ReactNode;
  className?: string;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
  onPinch?: (scale: number) => void;
  onRotate?: (rotation: number) => void;
  onTap?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface SwipeableProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  resistance?: number;
  velocity?: number;
}

interface PinchableProps {
  children: React.ReactNode;
  className?: string;
  onPinch?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

// =====================================================
// 🎯 GESTOS BÁSICOS - Swipe, Tap, Long Press
// =====================================================

export function GestureHandler({
  children,
  className = '',
  onSwipe,
  onPinch,
  onRotate,
  onTap,
  onLongPress,
  onDoubleTap,
  threshold = 50,
  enabled = true,
}: GestureProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTap, setLastTap] = useState(0);
  const [touchCount, setTouchCount] = useState(0);

  const minSwipeDistance = threshold;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    setTouchEnd(null);
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchCount(prev => prev + 1);

    // Long press timer
    const timer = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 500);

    setLongPressTimer(timer);
  }, [enabled, onLongPress]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });

    // Cancel long press if moved
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [enabled, longPressTimer]);

  const onTouchEnd = useCallback(() => {
    if (!enabled) return;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (Math.abs(distanceX) > minSwipeDistance) {
        if (distanceX > 0) {
          onSwipe?.('left', Math.abs(distanceX));
        } else {
          onSwipe?.('right', Math.abs(distanceX));
        }
      }
    } else {
      if (Math.abs(distanceY) > minSwipeDistance) {
        if (distanceY > 0) {
          onSwipe?.('up', Math.abs(distanceY));
        } else {
          onSwipe?.('down', Math.abs(distanceY));
        }
      }
    }

    // Handle tap
    if (Math.abs(distanceX) < 10 && Math.abs(distanceY) < 10) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      if (now - lastTap < DOUBLE_TAP_DELAY) {
        // Double tap
        onDoubleTap?.();
        setLastTap(0);
      } else {
        // Single tap
        onTap?.();
        setLastTap(now);
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [
    enabled,
    touchStart,
    touchEnd,
    minSwipeDistance,
    onSwipe,
    onTap,
    onDoubleTap,
    lastTap,
    longPressTimer,
  ]);

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
}

// =====================================================
// 🔄 SWIPEABLE - Componente com gestos de swipe
// =====================================================

export function Swipeable({
  children,
  className = '',
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  resistance = 0.8,
  velocity = 500,
}: SwipeableProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-100, 100], [-15, 15]);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);

  const handleDragEnd = (event: any, info: any) => {
    const { offset, velocity: dragVelocity } = info;
    const shouldTrigger = Math.abs(offset.x) > threshold || Math.abs(offset.y) > threshold;

    if (shouldTrigger) {
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        // Horizontal swipe
        if (offset.x > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (offset.x < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (offset.y > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (offset.y < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    // Reset position
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={cn('cursor-grab active:cursor-grabbing', className)}
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={resistance}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, opacity }}
      whileDrag={{ scale: 1.05 }}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// 🔍 PINCHABLE - Componente com gestos de pinch
// =====================================================

export function Pinchable({
  children,
  className = '',
  onPinch,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
}: PinchableProps) {
  const [scale, setScale] = useState(initialScale);
  const [lastDistance, setLastDistance] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastDistance(distance);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDistance !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const newScale = scale * (distance / lastDistance);
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      
      setScale(clampedScale);
      onPinch?.(clampedScale);
    }
  }, [scale, lastDistance, minScale, maxScale, onPinch]);

  const handleTouchEnd = useCallback(() => {
    setLastDistance(null);
  }, []);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <motion.div
        style={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =====================================================
// 🎯 TAP HANDLER - Gerenciador de taps
// =====================================================

interface TapHandlerProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  tapDelay?: number;
  longPressDelay?: number;
}

export function TapHandler({
  children,
  className = '',
  onTap,
  onDoubleTap,
  onLongPress,
  tapDelay = 300,
  longPressDelay = 500,
}: TapHandlerProps) {
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handlePointerDown = useCallback(() => {
    setIsLongPress(false);
    
    const timer = setTimeout(() => {
      setIsLongPress(true);
      onLongPress?.();
    }, longPressDelay);

    setLongPressTimer(timer);
  }, [longPressDelay, onLongPress]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!isLongPress) {
      const now = Date.now();
      
      if (now - lastTap < tapDelay) {
        // Double tap
        setTapCount(prev => prev + 1);
        if (tapCount === 1) {
          onDoubleTap?.();
          setTapCount(0);
        }
      } else {
        // Single tap
        setTapCount(1);
        onTap?.();
      }
      
      setLastTap(now);
    }
  }, [longPressTimer, isLongPress, lastTap, tapDelay, tapCount, onTap, onDoubleTap]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPress(false);
  }, [longPressTimer]);

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div
      className={cn('select-none', className)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </div>
  );
}

// =====================================================
// 🎨 GESTURE FEEDBACK - Feedback visual para gestos
// =====================================================

interface GestureFeedbackProps {
  children: React.ReactNode;
  className?: string;
  showFeedback?: boolean;
  feedbackColor?: string;
  feedbackDuration?: number;
}

export function GestureFeedback({
  children,
  className = '',
  showFeedback = true,
  feedbackColor = 'rgba(59, 130, 246, 0.3)',
  feedbackDuration = 300,
}: GestureFeedbackProps) {
  const [feedback, setFeedback] = useState(false);

  const triggerFeedback = useCallback(() => {
    if (!showFeedback) return;
    
    setFeedback(true);
    setTimeout(() => setFeedback(false), feedbackDuration);
  }, [showFeedback, feedbackDuration]);

  return (
    <div className={cn('relative', className)}>
      {children}
      {feedback && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: feedbackColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: feedbackDuration / 1000 }}
        />
      )}
    </div>
  );
}

// =====================================================
// 🚀 HOOKS DE GESTOS
// =====================================================

export function useSwipeGesture(
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void,
  threshold = 50
) {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);

  const handleSwipe = useCallback((direction: string, distance: number) => {
    setSwipeDirection(direction);
    setSwipeDistance(distance);
    onSwipe?.(direction as any, distance);
  }, [onSwipe]);

  return {
    swipeDirection,
    swipeDistance,
    handleSwipe,
  };
}

export function usePinchGesture(
  onPinch?: (scale: number) => void,
  minScale = 0.5,
  maxScale = 3
) {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);

  const handlePinch = useCallback((newScale: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    setScale(clampedScale);
    onPinch?.(clampedScale);
  }, [minScale, maxScale, onPinch]);

  return {
    scale,
    isPinching,
    setIsPinching,
    handlePinch,
  };
}

export function useTouchGesture() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [touchCount, setTouchCount] = useState(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd(null);
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchCount(prev => prev + 1);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setTouchEnd(null);
  }, []);

  return {
    touchStart,
    touchEnd,
    touchCount,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

// =====================================================
// 📱 RESPONSIVE GESTURES
// =====================================================

export function useResponsiveGestures() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const getGestureSettings = () => {
    if (isMobile) {
      return {
        swipeThreshold: 30,
        longPressDelay: 400,
        doubleTapDelay: 250,
        enableHapticFeedback: true,
      };
    }

    if (isTablet) {
      return {
        swipeThreshold: 40,
        longPressDelay: 500,
        doubleTapDelay: 300,
        enableHapticFeedback: false,
      };
    }

    return {
      swipeThreshold: 50,
      longPressDelay: 600,
      doubleTapDelay: 350,
      enableHapticFeedback: false,
    };
  };

  return {
    isMobile,
    isTablet,
    gestureSettings: getGestureSettings(),
  };
}

// =====================================================
// 🎯 GESTURE UTILITIES
// =====================================================

export function calculateSwipeDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold: number
): { direction: string; distance: number } | null {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance < threshold) return null;

  const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
  
  if (isHorizontal) {
    return {
      direction: deltaX > 0 ? 'right' : 'left',
      distance: Math.abs(deltaX),
    };
  } else {
    return {
      direction: deltaY > 0 ? 'down' : 'up',
      distance: Math.abs(deltaY),
    };
  }
}

export function calculatePinchScale(
  touch1Start: { x: number; y: number },
  touch2Start: { x: number; y: number },
  touch1Current: { x: number; y: number },
  touch2Current: { x: number; y: number }
): number {
  const startDistance = Math.hypot(
    touch1Start.x - touch2Start.x,
    touch1Start.y - touch2Start.y
  );
  
  const currentDistance = Math.hypot(
    touch1Current.x - touch2Current.x,
    touch1Current.y - touch2Current.y
  );

  return currentDistance / startDistance;
}

export function calculateRotation(
  touch1Start: { x: number; y: number },
  touch2Start: { x: number; y: number },
  touch1Current: { x: number; y: number },
  touch2Current: { x: number; y: number }
): number {
  const startAngle = Math.atan2(
    touch2Start.y - touch1Start.y,
    touch2Start.x - touch1Start.x
  );
  
  const currentAngle = Math.atan2(
    touch2Current.y - touch1Current.y,
    touch2Current.x - touch1Current.x
  );

  return (currentAngle - startAngle) * (180 / Math.PI);
}
