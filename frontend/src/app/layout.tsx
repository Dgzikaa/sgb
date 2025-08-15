import type { Metadata, Viewport } from 'next';
import './globals.css';

import { ToastProvider, GlobalToastListener } from '@/components/ui/toast';
import { CommandPaletteWrapper } from '@/components/CommandPaletteWrapper';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { PWAManager } from '@/components/PWAManager';
import AssistantWrapper from '@/components/AssistantWrapper';
import {
  ConfirmDialogProvider,
  GlobalConfirmListener,
} from '@/components/ui/confirm-dialog';
import { BarProvider } from '@/contexts/BarContext';
import { UserProvider } from '@/contexts/UserContext';
import AuthSync from '@/components/AuthSync';
import ErrorBoundary from '@/components/ui/error-boundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LGPDProvider } from '@/hooks/useLGPD';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';
import dynamic from 'next/dynamic';

const AxeA11y = dynamic(() => import('@/components/dev/AxeA11y'), { ssr: false });
import Script from 'next/script';

// Using system fonts instead of Google Fonts to avoid build connectivity issues

export const metadata: Metadata = {
  title: 'Zykor - O núcleo da gestão de bares',
  description: 'Zykor - Plataforma completa de gestão para bares e casas noturnas. Analytics, automação e inteligência artificial.',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Zykor Dashboard',
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
        {/* Manifest será carregado dinamicamente pelo PWAManager */}
        <meta name="theme-color" content="#ea580c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Zykor" />
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
                      <PWAManager />
                      <AxeA11y />
                      {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
                        <Script 
                          id="sentry-init" 
                          strategy="afterInteractive"
                          dangerouslySetInnerHTML={{
                            __html: `
                              (function(){
                                try {
                                  var dsn = '${process.env.NEXT_PUBLIC_SENTRY_DSN || ''}';
                                  if(!dsn) return;
                                  var s = document.createElement('script');
                                  s.src = 'https://browser.sentry-cdn.com/7.120.0/bundle.min.js';
                                  s.crossOrigin = 'anonymous';
                                  s.onload = function(){
                                    if(window.Sentry) {
                                      window.Sentry.init({ dsn: dsn, tracesSampleRate: 0.1 });
                                    }
                                  };
                                  document.head.appendChild(s);
                                } catch(e) {}
                              })();
                            `
                          }}
                        />
                      ) : null}
                      <div className="min-h-screen">
                        <ErrorBoundary>
                          {children}
                        </ErrorBoundary>
                        <GlobalToastListener />
                        <GlobalConfirmListener />
                        <CommandPaletteWrapper />
                        <AssistantWrapper />
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
