import {
  startServer as O,
  startStatic as W,
  logger as Z,
  createLogger as q,
  dateTime as ee,
  localIPs as te,
  nodeArgs as re,
  getEnvConfig as se,
  checkPort as oe,
  getDirName as ae,
  resolvePath as ne,
} from 'huxy-node-server';
import {createProxyMiddleware as E} from 'http-proxy-middleware';
import {dateTime as I} from 'huxy-node-server';
import T from 'jsonwebtoken';
var m = (r, e = {secret, ...opt}) => T.verify(r, secret, opt);
var f =
  (r = {}) =>
  (e, t, s) => {
    let n = e.headers.authorization;
    if (!n) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!n.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let a = n.split(' ')[1];
    if (!a) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let o = m(a, r);
      (e.log.info(o, '\u8BA4\u8BC1\u6210\u529F'), (e.user = o), s());
    } catch (o) {
      return o.name === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : o.name === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : o instanceof AuthorizationError
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${o.message}`), t.status(o.status).json({message: o.message}))
            : (e.log.warn({err: o, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var j =
    ({whiteAuthKeys: r = [], whiteAuthPaths: e = [], config: t = {}}) =>
    (s, n, a) => {
      if (s.method === 'OPTIONS' || e.includes(s.path)) return a();
      let {authToken: o} = t;
      if (o === !1 || o === 'false') return a();
      let p = s.headers['x-huxy-auth'] || s.headers['x-api-key'];
      if (p === o || r.includes(p)) return a();
      let {secret: c, expiresIn: u, algorithm: i, issuer: h} = t;
      f({secret: c, expiresIn: u, algorithm: i, issuer: h})(s, n, a);
    },
  x = j;
var v = ['x-powered-by', 'server'],
  y = (r, e) => {
    let t = new Headers(r);
    return (headersToRemove.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
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
var $ = ({target: r = 'http://localhost:11434', prefix: e = '/api', ...t} = {}, s = !1) => ({
    target: r,
    pathRewrite: {[`^${e}`]: ''},
    changeOrigin: !0,
    selfHandleResponse: !1,
    onProxyReq: (n, a, o) => {
      !s && y(n.headers, r);
    },
    onProxyRes: (n, a, o) => {
      !s && w(n.headers);
    },
    onError: (n, a, o) => {
      (a.log.error({err: n}, '\u4EE3\u7406\u9519\u8BEF'), o.headersSent || o.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
    },
    ...t,
  }),
  S = (r, e) => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D -> ${e}`, timestamp: I(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    r.get(`${e}/health`.replace('//', '/'), (s, n) => {
      n.status(200).json(t);
    });
  },
  k = (r, e = {}, t) => {
    let {apiPrefix: s, proxys: n = [], whiteAuthKeys: a = [], whitePathList: o = [], preserve: p = !1} = e,
      c = g(n, s);
    if (!c.length) return;
    (t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: http://${e.host}:${e.port}${s}`), S(r, s));
    let u = x({whiteAuthKeys: a, whitePathList: P(o, s), config: e});
    c.map(({prefix: i, target: h}) => {
      let A = $({prefix: i, target: h}, p);
      (r.use(i, u, E(A)), t.info(`\u2705 \u4EE3\u7406\u4E2D ${i} -> ${h}`));
    });
  },
  l = k;
var C = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api',
    authToken: '1234',
    proxys: [],
    whiteAuthKeys: ['ihuxy'],
    whitePathList: ['/health'],
    algorithm: 'HS256',
    secret: process.env.JWT_SECRET || 'ah.yiru@gmail.com',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'huxyApp',
  },
  d = C;
var L = (r, e) =>
    O({...d, ...r}, async (t, s, n, a) => {
      (await e?.(t, s, n, a), l(s, t, a));
    }),
  ce = L,
  he = (r, e) =>
    W({...d, ...r}, async (t, s, n, a) => {
      (await e?.(t, s, n, a), l(s, t, a));
    });
export {
  l as appProxy,
  oe as checkPort,
  q as createLogger,
  ee as dateTime,
  ce as default,
  ae as getDirName,
  se as getEnvConfig,
  te as localIPs,
  Z as logger,
  re as nodeArgs,
  ne as resolvePath,
  L as startApp,
  O as startServer,
  W as startStatic,
  he as startStaticApp,
};
