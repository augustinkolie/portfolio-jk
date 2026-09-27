'use client';

import type { AdminProjectDto, CategoryDto } from '@btp/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage, useAdminData } from '@/admin/lib/useAdminData';
import { ProjectForm, toProjectPayload } from '@/admin/projects/ProjectForm';
import { Notice, PageHeader, Panel } from '@/admin/ui';
import { ActionLink } from '@/components/ui/Button';

export default function NewProjectPage() {
  const router = useRouter();
  const { data: categories, error: loadError } = useAdminData<CategoryDto[]>('/admin/categories');
  const [error, setError] = useState('');

  return (
    <>
      <PageHeader title="Nouveau projet">
        <p>Étape 1 sur 2 : les informations. Les photos s’ajoutent juste après l’enregistrement.</p>
      </PageHeader>
      <ActionLink href="/admin/projets">Retour aux réalisations</ActionLink>
      {(error || loadError) && <Notice tone="erreur">{error || loadError}</Notice>}
      {categories && (
        <Panel title="Informations" id="infos">
          <ProjectForm
            categories={categories}
            submitLabel="Enregistrer et ajouter les photos"
            onSubmit={async (values) => {
              setError('');
              try {
                const created = await adminFetch<AdminProjectDto>('/admin/projects', {
                  method: 'POST',
                  json: toProjectPayload(values),
                });
                router.push(`/admin/projets/${created.id}?nouveau=1`);
              } catch (e) {
                setError(errorMessage(e));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        </Panel>
      )}
    </>
  );
}
