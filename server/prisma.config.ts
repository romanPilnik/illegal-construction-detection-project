import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const envSpecific =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
for (const name of ['.env', envSpecific] as const) {
  const file = path.join(serverDir, name);
  if (existsSync(file)) {
    loadEnv({ path: file, override: name !== '.env' });
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
