import {
  startServer as L,
  startStatic as U,
  logger as re,
  createLogger as se,
  dateTime as oe,
  localIPs as ae,
  nodeArgs as ne,
  getEnvConfig as ie,
  checkPort as pe,
  getDirName as ce,
  resolvePath as ue,
} from 'huxy-node-server';
import {createProxyMiddleware as k, fixRequestBody as O} from 'http-proxy-middleware';
import {dateTime as M} from 'huxy-node-server';
import $ from 'jsonwebtoken';
var x = (r, {secret: e = '', ...t} = {}) => $.verify(r, e, t);
var y =
  (r = {}) =>
  (e, t, s) => {
    let n = e.headers.authorization;
    if (!n) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!n.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let a = n.split(' ')[1];
    if (!a) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let o = x(a, r);
      (e.log.info(o, '\u8BA4\u8BC1\u6210\u529F'), (e.user = o), s());
    } catch (o) {
      let i = o.type || o.name;
      return i === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : i === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : i === 'AuthorizationError'
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${o.message}`), t.status(o.status).json({message: o.message}))
            : (e.log.warn({err: o, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var v =
    ({whiteAuthKeys: r = [], whiteAuthPaths: e = [], config: t = {}}) =>
    (s, n, a) => {
      if (s.method === 'OPTIONS' || e.includes(s.path)) return a();
      let {authToken: o} = t;
      if (o === !1 || o === 'false') return a();
      let i = s.headers,
        u = i['x-huxy-auth'] || i['x-api-key'] || i.authorization?.split('Bearer ')[1];
      if ((u && u === o) || r.includes(u)) return a();
      let {secret: c, expiresIn: p, algorithm: l, issuer: h} = t;
      y({secret: c, expiresIn: p, algorithm: l, issuer: h})(s, n, a);
    },
  w = v;
var I = ['origin', 'referer', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'x-huxy-auth'],
  R = ['x-powered-by', 'server'],
  A = (r, e) => {
    let t = new Headers(r);
    return (I.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  P = r => {
    let e = new Headers(r);
    return (
      R.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var E = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  S = r => (E(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  g = (r, e) => S(r).map(t => ((t.prefix = `${e}${t.prefix ?? (t.name ? `/${t.name}` : '')}`.replace('//', '/')), t)),
  T = r => (Array.isArray(r) ? r : []).filter(Boolean),
  j = (r, e) => [...new Set(['/', '/health', e, ...(Array.isArray(r) ? r : [])])].filter(Boolean).map(t => `${e}${t}`.replace('//', '/'));
var d = (r, e = '/') => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`, timestamp: M(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    (r.get(e, (s, n) => {
      n.status(200).json(t);
    }),
      r.get(`${e}/health`.replace('//', '/'), (s, n) => {
        n.status(200).json(t);
      }));
  },
  H = 0,
  W = ({target: r = 'http://', prefix: e, withPrefix: t, preserve: s = !0, ...n} = {}) => ({
    target: r,
    changeOrigin: !0,
    selfHandleResponse: !1,
    on: {
      proxyReq: (a, o, i) => (!s && A(a.headers, r), O(a, o, i)),
      proxyRes: (a, o, i) => {
        !s && P(a.headers);
      },
      error: (a, o, i) => {
        (H || ((H = 1), o.log.error({err: a}, '\u4EE3\u7406\u9519\u8BEF')), i.headersSent || i.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
      },
    },
    ...n,
  }),
  B = (r, e = {}, t) => {
    let {apiPrefix: s = '/', proxys: n = [], whiteAuthKeys: a = [], whitePathList: o = []} = e,
      i = g(n, s);
    if (!i.length) return;
    t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: ${e.protocol}://${e.host}:${e.port}${s}`);
    let u = w({whiteAuthKeys: T(a), whitePathList: j(o, s), config: e});
    return (
      i.map(({prefix: c, target: p, withPrefix: l = !0, ...h}) => {
        ((p = l ? `${p}${c}` : p), r.use(c, u, k(W({prefix: c, target: p, withPrefix: l, ...h}))), t.info(`\u2705 \u4EE3\u7406\u4E2D ${c} \u{1F449} ${p}`));
      }),
      !0
    );
  },
  m = B;
var C = {
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
  f = C;
var X = (r, e) =>
    L({...f, ...r}, async (t, s, n, a) => {
      let o = m(s, t, a);
      (await e?.(t, s, n, a), o && d(s, t.apiPrefix));
    }),
  he = X,
  me = (r, e) =>
    U({...f, ...r}, async (t, s, n, a) => {
      let o = m(s, t, a);
      (await e?.(t, s, n, a), d(s, t.apiPrefix), o && d(s, t.apiPrefix));
    });
export {
  m as appProxy,
  pe as checkPort,
  se as createLogger,
  oe as dateTime,
  he as default,
  ce as getDirName,
  ie as getEnvConfig,
  ae as localIPs,
  re as logger,
  ne as nodeArgs,
  ue as resolvePath,
  X as startApp,
  L as startServer,
  U as startStatic,
  me as startStaticApp,
};
