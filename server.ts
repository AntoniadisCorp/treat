import '@angular/compiler';
import './treaty-utilities/mock-create-histogram';
import './treaty-utilities/mock-zone';

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

const browserDistFolder = join(serverDistFolder, 'dist/treaty/browser');
const indexHtml = join(serverDistFolder, 'dist/treaty/browser/index.html');
let commonEngine: CommonEngine | null = null;

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

    const _db = await getDb();
    const cacheKey = getHtmlCacheKey(originalUrl);
    const cacheHit = await _db.select(cacheKey);

    if (cacheHit) {
      return new Response(cacheHit.content, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
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

      await _db.create(cacheKey, {
        content: _html,
      });

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
