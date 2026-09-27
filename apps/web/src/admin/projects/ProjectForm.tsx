'use client';

import type { AdminProjectDto, CategoryDto } from '@btp/shared';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { RichTextEditor } from '@/admin/RichTextEditor';
import { adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';

const MAX_YEAR = new Date().getFullYear() + 5;

const schema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères.').max(160),
  summary: z.string().trim().min(10, 'Le résumé doit contenir au moins 10 caractères.').max(300, 'Le résumé ne peut pas dépasser 300 caractères.'),
  categoryId: z.string().min(1, 'Choisissez une catégorie.'),
  location: z.string().trim().min(2, 'Indiquez le lieu (ex. « Kaloum, Conakry »).').max(120),
  year: z.coerce
    .number({ error: 'Indiquez une année.' })
    .int()
    .min(1950, `L'année doit être comprise entre 1950 et ${MAX_YEAR}.`)
    .max(MAX_YEAR, `L'année doit être comprise entre 1950 et ${MAX_YEAR}.`),
  client: z.string().trim().max(160),
  duration: z.string().trim().max(60),
  size: z.string().trim().max(60),
  budget: z.string().trim().max(60),
  status: z.enum(['DELIVERED', 'IN_PROGRESS']),
  order: z.coerce.number().int().min(0, 'L’ordre doit être un nombre positif.'),
  slug: z
    .string()
    .trim()
    .regex(/^([a-z0-9]+(?:-[a-z0-9]+)*)?$/, 'Seulement des minuscules, des chiffres et des tirets.')
    .optional(),
});

export type ProjectFormValues = z.infer<typeof schema> & {
  description: string;
  showBudget: boolean;
  featured: boolean;
};

type Errors = Partial<Record<keyof ProjectFormValues, string>>;

interface ProjectFormProps {
  initial?: AdminProjectDto;
  categories: CategoryDto[];
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

export function ProjectForm({ initial, categories, submitLabel, onSubmit }: ProjectFormProps) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof ProjectFormValues] ??= issue.message;
      setErrors(next);
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await onSubmit({
        ...parsed.data,
        description,
        showBudget: form.get('showBudget') === 'on',
        featured: form.get('featured') === 'on',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={s.form} onSubmit={handleSubmit} noValidate>
      <TextField name="title" label="Titre" defaultValue={initial?.title} error={errors.title} />
      <TextField
        name="summary"
        label="Résumé"
        hint="Une phrase affichée dans les listes (300 caractères au plus)."
        defaultValue={initial?.summary}
        error={errors.summary}
      />
      <div className={s.grid2}>
        <SelectField
          name="categoryId"
          label="Catégorie"
          placeholder="Choisir…"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          defaultValue={initial?.category.id ?? ''}
          error={errors.categoryId}
        />
        <SelectField
          name="status"
          label="Statut du chantier"
          options={[
            { value: 'DELIVERED', label: 'Livré' },
            { value: 'IN_PROGRESS', label: 'En cours' },
          ]}
          defaultValue={initial?.status ?? 'DELIVERED'}
        />
      </div>

      <h3>Fiche technique</h3>
      <div className={s.grid2}>
        <TextField name="client" label="Maître d’ouvrage" optional defaultValue={initial?.client ?? ''} error={errors.client} />
        <TextField name="location" label="Lieu" hint="Ex. « Kaloum, Conakry »." defaultValue={initial?.location} error={errors.location} />
        <TextField name="year" label="Année" inputMode="numeric" defaultValue={initial?.year ?? new Date().getFullYear()} error={errors.year} />
        <TextField name="duration" label="Durée des travaux" hint="Ex. « 14 mois »." optional defaultValue={initial?.duration ?? ''} error={errors.duration} />
        <TextField
          name="size"
          label="Surface ou linéaire"
          hint="Ex. « 2 400 m² », « 12 km ». Affiché en cote sur l’accueil."
          optional
          defaultValue={initial?.size ?? ''}
          error={errors.size}
        />
        <TextField name="budget" label="Montant" hint="Ex. « 4,2 milliards GNF »." optional defaultValue={initial?.budget ?? ''} error={errors.budget} />
      </div>
      <label className={s.check}>
        <input type="checkbox" name="showBudget" defaultChecked={initial?.showBudget ?? false} />
        Afficher le montant sur le site
      </label>

      <RichTextEditor
        id="champ-description"
        label="Description"
        hint="Programme, contraintes, points clés du chantier."
        value={description}
        onChange={setDescription}
      />

      <h3>Affichage</h3>
      <label className={s.check}>
        <input type="checkbox" name="featured" defaultChecked={initial?.featured ?? false} />
        En vedette : grande tuile sur l’accueil
      </label>
      <div className={s.grid2}>
        <TextField
          name="order"
          label="Ordre d’affichage"
          hint="0 = en premier. Les projets de même ordre sont triés par année."
          inputMode="numeric"
          defaultValue={initial?.order ?? 0}
          error={errors.order}
        />
        {initial && (
          <TextField
            name="slug"
            label="Adresse de la page"
            hint={`/realisations/${initial.slug} — à changer seulement si nécessaire : les anciens liens ne marcheront plus.`}
            defaultValue={initial.slug}
            error={errors.slug}
          />
        )}
      </div>

      <div className={s.formActions}>
        <Button type="submit" variant="plein" disabled={sending}>
          {sending ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Convertit les valeurs du formulaire en corps de requête pour l'API (champs vides → null). */
export function toProjectPayload(v: ProjectFormValues) {
  const blank = (x: string) => (x.trim() === '' ? null : x.trim());
  return {
    title: v.title,
    summary: v.summary,
    categoryId: v.categoryId,
    location: v.location,
    year: v.year,
    client: blank(v.client),
    duration: blank(v.duration),
    size: blank(v.size),
    budget: blank(v.budget),
    showBudget: v.showBudget,
    status: v.status,
    featured: v.featured,
    order: v.order,
    description: v.description,
    ...(v.slug ? { slug: v.slug } : {}),
  };
}
