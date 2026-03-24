import '@angular/compiler';
import './utilities/mock-create-histogram';
import './utilities/mock-zone';

import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { join } from 'path';

import { Surreal } from 'surrealdb.node';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import bootstrap from './src/main.server';
import { auth } from './auth';

const devLog = (...args: unknown[]) => {
  console.log('[dev]', new Date().toISOString(), ...args);
};

let db: Surreal | null = null;

const port = process.env['PORT'] || 4201;
const serverDistFolder = import.meta.dirname;

const browserDistFolder = join(serverDistFolder, 'dist/treat/browser');
const indexHtml = join(serverDistFolder, 'dist/treat/browser/index.html');
let commonEngine: CommonEngine | null = null;

type AppRole = 'owner' | 'admin' | 'operator' | 'viewer';

type StatusEntryPoint = {
  label: string;
  href: string | null;
  description: string;
  allowed: boolean;
};

type CurrentUserStatus = {
  authenticated: boolean;
  role: AppRole | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  entryPoints: StatusEntryPoint[];
};

const getDb = async () => {
  if (db) return db;

  db = new Surreal();
  await db.connect('memory');
  await db.use({ ns: 'test', db: 'test' });

  return db;
};

const getCommonEngine = () => {
  if (commonEngine) return commonEngine;

  commonEngine = new CommonEngine({
    enablePerformanceProfiler: true,
  });

  return commonEngine;
};

const getHtmlCacheKey = (urlPath: string) => `url:${encodeURIComponent(urlPath)}`;

const toDisplayRole = (role: AppRole | null) => role;

const buildEntryPoints = (role: AppRole | null): StatusEntryPoint[] => {
  const isAuthenticated = role !== null;
  const isAdmin = role === 'owner' || role === 'admin';

  return [
    {
      label: 'Dashboard Overview',
      href: '/dashboard',
      description: 'Protected operations shell and navigation.',
      allowed: isAuthenticated,
    },
    {
      label: 'Schedules',
      href: null,
      description: 'Planned scheduling workspace for operators and admins.',
      allowed: isAuthenticated,
    },
    {
      label: 'Notifications',
      href: null,
      description: 'Future notification center backed by audited events.',
      allowed: isAuthenticated,
    },
    {
      label: 'Admin Settings',
      href: null,
      description: 'Reserved for owner and admin workflows.',
      allowed: isAdmin,
    },
  ];
};

const buildCurrentUserStatus = async (headers: Headers): Promise<CurrentUserStatus> => {
  const betterAuthSession = await auth.api.getSession({ headers });

  if (!betterAuthSession) {
    return {
      authenticated: false,
      role: null,
      user: null,
      entryPoints: buildEntryPoints(null),
    };
  }

  const role = toDisplayRole('viewer');

  return {
    authenticated: true,
    role,
    user: {
      id: betterAuthSession.user.id,
      name: betterAuthSession.user.name ?? null,
      email: betterAuthSession.user.email ?? null,
    },
    entryPoints: buildEntryPoints(role),
  };
};

const app = new Elysia()
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      devLog('request', request.method, url.pathname);
    }
  })
  .use(
    cors({
      origin: ['http://localhost:4200', 'http://localhost:4201'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .get('/api/auth', () => {
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Better Auth is mounted. Use /api/auth/* endpoints.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  })
  .all('/api/auth/*', ({ request }) => auth.handler(request))
  .derive(({ request: { url } }) => {
    const _url = new URL(url);

    return {
      protocol: _url.protocol.split(':')[0],
      originalUrl: _url.pathname + _url.search,
      baseUrl: '',
    };
  })
  .group('/api', (api) => {
    return api
      .get('/status', async ({ request: { headers } }) =>
        buildCurrentUserStatus(headers)
      )
      .get('/id/:id', ({ params: { id } }) => ({ data: `Post with id: ${id}` }))
      .get('/example', () => `just an example`)
      .post('/form', ({ body }) => body, {
        body: t.Object({
          strField: t.String(),
          numbField: t.Number(),
        }),
      });
  })
  .get('*.*', async ({ originalUrl }) => {
    const file = Bun.file(`${browserDistFolder}${originalUrl}`);

    return new Response(await file.arrayBuffer(), {
      headers: {
        'Content-Type': file.type,
      },
    });
  })
  .get('*', async ({ originalUrl, baseUrl, protocol, headers }) => {
    if (originalUrl.startsWith('/api/')) {
      return new Response(
        JSON.stringify({
          error: 'Unknown API route',
          path: originalUrl,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (originalUrl.includes('.')) {
      const file = Bun.file(`${browserDistFolder}${originalUrl}`);

      return new Response(await file.arrayBuffer(), {
        headers: {
          'Content-Type': file.type,
        },
      });
    }

    const hasCookieHeader =
      typeof headers['cookie'] === 'string' && headers['cookie'].length > 0;
    const isDashboardRoute =
      originalUrl === '/dashboard' || originalUrl.startsWith('/dashboard/');
    const shouldBypassHtmlCache = hasCookieHeader || isDashboardRoute;

    const _db = await getDb();
    const cacheKey = getHtmlCacheKey(originalUrl);

    if (!shouldBypassHtmlCache) {
      const cacheHit = await _db.select(cacheKey);
      const cachedHtml = Array.isArray(cacheHit)
        ? cacheHit[0]?.content
        : cacheHit?.content;

      if (typeof cachedHtml === 'string' && cachedHtml.length > 0) {
        return new Response(cachedHtml, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
    }

    try {
      devLog('ssr.render.start', `${protocol}://${headers['host']}${originalUrl}`);

      const _html = await getCommonEngine().render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers['host']}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: '' }],
      });

      devLog('ssr.render.done', originalUrl);

      if (!shouldBypassHtmlCache) {
        await _db.create(cacheKey, {
          content: _html,
        });
      }

      return new Response(_html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } catch (error) {
      devLog('ssr.render.error', originalUrl, error);

      return 'Missing page';
    }
  })
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
