export interface AppConfig {
  databaseUrl: string;
  port: number;
  dataDir: string;
  corsOrigin: string;
  nodeEnv: string;
}

export function loadConfig(): AppConfig {
  const required = ['DATABASE_URL'] as const;
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(', ')}\n` +
        `Check your .env file or Docker Compose environment section.`,
    );
  }

  return {
    databaseUrl: process.env.DATABASE_URL!,
    port: Number(process.env.PORT ?? 3001),
    dataDir: process.env.DATA_DIR ?? './data',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}
