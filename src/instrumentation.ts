export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = (...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) => {
  // Lazy import so we don't bundle Sentry into edge if it's not configured
  return import("@sentry/nextjs").then(({ captureRequestError }) => captureRequestError(...args));
};
