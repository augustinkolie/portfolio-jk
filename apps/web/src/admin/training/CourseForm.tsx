'use client';

import {
  COURSE_FORMAT_LABELS,
  COURSE_LEVEL_LABELS,
  type AdminCourseDto,
  type CourseFormat,
  type CourseLevel,
} from '@btp/shared';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { RichTextEditor } from '@/admin/RichTextEditor';
import { adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';

const schema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères.').max(160),
  software: z.string().trim().min(2, 'Indiquez le logiciel enseigné (ex. « AutoCAD »).').max(60),
  summary: z.string().trim().min(10, 'Le résumé doit contenir au moins 10 caractères.').max(300, 'Le résumé ne peut pas dépasser 300 caractères.'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  format: z.enum(['IN_PERSON', 'LIVE_ONLINE', 'BOTH']),
  duration: z.string().trim().max(60),
  location: z.string().trim().max(160),
  price: z.string().trim().max(60),
  nextSession: z.string().trim().max(120),
  order: z.coerce.number().int().min(0, 'L’ordre doit être un nombre positif.'),
  slug: z
    .string()
    .trim()
    .regex(/^([a-z0-9]+(?:-[a-z0-9]+)*)?$/, 'Seulement des minuscules, des chiffres et des tirets.')
    .optional(),
});

export type CourseFormValues = z.infer<typeof schema> & { description: string };
type Errors = Partial<Record<keyof CourseFormValues, string>>;

export function CourseForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: AdminCourseDto;
  submitLabel: string;
  onSubmit: (values: CourseFormValues) => Promise<void>;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof CourseFormValues] ??= issue.message;
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

  const options = <T extends string>(labels: Record<T, string>) =>
    (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

  return (
    <form className={s.form} onSubmit={handleSubmit} noValidate>
      <TextField name="title" label="Titre" hint="Ex. « AutoCAD 2D pour le bâtiment »." defaultValue={initial?.title} error={errors.title} />
      <TextField
        name="summary"
        label="Résumé"
        hint="Une phrase affichée dans la liste des formations (300 caractères au plus)."
        defaultValue={initial?.summary}
        error={errors.summary}
      />
      <div className={s.grid2}>
        <TextField name="software" label="Logiciel" hint="AutoCAD, Revit, Robot Structural Analysis…" defaultValue={initial?.software} error={errors.software} />
        <SelectField
          name="level"
          label="Niveau"
          options={options<CourseLevel>(COURSE_LEVEL_LABELS)}
          defaultValue={initial?.level ?? 'BEGINNER'}
        />
        <SelectField
          name="format"
          label="Format"
          options={options<CourseFormat>(COURSE_FORMAT_LABELS)}
          defaultValue={initial?.format ?? 'IN_PERSON'}
        />
        <TextField name="duration" label="Durée" hint="Ex. « 40 heures », « 4 semaines »." optional defaultValue={initial?.duration ?? ''} error={errors.duration} />
        <TextField name="location" label="Lieu des cours" hint="Ex. « Kaloum, Conakry ». Laisser vide pour une formation en ligne." optional defaultValue={initial?.location ?? ''} error={errors.location} />
        <TextField name="price" label="Prix" hint="Ex. « 1 500 000 GNF »." optional defaultValue={initial?.price ?? ''} error={errors.price} />
        <TextField name="nextSession" label="Prochaine session" hint="Ex. « Lundi 3 novembre 2026, 18 h »." optional defaultValue={initial?.nextSession ?? ''} error={errors.nextSession} />
        <TextField name="order" label="Ordre d’affichage" hint="0 = en premier." inputMode="numeric" defaultValue={initial?.order ?? 0} error={errors.order} />
      </div>

      <RichTextEditor
        id="champ-description"
        label="Programme"
        hint="Objectifs, contenu séance par séance, matériel nécessaire, prérequis."
        value={description}
        onChange={setDescription}
      />

      {initial && (
        <TextField
          name="slug"
          label="Adresse de la page"
          hint={`/formations/${initial.slug} — à changer seulement si nécessaire : les anciens liens ne marcheront plus.`}
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

export function toCoursePayload(v: CourseFormValues) {
  const blank = (x: string) => (x.trim() === '' ? null : x.trim());
  return {
    title: v.title,
    software: v.software,
    summary: v.summary,
    level: v.level,
    format: v.format,
    duration: blank(v.duration),
    location: blank(v.location),
    price: blank(v.price),
    nextSession: blank(v.nextSession),
    order: v.order,
    description: v.description,
    ...(v.slug ? { slug: v.slug } : {}),
  };
}
