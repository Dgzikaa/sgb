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
  title: 'ZYCOR - Sistema de Gestão de Bares',
  description: 'ZYCOR - O núcleo da gestão de bares',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZYCOR Dashboard',
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: '48x48',
      },
    ],
    apple: {
      url: '/favicon.svg',
      type: 'image/svg+xml',
    },
    shortcut: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#4A90E2',
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
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="#4A90E2" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="ZYCOR Dashboard" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="msapplication-TileColor" content="#4A90E2" />
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
