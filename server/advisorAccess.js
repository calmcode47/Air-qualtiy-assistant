import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'aura_advisor';
const SESSION_SECONDS = 12 * 60 * 60;

function matches(left, right) {
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdvisorAccess(accessCode, secure) {
  const sign = (purpose, value) => createHmac('sha256', accessCode).update(`${purpose}:${value}`).digest();
  const expectedCode = accessCode ? sign('access', accessCode) : null;
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure, path: '/api' };

  function isAuthenticated(req) {
    if (!expectedCode) return false;
    const token = req.headers.cookie?.split(/;\s*/).find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
    const parts = token?.slice(SESSION_COOKIE.length + 1).match(/^(\d+)\.([a-f0-9]{64})$/);
    if (!parts || Number(parts[1]) <= Date.now()) return false;
    return matches(sign('session', parts[1]), Buffer.from(parts[2], 'hex'));
  }

  function login(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const code = req.body?.code;
    if (!expectedCode || typeof code !== 'string' || code.length > 256 || !matches(sign('access', code), expectedCode)) {
      return res.status(401).json({ error: 'The advisor access code is invalid.' });
    }

    const expires = String(Date.now() + SESSION_SECONDS * 1000);
    const token = `${expires}.${sign('session', expires).toString('hex')}`;
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_SECONDS * 1000 });
    return res.status(204).end();
  }

  function logout(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    return res.status(204).end();
  }

  return { isAuthenticated, login, logout };
}
