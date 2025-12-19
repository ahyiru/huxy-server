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
import {dateTime as I} from 'huxy-node-server';
import j from 'jsonwebtoken';
var d = (r, e = {secret, ...opt}) => j.verify(r, secret, opt);
var f =
  (r = {}) =>
  (e, t, o) => {
    let s = e.headers.authorization;
    if (!s) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!s.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let a = s.split(' ')[1];
    if (!a) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let n = d(a, r);
      (e.log.info(n, '\u8BA4\u8BC1\u6210\u529F'), (e.user = n), o());
    } catch (n) {
      return n.name === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : n.name === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : n instanceof AuthorizationError
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${n.message}`), t.status(n.status).json({message: n.message}))
            : (e.log.warn({err: n, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var T =
    ({whiteAuthKeys: r = [], whiteAuthPaths: e = [], config: t = {}}) =>
    (o, s, a) => {
      if (o.method === 'OPTIONS' || e.includes(o.path)) return a();
      let n = o.headers['x-huxy-auth'] || o.headers['x-api-key'];
      if (r.includes(n)) return a();
      let {secret: c, expiresIn: p, algorithm: h, issuer: i} = t;
      f({secret: c, expiresIn: p, algorithm: h, issuer: i})(o, s, a);
    },
  x = T;
var v = ['x-powered-by', 'server'],
  y = (r, e) => {
    let t = new Headers(r);
    return (headersToRemove.forEach(o => t.delete(o)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  w = r => {
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
  g = (r, e) => R(r).map(t => ((t.prefix = `${e}${t.prefix ?? `/${t.name}`}`.replace('//', '/')), t)),
  P = (r, e) => ['/', '/health', e, ...r].map(t => `${e}${t}`.replace('//', '/'));
var $ = ({target: r = 'http://localhost:11434', prefix: e = '/api', ...t} = {}, o = !1) => ({
    target: r,
    pathRewrite: {[`^${e}`]: ''},
    changeOrigin: !0,
    selfHandleResponse: !1,
    onProxyReq: (s, a, n) => {
      !o && y(s.headers, r);
    },
    onProxyRes: (s, a, n) => {
      !o && w(s.headers);
    },
    onError: (s, a, n) => {
      (a.log.error({err: s}, '\u4EE3\u7406\u9519\u8BEF'), n.headersSent || n.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
    },
    ...t,
  }),
  S = (r, e) => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D -> ${e}`, timestamp: I(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    r.get(`${e}/health`.replace('//', '/'), (o, s) => {
      s.status(200).json(t);
    });
  },
  C = (r, e = {}, t) => {
    let {apiPrefix: o, proxys: s = [], whiteAuthKeys: a = [], whitePathList: n = [], preserve: c = !1} = e,
      p = g(s, o);
    if (!p.length) return;
    (t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: http://${e.host}:${e.port}${o}`), S(r, o));
    let h = x({whiteAuthKeys: a, whitePathList: P(n, o), config: e});
    p.map(({prefix: i, target: m}) => {
      let A = $({prefix: i, target: m}, c);
      (r.use(i, h, E(A)), t.info(`\u2705 \u4EE3\u7406\u4E2D ${i} -> ${m}`));
    });
  },
  u = C;
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
  l = k;
var L = (r, e) =>
    O({...l, ...r}, async (t, o, s, a) => {
      (await e?.(t, o, s, a), u(o, t, a));
    }),
  ce = L,
  he = (r, e) =>
    W({...l, ...r}, async (t, o, s, a) => {
      (await e?.(t, o, s, a), u(o, t, a));
    });
export {
  u as appProxy,
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
