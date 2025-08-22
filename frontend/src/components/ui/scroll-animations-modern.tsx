'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion';
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  Star, 
  Heart,
  Zap,
  Sparkles,
  Target,
  Eye,
  EyeOff,
  Play,
  Pause
} from 'lucide-react';

// Tipos para animações de scroll
type ScrollAnimationType = 
  | 'fade-in' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right'
  | 'scale-in'
  | 'rotate-in'
  | 'bounce-in'
  | 'flip-in'
  | 'zoom-in'
  | 'stagger'
  | 'parallax'
  | 'magnetic'
  | 'tilt';

interface ScrollAnimationProps {
  children: React.ReactNode;
  type?: ScrollAnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

// Hook para detectar scroll
export const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true } as any);
  
  return { ref, isInView };
};

// Hook para efeito parallax
export const useParallax = (speed = 0.5) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1.2]);
  
  return { ref, y, opacity, scale };
};

// Hook para scroll progress
export const useScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  return { scrollYProgress, scaleX };
};

// Componente principal de animação de scroll
export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  type = 'fade-in',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  once = true,
  className = '',
  onAnimationStart,
  onAnimationComplete
}) => {
  const { ref, isInView } = useScrollAnimation(threshold);

  // Configurações de animação por tipo
  const getAnimationConfig = (type: ScrollAnimationType) => {
    const baseConfig = {
      duration,
      delay,
      ease: "easeOut"
    };

    switch (type) {
      case 'fade-in':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          ...baseConfig
        };
      
      case 'slide-up':
        return {
          initial: { y: 50, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          ...baseConfig
        };
      
      case 'slide-down':
        return {
          initial: { y: -50, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          ...baseConfig
        };
      
      case 'slide-left':
        return {
          initial: { x: 50, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          ...baseConfig
        };
      
      case 'slide-right':
        return {
          initial: { x: -50, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          ...baseConfig
        };
      
      case 'scale-in':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          ...baseConfig
        };
      
      case 'rotate-in':
        return {
          initial: { rotate: -180, scale: 0, opacity: 0 },
          animate: { rotate: 0, scale: 1, opacity: 1 },
          ...baseConfig
        };
      
      case 'bounce-in':
        return {
          initial: { y: -100, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: {
            ...baseConfig,
            type: "spring",
            stiffness: 300,
            damping: 20
          }
        };
      
      case 'flip-in':
        return {
          initial: { rotateY: -90, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          ...baseConfig
        };
      
      case 'zoom-in':
        return {
          initial: { scale: 0.5, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          ...baseConfig
        };
      
      case 'stagger':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: {
            ...baseConfig,
            staggerChildren: 0.1
          }
        };
      
      case 'parallax':
        return {
          initial: { y: 0, opacity: 0.8 },
          animate: { y: -20, opacity: 1 },
          ...baseConfig
        };
      
      case 'magnetic':
        return {
          initial: { scale: 1, rotate: 0 },
          animate: { scale: 1.05, rotate: 5 },
          ...baseConfig
        };
      
      case 'tilt':
        return {
          initial: { rotateX: 0, rotateY: 0 },
          animate: { rotateX: 5, rotateY: 5 },
          ...baseConfig
        };
      
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          ...baseConfig
        };
    }
  };

  const config = getAnimationConfig(type);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={config.initial}
      animate={isInView ? config.animate : config.initial}
      transition={config.transition || config}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
      style={{
        perspective: type === 'flip-in' ? '1000px' : 'none',
        transformStyle: type === 'flip-in' ? 'preserve-3d' : 'flat'
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente de efeito parallax
export const ParallaxElement: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  className = ''
}) => {
  const { ref, y, opacity, scale } = useParallax(speed);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return { y };
      case 'down':
        return { y: useTransform(y, (value) => -value) };
      case 'left':
        return { x: y };
      case 'right':
        return { x: useTransform(y, (value) => -value) };
      default:
        return { y };
    }
  };

  const transform = getTransform();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...transform,
        opacity,
        scale
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente de progress bar de scroll
export const ScrollProgressBar: React.FC = () => {
  const { scaleX } = useScrollProgress();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left z-50"
      style={{ scaleX }}
    />
  );
};

// Componente de scroll to top
export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setIsVisible(latest > 0.1);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-50 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUp className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Componente de seção com animações em lote
export const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.1 }) => {
  const { ref, isInView } = useScrollAnimation(0.1);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: staggerDelay
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente de item com animação individual
export const AnimatedItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente de exemplo com todas as animações
export const ScrollAnimationsExample: React.FC = () => {
  const [activeAnimation, setActiveAnimation] = useState<ScrollAnimationType>('fade-in');
  const [isPlaying, setIsPlaying] = useState(true);

  const animationTypes: Array<{
    type: ScrollAnimationType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      type: 'fade-in',
      label: 'Fade In',
      icon: <Eye className="w-5 h-5" />,
      description: 'Aparece suavemente'
    },
    {
      type: 'slide-up',
      label: 'Slide Up',
      icon: <ArrowUp className="w-5 h-5" />,
      description: 'Desliza de baixo para cima'
    },
    {
      type: 'slide-down',
      label: 'Slide Down',
      icon: <ArrowDown className="w-5 h-5" />,
      description: 'Desliza de cima para baixo'
    },
    {
      type: 'scale-in',
      label: 'Scale In',
      icon: <Target className="w-5 h-5" />,
      description: 'Cresce do centro'
    },
    {
      type: 'rotate-in',
      label: 'Rotate In',
      icon: <Zap className="w-5 h-5" />,
      description: 'Gira ao aparecer'
    },
    {
      type: 'bounce-in',
      label: 'Bounce In',
      icon: <Heart className="w-5 h-5" />,
      description: 'Quica ao entrar'
    },
    {
      type: 'flip-in',
      label: 'Flip In',
      icon: <Star className="w-5 h-5" />,
      description: 'Vira ao aparecer'
    },
    {
      type: 'parallax',
      label: 'Parallax',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Efeito de profundidade'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Progress Bar */}
      <ScrollProgressBar />
      
      {/* Scroll to Top */}
      <ScrollToTop />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Scroll Animations & Parallax
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Seletor de animação */}
              <select
                value={activeAnimation}
                onChange={(e) => setActiveAnimation(e.target.value as ScrollAnimationType)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {animationTypes.map((anim) => (
                  <option key={anim.type} value={anim.type}>
                    {anim.label}
                  </option>
                ))}
              </select>
              
              {/* Botão play/pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-32">
        {/* Seção 1: Animações básicas */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <AnimatedItem>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Animações de Scroll
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Experimente diferentes tipos de animações que são ativadas conforme você rola a página
              </p>
            </AnimatedItem>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {animationTypes.map((anim, index) => (
              <AnimatedItem key={anim.type} delay={index * 0.1}>
                <ScrollAnimation
                  type={anim.type}
                  className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-shadow"
                >
                  <div className="text-blue-500 mb-4 flex justify-center">
                    {anim.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {anim.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {anim.description}
                  </p>
                </ScrollAnimation>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>

        {/* Seção 2: Efeitos parallax */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <AnimatedItem>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Efeitos Parallax
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Elementos que se movem em velocidades diferentes criando profundidade
              </p>
            </AnimatedItem>
          </div>

          <div className="relative h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl overflow-hidden">
            {/* Elementos parallax */}
            <ParallaxElement speed={0.3} direction="up" className="absolute top-10 left-10">
              <div className="w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm" />
            </ParallaxElement>
            
            <ParallaxElement speed={0.5} direction="down" className="absolute top-20 right-20">
              <div className="w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm" />
            </ParallaxElement>
            
            <ParallaxElement speed={0.7} direction="left" className="absolute bottom-20 left-20">
              <div className="w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm" />
            </ParallaxElement>
            
            <ParallaxElement speed={0.4} direction="right" className="absolute bottom-10 right-10">
              <div className="w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm" />
            </ParallaxElement>

            {/* Conteúdo central */}
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 1, type: "spring" }}
                  className="mb-6"
                >
                  <Sparkles className="w-16 h-16 mx-auto" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-2">Efeito Parallax</h3>
                <p className="text-lg opacity-90">Role para ver a mágica acontecer</p>
              </div>
            </div>
        </div>
        </AnimatedSection>

        {/* Seção 3: Cards com animações */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <AnimatedItem>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Cards Animados
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Elementos que aparecem com timing diferente criando um efeito cascata
              </p>
            </AnimatedItem>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <AnimatedItem key={index} delay={index * 0.2}>
                <ScrollAnimation
                  type={activeAnimation}
                  className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl font-bold text-white">{index}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Card {index}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Este card aparece com a animação selecionada acima. Experimente diferentes tipos!
                    </p>
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                      Ação {index}
                    </button>
                  </div>
                </ScrollAnimation>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>

        {/* Seção 4: Texto com animações */}
        <AnimatedSection>
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedItem>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Texto com Animações
              </h2>
            </AnimatedItem>
            
            <AnimatedItem delay={0.2}>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Esta seção demonstra como o texto pode ser animado de forma elegante e sutil,
                criando uma experiência de leitura mais envolvente e moderna.
              </p>
            </AnimatedItem>
            
            <AnimatedItem delay={0.4}>
              <div className="flex items-center justify-center gap-4 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-6 h-6" />
                <span className="text-lg font-medium">Animações suaves e responsivas</span>
                <Sparkles className="w-6 h-6" />
              </div>
            </AnimatedItem>
          </div>
        </AnimatedSection>

        {/* Seção 5: Estatísticas animadas */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <AnimatedItem>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Estatísticas Animadas
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Números que contam até o valor final com animação
              </p>
            </AnimatedItem>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: 150, label: 'Projetos', icon: <Target className="w-8 h-8" /> },
              { number: 25, label: 'Clientes', icon: <Heart className="w-8 h-8" /> },
              { number: 99, label: 'Satisfação', icon: <Star className="w-8 h-8" />, suffix: '%' },
              { number: 24, label: 'Suporte', icon: <Zap className="w-8 h-8" />, suffix: '/7' }
            ].map((stat, index) => (
              <AnimatedItem key={stat.label} delay={index * 0.1}>
                <ScrollAnimation
                  type="scale-in"
                  className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center"
                >
                  <div className="text-blue-500 mb-4 flex justify-center">
                    {stat.icon}
                  </div>
                  <motion.div
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {stat.number}{stat.suffix || ''}
                  </motion.div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </p>
                </ScrollAnimation>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default ScrollAnimation;
