import {
  startServer as M,
  startStatic as L,
  logger as te,
  createLogger as re,
  dateTime as se,
  localIPs as oe,
  nodeArgs as ae,
  getEnvConfig as ne,
  checkPort as ie,
  getDirName as pe,
  resolvePath as ce,
} from 'huxy-node-server';
import {createProxyMiddleware as E, fixRequestBody as S} from 'http-proxy-middleware';
import {dateTime as C} from 'huxy-node-server';
import T from 'jsonwebtoken';
var m = (r, e = {secret, ...opt}) => T.verify(r, secret, opt);
var x =
  (r = {}) =>
  (e, t, s) => {
    let o = e.headers.authorization;
    if (!o) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!o.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let n = o.split(' ')[1];
    if (!n) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let a = m(n, r);
      (e.log.info(a, '\u8BA4\u8BC1\u6210\u529F'), (e.user = a), s());
    } catch (a) {
      return a.name === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : a.name === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : a instanceof AuthorizationError
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${a.message}`), t.status(a.status).json({message: a.message}))
            : (e.log.warn({err: a, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var H =
    ({whiteAuthKeys: r = [], whiteAuthPaths: e = [], config: t = {}}) =>
    (s, o, n) => {
      if (s.method === 'OPTIONS' || e.includes(s.path)) return n();
      let {authToken: a} = t;
      if (a === !1 || a === 'false') return n();
      let p = s.headers,
        i = p['x-huxy-auth'] || p['x-api-key'] || p.authorization?.split('Bearer ')[1];
      if ((i && i === a) || r.includes(i)) return n();
      let {secret: u, expiresIn: c, algorithm: l, issuer: h} = t;
      x({secret: u, expiresIn: c, algorithm: l, issuer: h})(s, o, n);
    },
  y = H;
var v = ['origin', 'referer', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'x-huxy-auth'],
  $ = ['x-powered-by', 'server'],
  w = (r, e) => {
    let t = new Headers(r);
    return (v.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  g = r => {
    let e = new Headers(r);
    return (
      $.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var I = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  R = r => (I(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  A = (r, e) => R(r).map(t => ((t.prefix = `${e}${(t.prefix ?? t.name) ? `/${t.name}` : ''}`.replace('//', '/')), t)),
  P = r => (Array.isArray(r) ? r : []).filter(Boolean),
  j = (r, e) => [...new Set(['/', '/health', e, ...(Array.isArray(r) ? r : [])])].filter(Boolean).map(t => `${e}${t}`.replace('//', '/'));
var k = ({target: r = 'http://', prefix: e, ...t} = {}, s = !1) => ({
    target: r,
    pathRewrite: e?.length > 1 ? {[`^${e}`]: ''} : void 0,
    changeOrigin: !0,
    selfHandleResponse: !1,
    on: {
      proxyReq: (o, n, a) => (!s && w(o.headers, r), S(o, n, a)),
      proxyRes: (o, n, a) => {
        !s && g(o.headers);
      },
      error: (o, n, a) => {
        (n.log.error({err: o}, '\u4EE3\u7406\u9519\u8BEF'), a.headersSent || a.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
      },
    },
    ...t,
  }),
  O = (r, e) => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`, timestamp: C(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    (r.get(e, (s, o) => {
      o.status(200).json(t);
    }),
      r.get(`${e}/health`.replace('//', '/'), (s, o) => {
        o.status(200).json(t);
      }));
  },
  W = (r, e = {}, t) => {
    let {apiPrefix: s = '/', proxys: o = [], whiteAuthKeys: n = [], whitePathList: a = [], preserve: p = !1} = e,
      i = A(o, s);
    if (!i.length) return;
    (t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: ${e.protocol}://${e.host}:${e.port}${s}`), O(r, s));
    let u = y({whiteAuthKeys: P(n), whitePathList: j(a, s), config: e});
    i.map(({prefix: c, target: l, ...h}) => {
      (r.use(c, u, E(k({prefix: c, target: l, ...h}, p))), t.info(`\u2705 \u4EE3\u7406\u4E2D ${c} \u{1F449} ${l}`));
    });
  },
  d = W;
var B = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/',
    authToken: !1,
    proxys: [],
    whitePathList: ['/health'],
    algorithm: 'HS256',
    secret: process.env.JWT_SECRET || 'hy123',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'huxyApp',
  },
  f = B;
var U = (r, e) =>
    M({...f, ...r}, async (t, s, o, n) => {
      (await e?.(t, s, o, n), d(s, t, n));
    }),
  he = U,
  de = (r, e) =>
    L({...f, ...r}, async (t, s, o, n) => {
      (await e?.(t, s, o, n), d(s, t, n));
    });
export {
  d as appProxy,
  ie as checkPort,
  re as createLogger,
  se as dateTime,
  he as default,
  pe as getDirName,
  ne as getEnvConfig,
  oe as localIPs,
  te as logger,
  ae as nodeArgs,
  ce as resolvePath,
  U as startApp,
  M as startServer,
  L as startStatic,
  de as startStaticApp,
};
