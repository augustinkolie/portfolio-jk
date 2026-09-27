'use client';

import type { AdminPlanDto } from '@btp/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage } from '@/admin/lib/useAdminData';
import { PlanForm, toPlanPayload } from '@/admin/plans/PlanForm';
import { Notice, PageHeader, Panel } from '@/admin/ui';
import { ActionLink } from '@/components/ui/Button';

export default function NewPlanPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  return (
    <>
      <PageHeader title="Nouveau plan">
        <p>Étape 1 sur 2 : les informations. Les images du plan s’ajoutent juste après.</p>
      </PageHeader>
      <ActionLink href="/admin/plans">Retour aux plans</ActionLink>
      {error && <Notice tone="erreur">{error}</Notice>}
      <Panel title="Informations" id="infos">
        <PlanForm
          submitLabel="Enregistrer et ajouter les images"
          onSubmit={async (values) => {
            setError('');
            try {
              const created = await adminFetch<AdminPlanDto>('/admin/plans', { method: 'POST', json: toPlanPayload(values) });
              router.push(`/admin/plans/${created.id}?nouveau=1`);
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
