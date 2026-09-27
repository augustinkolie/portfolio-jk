'use client';

import type { AdminProjectDto, CategoryDto, MediaDto } from '@btp/shared';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage, useAdminData } from '@/admin/lib/useAdminData';
import { PhotoManager } from '@/admin/projects/PhotoManager';
import { ProjectForm, toProjectPayload } from '@/admin/projects/ProjectForm';
import { Notice, PageHeader, Panel, Tag, adminStyles as s } from '@/admin/ui';
import { ActionLink, Button } from '@/components/ui/Button';
import styles from './projet.module.css';

type Feedback = { tone: 'ok' | 'erreur'; text: string } | null;

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: project, error: loadError, setData } = useAdminData<AdminProjectDto>(`/admin/projects/${id}`);
  const { data: categories } = useAdminData<CategoryDto[]>('/admin/categories');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('nouveau')) {
      setFeedback({ tone: 'ok', text: 'Projet enregistré en brouillon. Ajoutez maintenant ses photos, puis publiez-le.' });
    }
  }, []);

  function show(next: Feedback) {
    setFeedback(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function setPublished(published: boolean) {
    if (!project) return;
    setPublishing(true);
    try {
      setData(await adminFetch<AdminProjectDto>(`/admin/projects/${project.id}`, { method: 'PATCH', json: { published } }));
      show({
        tone: 'ok',
        text: published ? 'Projet publié. Il est visible sur le site.' : 'Projet retiré du site. Il reste enregistré en brouillon.',
      });
    } catch (e) {
      show({ tone: 'erreur', text: errorMessage(e) });
    } finally {
      setPublishing(false);
    }
  }

  async function remove() {
    if (!project) return;
    if (!window.confirm(`Supprimer définitivement « ${project.title} » et ses ${project.media.length} photo(s) ?`)) return;
    try {
      await adminFetch<void>(`/admin/projects/${project.id}`, { method: 'DELETE' });
      router.push('/admin/projets');
    } catch (e) {
      show({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  if (loadError) return <Notice tone="erreur">{loadError}</Notice>;
  if (!project || !categories) return <p className={s.muted}>Chargement…</p>;

  const hasPhotos = project.media.length > 0;

  return (
    <>
      <PageHeader
        title={project.title}
        actions={
          project.published ? (
            <>
              <Button href={`/realisations/${project.slug}`} external variant="trait">
                Voir sur le site
              </Button>
              <Button variant="trait" onClick={() => void setPublished(false)} disabled={publishing}>
                Retirer du site
              </Button>
            </>
          ) : (
            <Button variant="plein" onClick={() => void setPublished(true)} disabled={publishing || !hasPhotos}>
              {publishing ? 'Publication…' : 'Publier'}
            </Button>
          )
        }
      >
        <p className={styles.status}>
          <Tag strong={project.published}>{project.published ? 'Publié' : 'Brouillon'}</Tag>
          {!project.published && !hasPhotos && <span className={s.muted}>Ajoutez au moins une photo pour pouvoir publier.</span>}
        </p>
      </PageHeader>
      <ActionLink href="/admin/projets">Retour aux réalisations</ActionLink>

      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

      <Panel title={`Photos (${project.media.length})`} id="photos">
        <PhotoManager
          owner={{ type: 'project', id: project.id }}
          media={project.media}
          onChange={(media: MediaDto[]) =>
            setData({ ...project, media, cover: media.find((m) => m.kind === 'COVER') ?? media[0] ?? null })
          }
        />
      </Panel>

      <Panel title="Informations" id="infos">
        <ProjectForm
          key={project.updatedAt}
          initial={project}
          categories={categories}
          submitLabel="Enregistrer les modifications"
          onSubmit={async (values) => {
            try {
              setData(
                await adminFetch<AdminProjectDto>(`/admin/projects/${project.id}`, {
                  method: 'PATCH',
                  json: toProjectPayload(values),
                }),
              );
              show({
                tone: 'ok',
                text: project.published ? 'Modifications enregistrées et visibles sur le site.' : 'Modifications enregistrées.',
              });
            } catch (e) {
              show({ tone: 'erreur', text: errorMessage(e) });
            }
          }}
        />
      </Panel>

      <Panel title="Supprimer le projet" id="suppression">
        <p className={s.muted}>Le projet et toutes ses photos seront supprimés définitivement.</p>
        <div>
          <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove()}>
            Supprimer ce projet
          </button>
        </div>
      </Panel>
    </>
  );
}
