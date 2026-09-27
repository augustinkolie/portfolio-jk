'use client';

import type { AdminCourseDto } from '@btp/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage } from '@/admin/lib/useAdminData';
import { CourseForm, toCoursePayload } from '@/admin/training/CourseForm';
import { Notice, PageHeader, Panel } from '@/admin/ui';
import { ActionLink } from '@/components/ui/Button';

export default function NewCoursePage() {
  const router = useRouter();
  const [error, setError] = useState('');

  return (
    <>
      <PageHeader title="Nouvelle formation">
        <p>Étape 1 sur 2 : les informations. La photo de couverture et l’extrait vidéo s’ajoutent juste après.</p>
      </PageHeader>
      <ActionLink href="/admin/formations">Retour aux formations</ActionLink>
      {error && <Notice tone="erreur">{error}</Notice>}
      <Panel title="Informations" id="infos">
        <CourseForm
          submitLabel="Enregistrer et ajouter les médias"
          onSubmit={async (values) => {
            setError('');
            try {
              const created = await adminFetch<AdminCourseDto>('/admin/courses', { method: 'POST', json: toCoursePayload(values) });
              router.push(`/admin/formations/${created.id}?nouveau=1`);
            } catch (e) {
              setError(errorMessage(e));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      </Panel>
    </>
  );
}
