var b = Object.defineProperty;
var B = (r, e, t) => () => {
  if (t) throw t[0];
  try {
    return (r && (e = r((r = 0))), e);
  } catch (s) {
    throw ((t = [s]), s);
  }
};
var W = (r, e) => {
  for (var t in e) b(r, t, {get: e[t], enumerable: !0});
};
var S = {};
W(S, {default: () => H});
import {timingSafeEqual as $} from 'node:crypto';
function H({realm: r = 'Restricted', users: e, authorize: t, skip: s, unauthorizedResponse: u} = {}) {
  let n = o => (typeof s == 'function' ? s(o) : s instanceof RegExp ? s.test(o.path) : Array.isArray(s) ? s.includes(o.path) : !1),
    a = (o, c, p) => {
      if (typeof t == 'function') return t(o, c, p);
      if (e) {
        let f = e[o];
        return f !== void 0 && U(c, f);
      }
      return !1;
    },
    i = (o, c) => {
      o.set('WWW-Authenticate', `Basic realm="${r}", charset="UTF-8"`);
      let p = typeof u == 'function' ? u(c) : void 0;
      o.status(401).send(p);
    };
  return async (o, c, p) => {
    if (n(o)) return p();
    let f = o.headers['proxy-authorization'] || o.headers.authorization,
      l = X(f);
    if (!l) return i(c, o);
    try {
      if (!(await a(l.username, l.password, o))) return i(c, o);
      ((o.basicAuthInfo = {username: l.username}), p());
    } catch {
      c.status(500).end();
    }
  };
}
var U,
  X,
  v = B(() => {
    ((U = (r, e) => {
      let t = Buffer.from(r ?? '', 'utf8'),
        s = Buffer.from(e ?? '', 'utf8');
      return t.length !== s.length ? ($(t, Buffer.alloc(t.length)), !1) : $(t, s);
    }),
      (X = r => {
        if (!r?.startsWith('Basic ')) return null;
        let e = Buffer.from(r.slice(6), 'base64').toString('utf8'),
          t = e.indexOf(':');
        return t === -1 ? null : {username: e.slice(0, t), password: e.slice(t + 1)};
      }));
  });
import {
  startServer as G,
  startStatic as Q,
  createLogger as we,
  dateTime as ge,
  localIPs as Pe,
  nodeArgs as Te,
  getEnvConfig as je,
  checkPort as Ie,
  getDirName as $e,
  resolvePath as He,
} from 'huxy-node-server';
import {createProxyMiddleware as J, fixRequestBody as K} from 'http-proxy-middleware';
import {dateTime as L} from 'huxy-node-server';
import C from 'jsonwebtoken';
var x = (r, {secret: e = '', ...t} = {}) => C.verify(r, e, t);
var A =
  (r = {}) =>
  (e, t, s) => {
    let u = e.headers.authorization;
    if (!u) return (e.log.error('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'}));
    if (!u.startsWith('Bearer '))
      return (e.log.error('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'), t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'}));
    let n = u.split(' ')[1];
    if (!n) return (e.log.error('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'), t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'}));
    try {
      let a = x(n, r);
      (e.log.info(a, '\u8BA4\u8BC1\u6210\u529F'), (e.user = a), s());
    } catch (a) {
      let i = a.type || a.name;
      return i === 'TokenExpiredError'
        ? (e.log.error({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'), t.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : i === 'JsonWebTokenError'
          ? (e.log.error({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'), t.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
          : i === 'AuthorizationError'
            ? (e.log.error({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${a.message}`), t.status(a.status).json({message: a.message}))
            : (e.log.error({err: a, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'), t.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}));
    }
  };
var h = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  O = r => (h(r) === 'object' ? [r] : Array.isArray(r) ? r : []),
  w = (r, e) => O(r).map(t => ((t.prefix = `${e}${t.prefix ?? (t.name ? `/${t.name}` : '')}`.replace('//', '/')), t)),
  g = r => (Array.isArray(r) ? r : []).filter(Boolean),
  P = (r, e) => [...new Set(['/', '/health', e, ...(Array.isArray(r) ? r : [])])].filter(Boolean).map(t => `${e}${t}`.replace('//', '/'));
var k =
    (r = {}) =>
    (e, t, s) => {
      if (e.method === 'OPTIONS') return s();
      let u = g(r.whiteAuthKeys);
      if (P(r.whitePathList, r.apiPrefix).includes(e.path)) return s();
      let {authToken: a} = r;
      if (a === !1 || a === 'false') return s();
      let i = e.headers,
        o = i['x-huxy-auth'] || i['x-api-key'] || i.authorization || '',
        c = e.query.token || o.split('Bearer ')[1];
      if ((c && c === a) || u.includes(c)) return s();
      let {secret: p, expiresIn: f, algorithm: l, issuer: y} = r;
      A({secret: p, expiresIn: f, algorithm: l, issuer: y})(e, t, s);
    },
  T = k;
var M = ['origin', 'referer', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'x-huxy-auth'],
  z = ['x-powered-by', 'server'],
  j = (r, e) => {
    let t = new Headers(r);
    return (M.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  I = r => {
    let e = new Headers(r);
    return (
      z.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') && ((e['Cache-Control'] = 'no-cache, no-transform'), (e.Connection = 'keep-alive'), (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var _ = async (r, e) => {
    let t = (await Promise.resolve().then(() => (v(), S))).default;
    e.use(
      t({realm: 'Ihuxy Team', unauthorizedResponse: s => ({message: '\u672A\u6388\u6743\uFF0C\u8BF7\u8054\u7CFB Ihuxy \u5DE5\u4F5C\u5BA4\uFF01ah.yiru@gmail.com'}), users: {ihuxy: '123456'}, ...r}),
    );
  },
  E = _;
var D = (r, e = '/') => {
    let t = {status: 'OK', message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`, timestamp: L(), uptime: process.uptime(), memoryUsage: process.memoryUsage()};
    r.get(`${e}/health`.replace('//', '/'), (s, u) => {
      u.status(200).json(t);
    });
  },
  R = 0,
  N = ({target: r = 'http://', prefix: e, withPrefix: t, preserve: s = !0, ...u} = {}) => ({
    target: r,
    changeOrigin: !0,
    secure: !1,
    xfwd: !0,
    ws: !0,
    followRedirects: !0,
    on: {
      proxyReq: (n, a, i) => (!s && j(n.headers, r), K(n, a, i)),
      proxyRes: (n, a, i) => {
        !s && I(n.headers);
      },
      error: (n, a, i) => {
        (R || ((R = 1), a.log.error({err: n}, '\u4EE3\u7406\u9519\u8BEF')), i.headersSent || i.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
      },
    },
    ...u,
  }),
  F = async (r, e = {}, t) => {
    let {apiPrefix: s = '/', proxys: u = [], basicAuth: n} = e,
      a = w(u, s);
    if (!a.length) return !1;
    (h(n) === 'object' && (await E(n, r)),
      t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: ${e.protocol}://${e.host}:${e.port}${s}`),
      a.map(({prefix: i, target: o, withPrefix: c = !0, ...p}) => {
        ((o = c ? `${o}${i}` : o), r.use(i, T(e), J(N({prefix: i, target: o, withPrefix: c, ...p}))), t.info(`\u2705 \u4EE3\u7406\u4E2D ${i} \u{1F449} ${o}`));
      }),
      D(r, s));
  },
  d = F;
var Y = {
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
  m = Y;
var V = (r, e) =>
    G({...m, ...r}, async (t, s, u, n) => {
      (await d(s, t, n), await e?.(t, s, u, n));
    }),
  Ee = V,
  Re = (r, e) =>
    Q({...m, ...r}, async (t, s, u, n) => {
      (await d(s, t, n), await e?.(t, s, u, n));
    });
export {
  d as appProxy,
  Ie as checkPort,
  we as createLogger,
  ge as dateTime,
  Ee as default,
  $e as getDirName,
  je as getEnvConfig,
  Pe as localIPs,
  Te as nodeArgs,
  He as resolvePath,
  V as startApp,
  G as startServer,
  Q as startStatic,
  Re as startStaticApp,
};
