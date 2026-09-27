'use client';

import type { AdminPlanDto } from '@btp/shared';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { RichTextEditor } from '@/admin/RichTextEditor';
import { adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';

const schema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères.').max(160),
  planType: z.string().trim().min(2, 'Indiquez le type (ex. « Villa », « Duplex »).').max(60),
  summary: z.string().trim().min(10, 'Le résumé doit contenir au moins 10 caractères.').max(300, 'Le résumé ne peut pas dépasser 300 caractères.'),
  levels: z.string().trim().max(30),
  surface: z.string().trim().max(40),
  bedrooms: z.string().trim().regex(/^\d{0,2}$/, 'Indiquez un nombre de chambres (ex. 4) ou laissez vide.'),
  order: z.coerce.number().int().min(0, 'L’ordre doit être un nombre positif.'),
  slug: z
    .string()
    .trim()
    .regex(/^([a-z0-9]+(?:-[a-z0-9]+)*)?$/, 'Seulement des minuscules, des chiffres et des tirets.')
    .optional(),
});

export type PlanFormValues = z.infer<typeof schema> & { description: string };
type Errors = Partial<Record<keyof PlanFormValues, string>>;

export function PlanForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: AdminPlanDto;
  submitLabel: string;
  onSubmit: (values: PlanFormValues) => Promise<void>;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof PlanFormValues] ??= issue.message;
      setErrors(next);
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await onSubmit({ ...parsed.data, description });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={s.form} onSubmit={handleSubmit} noValidate>
      <TextField name="title" label="Titre" hint="Ex. « Villa R+1, 4 chambres »." defaultValue={initial?.title} error={errors.title} />
      <TextField
        name="summary"
        label="Résumé"
        hint="Une phrase affichée dans la galerie des plans (300 caractères au plus)."
        defaultValue={initial?.summary}
        error={errors.summary}
      />
      <div className={s.grid2}>
        <TextField name="planType" label="Type" hint="Villa, Duplex, Immeuble, Commerce…" defaultValue={initial?.planType} error={errors.planType} />
        <TextField name="levels" label="Niveaux" hint="Ex. « R+1 », « R+4 »." optional defaultValue={initial?.levels ?? ''} error={errors.levels} />
        <TextField name="surface" label="Surface" hint="Ex. « 180 m² »." optional defaultValue={initial?.surface ?? ''} error={errors.surface} />
        <TextField
          name="bedrooms"
          label="Chambres"
          inputMode="numeric"
          optional
          defaultValue={initial?.bedrooms ?? ''}
          error={errors.bedrooms}
        />
        <TextField name="order" label="Ordre d’affichage" hint="0 = en premier." inputMode="numeric" defaultValue={initial?.order ?? 0} error={errors.order} />
      </div>

      <RichTextEditor
        id="champ-description"
        label="Description"
        hint="Distribution des pièces, dimensions du terrain, points forts du plan."
        value={description}
        onChange={setDescription}
      />

      {initial && (
        <TextField
          name="slug"
          label="Adresse de la page"
          hint={`/plans/${initial.slug} — à changer seulement si nécessaire.`}
          defaultValue={initial.slug}
          error={errors.slug}
        />
      )}

      <div className={s.formActions}>
        <Button type="submit" variant="plein" disabled={sending}>
          {sending ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function toPlanPayload(v: PlanFormValues) {
  const blank = (x: string) => (x.trim() === '' ? null : x.trim());
  return {
    title: v.title,
    planType: v.planType,
    summary: v.summary,
    levels: blank(v.levels),
    surface: blank(v.surface),
    bedrooms: v.bedrooms === '' ? null : Number(v.bedrooms),
    order: v.order,
    description: v.description,
    ...(v.slug ? { slug: v.slug } : {}),
  };
}
