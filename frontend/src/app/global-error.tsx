"use client";

// Sentry temporariamente desabilitado para resolver warnings de instrumentação
// import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // Sentry temporariamente desabilitado
    // Sentry.captureException(error);
    console.error('🚨 Global Error:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}