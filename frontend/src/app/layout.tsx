import type { Metadata, Viewport } from 'next';
import './globals.css';

import { ToastProvider, GlobalToastListener } from '@/components/ui/toast';
import { CommandPaletteWrapper } from '@/components/CommandPaletteWrapper';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import {
  ConfirmDialogProvider,
  GlobalConfirmListener,
} from '@/components/ui/confirm-dialog';
import { BarProvider } from '@/contexts/BarContext';
import { UserProvider } from '@/contexts/UserContext';
import AuthSync from '@/components/AuthSync';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LGPDProvider } from '@/hooks/useLGPD';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';

// Using system fonts instead of Google Fonts to avoid build connectivity issues

export const metadata: Metadata = {
  title: 'SGB - Sistema de Gestão de Bares',
  description: 'Sistema de Gestão de Bares - Grupo Menos é Mais',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SGB Dashboard',
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '48x48',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SGB Dashboard" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="font-sans">
        <LGPDProvider>
          <ThemeProvider>
            <UserProvider>
              <BarProvider>
                <CommandPaletteProvider>
                  <ToastProvider>
                    <ConfirmDialogProvider>
                      <AuthSync />
                      <div className="min-h-screen">
                        {children}
                        <GlobalToastListener />
                        <GlobalConfirmListener />
                        <CommandPaletteWrapper />
                        <PWAInstallBanner variant="floating" />
                      </div>
                    </ConfirmDialogProvider>
                  </ToastProvider>
                </CommandPaletteProvider>
              </BarProvider>
            </UserProvider>
          </ThemeProvider>
        </LGPDProvider>
      </body>
    </html>
  );
}
