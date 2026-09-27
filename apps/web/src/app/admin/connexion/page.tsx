'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useAuth } from '@/admin/AuthProvider';
import { errorMessage } from '@/admin/lib/useAdminData';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import styles from './connexion.module.css';

const schema = z.object({
  email: z.email('Adresse email invalide.'),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [sending, setSending] = useState(false);

  // Déjà connecté : direction la page demandée ou le tableau de bord.
  useEffect(() => {
    if (status === 'authenticated') {
      const next = new URLSearchParams(window.location.search).get('suite');
      router.replace(next?.startsWith('/admin') ? next : '/admin');
    }
  }, [status, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as 'email' | 'password'] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setServerError('');
    setSending(true);
    try {
      await login(parsed.data.email, parsed.data.password);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <main id="contenu" className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>Connexion</h1>
        <p className={styles.lead}>Espace d’administration du site.</p>
        <TextField name="email" label="Email" type="email" autoComplete="username" error={errors.email} />
        <TextField
          name="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          error={errors.password}
        />
        {serverError && (
          <p className={styles.error} role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" variant="plein" block disabled={sending || status === 'loading'}>
          {sending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </main>
  );
}
