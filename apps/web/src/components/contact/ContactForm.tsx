'use client';

import { PHONE_PATTERN, type ContactRequest } from '@btp/shared';
import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { SelectField, TextArea, TextField } from '@/components/ui/Field';
import { PUBLIC_API_URL } from '@/lib/site';
import styles from './ContactForm.module.css';

const optionalText = z.string().trim().max(120).optional();

const schema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(120),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, 'Numéro non reconnu. Exemple : 622 12 34 56 ou +224 622 12 34 56.'),
  email: z.union([z.literal(''), z.email("L'adresse email n'est pas valide. Laissez le champ vide si vous n'en avez pas.")]),
  projectType: optionalText,
  location: optionalText,
  message: z
    .string()
    .trim()
    .min(10, 'Décrivez votre projet en quelques phrases (10 caractères au moins).')
    .max(5000, 'Le message est trop long (5 000 caractères au plus).'),
  website: z.string().optional(),
});

type FieldName = keyof z.infer<typeof schema>;
type Status = 'idle' | 'sending' | 'sent' | 'error';

interface ContactFormProps {
  projectTypes: string[];
}

export function ContactForm({ projectTypes }: ContactFormProps) {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName;
        next[field] ??= issue.message;
      }
      setErrors(next);
      // Focus sur le premier champ en erreur, pour le clavier et les lecteurs d'écran.
      const first = Object.keys(next)[0];
      if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    setStatus('sending');
    setServerError('');
    const body: ContactRequest = {
      ...parsed.data,
      email: parsed.data.email || undefined,
      projectType: parsed.data.projectType || undefined,
      location: parsed.data.location || undefined,
    };

    try {
      const res = await fetch(`${PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setStatus('sent');
        form.current?.reset();
        return;
      }
      if (res.status === 429) {
        setServerError(
          'Trop de demandes envoyées depuis cette connexion. Réessayez dans 15 minutes ou écrivez-nous sur WhatsApp.',
        );
      } else {
        const payload = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
        setServerError(message ?? 'La demande n’a pas pu être enregistrée. Réessayez ou écrivez-nous sur WhatsApp.');
      }
      setStatus('error');
    } catch {
      setServerError(
        'La demande n’est pas partie : la connexion semble coupée. Vérifiez votre réseau puis réessayez, ou écrivez-nous sur WhatsApp.',
      );
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.sent} role="status">
        <p className={styles.sentTitle}>Demande envoyée</p>
        <p>Nous vous rappelons au numéro indiqué pour préciser le projet.</p>
        <Button variant="trait" onClick={() => setStatus('idle')}>
          Envoyer une autre demande
        </Button>
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
        hint="Numéro guinéen, avec ou sans +224."
        error={errors.phone}
      />
      <TextField name="email" label="Email" type="email" autoComplete="email" optional error={errors.email} />
      <SelectField
        name="projectType"
        label="Type de projet"
        optional
        placeholder="Choisir…"
        options={[...projectTypes, 'Autre'].map((t) => ({ value: t, label: t }))}
        error={errors.projectType}
      />
      <TextField
        name="location"
        label="Localisation du chantier"
        hint="Ville ou quartier, ex. « Kipé, Conakry »."
        optional
        error={errors.location}
      />
      <TextArea
        name="message"
        label="Votre projet"
        hint="Nature des travaux, surface ou longueur, délai souhaité."
        error={errors.message}
      />

      {/* Champ piège : invisible et hors du parcours clavier, seuls les robots le remplissent. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="champ-website">Site web</label>
        <input id="champ-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === 'error' && (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" variant="plein" disabled={status === 'sending'} block>
        {status === 'sending' ? 'Envoi en cours…' : 'Envoyer la demande'}
      </Button>
    </form>
  );
}
