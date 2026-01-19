import {
  startServer as U,
  startStatic as X,
  logger as se,
  createLogger as oe,
  dateTime as ae,
  localIPs as ne,
  nodeArgs as ie,
  getEnvConfig as pe,
  checkPort as ce,
  getDirName as ue,
  resolvePath as le,
} from 'huxy-node-server';
import {createProxyMiddleware as k, fixRequestBody as O} from 'http-proxy-middleware';
import {dateTime as W} from 'huxy-node-server';
import $ from 'jsonwebtoken';
var d = (r, {secret: e = '', ...t} = {}) => $.verify(r, e, t);
var m =
  (r = {}) =>
  (e, t, o) => {
    let i = e.headers.authorization;
    if (!i) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!i.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let a = i.split(' ')[1];
    if (!a) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let s = d(a, r);
      (e.log.info(s, '\u8BA4\u8BC1\u6210\u529F'), (e.user = s), o());
    } catch (s) {
      let n = s.type || s.name;
      return n === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : n === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : n === 'AuthorizationError'
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${s.message}`), t.status(s.status).json({message: s.message}))
            : (e.log.warn({err: s, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var v = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  I = r => (v(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  f = (r, e) => I(r).map(t => ((t.prefix = `${e}${t.prefix ?? (t.name ? `/${t.name}` : '')}`.replace('//', '/')), t)),
  x = r => (Array.isArray(r) ? r : []).filter(Boolean),
  y = (r, e) => [...new Set(['/', '/health', e, ...(Array.isArray(r) ? r : [])])].filter(Boolean).map(t => `${e}${t}`.replace('//', '/'));
var R =
    (r = {}) =>
    (e, t, o) => {
      if (e.method === 'OPTIONS') return o();
      let i = x(r.whiteAuthKeys);
      if (y(r.whitePathList, r.apiPrefix).includes(e.path)) return o();
      let {authToken: s} = r;
      if (s === !1 || s === 'false') return o();
      let n = e.headers,
        p = n['x-huxy-auth'] || n['x-api-key'] || n.authorization?.split('Bearer ')[1];
      if ((p && p === s) || i.includes(p)) return o();
      let {secret: u, expiresIn: T, algorithm: j, issuer: H} = r;
      m({secret: u, expiresIn: T, algorithm: j, issuer: H})(e, t, o);
    },
  w = R;
var E = ['origin', 'referer', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'x-huxy-auth'],
  S = ['x-powered-by', 'server'],
  A = (r, e) => {
    let t = new Headers(r);
    return (E.forEach(o => t.delete(o)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  P = r => {
    let e = new Headers(r);
    return (
      S.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var c = (r, e = '/') => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`, timestamp: W(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    (r.get(e, (o, i) => {
      i.status(200).json(t);
    }),
      r.get(`${e}/health`.replace('//', '/'), (o, i) => {
        i.status(200).json(t);
      }));
  },
  g = 0,
  B = ({target: r = 'http://', prefix: e, withPrefix: t, preserve: o = !0, ...i} = {}) => ({
    target: r,
    changeOrigin: !0,
    selfHandleResponse: !1,
    on: {
      proxyReq: (a, s, n) => (!o && A(a.headers, r), O(a, s, n)),
      proxyRes: (a, s, n) => {
        !o && P(a.headers);
      },
      error: (a, s, n) => {
        (g || ((g = 1), s.log.error({err: a}, '\u4EE3\u7406\u9519\u8BEF')), n.headersSent || n.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
      },
    },
    ...i,
  }),
  C = (r, e = {}, t) => {
    let {apiPrefix: o = '/', proxys: i = []} = e,
      a = f(i, o);
    if (a.length)
      return (
        t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: ${e.protocol}://${e.host}:${e.port}${o}`),
        a.map(({prefix: s, target: n, withPrefix: p = !0, ...u}) => {
          ((n = p ? `${n}${s}` : n), r.use(s, w(e), k(B({prefix: s, target: n, withPrefix: p, ...u}))), t.info(`\u2705 \u4EE3\u7406\u4E2D ${s} \u{1F449} ${n}`));
        }),
        !0
      );
  },
  l = C;
var M = {
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
  h = M;
var _ = (r, e) =>
    U({...h, ...r}, async (t, o, i, a) => {
      let s = l(o, t, a);
      (await e?.(t, o, i, a), s && c(o, t.apiPrefix));
    }),
  me = _,
  fe = (r, e) =>
    X({...h, ...r}, async (t, o, i, a) => {
      let s = l(o, t, a);
      (await e?.(t, o, i, a), c(o, t.apiPrefix), s && c(o, t.apiPrefix));
    });
export {
  l as appProxy,
  ce as checkPort,
  oe as createLogger,
  ae as dateTime,
  me as default,
  ue as getDirName,
  pe as getEnvConfig,
  ne as localIPs,
  se as logger,
  ie as nodeArgs,
  le as resolvePath,
  _ as startApp,
  U as startServer,
  X as startStatic,
  fe as startStaticApp,
};
