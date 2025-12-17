import f from 'express';
import H from 'helmet';
import _ from 'cors';
import {rateLimit as N, ipKeyGenerator as k} from 'express-rate-limit';
import B from 'compression';
import M from 'pino-http';
import {createServer as U} from 'node:http';
import W from 'pino';
import G from 'node:os';
import X from 'node:net';
import 'dotenv';
import {Router as q} from 'express';
import ne from 'express';
import {fileURLToPath as ue} from 'node:url';
import {dirname as pe, resolve as le} from 'node:path';
var p = (r = new Date()) => r.toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: !1}),
  v = r => {
    let e = r ? 'https' : 'http',
      t = G.networkInterfaces(),
      s = [];
    return (Object.keys(t).map(o => s.push(...t[o])), s.filter(o => o.family === 'IPv4').map(o => `${e}://${o.address}`));
  },
  A = r => {
    let e = r ?? process.argv.slice(2) ?? [],
      t = {};
    return (
      e.map(s => {
        let [o, a] = s.split('=');
        t[o] = a;
      }),
      t
    );
  },
  z = {
    NODE_ENV: 'nodeEnv',
    PORT: 'port',
    STATIC_PORT: 'staticPort',
    HOST: 'host',
    BASEPATH: 'basepath',
    CORS_ORIGIN: 'cors.origin',
    RATE_LIMIT_WINDOW_MS: 'rateLimit.windowMs',
    RATE_LIMIT_MAX_REQUESTS: 'rateLimit.limit',
    LOG_LEVEL: 'logLevel',
    API_PREFIX: 'apiPrefix',
    JWT_SECRET: 'secret',
    AUTH_TOKEN: 'authToken',
  },
  J = (r, e, t) => {
    let [s, o] = r.split('.');
    s && o ? (t[s] || (t[s] = {}), (t[s][o] = e)) : (t[s] = e);
  },
  x = (r = {}, e = z) => {
    let {env: t} = process;
    Object.keys(e).map(o => {
      let a = t[o];
      a && J(e[o], a, r);
    });
    let s = {...r, ...A()};
    return ((s.port = s.staticPort || s.port), (s.isDev = s.NODE_ENV === 'development'), s);
  },
  T = (r, e = '127.0.0.1') =>
    new Promise(t => {
      let s = X.createServer();
      (s.once('error', o => {
        (s.close(), t((o.code, !1)));
      }),
        s.once('listening', () => {
          (s.close(), t(!0));
        }),
        s.listen(Number(r), e));
    }),
  K = {
    nodeEnv: 'production',
    isDev: !1,
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    basepath: process.env.BASEPATH || '/',
    cors: {origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: !0},
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: {error: '\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5'},
    },
    helmet: {
      contentSecurityPolicy: {directives: {defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:', 'https:']}},
      crossOriginEmbedderPolicy: !1,
    },
    logLevel: process.env.LOG_LEVEL || 30,
  },
  y = K,
  g = (r, e) =>
    W({
      name: r,
      level: y.logLevel,
      transport: {target: 'pino-pretty', options: {colorize: !0, sync: !0}, ignore: 'pid,hostname,level,time', translateTime: 'UTC:yyyy-mm-dd HH:MM:ss', customColors: 'err:red,info:blue'},
      ...e,
    }),
  V = () => {
    let r = g('http-request');
    return (e, t, s) => {
      let o = Date.now();
      (t.on('finish', () => {
        let a = Date.now() - o,
          i = {method: e.method, url: e.originalUrl, status: t.statusCode, duration: `${a}ms`, ip: e.ip, userAgent: e.get('User-Agent'), timestamp: p()};
        t.statusCode >= 500 ? r.error(i, 'HTTP\u8BF7\u6C42\u9519\u8BEF') : t.statusCode >= 400 ? r.warn(i, 'HTTP\u5BA2\u6237\u7AEF\u9519\u8BEF') : r.info(i, 'HTTP\u8BF7\u6C42');
      }),
        s());
    };
  },
  n = g('huxy'),
  P = g('error-handler'),
  Q = r => (e, t, s) => {
    (P.error({message: 'Not Found', timestamp: p(), url: e.originalUrl, method: e.method, ip: e.ip, userAgent: e.get('User-Agent')}, '\u627E\u4E0D\u5230\u8DEF\u5F84'),
      t.status(404).json({success: !1, timestamp: p(), status: 404, message: `\u8DEF\u7531 ${e.method} ${e.originalUrl} \u4E0D\u5B58\u5728`, url: e.originalUrl}));
  },
  Y = r => (e, t, s, o) => {
    let a = e.status || 500,
      i = e.message;
    (P.error({message: i, timestamp: p(), stack: e.stack, url: t.originalUrl, method: t.method, ip: t.ip, userAgent: t.get('User-Agent')}, '\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF'),
      s.status(a).json({success: !1, timestamp: p(), message: r.isDev ? i : '\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF', stack: r.isDev ? e.stack : void 0}));
  },
  Z = r => (e, t, s) => {
    (e.path.match(/\.(js|css|png|jpe?g|ico|webp|svg|mpeg|webm|m4a)$/) ? t.set('Cache-Control', 'public, max-age=31536000, immutable') : t.set('Cache-Control', 'no-cache'), s());
  },
  ee = r => {
    let e = q();
    return (
      e.use('/health', (t, s) => {
        s.status(200).json({status: 'OK', timestamp: p(), uptime: process.uptime(), environment: r.nodeEnv, memoryUsage: process.memoryUsage(), pid: process.pid});
      }),
      e.get('/', (t, s) => {
        s.status(200).json({message: 'Node.js \u670D\u52A1\u5668\u8FD0\u884C\u4E2D', timestamp: p(), environment: r.nodeEnv});
      }),
      e
    );
  },
  te = ee,
  re = (r, e = {}) => (
    r.disable('x-powered-by'),
    r.set('trust proxy', 1),
    r.use(H(e.helmet)),
    r.use(_(e.cors)),
    r.use(N({keyGenerator: t => k(t.ip) || t.headers['x-huxy-auth'] || t.headers['x-api-key'] || t.headers.authorization, ...e.rateLimit})),
    r.use(B()),
    r.use(f.json({limit: '20mb'})),
    r.use(f.urlencoded({extended: !0, limit: '20mb'})),
    r.use(M({logger: n, quietReqLogger: !0, autoLogging: !1})),
    r.use(V()),
    r.use(Z(e)),
    r
  ),
  se = r => {
    let e = t => {
      (n.info(`\u6536\u5230 ${t} \u4FE1\u53F7, \u{1F6D1} \u6B63\u5728\u5173\u95ED\u670D\u52A1\u5668...`),
        r.close(() => {
          (n.info('\u{1F44B} \u670D\u52A1\u5668\u5DF2\u5173\u95ED'), process.exit(0));
        }),
        setTimeout(() => {
          (n.error('\u274C \u5F3A\u5236\u5173\u95ED\u670D\u52A1\u5668'), process.exit(1));
        }, 5e3));
    };
    (process.on('SIGTERM', () => e('SIGTERM')),
      process.on('SIGINT', () => e('SIGINT')),
      process.on('uncaughtException', t => {
        (n.error(t, `\u672A\u6355\u83B7\u7684\u5F02\u5E38: ${t.message}`), process.exit(1));
      }),
      process.on('unhandledRejection', (t, s) => {
        (n.error({reason: t, promise: s}, '\u672A\u5904\u7406\u7684 Promise \u62D2\u7EDD'), process.exit(1));
      }));
  },
  oe = async (r, e) => {
    let t = x(r),
      {port: s} = t;
    (await T(s, t.host)) || ((t.port = Number(s) + 1), n.warn(`\u7AEF\u53E3 ${s} \u5DF2\u88AB\u5360\u7528\uFF0C\u73B0\u5728\u4F7F\u7528\u7AEF\u53E3 ${t.port}`));
    let o = f();
    re(o, t);
    let a = U(o);
    return (e?.(a, o, t), o.use(te(t)), o.use(Q(t)), o.use(Y(t)), se(a), {app: o, httpServer: a, config: t});
  },
  ae = oe,
  ie = (r, e, t) =>
    ae({...y, ...r}, (s, o, a) => {
      let {port: i, host: u, nodeEnv: l, basepath: d, appName: c = 'HuxyServer'} = a;
      s.listen(i, u, () => {
        if (!t) {
          let h = v()
            .filter(m => m !== `http://${u}`)
            .map(m => `http://${m}:${i}${d}`);
          (n.info(`-----------------------${c}-----------------------`),
            n.info(`\u{1F680} \u670D\u52A1\u8FD0\u884C\u5728\u3010${l}\u3011\u73AF\u5883: http://${u}:${i}${d}`),
            n.info(`-----------------[${p()}]------------------`),
            n.info({ips: h}, '\u672C\u5730\u5730\u5740\uFF1A'));
        }
        e?.(a, o, s);
      });
    }),
  E = ie,
  w = (r = import.meta.url) => pe(ue(r)),
  S = r => le(w(), r),
  ce = S,
  me = {port: 9e3, host: 'localhost', basepath: '/', buildPath: './build'},
  de = (r, e) =>
    E({...me, ...r}, (t, s, o) => {
      let {basepath: a, buildPath: i} = t;
      (s.use(a, ne.static(i, {maxAge: '1y', immutable: !0})),
        s.get(`${a}/{*splat}`.replace('//', '/'), (u, l) => {
          l.sendFile(ce(i, 'index.html'));
        }),
        e?.(t, s, o));
    }),
  he = de;
import {createProxyMiddleware as xe} from 'http-proxy-middleware';
import ge from 'jsonwebtoken';
var D = (r, e = {secret, ...opt}) => ge.verify(r, secret, opt);
var I =
  (r = {}) =>
  (e, t, s) => {
    let o = e.headers.authorization;
    if (!o) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({error: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!o.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({error: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let a = o.split(' ')[1];
    if (!a) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({error: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let i = D(a, r);
      (e.log.info(i, '\u8BA4\u8BC1\u6210\u529F'), (e.user = i), s());
    } catch (i) {
      return i.name === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({error: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : i.name === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({error: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : i instanceof AuthorizationError
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${i.message}`), t.status(i.status).json({error: i.message}))
            : (e.log.warn({err: i, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({error: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var fe =
    ({whiteAuthKeys: r = [], whiteAuthPaths: e = [], jwtConfig: t = {}}) =>
    (s, o, a) => {
      if (s.method === 'OPTIONS' || e.includes(s.path)) return a();
      let i = s.headers['x-huxy-auth'] || s.headers['x-api-key'];
      if (r.includes(i)) return a();
      I(t)(s, o, a);
    },
  C = fe;
var Ee = ['x-powered-by', 'server'],
  F = (r, e) => {
    let t = new Headers(r);
    return (headersToRemove.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  R = r => {
    let e = new Headers(r);
    return (
      Ee.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var ve = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  Ae = r => (ve(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  $ = (r, e) => Ae(r).map(t => ((t.prefix = `${e}${t.prefix ?? `/${t.name}`}`.replace('//', '/')), t)),
  j = (r, e) => ['/', '/health', e, ...r].map(t => `${e}${t}`.replace('//', '/'));
var Te = ({target: r = 'http://localhost:11434', prefix: e = '/api', ...t} = {}, s = !1) => ({
    target: r,
    pathRewrite: {[`^${e}`]: ''},
    changeOrigin: !0,
    selfHandleResponse: !1,
    onProxyReq: (o, a, i) => {
      !s && F(o.headers, r);
    },
    onProxyRes: (o, a, i) => {
      !s && R(o.headers);
    },
    onError: (o, a, i) => {
      (a.log.error({err: o}, '\u4EE3\u7406\u9519\u8BEF'), i.headersSent || i.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
    },
    ...t,
  }),
  L = (r, e, t) => {
    let s = {message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D -> ${e}`, timestamp: new Date().toISOString(), version: '1.0.0', environment: t.nodeEnv};
    (r.get(e, (o, a) => {
      a.status(200).json(s);
    }),
      r.get(`${e}/health`, (o, a) => {
        a.status(200).json(s);
      }));
  },
  ye = ({proxys: r = [], whiteAuthKeys: e = [], whitePathList: t = [], preserve: s = !1} = {}, o, a, i = {}) => {
    let {apiPrefix: u} = o,
      l = $(r, u);
    if (!l.length) return;
    (n.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: http://${o.host}:${o.port}${u}`), L(a, u, o));
    let d = C({whiteAuthKeys: e, whitePathList: j(t, u), jwtConfig: i});
    l.map(({prefix: c, target: h}) => {
      L(a, c, o);
      let m = Te({prefix: c, target: h}, s);
      (a.use(c, d, xe(m)), n.info(`\u2705 \u4EE3\u7406\u4E2D ${c} -> ${h}`));
    });
  },
  O = ye;
var Pe = {
    config: {port: parseInt(process.env.PORT || '2345', 10), host: process.env.HOST || 'localhost', apiPrefix: process.env.API_PREFIX || '/', authToken: 'ah.yiru@gmail.com'},
    proxyConfig: {proxys: [], whiteAuthKeys: ['ihuxy'], whitePathList: ['/health']},
    jwtConfig: {algorithm: 'HS256', secret: process.env.JWT_SECRET || 'ah.yiru@gmail.com', expiresIn: process.env.JWT_EXPIRES_IN || '30d', issuer: process.env.JWT_ISSUER || 'huxyApp'},
  },
  b = Pe;
var {config: we, proxyConfig: Se, jwtConfig: De} = b,
  Ie = ({config: r, proxyConfig: e, jwtConfig: t} = {}, s) =>
    E({...we, ...r}, (o, a, i) => {
      (O({...Se, ...e}, o, a, {...De, ...t}), s?.(o, a, i));
    }),
  ut = Ie;
export {
  T as checkPort,
  g as createLogger,
  p as dateTime,
  ut as default,
  w as getDirName,
  x as getEnvConfig,
  v as localIPs,
  n as logger,
  A as nodeArgs,
  S as resolvePath,
  Ie as startApp,
  E as startServer,
  he as startStatic,
};
