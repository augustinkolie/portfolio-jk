'use client';

import type { AdminCourseDto } from '@btp/shared';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage, useAdminData } from '@/admin/lib/useAdminData';
import { PhotoManager } from '@/admin/projects/PhotoManager';
import { CourseForm, toCoursePayload } from '@/admin/training/CourseForm';
import { TeaserManager } from '@/admin/training/TeaserManager';
import { Notice, PageHeader, Panel, Tag, adminStyles as s } from '@/admin/ui';
import { ActionLink, Button } from '@/components/ui/Button';
import styles from '../../projets/[id]/projet.module.css';

type Feedback = { tone: 'ok' | 'erreur'; text: string } | null;

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: course, error: loadError, setData } = useAdminData<AdminCourseDto>(`/admin/courses/${id}`);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('nouveau')) {
      setFeedback({ tone: 'ok', text: 'Formation enregistrée en brouillon. Ajoutez sa photo de couverture et son extrait vidéo, puis publiez-la.' });
    }
  }, []);

  function show(next: Feedback) {
    setFeedback(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function setPublished(published: boolean) {
    if (!course) return;
    setPublishing(true);
    try {
      setData(await adminFetch<AdminCourseDto>(`/admin/courses/${course.id}`, { method: 'PATCH', json: { published } }));
      show({ tone: 'ok', text: published ? 'Formation publiée. Elle est visible sur le site.' : 'Formation retirée du site.' });
    } catch (e) {
      show({ tone: 'erreur', text: errorMessage(e) });
    } finally {
      setPublishing(false);
    }
  }

  async function remove() {
    if (!course) return;
    const extra = course.enrollmentCount > 0 ? ` et ses ${course.enrollmentCount} demande(s) d’inscription` : '';
    if (!window.confirm(`Supprimer définitivement « ${course.title} »${extra} ?`)) return;
    try {
      await adminFetch<void>(`/admin/courses/${course.id}`, { method: 'DELETE' });
      router.push('/admin/formations');
    } catch (e) {
      show({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  if (loadError) return <Notice tone="erreur">{loadError}</Notice>;
  if (!course) return <p className={s.muted}>Chargement…</p>;
  const hasCover = course.media.length > 0;

  return (
    <>
      <PageHeader
        title={course.title}
        actions={
          course.published ? (
            <>
              <Button href={`/formations/${course.slug}`} external variant="trait">
                Voir sur le site
              </Button>
              <Button variant="trait" onClick={() => void setPublished(false)} disabled={publishing}>
                Retirer du site
              </Button>
            </>
          ) : (
            <Button variant="plein" onClick={() => void setPublished(true)} disabled={publishing || !hasCover}>
              {publishing ? 'Publication…' : 'Publier'}
            </Button>
          )
        }
      >
        <p className={styles.status}>
          <Tag strong={course.published}>{course.published ? 'Publiée' : 'Brouillon'}</Tag>
          {!course.published && !hasCover && <span className={s.muted}>Ajoutez une photo de couverture pour pouvoir publier.</span>}
        </p>
      </PageHeader>
      <ActionLink href="/admin/formations">Retour aux formations</ActionLink>
      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

      <Panel title="Photo de couverture" id="couverture">
        <PhotoManager
          owner={{ type: 'course', id: course.id }}
          media={course.media}
          kinds={['COVER', 'GALLERY']}
          note="Une image qui représente la formation (capture du logiciel, séance en salle). Elle sert aussi d’image d’attente de la vidéo."
          onChange={(media) => setData({ ...course, media, cover: media.find((m) => m.kind === 'COVER') ?? media[0] ?? null })}
        />
      </Panel>

      <Panel title="Extrait vidéo" id="video">
        <TeaserManager course={course} onChange={setData} />
      </Panel>

      <Panel title="Informations" id="infos">
        <CourseForm
          key={course.updatedAt}
          initial={course}
          submitLabel="Enregistrer les modifications"
          onSubmit={async (values) => {
            try {
              setData(await adminFetch<AdminCourseDto>(`/admin/courses/${course.id}`, { method: 'PATCH', json: toCoursePayload(values) }));
              show({ tone: 'ok', text: 'Modifications enregistrées.' });
            } catch (e) {
              show({ tone: 'erreur', text: errorMessage(e) });
            }
          }}
        />
      </Panel>

      <Panel title="Supprimer la formation" id="suppression">
        <p className={s.muted}>La formation, ses images, sa vidéo et ses demandes d’inscription seront supprimées.</p>
        <div>
          <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove()}>
            Supprimer cette formation
          </button>
        </div>
      </Panel>
    </>
  );
}
