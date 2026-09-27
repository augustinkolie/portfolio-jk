'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch, ApiError } from './client';

interface AdminData<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  setData: (data: T) => void;
}

/** Charge une ressource de l'admin ; `path` null = ne rien charger. */
export function useAdminData<T>(path: string | null): AdminData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<T>(path));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Une erreur inattendue est survenue. Réessayez.';
}
