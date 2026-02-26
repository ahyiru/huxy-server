import {
  startServer as U,
  startStatic as X,
  createLogger as se,
  dateTime as oe,
  localIPs as ae,
  nodeArgs as ne,
  getEnvConfig as ie,
  checkPort as pe,
  getDirName as ce,
  resolvePath as ue,
} from 'huxy-node-server';
import {createProxyMiddleware as S, fixRequestBody as k} from 'http-proxy-middleware';
import {dateTime as C} from 'huxy-node-server';
import j from 'jsonwebtoken';
var h = (t, {secret: e = '', ...r} = {}) => j.verify(t, e, r);
var d =
  (t = {}) =>
  (e, r, s) => {
    let i = e.headers.authorization;
    if (!i) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), r.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!i.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), r.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let a = i.split(' ')[1];
    if (!a) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), r.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let o = h(a, t);
      (e.log.info(o, '\u8BA4\u8BC1\u6210\u529F'), (e.user = o), s());
    } catch (o) {
      let n = o.type || o.name;
      return n === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), r.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : n === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), r.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : n === 'AuthorizationError'
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${o.message}`), r.status(o.status).json({message: o.message}))
            : (e.log.warn({err: o, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), r.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var $ = t => Object.prototype.toString.call(t).slice(8, -1).toLowerCase(),
  v = t => ($(t) === 'object' ? [t] : Array.isArray(t) ? t : []),
  m = (t, e) => v(t).map(r => ((r.prefix = `${e}${r.prefix ?? (r.name ? `/${r.name}` : '')}`.replace('//', '/')), r)),
  f = t => (Array.isArray(t) ? t : []).filter(Boolean),
  x = (t, e) => [...new Set(['/', '/health', e, ...(Array.isArray(t) ? t : [])])].filter(Boolean).map(r => `${e}${r}`.replace('//', '/'));
var I =
    (t = {}) =>
    (e, r, s) => {
      if (e.method === 'OPTIONS') return s();
      let i = f(t.whiteAuthKeys);
      if (x(t.whitePathList, t.apiPrefix).includes(e.path)) return s();
      let {authToken: o} = t;
      if (o === !1 || o === 'false') return s();
      let n = e.headers,
        p = n['x-huxy-auth'] || n['x-api-key'] || n.authorization?.split('Bearer ')[1];
      if ((p && p === o) || i.includes(p)) return s();
      let {secret: c, expiresIn: g, algorithm: T, issuer: H} = t;
      d({secret: c, expiresIn: g, algorithm: T, issuer: H})(e, r, s);
    },
  y = I;
var E = ['origin', 'referer', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'x-huxy-auth'],
  R = ['x-powered-by', 'server'],
  w = (t, e) => {
    let r = new Headers(t);
    return (E.forEach(s => r.delete(s)), r.set('Host', e), r.set('User-Agent', 'IHUXY-API/1.0'), r);
  },
  A = t => {
    let e = new Headers(t);
    return (
      R.forEach(r => e.delete(r)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var O = (t, e = '/') => {
    let r = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`, timestamp: C(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    t.get(`${e}/health`.replace('//', '/'), (s, i) => {
      i.status(200).json(r);
    });
  },
  P = 0,
  W = ({target: t = 'http://', prefix: e, withPrefix: r, preserve: s = !0, ...i} = {}) => ({
    target: t,
    changeOrigin: !0,
    selfHandleResponse: !1,
    on: {
      proxyReq: (a, o, n) => (!s && w(a.headers, t), k(a, o, n)),
      proxyRes: (a, o, n) => {
        !s && A(a.headers);
      },
      error: (a, o, n) => {
        (P || ((P = 1), o.log.error({err: a}, '\u4EE3\u7406\u9519\u8BEF')), n.headersSent || n.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
      },
    },
    ...i,
  }),
  B = (t, e = {}, r) => {
    let {apiPrefix: s = '/', proxys: i = []} = e,
      a = m(i, s);
    if (!a.length) return !1;
    (r.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: ${e.protocol}://${e.host}:${e.port}${s}`),
      a.map(({prefix: o, target: n, withPrefix: p = !0, ...c}) => {
        ((n = p ? `${n}${o}` : n), t.use(o, y(e), S(W({prefix: o, target: n, withPrefix: p, ...c}))), r.info(`\u2705 \u4EE3\u7406\u4E2D ${o} \u{1F449} ${n}`));
      }),
      O(t, s));
  },
  u = B;
var M = {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/',
    authToken: !1,
    proxys: [],
    whitePathList: ['/health'],
    algorithm: 'HS256',
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'huxyApp',
  },
  l = M;
var _ = (t, e) =>
    U({...l, ...t}, async (r, s, i, a) => {
      (u(s, r, a), await e?.(r, s, i, a));
    }),
  de = _,
  me = (t, e) =>
    X({...l, ...t}, async (r, s, i, a) => {
      (u(s, r, a), await e?.(r, s, i, a));
    });
export {
  u as appProxy,
  pe as checkPort,
  se as createLogger,
  oe as dateTime,
  de as default,
  ce as getDirName,
  ie as getEnvConfig,
  ae as localIPs,
  ne as nodeArgs,
  ue as resolvePath,
  _ as startApp,
  U as startServer,
  X as startStatic,
  me as startStaticApp,
};
