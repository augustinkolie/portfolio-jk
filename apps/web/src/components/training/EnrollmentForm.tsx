'use client';

import { PHONE_PATTERN, type EnrollmentRequest } from '@btp/shared';
import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import styles from '@/components/contact/ContactForm.module.css';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import { PUBLIC_API_URL } from '@/lib/site';

const schema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(120),
  phone: z.string().trim().regex(PHONE_PATTERN, 'Numéro non reconnu. Exemple : 622 12 34 56 ou +224 622 12 34 56.'),
  email: z.union([z.literal(''), z.email("L'adresse email n'est pas valide. Laissez le champ vide si vous n'en avez pas.")]),
  message: z.string().trim().max(2000, 'Le message est trop long (2 000 caractères au plus).'),
  website: z.string().optional(),
});

type Field = 'name' | 'phone' | 'email' | 'message';

/** Demande d'inscription : Jérôme Kolié rappelle pour confirmer la place et le paiement (hors site). */
export function EnrollmentForm({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as Field] ??= issue.message;
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setStatus('sending');
    const body: EnrollmentRequest = {
      courseId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      message: parsed.data.message || undefined,
      website: parsed.data.website,
    };
    try {
      const res = await fetch(`${PUBLIC_API_URL}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setStatus('sent');
        return;
      }
      if (res.status === 429) {
        setServerError('Trop de demandes envoyées depuis cette connexion. Réessayez dans 15 minutes ou écrivez sur WhatsApp.');
      } else {
        const payload = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
        setServerError(message ?? 'La demande n’a pas pu être enregistrée. Réessayez ou écrivez sur WhatsApp.');
      }
      setStatus('error');
    } catch {
      setServerError('La demande n’est pas partie : la connexion semble coupée. Vérifiez votre réseau puis réessayez.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.sent} role="status">
        <p className={styles.sentTitle}>Demande d’inscription envoyée</p>
        <p>
          Nous vous appelons au numéro indiqué pour confirmer votre place à « {courseTitle} » et vous indiquer les
          modalités de paiement.
        </p>
      </div>
    );
  }

  return (
    <form ref={form} className={styles.form} onSubmit={onSubmit} noValidate>
      <TextField name="name" label="Nom" autoComplete="name" error={errors.name} />
      <TextField
        name="phone"
        label="Téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="Numéro guinéen, avec ou sans +224. Nous vous rappelons pour confirmer."
        error={errors.phone}
      />
      <TextField name="email" label="Email" type="email" autoComplete="email" optional error={errors.email} />
      <TextArea
        name="message"
        label="Votre niveau ou vos questions"
        optional
        rows={4}
        hint="Ex. « Je débute », « J’utilise déjà AutoCAD 2D »."
        error={errors.message}
      />
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="champ-website">Site web</label>
        <input id="champ-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status === 'error' && (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      )}
      <Button type="submit" variant="plein" block disabled={status === 'sending'}>
        {status === 'sending' ? 'Envoi en cours…' : 'Demander mon inscription'}
      </Button>
    </form>
  );
}
