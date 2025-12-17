import {
  startServer as L,
  startStatic as X,
  logger as te,
  createLogger as oe,
  dateTime as re,
  localIPs as se,
  nodeArgs as ne,
  getEnvConfig as ae,
  checkPort as ie,
  getDirName as pe,
  resolvePath as ce,
} from 'huxy-node-server';
import {createProxyMiddleware as k} from 'http-proxy-middleware';
import {logger as y} from 'huxy-node-server';
import E from 'jsonwebtoken';
var d = (o, e = {secret, ...opt}) => E.verify(o, secret, opt);
var h =
  (o = {}) =>
  (e, t, a) => {
    let r = e.headers.authorization;
    if (!r) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({error: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!r.startsWith('Bearer '))
      return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({error: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let s = r.split(' ')[1];
    if (!s) return (e.log.warn('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({error: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let n = d(s, o);
      (e.log.info(n, '\u8BA4\u8BC1\u6210\u529F'), (e.user = n), a());
    } catch (n) {
      return n.name === 'TokenExpiredError'
        ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({error: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : n.name === 'JsonWebTokenError'
          ? (e.log.warn({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({error: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : n instanceof AuthorizationError
            ? (e.log.warn({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${n.message}`), t.status(n.status).json({error: n.message}))
            : (e.log.warn({err: n, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({error: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var R =
    ({whiteAuthKeys: o = [], whiteAuthPaths: e = [], jwtConfig: t = {}}) =>
    (a, r, s) => {
      if (a.method === 'OPTIONS' || e.includes(a.path)) return s();
      let n = a.headers['x-huxy-auth'] || a.headers['x-api-key'];
      if (o.includes(n)) return s();
      h(t)(a, r, s);
    },
  u = R;
var I = ['x-powered-by', 'server'],
  m = (o, e) => {
    let t = new Headers(o);
    return (headersToRemove.forEach(a => t.delete(a)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  g = o => {
    let e = new Headers(o);
    return (
      I.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var S = o => Object.prototype.toString.call(o).slice(8, -1).toLowerCase(),
  $ = o => (S(o) === 'object' ? [o] : Array.isArray(o) ? o : []),
  x = (o, e) => $(o).map(t => ((t.prefix = `${e}${t.prefix ?? `/${t.name}`}`.replace('//', '/')), t)),
  w = (o, e) => ['/', '/health', e, ...o].map(t => `${e}${t}`.replace('//', '/'));
var O = ({target: o = 'http://localhost:11434', prefix: e = '/api', ...t} = {}, a = !1) => ({
    target: o,
    pathRewrite: {[`^${e}`]: ''},
    changeOrigin: !0,
    selfHandleResponse: !1,
    onProxyReq: (r, s, n) => {
      !a && m(r.headers, o);
    },
    onProxyRes: (r, s, n) => {
      !a && g(r.headers);
    },
    onError: (r, s, n) => {
      (s.log.error({err: r}, '\u4EE3\u7406\u9519\u8BEF'), n.headersSent || n.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
    },
    ...t,
  }),
  P = (o, e, t) => {
    let a = {message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D -> ${e}`, timestamp: new Date().toISOString(), version: '1.0.0', environment: t.nodeEnv};
    (o.get(e, (r, s) => {
      s.status(200).json(a);
    }),
      o.get(`${e}/health`, (r, s) => {
        s.status(200).json(a);
      }));
  },
  W = ({proxys: o = [], whiteAuthKeys: e = [], whitePathList: t = [], preserve: a = !1} = {}, r, s, n = {}) => {
    let {apiPrefix: i} = r,
      l = x(o, i);
    if (!l.length) return;
    (y.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: http://${r.host}:${r.port}${i}`), P(s, i, r));
    let H = u({whiteAuthKeys: e, whitePathList: w(t, i), jwtConfig: n});
    l.map(({prefix: p, target: f}) => {
      P(s, p, r);
      let C = O({prefix: p, target: f}, a);
      (s.use(p, H, k(C)), y.info(`\u2705 \u4EE3\u7406\u4E2D ${p} -> ${f}`));
    });
  },
  c = W;
var M = {
    config: {port: parseInt(process.env.PORT || '2345', 10), host: process.env.HOST || 'localhost', apiPrefix: process.env.API_PREFIX || '/', authToken: 'ah.yiru@gmail.com'},
    proxyConfig: {proxys: [], whiteAuthKeys: ['ihuxy'], whitePathList: ['/health']},
    jwtConfig: {algorithm: 'HS256', secret: process.env.JWT_SECRET || 'ah.yiru@gmail.com', expiresIn: process.env.JWT_EXPIRES_IN || '30d', issuer: process.env.JWT_ISSUER || 'huxyApp'},
  },
  j = M;
var {config: A, proxyConfig: v, jwtConfig: T} = j,
  _ = ({config: o, proxyConfig: e, jwtConfig: t} = {}, a) =>
    L({...A, ...o}, (r, s, n) => {
      (c({...v, ...e}, r, s, {...T, ...t}), a?.(r, s, n));
    }),
  de = _,
  he = ({config: o, proxyConfig: e, jwtConfig: t} = {}, a) =>
    X({...A, ...o}, (r, s, n) => {
      (c({...v, ...e}, r, s, {...T, ...t}), a?.(r, s, n));
    });
export {
  ie as checkPort,
  oe as createLogger,
  re as dateTime,
  de as default,
  pe as getDirName,
  ae as getEnvConfig,
  se as localIPs,
  te as logger,
  ne as nodeArgs,
  ce as resolvePath,
  _ as startApp,
  L as startServer,
  X as startStatic,
  he as startStaticApp,
};
