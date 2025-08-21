// =====================================================
// 📝 DESIGN SYSTEM ZYKOR - TIPOS TYPESCRIPT
// =====================================================

// =====================================================
// 🎬 PAGE TRANSITIONS
// =====================================================

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'slide' | 'fade' | 'scale' | 'slide-up' | 'slide-down';
  duration?: number;
  delay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface TransitionVariant {
  initial: any;
  animate: any;
  exit: any;
}

export interface LoadingTransitionProps {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
  loadingComponent?: React.ReactNode;
}

// =====================================================
// 🚨 ERROR BOUNDARIES
// =====================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  errorId: string;
  retryCount: number;
}

export interface ErrorRecoveryProps {
  error: Error;
  onRetry: () => void;
  onReport: () => void;
  onGoHome: () => void;
}

// =====================================================
// 🎭 EMPTY STATES
// =====================================================

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  actions?: EmptyStateAction[];
  variant?: 'default' | 'minimal' | 'detailed' | 'illustrated';
  className?: string;
}

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  primary?: boolean;
}

export interface EmptyStateIllustrationProps {
  type: 'data' | 'search' | 'error' | 'success' | 'loading' | 'custom';
  variant?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// =====================================================
// 📜 SCROLL ANIMATIONS
// =====================================================

export interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  triggerOnce?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: number;
}

export interface ScrollTriggerProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'rotate';
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

export interface StaggeredContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'scale';
  threshold?: number;
  triggerOnce?: boolean;
}

export interface ScrollProgressProps {
  className?: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

export interface TextRevealProps {
  text: string;
  className?: string;
  animation?: 'word' | 'character' | 'line';
  delay?: number;
  duration?: number;
  threshold?: number;
}

export interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'blur';
  delay?: number;
  duration?: number;
  threshold?: number;
}

export interface ScrollToTopProps {
  className?: string;
  threshold?: number;
  smooth?: boolean;
}

// =====================================================
// 📱 MOBILE GESTURES
// =====================================================

export interface GestureProps {
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

export interface SwipeableProps {
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

export interface PinchableProps {
  children: React.ReactNode;
  className?: string;
  onPinch?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

export interface TapHandlerProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  tapDelay?: number;
  longPressDelay?: number;
}

export interface GestureFeedbackProps {
  children: React.ReactNode;
  className?: string;
  showFeedback?: boolean;
  feedbackColor?: string;
  feedbackDuration?: number;
}

// =====================================================
// 🔍 GLOBAL SEARCH
// =====================================================

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  category: SearchCategory;
  icon: React.ReactNode;
  tags: string[];
  priority: number;
  lastAccessed?: Date;
  isRecent?: boolean;
  isPopular?: boolean;
}

export interface SearchCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  showShortcut?: boolean;
  maxResults?: number;
  onResultSelect?: (result: SearchResult) => void;
}

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

export interface QuickSuggestionProps {
  result: SearchResult;
  onClick: () => void;
}

export interface RecentItemProps {
  result: SearchResult;
  onClick: () => void;
}

// =====================================================
// 🍞 BREADCRUMBS
// =====================================================

export interface BreadcrumbItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  isActive?: boolean;
  isClickable?: boolean;
  metadata?: Record<string, any>;
}

export interface BreadcrumbsProps {
  className?: string;
  showHome?: boolean;
  showIcons?: boolean;
  showDescriptions?: boolean;
  showBadges?: boolean;
  maxItems?: number;
  separator?: React.ReactNode;
  variant?: 'default' | 'compact' | 'detailed' | 'smart';
  onItemClick?: (item: BreadcrumbItem) => void;
  showContextMenu?: boolean;
  showQuickActions?: boolean;
  showBreadcrumbHistory?: boolean;
}

export interface SmartBreadcrumbsProps extends BreadcrumbsProps {
  enableSmartSuggestions?: boolean;
  enableContextualActions?: boolean;
  enableBreadcrumbAnalytics?: boolean;
}

export interface BreadcrumbItemComponentProps {
  item: BreadcrumbItem;
  variant: string;
  showIcon: boolean;
  showDescription: boolean;
  showBadge: boolean;
  onClick: () => void;
}

export interface BreadcrumbContextMenuProps {
  item: BreadcrumbItem;
  onClose: () => void;
}

// =====================================================
// 📈 ANALYTICS UX
// =====================================================

export interface UserEvent {
  id: string;
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'navigation' | 'error' | 'performance';
  element: string;
  path: string;
  timestamp: Date;
  metadata: Record<string, any>;
  sessionId: string;
  userId?: string;
}

export interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
  element: string;
  eventType: string;
  count: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'good' | 'warning' | 'poor';
  trend: 'up' | 'down' | 'stable';
}

export interface UserInsight {
  id: string;
  type: 'behavior' | 'performance' | 'engagement' | 'error';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  data: any;
}

export interface AnalyticsUXProps {
  className?: string;
  enableTracking?: boolean;
  enableHeatmaps?: boolean;
  enablePerformance?: boolean;
  enableUserInsights?: boolean;
  sessionId?: string;
  userId?: string;
}

export interface HeatmapProps {
  className?: string;
  data: HeatmapData[];
  width?: number;
  height?: number;
  intensity?: 'clicks' | 'hovers' | 'scrolls' | 'all';
  showLegend?: boolean;
  showStats?: boolean;
}

export interface PerformanceMonitorProps {
  className?: string;
  showMetrics?: boolean;
  showCharts?: boolean;
  autoRefresh?: boolean;
}

export interface UserInsightsProps {
  className?: string;
  events: UserEvent[];
  showRecommendations?: boolean;
  showTrends?: boolean;
}

// =====================================================
// ♿ ACCESSIBILITY
// =====================================================

export interface AccessibilitySettings {
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

export interface AccessibilityProviderProps {
  children: React.ReactNode;
  className?: string;
  defaultSettings?: Partial<AccessibilitySettings>;
  enableVoiceControl?: boolean;
  enableEyeTracking?: boolean;
  enableSwitchControl?: boolean;
}

export interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export interface FocusTrapProps {
  children: React.ReactNode;
}

export interface LiveRegionProps {
  children: React.ReactNode;
  ariaLive?: 'off' | 'polite' | 'assertive';
  className?: string;
}

export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

// =====================================================
// 🎨 COMPONENTES COMPOSTOS
// =====================================================

export interface EnhancedPageProps {
  children: React.ReactNode;
  className?: string;
  enableAnimations?: boolean;
  enableGestures?: boolean;
  enableAccessibility?: boolean;
  enableAnalytics?: boolean;
}

export interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  enableHover?: boolean;
  enableSwipe?: boolean;
  enablePinch?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinch?: (scale: number) => void;
}

export interface ResponsiveWrapperProps {
  children: React.ReactNode;
  mobileProps?: Record<string, any>;
  tabletProps?: Record<string, any>;
  desktopProps?: Record<string, any>;
}

// =====================================================
// 🚀 HOOKS
// =====================================================

export interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLDivElement>;
  isInView: boolean;
  scrollVariants: any;
}

export interface UseParallaxScrollReturn {
  ref: React.RefObject<HTMLDivElement>;
  y: any;
}

export interface UseResponsiveScrollAnimationReturn {
  isMobile: boolean;
  animationSettings: {
    threshold: number;
    rootMargin: string;
    duration: number;
  };
}

export interface UseSwipeGestureReturn {
  swipeDirection: string | null;
  swipeDistance: number;
  handleSwipe: (direction: string, distance: number) => void;
}

export interface UsePinchGestureReturn {
  scale: number;
  isPinching: boolean;
  setIsPinching: (pinching: boolean) => void;
  handlePinch: (scale: number) => void;
}

export interface UseTouchGestureReturn {
  touchStart: { x: number; y: number } | null;
  touchEnd: { x: number; y: number } | null;
  touchCount: number;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: () => void;
}

export interface UseResponsiveGesturesReturn {
  isMobile: boolean;
  isTablet: boolean;
  gestureSettings: {
    swipeThreshold: number;
    longPressDelay: number;
    doubleTapDelay: number;
    enableHapticFeedback: boolean;
  };
}

export interface UseGlobalSearchReturn {
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  openSearch: () => void;
  closeSearch: () => void;
  updateQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
}

export interface UseSearchHistoryReturn {
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}

export interface UseBreadcrumbsReturn {
  breadcrumbs: BreadcrumbItem[];
  currentPath: string;
  navigateTo: (href: string) => void;
}

export interface UseBreadcrumbHistoryReturn {
  history: string[];
  addToHistory: (path: string) => void;
  clearHistory: () => void;
}

export interface UseAnalyticsReturn {
  events: UserEvent[];
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  addEvent: (event: Omit<UserEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

export interface UsePerformanceMetricsReturn {
  metrics: PerformanceMetric[];
  collectMetrics: () => void;
}

export interface UseAccessibilityReturn {
  settings: AccessibilitySettings;
  setSettings: (settings: AccessibilitySettings) => void;
  currentFocus: HTMLElement | null;
  focusHistory: HTMLElement[];
  handleFocusChange: (element: HTMLElement) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
}

export interface UseFocusManagementReturn {
  focusHistory: HTMLElement[];
  currentFocus: HTMLElement | null;
  addToFocusHistory: (element: HTMLElement) => void;
  goBackInFocusHistory: () => void;
}

export interface UseKeyboardNavigationReturn {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

export interface UseHighContrastReturn {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

// =====================================================
// 🎯 UTILITÁRIOS
// =====================================================

export interface DesignSystemConfig {
  defaultTransitionDuration: number;
  defaultEasing: number[];
  defaultScrollThreshold: number;
  defaultScrollRootMargin: string;
  defaultSwipeThreshold: number;
  defaultLongPressDelay: number;
  defaultFontSize: number;
  defaultLineHeight: number;
  defaultLetterSpacing: number;
  defaultDebounceDelay: number;
  defaultThrottleDelay: number;
}

export interface ResponsiveAnimationSettings {
  duration: number;
  threshold: number;
  rootMargin: string;
  reducedMotion: boolean;
}

export interface ResponsiveGestureSettings {
  swipeThreshold: number;
  longPressDelay: number;
  doubleTapDelay: number;
  enableHapticFeedback: boolean;
  enablePinch: boolean;
}

export interface ResponsiveAccessibilitySettings {
  enableVoiceControl: boolean;
  enableEyeTracking: boolean;
  enableSwitchControl: boolean;
  defaultFontSize: number;
  defaultLineHeight: number;
  enableLargeTouchTargets: boolean;
}

// =====================================================
// 🔧 FUNÇÕES UTILITÁRIAS
// =====================================================

export type DebounceFunction<T extends (...args: any[]) => any> = (
  func: T,
  wait: number
) => (...args: Parameters<T>) => void;

export type ThrottleFunction<T extends (...args: any[]) => any> = (
  func: T,
  limit: number
) => (...args: Parameters<T>) => void;

export type ClampFunction = (value: number, min: number, max: number) => number;

export type LerpFunction = (start: number, end: number, factor: number) => number;

// =====================================================
// 🎨 EVENTOS E CALLBACKS
// =====================================================

export type SwipeCallback = (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
export type PinchCallback = (scale: number) => void;
export type TapCallback = () => void;
export type LongPressCallback = () => void;
export type DoubleTapCallback = () => void;

export type SearchResultSelectCallback = (result: SearchResult) => void;
export type BreadcrumbItemClickCallback = (item: BreadcrumbItem) => void;
export type UserEventCallback = (event: UserEvent) => void;
export type AccessibilitySettingChangeCallback = (setting: keyof AccessibilitySettings, value: any) => void;

// =====================================================
// 🌐 RESPONSIVE BREAKPOINTS
// =====================================================

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  large: number;
}

export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  large: 1536,
} as const;

// =====================================================
// 🎯 VALIDAÇÃO E CONSTRAINTS
// =====================================================

export interface ValidationConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface AccessibilityConstraints {
  minContrastRatio: number;
  minTouchTargetSize: number;
  maxAnimationDuration: number;
  requiredFocusIndicators: boolean;
  requiredKeyboardNavigation: boolean;
}

// =====================================================
// 📱 DEVICE CAPABILITIES
// =====================================================

export interface DeviceCapabilities {
  touch: boolean;
  pointer: boolean;
  hover: boolean;
  motion: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  voiceControl: boolean;
  eyeTracking: boolean;
  switchControl: boolean;
}

// =====================================================
// 🎨 THEME & STYLING
// =====================================================

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// =====================================================
// 🚀 PERFORMANCE & OPTIMIZATION
// =====================================================

export interface PerformanceConfig {
  lazyLoading: boolean;
  virtualScrolling: boolean;
  debounceDelay: number;
  throttleDelay: number;
  maxConcurrentRequests: number;
  cacheSize: number;
  preloadThreshold: number;
}

export interface OptimizationConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  enablePrefetching: boolean;
  enableServiceWorker: boolean;
}

// =====================================================
// 🔒 SECURITY & PRIVACY
// =====================================================

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  enableAuditLogging: boolean;
}

export interface PrivacyConfig {
  enableAnalytics: boolean;
  enableTracking: boolean;
  enableCookies: boolean;
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
  enableGeolocation: boolean;
  enableNotifications: boolean;
}

// =====================================================
// 🌍 INTERNATIONALIZATION
// =====================================================

export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  enableRTL: boolean;
  enableNumberFormatting: boolean;
  enableDateFormatting: boolean;
  enableCurrencyFormatting: boolean;
}

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
}
