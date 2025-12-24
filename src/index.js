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
import {createProxyMiddleware as I} from 'http-proxy-middleware';
import {dateTime as $} from 'huxy-node-server';
import T from 'jsonwebtoken';
var f = (r, e = {secret, ...opt}) => T.verify(r, secret, opt);
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
      let a = f(n, r);
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
var v =
    ({whiteAuthKeys: r = [], whiteAuthPaths: e = [], config: t = {}}) =>
    (s, o, n) => {
      if (s.method === 'OPTIONS' || e.includes(s.path)) return n();
      let {authToken: a} = t;
      if (a === !1 || a === 'false') return n();
      let i = s.headers['x-huxy-auth'] || s.headers['x-api-key'];
      if ((i && i === a) || r.includes(i)) return n();
      let {secret: c, expiresIn: l, algorithm: p, issuer: h} = t;
      x({secret: c, expiresIn: l, algorithm: p, issuer: h})(s, o, n);
    },
  y = v;
var H = ['x-powered-by', 'server'],
  w = (r, e) => {
    let t = new Headers(r);
    return (headersToRemove.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  g = r => {
    let e = new Headers(r);
    return (
      H.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var R = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  E = r => (R(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  A = (r, e) => E(r).map(t => ((t.prefix = `${e}${t.prefix ?? `/${t.name}`}`.replace('//', '/')), t)),
  u = r => (Array.isArray(r) ? r : []).filter(Boolean),
  P = (r, e) => ['/', '/health', e, ...u(r)].map(t => `${e}${t}`.replace('//', '/'));
var S = ({target: r = 'http://localhost:11434', prefix: e = '/api', ...t} = {}, s = !1) => ({
    target: r,
    pathRewrite: {[`^${e}`]: ''},
    changeOrigin: !0,
    selfHandleResponse: !1,
    onProxyReq: (o, n, a) => {
      !s && w(o.headers, r);
    },
    onProxyRes: (o, n, a) => {
      !s && g(o.headers);
    },
    onError: (o, n, a) => {
      (n.log.error({err: o}, '\u4EE3\u7406\u9519\u8BEF'), a.headersSent || a.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
    },
    ...t,
  }),
  k = (r, e) => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`, timestamp: $(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    (r.get(e, (s, o) => {
      o.status(200).json(t);
    }),
      r.get(`${e}/health`.replace('//', '/'), (s, o) => {
        o.status(200).json(t);
      }));
  },
  C = (r, e = {}, t) => {
    let {apiPrefix: s, proxys: o = [], whiteAuthKeys: n = [], whitePathList: a = [], preserve: i = !1} = e,
      c = A(o, s);
    if (!c.length) return;
    (t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: http://${e.host}:${e.port}${s}`), k(r, s));
    let l = y({whiteAuthKeys: u(n), whitePathList: P(a, s), config: e});
    c.map(({prefix: p, target: h}) => {
      let j = S({prefix: p, target: h}, i);
      (r.use(p, l, I(j)), t.info(`\u2705 \u4EE3\u7406\u4E2D ${p} \u{1F449} ${h}`));
    });
  },
  d = C;
var O = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api',
    authToken: !1,
    proxys: [],
    whitePathList: ['/health'],
    algorithm: 'HS256',
    secret: process.env.JWT_SECRET || 'ah.yiru@gmail.com',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'huxyApp',
  },
  m = O;
var M = (r, e) =>
    W({...m, ...r}, async (t, s, o, n) => {
      (await e?.(t, s, o, n), d(s, t, n));
    }),
  he = M,
  le = (r, e) =>
    L({...m, ...r}, async (t, s, o, n) => {
      (await e?.(t, s, o, n), d(s, t, n));
    });
export {
  d as appProxy,
  ae as checkPort,
  ee as createLogger,
  te as dateTime,
  he as default,
  ne as getDirName,
  oe as getEnvConfig,
  re as localIPs,
  q as logger,
  se as nodeArgs,
  ie as resolvePath,
  M as startApp,
  W as startServer,
  L as startStatic,
  le as startStaticApp,
};
