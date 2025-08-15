import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}
// A faulty API route to test Sentry's error monitoring
export function GET() {
  // Sempre lança erro para teste - remove unreachable code
  throw new SentryExampleAPIError("This error is raised on the backend called by the example page.");
}
