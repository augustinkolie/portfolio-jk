'use client';

import type { KeyFigure, SiteSettings, SiteSettingsInput } from '@btp/shared';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { adminFetch, uploadMedia } from '@/admin/lib/client';
import { compressImage } from '@/admin/lib/compress';
import { errorMessage, useAdminData } from '@/admin/lib/useAdminData';
import { Notice, PageHeader, Panel, adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import styles from './parametres.module.css';

const MAX_FIGURES = 4;

export default function SettingsPage() {
  const { data, error } = useAdminData<SiteSettings>('/admin/settings');
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (error) return <Notice tone="erreur">{error}</Notice>;
  if (!form) return <p className={s.muted}>Chargement…</p>;

  /** Champ texte lié à form[section][key]. */
  function bind<S extends 'company' | 'contact' | 'social' | 'profile'>(section: S, key: keyof SiteSettings[S] & string) {
    return {
      name: `${section}.${key}`,
      value: String(form![section][key] ?? ''),
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => (f ? { ...f, [section]: { ...f[section], [key]: e.target.value } } : f)),
    };
  }

  function setFigure(i: number, patch: Partial<KeyFigure>) {
    setForm((f) => (f ? { ...f, keyFigures: f.keyFigures.map((k, j) => (j === i ? { ...k, ...patch } : k)) } : f));
  }

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !form) return;
    try {
      const blob = await compressImage(file);
      const media = await uploadMedia(blob, { alt: `Portrait de ${form.company.name}` }, setUploading);
      setForm({ ...form, profile: { ...form.profile, photoId: media.id, photo: media } });
      setFeedback({ tone: 'ok', text: 'Photo prête. Cliquez sur « Enregistrer les paramètres » pour l’afficher sur le site.' });
    } catch (err) {
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    } finally {
      setUploading(0);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload: SiteSettingsInput = {
      company: form.company,
      keyFigures: form.keyFigures.map((k) => ({ ...k, value: Number(k.value) })),
      contact: form.contact,
      social: form.social,
      profile: { role: form.profile.role, bio: form.profile.bio, photoId: form.profile.photoId },
    };
    try {
      setForm(await adminFetch<SiteSettings>('/admin/settings', { method: 'PUT', json: payload }));
      setFeedback({ tone: 'ok', text: 'Paramètres enregistrés. Le site est mis à jour.' });
    } catch (err) {
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const photo = form.profile.photo?.sources.webp[0]?.url;

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title="Paramètres du site"
        actions={
          <Button type="submit" variant="plein" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </Button>
        }
      />
      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

      <Panel title="Entreprise" id="entreprise">
        <TextField label="Nom affiché" {...bind('company', 'name')} />
        <TextField label="Phrase de positionnement" hint="Sous le nom, sur l’accueil. Des faits, pas d’adjectifs." optional {...bind('company', 'tagline')} />
        <TextArea label="Présentation (page À propos)" hint="Séparez les paragraphes par une ligne vide." optional rows={6} {...bind('company', 'description')} />
      </Panel>

      <Panel title="Dirigeant" id="dirigeant">
        <div className={styles.profile}>
          <div className={styles.portrait}>{photo ? <img src={photo} alt="" /> : <span className={s.muted}>Aucune photo</span>}</div>
          <div className={s.form}>
            <label className={styles.upload}>
              <span>{uploading > 0 ? `Envoi ${Math.round(uploading * 100)} %…` : photo ? 'Changer la photo' : 'Choisir une photo'}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onPhoto(e)} />
            </label>
            {photo && (
              <button
                type="button"
                className={`${s.linkButton} ${s.danger}`}
                onClick={() => setForm({ ...form, profile: { ...form.profile, photoId: null, photo: null } })}
              >
                Retirer la photo de l’accueil
              </button>
            )}
          </div>
        </div>
        <TextField label="Fonction" hint="Ex. « Dirigeant », « Ingénieur en génie civil »." optional {...bind('profile', 'role')} />
        <TextArea label="Présentation courte" hint="Deux ou trois phrases : formation, expérience, spécialité." optional rows={4} {...bind('profile', 'bio')} />
      </Panel>

      <Panel title="Chiffres clés de l’accueil" id="chiffres">
        <p className={s.muted}>Affichés en lignes de cote. {MAX_FIGURES} au plus, uniquement des données réelles.</p>
        {form.keyFigures.map((k, i) => (
          <fieldset key={i} className={styles.figure}>
            <legend className="sr-only">Chiffre {i + 1}</legend>
            <label className={styles.small}>
              Valeur
              <input inputMode="numeric" value={String(k.value)} onChange={(e) => setFigure(i, { value: Number(e.target.value.replace(/\s/g, '').replace(',', '.')) || 0 })} />
            </label>
            <label className={styles.small}>
              Unité
              <input value={k.unit} placeholder="ans, m², km…" onChange={(e) => setFigure(i, { unit: e.target.value })} />
            </label>
            <label className={styles.small}>
              Libellé
              <input value={k.label} placeholder="projets livrés" onChange={(e) => setFigure(i, { label: e.target.value })} />
            </label>
            <button
              type="button"
              className={`${s.linkButton} ${s.danger}`}
              onClick={() => setForm({ ...form, keyFigures: form.keyFigures.filter((_, j) => j !== i) })}
            >
              Retirer
            </button>
          </fieldset>
        ))}
        {form.keyFigures.length < MAX_FIGURES && (
          <div>
            <Button
              variant="trait"
              icon="plus"
              onClick={() => setForm({ ...form, keyFigures: [...form.keyFigures, { value: 0, unit: '', label: '' }] })}
            >
              Ajouter un chiffre
            </Button>
          </div>
        )}
      </Panel>

      <Panel title="Coordonnées" id="coordonnees">
        <div className={s.grid2}>
          <TextField label="Téléphone" type="tel" hint="Ex. +224 622 12 34 56." optional {...bind('contact', 'phone')} />
          <TextField label="WhatsApp" type="tel" hint="Numéro utilisé par tous les boutons WhatsApp." optional {...bind('contact', 'whatsapp')} />
          <TextField label="Email" type="email" optional {...bind('contact', 'email')} />
          <TextField label="Horaires" hint="Ex. « Lundi – samedi, 8 h – 17 h »." optional {...bind('contact', 'hours')} />
        </div>
        <TextField label="Adresse" optional {...bind('contact', 'address')} />
        <TextField label="Lien Google Maps" hint="Copiez le lien « Partager » de Google Maps (https://…)." optional {...bind('contact', 'mapUrl')} />
      </Panel>

      <Panel title="Réseaux sociaux" id="reseaux">
        <div className={s.grid2}>
          <TextField label="Facebook" optional {...bind('social', 'facebook')} />
          <TextField label="LinkedIn" optional {...bind('social', 'linkedin')} />
          <TextField label="Instagram" optional {...bind('social', 'instagram')} />
          <TextField label="YouTube" optional {...bind('social', 'youtube')} />
        </div>
      </Panel>

      <Button type="submit" variant="plein" disabled={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </Button>
    </form>
  );
}
