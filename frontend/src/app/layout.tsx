import type { Metadata, Viewport } from 'next';
import './globals.css';

import { ToastProvider, GlobalToastListener } from '@/components/ui/toast';
import { Toaster } from 'sonner';
// import {
//   ConfirmDialogProvider,
//   GlobalConfirmListener,
// } from '@/components/ui/confirm-dialog';
import { CommandPaletteWrapper } from '@/components/CommandPaletteWrapper';
import ErrorBoundary from '@/components/ui/error-boundary';
import AuthSync from '@/components/AuthSync';
// import AssistantWrapper from '@/components/AssistantWrapper';
// import ZykorPWABanner from '@/components/ZykorPWABanner';
// import { UniversalDesignSystemWrapper } from '@/components/layouts/UniversalDesignSystemWrapper';
import { BarProvider } from '@/contexts/BarContext';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LGPDProvider } from '@/hooks/useLGPD';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';

export const metadata: Metadata = {
  title: 'Zykor - O núcleo da gestão de bares',
  description: 'Zykor - Plataforma completa de gestão para bares e casas noturnas.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ThemeProvider>
          <LGPDProvider>
            <UserProvider>
              <BarProvider>
                <CommandPaletteProvider>
                  <ToastProvider>
                    <ErrorBoundary>
                      <div className="min-h-screen">
                        {children}
                      </div>
                    </ErrorBoundary>
                    <CommandPaletteWrapper />
                    <AuthSync />
                    <GlobalToastListener />
                    <Toaster position="top-right" richColors />
                    {/* <AssistantWrapper /> */}
                    {/* <ZykorPWABanner /> */}
                  </ToastProvider>
                </CommandPaletteProvider>
              </BarProvider>
            </UserProvider>
          </LGPDProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
