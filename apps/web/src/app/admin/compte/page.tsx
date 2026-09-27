'use client';

import { PASSWORD_MIN_LENGTH, type AuthResponse } from '@btp/shared';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useAuth } from '@/admin/AuthProvider';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage } from '@/admin/lib/useAdminData';
import { Notice, PageHeader, Panel, adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Saisissez votre mot de passe actuel.'),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH, `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Les deux mots de passe ne sont pas identiques.' });

type Field = 'currentPassword' | 'newPassword' | 'confirm';

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, setSession } = useAuth();
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as Field] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const session = await adminFetch<AuthResponse>('/admin/account/password', {
        method: 'PATCH',
        json: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword },
      });
      setSession(session.user, session.accessToken);
      form.reset();
      setFeedback({ tone: 'ok', text: 'Mot de passe modifié. Les autres appareils connectés ont été déconnectés.' });
    } catch (err) {
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader title="Mon compte">
        <p>
          {user?.name} · {user?.email}
        </p>
      </PageHeader>
      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

      <Panel title="Changer le mot de passe" id="mot-de-passe">
        <form className={s.form} onSubmit={onSubmit} noValidate>
          <TextField name="currentPassword" label="Mot de passe actuel" type="password" autoComplete="current-password" error={errors.currentPassword} />
          <TextField
            name="newPassword"
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            hint={`${PASSWORD_MIN_LENGTH} caractères au moins. Une phrase de plusieurs mots est facile à retenir et solide.`}
            error={errors.newPassword}
          />
          <TextField name="confirm" label="Confirmer le nouveau mot de passe" type="password" autoComplete="new-password" error={errors.confirm} />
          <div className={s.formActions}>
            <Button type="submit" variant="plein" disabled={sending}>
              {sending ? 'Modification…' : 'Changer le mot de passe'}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Déconnexion" id="deconnexion">
        <p className={s.muted}>Pensez à vous déconnecter sur un ordinateur partagé.</p>
        <div>
          <Button
            variant="trait"
            onClick={async () => {
              await logout();
              router.replace('/admin/connexion');
            }}
          >
            Se déconnecter
          </Button>
        </div>
      </Panel>
    </>
  );
}
