import { betterAuth } from 'better-auth';
import { dash } from '@better-auth/infra';

export const auth = betterAuth({
  appName: 'Treaty',
  baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:4201',
  basePath: '/api/auth',
  secret:
    process.env['BETTER_AUTH_SECRET'] ??
    'replace-this-dev-secret-before-production',
  trustedOrigins: ['http://localhost:4200', 'http://localhost:4201'],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [
    dash({
      apiUrl: process.env['BETTER_AUTH_API_URL'],
      kvUrl: process.env['BETTER_AUTH_KV_URL'],
      apiKey: process.env['BETTER_AUTH_API_KEY'],
    }),
  ],
});