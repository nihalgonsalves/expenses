import path from 'path';

import type {
  AppControllerRoute,
  AppViewRoute,
  BullBoardQueues,
  ControllerHandlerReturnType,
  IServerAdapter,
  UIConfig,
} from '@bull-board/api/dist/typings/app';
import type { serveStatic as nodeServeStatic } from '@hono/node-server/serve-static';
import ejs from 'ejs';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { serveStatic as bunServeStatic } from 'hono/bun';
import type { serveStatic as cloudflarePagesServeStatic } from 'hono/cloudflare-pages';
import type { serveStatic as cloudflareWorkersServeStatic } from 'hono/cloudflare-workers';
import type { serveStatic as denoServeStatic } from 'hono/deno';

export class BullBoardHonoAdapter implements IServerAdapter {
  protected bullBoardQueues: BullBoardQueues | undefined;

  protected errorHandler:
    | ((error: Error) => ControllerHandlerReturnType)
    | undefined;

  protected uiConfig?: UIConfig;

  protected staticRoute?: string;

  protected staticPath?: string;

  protected entryRoute?: AppViewRoute;

  protected viewPath?: string;

  protected apiRoutes: Hono;

  constructor(
    protected serveStatic:
      | typeof bunServeStatic
      | typeof nodeServeStatic
      | typeof cloudflarePagesServeStatic
      | typeof cloudflareWorkersServeStatic
      | typeof denoServeStatic,
  ) {
    this.apiRoutes = new Hono();
  }

  setStaticPath(staticRoute: string, staticPath: string): this {
    this.staticRoute = staticRoute;
    this.staticPath = staticPath;
    return this;
  }

  setViewsPath(viewPath: string): this {
    this.viewPath = viewPath;
    return this;
  }

  setErrorHandler(
    handler: (error: Error) => ControllerHandlerReturnType,
  ): this {
    this.errorHandler = handler;
    return this;
  }

  setApiRoutes(routes: readonly AppControllerRoute[]): this {
    const { errorHandler, bullBoardQueues } = this;

    if (!errorHandler || !bullBoardQueues) {
      throw new Error('');
    }

    routes.forEach(({ method: methodOrMethods, route, handler }) => {
      const methods = Array.isArray(methodOrMethods)
        ? methodOrMethods
        : [methodOrMethods];

      methods.forEach((m) => {
        this.registerRoute(route, m, handler);
      });
    });

    return this;
  }

  private registerRoute(
    routeOrRoutes: string | string[],
    method: 'get' | 'post' | 'put',
    handler: AppControllerRoute['handler'],
  ) {
    const { bullBoardQueues } = this;

    if (!bullBoardQueues) {
      throw new Error('');
    }

    const routes = Array.isArray(routeOrRoutes)
      ? routeOrRoutes
      : [routeOrRoutes];

    routes.forEach((route) => {
      this.apiRoutes[method](route, async (c: Context) => {
        try {
          const response = await handler({
            queues: bullBoardQueues,
            params: c.req.param(),
            query: c.req.query(),
          });
          return c.json(response.body, response.status || 200);
        } catch (e) {
          if (!this.errorHandler || !(e instanceof Error)) {
            throw e;
          }

          const response = this.errorHandler(e);

          if (typeof response.body === 'string') {
            return c.text(response.body, response.status);
          }

          return c.json(response.body, response.status);
        }
      });
    });
  }

  setEntryRoute(routeDef: AppViewRoute): this {
    this.entryRoute = routeDef;
    return this;
  }

  setQueues(bullBoardQueues: BullBoardQueues): this {
    this.bullBoardQueues = bullBoardQueues;
    return this;
  }

  setUIConfig(config: UIConfig): this {
    this.uiConfig = config;
    return this;
  }

  registerPlugin(basePath: string) {
    const {
      staticRoute,
      staticPath,
      entryRoute,
      viewPath,
      bullBoardQueues,
      uiConfig,
    } = this;

    if (
      !staticRoute ||
      !staticPath ||
      !entryRoute ||
      !viewPath ||
      !bullBoardQueues ||
      !uiConfig
    ) {
      throw new Error(
        `Please call 'setErrorHandler' before using 'registerPlugin'`,
      );
    }

    const app = new Hono();

    app.get(
      `${this.staticRoute}/*`,
      this.serveStatic({
        root: path.relative(process.cwd(), staticPath),
        rewriteRequestPath: (p: string) =>
          p.replace(path.join(basePath, staticRoute), ''),
      }),
    );

    app.route('/', this.apiRoutes);

    const routeOrRoutes = entryRoute.route;
    const routes = Array.isArray(routeOrRoutes)
      ? routeOrRoutes
      : [routeOrRoutes];

    routes.forEach((route) => {
      app[entryRoute.method](route, async (c: Context) => {
        const { name: fileName, params } = entryRoute.handler({
          basePath,
          uiConfig,
        });

        const template = await ejs.renderFile(
          `${this.viewPath}/${fileName}`,
          params,
        );
        return c.html(template);
      });
    });

    return app;
  }
}
