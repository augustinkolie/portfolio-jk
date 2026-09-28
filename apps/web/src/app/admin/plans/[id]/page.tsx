'use client';

import type { AdminPlanDto, SiteSettings } from '@btp/shared';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage, useAdminData } from '@/admin/lib/useAdminData';
import { PlanDocumentManager } from '@/admin/plans/PlanDocumentManager';
import { PlanForm, toPlanPayload } from '@/admin/plans/PlanForm';
import { PhotoManager } from '@/admin/projects/PhotoManager';
import { Notice, PageHeader, Panel, Tag, adminStyles as s } from '@/admin/ui';
import { ActionLink, Button } from '@/components/ui/Button';
import styles from '../../projets/[id]/projet.module.css';

type Feedback = { tone: 'ok' | 'erreur'; text: string } | null;

export default function EditPlanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: plan, error: loadError, setData } = useAdminData<AdminPlanDto>(`/admin/plans/${id}`);
  const { data: settings } = useAdminData<SiteSettings>('/admin/settings'); // texte du filigrane
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('nouveau')) {
      setFeedback({ tone: 'ok', text: 'Plan enregistré en brouillon. Ajoutez maintenant ses images, puis publiez-le.' });
    }
  }, []);

  function show(next: Feedback) {
    setFeedback(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function setPublished(published: boolean) {
    if (!plan) return;
    setPublishing(true);
    try {
      setData(await adminFetch<AdminPlanDto>(`/admin/plans/${plan.id}`, { method: 'PATCH', json: { published } }));
      show({ tone: 'ok', text: published ? 'Plan publié. Il est visible sur le site.' : 'Plan retiré du site.' });
    } catch (e) {
      show({ tone: 'erreur', text: errorMessage(e) });
    } finally {
      setPublishing(false);
    }
  }

  async function remove() {
    if (!plan) return;
    if (!window.confirm(`Supprimer définitivement « ${plan.title} » et ses ${plan.media.length} image(s) ?`)) return;
    try {
      await adminFetch<void>(`/admin/plans/${plan.id}`, { method: 'DELETE' });
      router.push('/admin/plans');
    } catch (e) {
      show({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  if (loadError) return <Notice tone="erreur">{loadError}</Notice>;
  if (!plan) return <p className={s.muted}>Chargement…</p>;
  const hasImages = plan.media.length > 0;

  return (
    <>
      <PageHeader
        title={plan.title}
        actions={
          plan.published ? (
            <>
              <Button href={`/plans/${plan.slug}`} external variant="trait">
                Voir sur le site
              </Button>
              <Button variant="trait" onClick={() => void setPublished(false)} disabled={publishing}>
                Retirer du site
              </Button>
            </>
          ) : (
            <Button variant="plein" onClick={() => void setPublished(true)} disabled={publishing || !hasImages}>
              {publishing ? 'Publication…' : 'Publier'}
            </Button>
          )
        }
      >
        <p className={styles.status}>
          <Tag strong={plan.published}>{plan.published ? 'Publié' : 'Brouillon'}</Tag>
          {!plan.published && !hasImages && <span className={s.muted}>Ajoutez au moins une image pour pouvoir publier.</span>}
        </p>
      </PageHeader>
      <ActionLink href="/admin/plans">Retour aux plans</ActionLink>
      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

      <Panel title={`Images du plan (${plan.media.length})`} id="images">
        <PhotoManager
          owner={{ type: 'plan', id: plan.id }}
          media={plan.media}
          kinds={['COVER', 'GALLERY']}
          note="Exports du plan (JPEG ou PNG). Le filigrane « © Jérôme Kolié » est ajouté automatiquement."
          onChange={(media) => setData({ ...plan, media, cover: media.find((m) => m.kind === 'COVER') ?? media[0] ?? null })}
        />
      </Panel>

      <Panel title="Dossier PDF du plan" id="pdf">
        <PlanDocumentManager
          plan={plan}
          watermark={`© ${settings?.company.name ?? 'Jérôme Kolié'}`}
          onChange={(next) => setData({ ...plan, ...next })}
        />
      </Panel>

      <Panel title="Informations" id="infos">
        <PlanForm
          key={plan.updatedAt}
          initial={plan}
          submitLabel="Enregistrer les modifications"
          onSubmit={async (values) => {
            try {
              setData(await adminFetch<AdminPlanDto>(`/admin/plans/${plan.id}`, { method: 'PATCH', json: toPlanPayload(values) }));
              show({ tone: 'ok', text: 'Modifications enregistrées.' });
            } catch (e) {
              show({ tone: 'erreur', text: errorMessage(e) });
            }
          }}
        />
      </Panel>

      <Panel title="Supprimer le plan" id="suppression">
        <p className={s.muted}>Le plan et toutes ses images seront supprimés définitivement.</p>
        <div>
          <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove()}>
            Supprimer ce plan
          </button>
        </div>
      </Panel>
    </>
  );
}
