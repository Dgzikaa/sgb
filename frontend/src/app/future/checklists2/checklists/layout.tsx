import { DarkSidebarLayout } from '@/components/layouts';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DarkSidebarLayout>{children}</DarkSidebarLayout>;
} 