import type { AuthResponse, MediaDto } from '@btp/shared';
import { PUBLIC_API_URL } from '@/lib/site';

/**
 * Client de l'API pour l'admin (navigateur uniquement).
 * L'access token vit en mémoire ; le refresh token est un cookie httpOnly posé par l'API.
 * Un 401 déclenche un rafraîchissement de session, puis la requête est rejouée une fois.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const NETWORK_ERROR = 'Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez.';

const FALLBACK: Record<number, string> = {
  400: 'Certaines informations sont invalides. Corrigez-les puis réessayez.',
  403: 'Action non autorisée.',
  404: 'Élément introuvable. Il a peut-être été supprimé.',
  413: 'Le fichier est trop lourd.',
  429: 'Trop de tentatives. Patientez une minute avant de réessayer.',
  500: 'Erreur du serveur. Réessayez dans un instant.',
};

let accessToken: string | null = null;
let refreshing: Promise<AuthResponse | null> | null = null;
let onExpired: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Appelé quand la session ne peut pas être rafraîchie (retour à la connexion). */
export function onSessionExpired(handler: () => void): void {
  onExpired = handler;
}

function messageOf(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const m = (payload as { message: unknown }).message;
    if (Array.isArray(m) && typeof m[0] === 'string') return m[0];
    if (typeof m === 'string') return m;
  }
  return FALLBACK[status] ?? FALLBACK[500]!;
}

/** Échange le cookie de session contre un nouvel access token. Les appels simultanés sont regroupés. */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${PUBLIC_API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = (await res.json()) as AuthResponse;
      accessToken = data.accessToken;
      return data;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  json?: unknown;
}

export async function adminFetch<T>(path: string, { method = 'GET', json }: RequestOptions = {}): Promise<T> {
  const send = () =>
    fetch(`${PUBLIC_API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && !path.startsWith('/auth/')) {
      if (!(await refreshSession())) {
        onExpired?.();
        throw new ApiError(401, 'Votre session a expiré. Reconnectez-vous.');
      }
      res = await send();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, NETWORK_ERROR);
  }

  if (!res.ok) throw new ApiError(res.status, messageOf(await res.json().catch(() => null), res.status));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Fichier brut d'une route protégée (ex. PDF d'un plan en brouillon pour l'aperçu). */
export async function adminFetchBytes(path: string): Promise<ArrayBuffer> {
  const send = () =>
    fetch(`${PUBLIC_API_URL}${path}`, {
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  let res: Response;
  try {
    res = await send();
    if (res.status === 401) {
      if (!(await refreshSession())) {
        onExpired?.();
        throw new ApiError(401, 'Votre session a expiré. Reconnectez-vous.');
      }
      res = await send();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, NETWORK_ERROR);
  }
  if (!res.ok) throw new ApiError(res.status, messageOf(await res.json().catch(() => null), res.status));
  return res.arrayBuffer();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await adminFetch<AuthResponse>('/auth/login', { method: 'POST', json: { email, password } });
  accessToken = data.accessToken;
  return data;
}

export async function logout(): Promise<void> {
  try {
    await adminFetch<void>('/auth/logout', { method: 'POST' });
  } finally {
    accessToken = null;
  }
}

export interface UploadFields {
  alt: string;
  kind?: MediaDto['kind'];
  /** Élément auquel la photo est rattachée (un seul). */
  projectId?: string;
  courseId?: string;
  planId?: string;
}

/**
 * Envoi de fichier avec suivi de progression (XMLHttpRequest : fetch ne donne pas
 * l'avancement de l'envoi, précieux sur une connexion 3G). Session rafraîchie une fois si besoin.
 */
async function xhrUpload<T>(path: string, form: () => FormData, onProgress: (ratio: number) => void): Promise<T> {
  const attempt = () =>
    new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${PUBLIC_API_URL}${path}`);
      xhr.withCredentials = true;
      if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          /* réponse vide */
        }
        resolve({ status: xhr.status, body });
      };
      xhr.onerror = () => reject(new ApiError(0, NETWORK_ERROR));
      xhr.send(form());
    });

  let result = await attempt();
  if (result.status === 401) {
    if (!(await refreshSession())) {
      onExpired?.();
      throw new ApiError(401, 'Votre session a expiré. Reconnectez-vous.');
    }
    result = await attempt();
  }
  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(result.status, messageOf(result.body, result.status));
  }
  return result.body as T;
}

export function uploadMedia(file: Blob, fields: UploadFields, onProgress: (ratio: number) => void): Promise<MediaDto> {
  return xhrUpload<MediaDto>(
    '/admin/media',
    () => {
      const form = new FormData();
      form.append('file', file, 'photo.jpg');
      form.append('alt', fields.alt);
      if (fields.kind) form.append('kind', fields.kind);
      if (fields.projectId) form.append('projectId', fields.projectId);
      if (fields.courseId) form.append('courseId', fields.courseId);
      if (fields.planId) form.append('planId', fields.planId);
      return form;
    },
    onProgress,
  );
}

/** Dossier PDF d'un plan, avec son nombre de pages lu par pdf.js. */
export function uploadPlanDocument<T>(
  planId: string,
  file: File,
  pages: number | null,
  onProgress: (ratio: number) => void,
): Promise<T> {
  return xhrUpload<T>(
    `/admin/plans/${planId}/document`,
    () => {
      const form = new FormData();
      form.append('file', file, file.name);
      if (pages) form.append('pages', String(pages));
      return form;
    },
    onProgress,
  );
}

/** Extrait vidéo d'une formation (envoyé tel quel, sans conversion). */
export function uploadTeaser<T>(courseId: string, file: File, onProgress: (ratio: number) => void): Promise<T> {
  return xhrUpload<T>(
    `/admin/courses/${courseId}/teaser`,
    () => {
      const form = new FormData();
      form.append('file', file, file.name);
      return form;
    },
    onProgress,
  );
}
