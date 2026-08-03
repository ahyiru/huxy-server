var R = Object.defineProperty;
var b = (r, e, t) => () => {
  if (t) throw t[0];
  try {
    return (r && (e = r((r = 0))), e);
  } catch (s) {
    throw ((t = [s]), s);
  }
};
var B = (r, e) => {
  for (var t in e) R(r, t, {get: e[t], enumerable: !0});
};
var H = {};
B(H, {default: () => E});
import {timingSafeEqual as $} from 'node:crypto';
function E({realm: r = 'Restricted', users: e, authorize: t, skip: s, unauthorizedResponse: u} = {}) {
  let n = o =>
      typeof s == 'function' ? s(o)
      : s instanceof RegExp ? s.test(o.path)
      : Array.isArray(s) ? s.includes(o.path)
      : !1,
    a = (o, c, p) => {
      if (typeof t == 'function') return t(o, c, p);
      if (e) {
        let f = e[o];
        return f !== void 0 && M(c, f);
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
      l = U(f);
    if (!l) return i(c, o);
    try {
      if (!(await a(l.username, l.password, o))) return i(c, o);
      ((o.basicAuthInfo = {username: l.username}), p());
    } catch {
      c.status(500).end();
    }
  };
}
var M,
  U,
  S = b(() => {
    ((M = (r, e) => {
      let t = Buffer.from(r ?? '', 'utf8'),
        s = Buffer.from(e ?? '', 'utf8');
      return t.length !== s.length ? ($(t, Buffer.alloc(t.length)), !1) : $(t, s);
    }),
      (U = r => {
        if (!r?.startsWith('Basic ')) return null;
        let e = Buffer.from(r.slice(6), 'base64').toString('utf8'),
          t = e.indexOf(':');
        return t === -1 ? null : {username: e.slice(0, t), password: e.slice(t + 1)};
      }));
  });
import {
  startServer as Y,
  startStatic as G,
  createLogger as Ae,
  dateTime as we,
  localIPs as ge,
  nodeArgs as Pe,
  getEnvConfig as Te,
  checkPort as Ie,
  getDirName as je,
  resolvePath as $e,
} from 'huxy-node-server';
import {createProxyMiddleware as _, fixRequestBody as J} from 'http-proxy-middleware';
import {dateTime as K} from 'huxy-node-server';
import O from 'jsonwebtoken';
var x = (r, {secret: e = '', ...t} = {}) => O.verify(r, e, t);
var A =
  (r = {}) =>
  (e, t, s) => {
    let u = e.headers.authorization;
    if (!u)
      return (
        e.log.error('\u8BA4\u8BC1\u5931\u8D25: \u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'),
        t.status(401).json({message: '\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F'})
      );
    if (!u.startsWith('Bearer '))
      return (
        e.log.error('\u8BA4\u8BC1\u5931\u8D25: \u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'),
        t.status(401).json({message: '\u672A\u63D0\u4F9B\u6709\u6548\u8BA4\u8BC1\u4FE1\u606F'})
      );
    let n = u.split(' ')[1];
    if (!n)
      return (
        e.log.error('\u8BA4\u8BC1\u5931\u8D25: \u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'),
        t.status(401).json({message: '\u8BBF\u95EE\u4EE4\u724C\u7F3A\u5931'})
      );
    try {
      let a = x(n, r);
      (e.log.info(a, '\u8BA4\u8BC1\u6210\u529F'), (e.user = a), s());
    } catch (a) {
      let i = a.type || a.name;
      return (
        i === 'TokenExpiredError' ?
          (e.log.error({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u4EE4\u724C\u5DF2\u8FC7\u671F'),
          t.status(401).json({message: '\u4EE4\u724C\u5DF2\u8FC7\u671F'}))
        : i === 'JsonWebTokenError' ?
          (e.log.error({ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u65E0\u6548\u7684\u4EE4\u724C'),
          t.status(403).json({message: '\u65E0\u6548\u7684\u4EE4\u724C'}))
        : i === 'AuthorizationError' ?
          (e.log.error({ip: e.ip}, `\u8BA4\u8BC1\u5931\u8D25: ${a.message}`),
          t.status(a.status).json({message: a.message}))
        : (e.log.error({err: a, ip: e.ip}, '\u8BA4\u8BC1\u5931\u8D25: \u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'),
          t.status(500).json({message: '\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF'}))
      );
    }
  };
var h = r => Object.prototype.toString.call(r).slice(8, -1).toLowerCase(),
  W = r =>
    h(r) === 'object' ? [r]
    : Array.isArray(r) ? r
    : [],
  w = (r, e) => W(r).map(t => ((t.prefix = `${e}${t.prefix ?? (t.name ? `/${t.name}` : '')}`.replace('//', '/')), t)),
  g = r => (Array.isArray(r) ? r : []).filter(Boolean),
  P = (r, e) =>
    [...new Set(['/', '/health', e, ...(Array.isArray(r) ? r : [])])]
      .filter(Boolean)
      .map(t => `${e}${t}`.replace('//', '/'));
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
var C = [
    'origin',
    'referer',
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'cf-ipcountry',
    'cf-ray',
    'x-huxy-auth',
  ],
  z = ['x-powered-by', 'server'],
  I = (r, e) => {
    let t = new Headers(r);
    return (C.forEach(s => t.delete(s)), t.set('Host', e), t.set('User-Agent', 'IHUXY-API/1.0'), t);
  },
  j = r => {
    let e = new Headers(r);
    return (
      z.forEach(t => e.delete(t)),
      e.set('Access-Control-Allow-Origin', '*'),
      e.set('X-Content-Type-Options', 'nosniff'),
      e.get('content-type')?.includes('text/event-stream') &&
        ((e['Cache-Control'] = 'no-cache, no-transform'),
        (e.Connection = 'keep-alive'),
        (e['X-Accel-Buffering'] = 'no')),
      e
    );
  };
var X = async (r, e) => {
    let t = (await Promise.resolve().then(() => (S(), H))).default;
    e.use(
      t({
        realm: 'Ihuxy Team',
        unauthorizedResponse: s => ({
          message: '\u672A\u6388\u6743\uFF0C\u8BF7\u8054\u7CFB Ihuxy \u5DE5\u4F5C\u5BA4\uFF01ah.yiru@gmail.com',
        }),
        users: {ihuxy: '123456'},
        ...r,
      }),
    );
  },
  v = X;
var L = (r, e = '/') => {
    let t = {
      status: 'OK',
      message: `API \u670D\u52A1\u5668\u8FD0\u884C\u4E2D \u{1F449} ${e}`,
      timestamp: K(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
    r.get(`${e}/health`.replace('//', '/'), (s, u) => {
      u.status(200).json(t);
    });
  },
  D = ({target: r = 'http://', prefix: e, withPrefix: t, preserve: s = !0, ...u} = {}) => ({
    target: r,
    changeOrigin: !0,
    secure: !1,
    xfwd: !0,
    ws: !0,
    followRedirects: !0,
    on: {
      proxyReq: (n, a, i) => (!s && I(n.headers, r), J(n, a, i)),
      proxyRes: (n, a, i) => {
        !s && j(n.headers);
      },
      error: (n, a, i) => {
        let o = a.url;
        !o.includes('EIO=') &&
          !o.includes('/socket.io') &&
          (a.log.error({err: n}, '\u4EE3\u7406\u9519\u8BEF'),
          i.headersSent || i.status(502).json({error: '\u7F51\u5173\u9519\u8BEF'}));
      },
    },
    ...u,
  }),
  N = async (r = {}, e, t) => {
    let {apiPrefix: s = '/', proxys: u = [], basicAuth: n} = r,
      a = w(u, s);
    if (!a.length) return !1;
    (h(n) === 'object' && (await v(n, e)),
      t.info(`\u{1F4DD} API \u63A5\u53E3\u5730\u5740: ${r.protocol}://${r.host}:${r.port}${s}`),
      a.map(({prefix: i, target: o, withPrefix: c = !0, ...p}) => {
        ((o = c ? `${o}${i}` : o),
          e.use(i, T(r), _(D({prefix: i, target: o, withPrefix: c, ...p}))),
          t.info(`\u2705 \u4EE3\u7406\u4E2D ${i} \u{1F449} ${o}`));
      }),
      L(e, s));
  },
  d = N;
var F = {
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
  m = F;
var Q = (r, e) =>
    Y({...m, ...r}, async (t, s, u, n) => {
      (await d(t, s, n), await e?.(t, s, u, n));
    }),
  Se = Q,
  ve = (r, e) =>
    G({...m, ...r}, async (t, s, u, n) => {
      (await d(t, s, n), await e?.(t, s, u, n));
    });
export {
  d as appProxy,
  Ie as checkPort,
  Ae as createLogger,
  we as dateTime,
  Se as default,
  je as getDirName,
  Te as getEnvConfig,
  ge as localIPs,
  Pe as nodeArgs,
  $e as resolvePath,
  Q as startApp,
  Y as startServer,
  G as startStatic,
  ve as startStaticApp,
};
