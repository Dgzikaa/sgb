// Sentry instrumentação temporariamente desabilitada
export async function register() {
  // Silenciar erros específicos do Watchpack no Windows durante o dev
  if (process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      try {
        const msg = (args && args.length > 0 ? String(args[0]) : '').toLowerCase();
        // Ignorar somente o erro conhecido do Watchpack para 'System Volume Information'
        if (
          msg.includes('watchpack error (initial scan)') &&
          msg.includes('system volume information') &&
          msg.includes('einval')
        ) {
          return;
        }
      } catch {}
      originalError.apply(console, args as never);
    };
  }
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config');
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config');
  // }
}
