import {
  startServer as O,
  startStatic as W,
  logger as Z,
  createLogger as q,
  dateTime as ee,
  localIPs as te,
  nodeArgs as re,
  getEnvConfig as oe,
  checkPort as se,
  getDirName as ae,
  resolvePath as ne,
} from 'huxy-node-server';
import {createProxyMiddleware as E} from 'http-proxy-middleware';
import {logger as P, dateTime as I} from 'huxy-node-server';
import j from 'jsonwebtoken';
var m = (r, e = {secret, ...opt}) => j.verify(r, secret, opt);
var d =
  (r = {}) =>
  (e, t, o) => {
    let s = e.headers.authorization;
    if (!s) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!s.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let n = s.split(' ')[1];
    if (!n) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let a = m(n, r);
      (e.log.info(a, '\u8BA4\u8BC1\u6210\u529F'), (e.user = a), o());
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
var T =
    ({whiteAuthKeys: r = [], whiteAuthPaths: e = [], config: t = {}}) =>
    (o, s, n) => {
      if (o.method === 'OPTIONS' || e.includes(o.path)) return n();
      let a = o.headers['x-huxy-auth'] || o.headers['x-api-key'];
      if (r.includes(a)) return n();
      let {secret: p, expiresIn: h, algorithm: i, issuer: c} = t;
      d({secret: p, expiresIn: h, algorithm: i, issuer: c})(o, s, n);
    },
  f = T;
var v = ['x-powered-by', 'server'],
  x = (r, e) => {
    let t = new Headers(r);
    return (headersToRemove.forEach(o => t.delete(o)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  g = r => {
    let e = new Headers(r);
    return (
      v.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var H = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  R = r => (H(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  y = (r, e) => R(r).map(t => ((t.prefix = `${e}${t.prefix ?? `/${t.name}`}`.replace('//', '/')), t)),
  w = (r, e) => ['/', '/health', e, ...r].map(t => `${e}${t}`.replace('//', '/'));
var $ = ({target: r = 'http://localhost:11434', prefix: e = '/api', ...t} = {}, o = !1) => ({
    target: r,
    pathRewrite: {[`^${e}`]: ''},
    changeOrigin: !0,
    selfHandleResponse: !1,
    onProxyReq: (s, n, a) => {
      !o && x(s.headers, r);
    },
    onProxyRes: (s, n, a) => {
      !o && g(s.headers);
    },
    onError: (s, n, a) => {
      (n.log.error({err: s}, '\u4EE3\u7406\u9519\u8BEF'), a.headersSent || a.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
    },
    ...t,
  }),
  S = (r, e) => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D -> ${e}`, timestamp: I(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    r.get(`${e}/health`.replace('//', '/'), (o, s) => {
      s.status(200).json(t);
    });
  },
  C = (r, e = {}) => {
    let {apiPrefix: t, proxys: o = [], whiteAuthKeys: s = [], whitePathList: n = [], preserve: a = !1} = e,
      p = y(o, t);
    if (!p.length) return;
    (P.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: http://${e.host}:${e.port}${t}`), S(r, t));
    let h = f({whiteAuthKeys: s, whitePathList: w(n, t), config: e});
    p.map(({prefix: i, target: c}) => {
      let A = $({prefix: i, target: c}, a);
      (r.use(i, h, E(A)), P.info(`\u2705 \u4EE3\u7406\u4E2D ${i} -> ${c}`));
    });
  },
  l = C;
var k = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api',
    authToken: 'ah.yiru@gmail.com',
    proxys: [],
    whiteAuthKeys: ['ihuxy'],
    whitePathList: ['/health'],
    algorithm: 'HS256',
    secret: process.env.JWT_SECRET || 'ah.yiru@gmail.com',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'huxyApp',
  },
  u = k;
var L = (r, e) =>
    O({...u, ...r}, async (t, o, s) => {
      (await e?.(t, o, s), l(o, t));
    }),
  ce = L,
  he = (r, e) =>
    W({...u, ...r}, async (t, o, s) => {
      (await e?.(t, o, s), l(o, t));
    });
export {
  l as appProxy,
  se as checkPort,
  q as createLogger,
  ee as dateTime,
  ce as default,
  ae as getDirName,
  oe as getEnvConfig,
  te as localIPs,
  Z as logger,
  re as nodeArgs,
  ne as resolvePath,
  L as startApp,
  O as startServer,
  W as startStatic,
  he as startStaticApp,
};
