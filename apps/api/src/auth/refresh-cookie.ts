import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_COOKIE = 'btp_refresh';

function cookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    // L'API et le site partagent le même domaine racine (api.exemple.gn / exemple.gn).
    sameSite: 'strict',
    // Le cookie n'est envoyé qu'aux routes /auth, jamais au reste de l'API.
    path: '/auth',
  };
}

export function setRefreshCookie(res: Response, token: string, maxAgeMs: number, secure: boolean): void {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(secure), maxAge: maxAgeMs });
}

export function clearRefreshCookie(res: Response, secure: boolean): void {
  res.clearCookie(REFRESH_COOKIE, cookieOptions(secure));
}

export function readRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[REFRESH_COOKIE];
}
