// 🎨 ZYKOR DESIGN SYSTEM TOKENS
// Sistema completo de tokens de design para consistência visual

export const tokens = {
  // 🌈 COLORS - Sistema de cores completo
  colors: {
    // Primárias
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Secundárias
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    
    // Sucesso
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    
    // Aviso
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    
    // Erro
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    
    // Neutros
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // Gradientes
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 0%, #f093fb 50%, #f5576c 100%)',
      glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    },
  },

  // 📏 SPACING - Sistema de espaçamento consistente
  spacing: {
    // Base unit: 4px
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
    72: '288px',
    80: '320px',
    96: '384px',
  },

  // 🔤 TYPOGRAPHY - Sistema tipográfico completo
  typography: {
    // Font families
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      serif: ['Georgia', 'serif'],
    },
    
    // Font sizes
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
      '7xl': '4.5rem',   // 72px
      '8xl': '6rem',     // 96px
      '9xl': '8rem',     // 128px
    },
    
    // Font weights
    weights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    // Line heights
    lineHeights: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    
    // Letter spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // 🌟 SHADOWS - Sistema de sombras e elevação
  shadows: {
    // Base shadows
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    
    // Colored shadows
    primary: '0 4px 14px 0 rgb(59 130 246 / 0.25)',
    success: '0 4px 14px 0 rgb(34 197 94 / 0.25)',
    warning: '0 4px 14px 0 rgb(245 158 11 / 0.25)',
    error: '0 4px 14px 0 rgb(239 68 68 / 0.25)',
    
    // Inner shadows
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    
    // Glow effects
    glow: {
      primary: '0 0 20px rgb(59 130 246 / 0.5)',
      success: '0 0 20px rgb(34 197 94 / 0.5)',
      warning: '0 0 20px rgb(245 158 11 / 0.5)',
      error: '0 0 20px rgb(239 68 68 / 0.5)',
    },
  },

  // 🎭 BORDER RADIUS - Sistema de bordas arredondadas
  borderRadius: {
    none: '0px',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',
  },

  // 🎬 ANIMATIONS - Sistema de animações e transições
  animations: {
    // Durations
    duration: {
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
      slower: '700ms',
      slowest: '1000ms',
    },
    
    // Easing functions
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // Keyframes
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      fadeOut: {
        '0%': { opacity: '1' },
        '100%': { opacity: '0' },
      },
      slideInUp: {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideInDown: {
        '0%': { transform: 'translateY(-100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideInLeft: {
        '0%': { transform: 'translateX(-100%)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' },
      },
      slideInRight: {
        '0%': { transform: 'translateX(100%)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' },
      },
      scaleIn: {
        '0%': { transform: 'scale(0.9)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      scaleOut: {
        '0%': { transform: 'scale(1)', opacity: '1' },
        '100%': { transform: 'scale(0.9)', opacity: '0' },
      },
      rotate: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
      bounce: {
        '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
        '40%, 43%': { transform: 'translate3d(0,-30px,0)' },
        '70%': { transform: 'translate3d(0,-15px,0)' },
        '90%': { transform: 'translate3d(0,-4px,0)' },
      },
      shimmer: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
    },
  },

  // 📱 BREAKPOINTS - Sistema responsivo
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // 🎨 Z-INDEX - Sistema de camadas
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  // 🔧 UTILITIES - Utilitários especiais
  utilities: {
    // Backdrop blur
    backdropBlur: {
      none: '0',
      sm: '4px',
      base: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '40px',
      '3xl': '64px',
    },
    
    // Glass morphism
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      dark: 'rgba(0, 0, 0, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
    },
    
    // Focus rings
    focusRing: {
      primary: '0 0 0 3px rgb(59 130 246 / 0.5)',
      success: '0 0 0 3px rgb(34 197 94 / 0.5)',
      warning: '0 0 0 3px rgb(245 158 11 / 0.5)',
      error: '0 0 0 3px rgb(239 68 68 / 0.5)',
    },
  },
};

// 🎯 HELPER FUNCTIONS
export const getToken = (path: string) => {
  return path.split('.').reduce((obj, key) => obj?.[key], tokens);
};

export const createCSSVariable = (name: string, value: string) => {
  return `--${name}: ${value};`;
};

export const generateCSSVariables = () => {
  const cssVars: string[] = [];
  
  // Colors
  Object.entries(tokens.colors).forEach(([category, colors]) => {
    if (typeof colors === 'object' && colors !== null) {
      Object.entries(colors).forEach(([shade, value]) => {
        cssVars.push(createCSSVariable(`${category}-${shade}`, value));
      });
    }
  });
  
  // Spacing
  Object.entries(tokens.spacing).forEach(([size, value]) => {
    cssVars.push(createCSSVariable(`spacing-${size}`, value));
  });
  
  // Typography
  Object.entries(tokens.typography.sizes).forEach(([size, value]) => {
    cssVars.push(createCSSVariable(`font-size-${size}`, value));
  });
  
  Object.entries(tokens.typography.weights).forEach(([weight, value]) => {
    cssVars.push(createCSSVariable(`font-weight-${weight}`, value));
  });
  
  // Shadows
  Object.entries(tokens.shadows).forEach(([name, value]) => {
    if (typeof value === 'string') {
      cssVars.push(createCSSVariable(`shadow-${name}`, value));
    }
  });
  
  // Border radius
  Object.entries(tokens.borderRadius).forEach(([size, value]) => {
    cssVars.push(createCSSVariable(`radius-${size}`, value));
  });
  
  return cssVars.join('\n  ');
};

// 🚀 EXPORT DEFAULT
export default tokens;
