import {
  startServer as W,
  startStatic as L,
  logger as q,
  createLogger as ee,
  dateTime as te,
  localIPs as re,
  nodeArgs as se,
  getEnvConfig as oe,
  checkPort as ae,
  getDirName as ne,
  resolvePath as ie,
} from 'huxy-node-server';
import {createProxyMiddleware as E} from 'http-proxy-middleware';
import {dateTime as I} from 'huxy-node-server';
import T from 'jsonwebtoken';
var x = (r, e = {secret, ...opt}) => T.verify(r, secret, opt);
var y =
  (r = {}) =>
  (e, t, s) => {
    let o = e.headers.authorization;
    if (!o) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!o.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let n = o.split(' ')[1];
    if (!n) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let a = x(n, r);
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
      let {secret: h, expiresIn: c, algorithm: l, issuer: u} = t;
      y({secret: h, expiresIn: c, algorithm: l, issuer: u})(s, o, n);
    },
  w = H;
var v = ['x-powered-by', 'server'],
  g = (r, e) => {
    let t = new Headers(r);
    return (headersToRemove.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  A = r => {
    let e = new Headers(r);
    return (
      v.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var R = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  $ = r => (R(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  P = (r, e) => $(r).map(t => ((t.prefix = `${e}${t.prefix ?? `/${t.name}`}`.replace('//', '/')), t)),
  d = r => (Array.isArray(r) ? r : []).filter(Boolean),
  j = (r, e) => ['/', '/health', e, ...d(r)].map(t => `${e}${t}`.replace('//', '/'));
var S = ({target: r = 'http://localhost:11434', prefix: e = '/api', ...t} = {}, s = !1) => ({
    target: r,
    pathRewrite: {[`^${e}`]: ''},
    changeOrigin: !0,
    selfHandleResponse: !1,
    onProxyReq: (o, n, a) => {
      !s && g(o.headers, r);
    },
    onProxyRes: (o, n, a) => {
      !s && A(o.headers);
    },
    onError: (o, n, a) => {
      (n.log.error({err: o}, '\u4EE3\u7406\u9519\u8BEF'), a.headersSent || a.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
    },
    ...t,
  }),
  k = (r, e) => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`, timestamp: I(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    (r.get(e, (s, o) => {
      o.status(200).json(t);
    }),
      r.get(`${e}/health`.replace('//', '/'), (s, o) => {
        o.status(200).json(t);
      }));
  },
  C = (r, e = {}, t) => {
    let {apiPrefix: s, proxys: o = [], whiteAuthKeys: n = [], whitePathList: a = [], preserve: p = !1} = e,
      i = P(o, s);
    if (!i.length) return;
    (t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: ${e.protocol}://${e.host}:${e.port}${s}`), k(r, s));
    let h = w({whiteAuthKeys: d(n), whitePathList: j(a, s), config: e});
    i.map(({prefix: c, target: l}) => {
      let u = S({prefix: c, target: l}, p);
      (r.use(c, h, E(u)), t.info(`\u2705 \u4EE3\u7406\u4E2D ${c} \u{1F449} ${l}`));
    });
  },
  m = C;
var O = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api',
    authToken: !1,
    proxys: [],
    whitePathList: ['/health'],
    algorithm: 'HS256',
    secret: process.env.JWT_SECRET || 'hy123',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'huxyApp',
  },
  f = O;
var M = (r, e) =>
    W({...f, ...r}, async (t, s, o, n) => {
      (await e?.(t, s, o, n), m(s, t, n));
    }),
  le = M,
  he = (r, e) =>
    L({...f, ...r}, async (t, s, o, n) => {
      (await e?.(t, s, o, n), m(s, t, n));
    });
export {
  m as appProxy,
  ae as checkPort,
  ee as createLogger,
  te as dateTime,
  le as default,
  ne as getDirName,
  oe as getEnvConfig,
  re as localIPs,
  q as logger,
  se as nodeArgs,
  ie as resolvePath,
  M as startApp,
  W as startServer,
  L as startStatic,
  he as startStaticApp,
};
