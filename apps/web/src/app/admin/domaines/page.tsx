'use client';

import type { CategoryDto, ExpertiseDto } from '@btp/shared';
import { OrderedList } from '@/admin/OrderedList';
import { useAdminData } from '@/admin/lib/useAdminData';
import { PageHeader, adminStyles as s } from '@/admin/ui';

export default function ExpertisesPage() {
  const { data: categories } = useAdminData<CategoryDto[]>('/admin/categories');
  if (!categories) return <p className={s.muted}>Chargement…</p>;

  return (
    <>
      <PageHeader title="Domaines d’intervention">
        <p>Affichés sur l’accueil et la page Expertises, dans cet ordre.</p>
      </PageHeader>
      <OrderedList<ExpertiseDto>
        endpoint="/admin/expertises"
        itemName="Domaine"
        addLabel="Ajouter un domaine"
        fields={[
          { name: 'name', label: 'Nom', hint: 'Ex. « Routes & VRD ».' },
          { name: 'description', label: 'Description', type: 'textarea', hint: 'Deux ou trois phrases factuelles.' },
          {
            name: 'categoryId',
            label: 'Catégorie de projets associée',
            type: 'select',
            optional: true,
            hint: 'Les projets de cette catégorie illustrent le domaine.',
            options: categories.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
        valueOf={(e, f) => (f === 'categoryId' ? (e.category?.id ?? '') : String(e[f as keyof ExpertiseDto] ?? ''))}
        renderItem={(e) => (
          <>
            <span className={s.rowTitle}>{e.name}</span>
            <span className={s.muted}>{e.category ? `Projets : ${e.category.name}` : 'Aucune catégorie associée'}</span>
          </>
        )}
      />
    </>
  );
}
