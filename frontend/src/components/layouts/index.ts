// Layout Components
export { default as StandardPageLayout } from './StandardPageLayout';
export { default as StandardPageWrapper } from './StandardPageWrapper';
export { DarkSidebarLayout } from './DarkSidebarLayout';
export { DashboardLayout } from './DashboardLayout';
export { AuthLayout } from './AuthLayout';
export { DarkHeader } from './DarkHeader';
export { ModernSidebar } from './ModernSidebar';
export { BottomNavigation } from './BottomNavigation';

// Layout Factory (para criar layouts padronizados)
export { 
  SimpleDashboardLayout,
  createProtectedDashboardLayout,
  default as createDashboardLayout 
} from './createDashboardLayout';

// Page Content Components (centralizados)
export { PageContent, PageHeader, PageSection } from './PageContent';

// Re-export standard card components
export {
  StandardCard,
  StandardCardHeader,
  StandardCardTitle,
  StandardCardDescription,
  StandardCardContent,
  StatsCard,
} from '../ui/standard-card';
