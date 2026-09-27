'use client';

import type { ExperienceDto } from '@btp/shared';
import { OrderedList } from '@/admin/OrderedList';
import { PageHeader, adminStyles as s } from '@/admin/ui';

export default function ExperiencesPage() {
  return (
    <>
      <PageHeader title="Parcours">
        <p>Étapes de la frise « À propos », dans l’ordre chronologique.</p>
      </PageHeader>
      <OrderedList<ExperienceDto>
        endpoint="/admin/experiences"
        itemName="Étape"
        addLabel="Ajouter une étape"
        fields={[
          { name: 'period', label: 'Période', hint: 'Ex. « 2011 », « 2015 – 2018 », « Depuis 2020 ».' },
          { name: 'title', label: 'Intitulé', hint: 'Ex. « Création de l’entreprise ».' },
          { name: 'organization', label: 'Structure', optional: true },
          { name: 'location', label: 'Lieu', optional: true },
          { name: 'description', label: 'Description', type: 'textarea', optional: true },
        ]}
        valueOf={(e, f) => String(e[f as keyof ExperienceDto] ?? '')}
        renderItem={(e) => (
          <>
            <span className={s.rowTitle}>
              <span className="num">{e.period}</span> · {e.title}
            </span>
            {(e.organization || e.location) && (
              <span className={s.muted}>{[e.organization, e.location].filter(Boolean).join(' · ')}</span>
            )}
          </>
        )}
      />
    </>
  );
}
