// Contenu de démonstration : npm run seed:content
// Idempotent : relancer le script met à jour les entrées sans créer de doublons.
// Les projets sont créés en brouillon : ajoutez leurs photos depuis l'admin, puis publiez-les.
import { loadEnvFile } from '../config/app-config.js';
import type { Prisma } from '../generated/prisma/client.js';
import { createPrismaClient } from '../prisma/prisma.service.js';
import { DEFAULT_SETTINGS } from '../settings/settings.service.js';

const CATEGORIES = [
  { slug: 'batiment', name: 'Bâtiment' },
  { slug: 'genie-civil', name: 'Génie civil' },
  { slug: 'routes-vrd', name: 'Routes & VRD' },
  { slug: 'renovation', name: 'Rénovation' },
];

const EXPERTISES = [
  {
    slug: 'batiment',
    name: 'Bâtiment',
    category: 'batiment',
    description:
      'Écoles, logements, immeubles de bureaux et bâtiments publics, du gros œuvre aux finitions. Structures en béton armé conçues pour le climat côtier et les fortes pluies.',
  },
  {
    slug: 'genie-civil',
    name: 'Génie civil',
    category: 'genie-civil',
    description:
      'Ouvrages de franchissement, dalots, châteaux d’eau et fondations spéciales. Études de sol et notes de calcul réalisées avant chaque ouvrage.',
  },
  {
    slug: 'routes-vrd',
    name: 'Routes & VRD',
    category: 'routes-vrd',
    description:
      'Terrassement, chaussées en latérite et en enrobé, caniveaux, assainissement pluvial et réseaux enterrés en milieu urbain et rural.',
  },
  {
    slug: 'renovation',
    name: 'Rénovation',
    category: 'renovation',
    description:
      'Réhabilitation de bâtiments publics et privés : reprise de structure, étanchéité des toitures, mise aux normes électriques et sanitaires.',
  },
];

const PROJECTS: (Omit<Prisma.ProjectUncheckedCreateInput, 'categoryId'> & { category: string })[] = [
  {
    slug: 'ecole-primaire-labe',
    title: 'École primaire de Labé',
    category: 'batiment',
    summary: 'Construction d’un groupe scolaire de 12 salles de classe, bloc administratif et sanitaires.',
    description:
      '<h2>Programme</h2><p>Groupe scolaire de 12 salles de classe sur deux niveaux, bloc administratif, bibliothèque et deux blocs sanitaires séparés filles / garçons.</p><h2>Contraintes</h2><ul><li>Travaux menés pendant la saison des pluies sans arrêt de chantier.</li><li>Terrain en pente : plateformes en terrasses et murs de soutènement.</li></ul>',
    client: 'Maître d’ouvrage public',
    location: 'Labé',
    year: 2022,
    duration: '14 mois',
    size: '2 400 m²',
    status: 'DELIVERED',
    featured: true,
    order: 0,
  },
  {
    slug: 'immeuble-r5-kaloum',
    title: 'Immeuble R+5 à usage mixte, Kaloum',
    category: 'batiment',
    summary: 'Commerces en rez-de-chaussée, bureaux et logements sur cinq étages en centre-ville.',
    description:
      '<h2>Programme</h2><p>Rez-de-chaussée commercial, deux niveaux de bureaux et trois niveaux de logements. Structure poteaux-poutres en béton armé sur fondations par semelles filantes.</p><h2>Points clés</h2><ul><li>Chantier en site urbain dense : approvisionnement de nuit.</li><li>Parking en sous-sol de 18 places.</li></ul>',
    client: 'Promoteur privé',
    location: 'Kaloum, Conakry',
    year: 2021,
    duration: '22 mois',
    size: '3 800 m²',
    status: 'DELIVERED',
    featured: true,
    order: 1,
  },
  {
    slug: 'route-kankan-12-km',
    title: 'Réhabilitation de 12 km de route, préfecture de Kankan',
    category: 'routes-vrd',
    summary: 'Reprise de la chaussée, fossés maçonnés et six dalots sur un axe reliant trois villages.',
    description:
      '<h2>Travaux</h2><ul><li>Scarification et reprofilage de la chaussée existante.</li><li>Couche de base en latérite améliorée au ciment.</li><li>Fossés maçonnés sur 4 km et six dalots de franchissement.</li></ul>',
    client: 'Collectivité locale',
    location: 'Kankan',
    year: 2023,
    duration: '18 mois',
    size: '12 km',
    status: 'DELIVERED',
    featured: false,
    order: 2,
  },
  {
    slug: 'ouvrage-franchissement-kindia',
    title: 'Ouvrage de franchissement, Kindia',
    category: 'genie-civil',
    summary: 'Pont-cadre en béton armé remplaçant un passage à gué impraticable en saison des pluies.',
    description:
      '<h2>Ouvrage</h2><p>Pont-cadre à deux travées, fondé sur radier général après étude géotechnique. Garde-corps métalliques et perrés de protection des berges.</p>',
    client: 'Maître d’ouvrage public',
    location: 'Kindia',
    year: 2020,
    duration: '6 mois',
    size: '24 m de portée',
    status: 'DELIVERED',
    featured: false,
    order: 3,
  },
  {
    slug: 'assainissement-pluvial-matoto',
    title: 'Assainissement pluvial, Matoto',
    category: 'routes-vrd',
    summary: 'Collecteurs et caniveaux couverts pour mettre fin aux inondations d’un quartier.',
    description:
      '<h2>Travaux en cours</h2><ul><li>Collecteur principal en béton armé de 1,20 m de section.</li><li>Caniveaux couverts de dalles amovibles pour l’entretien.</li></ul>',
    client: 'Collectivité locale',
    location: 'Matoto, Conakry',
    year: 2024,
    duration: '10 mois',
    size: '3,2 km',
    status: 'IN_PROGRESS',
    featured: false,
    order: 4,
  },
  {
    slug: 'centre-sante-mamou',
    title: 'Réhabilitation du centre de santé de Mamou',
    category: 'renovation',
    summary: 'Reprise de toiture, réfection des réseaux et mise aux normes d’un centre de santé en activité.',
    description:
      '<h2>Travaux</h2><ul><li>Remplacement complet de la charpente et de la couverture.</li><li>Réseaux électriques et sanitaires refaits à neuf.</li><li>Phasage par aile pour maintenir les consultations.</li></ul>',
    client: 'ONG partenaire',
    location: 'Mamou',
    year: 2023,
    duration: '8 mois',
    size: '950 m²',
    status: 'DELIVERED',
    featured: false,
    order: 5,
  },
  {
    slug: 'chateau-eau-siguiri',
    title: 'Château d’eau de 300 m³, Siguiri',
    category: 'genie-civil',
    summary: 'Réservoir surélevé en béton armé alimentant un réseau de bornes-fontaines.',
    description:
      '<h2>Ouvrage</h2><p>Cuve de 300 m³ sur fût de 18 m, fondée sur radier. Essais d’étanchéité réalisés avant mise en service.</p>',
    client: 'ONG partenaire',
    location: 'Siguiri',
    year: 2022,
    duration: '9 mois',
    size: '300 m³',
    status: 'DELIVERED',
    featured: false,
    order: 6,
  },
];

const EXPERIENCES = [
  {
    period: '2011',
    title: 'Création de l’entreprise',
    location: 'Conakry',
    description: 'Premiers chantiers de maisons individuelles et de petits commerces.',
  },
  {
    period: '2015',
    title: 'Premier marché public',
    location: 'Kindia',
    description: 'Construction d’un bloc de salles de classe : premier ouvrage réceptionné par un maître d’ouvrage public.',
  },
  {
    period: '2018',
    title: 'Création du pôle Routes & VRD',
    location: 'Kankan',
    description: 'Acquisition d’une niveleuse, d’un compacteur et de deux camions-bennes.',
  },
  {
    period: '2022',
    title: 'Ouverture d’une base en Moyenne-Guinée',
    location: 'Labé',
    description: 'Dépôt de matériel et équipe permanente pour les chantiers de la région.',
  },
];

async function main(): Promise<void> {
  loadEnvFile();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL est absent de apps/api/.env.');
  const prisma = createPrismaClient(url);

  try {
    const categoryIds = new Map<string, string>();
    for (const [order, c] of CATEGORIES.entries()) {
      const row = await prisma.category.upsert({
        where: { slug: c.slug },
        create: { ...c, order },
        update: { name: c.name, order },
      });
      categoryIds.set(c.slug, row.id);
    }

    for (const [order, e] of EXPERTISES.entries()) {
      const { category, ...data } = e;
      const categoryId = categoryIds.get(category) ?? null;
      await prisma.expertise.upsert({
        where: { slug: e.slug },
        create: { ...data, order, categoryId },
        update: { ...data, order, categoryId },
      });
    }

    for (const p of PROJECTS) {
      const { category, ...data } = p;
      const categoryId = categoryIds.get(category);
      if (!categoryId) throw new Error(`Catégorie inconnue : ${category}`);
      await prisma.project.upsert({
        where: { slug: p.slug },
        create: { ...data, categoryId, published: false },
        // Ne dépublie pas un projet que l'administrateur a déjà publié.
        update: { ...data, categoryId },
      });
    }

    if ((await prisma.experience.count()) === 0) {
      await prisma.experience.createMany({ data: EXPERIENCES.map((e, order) => ({ ...e, order })) });
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      company: {
        ...DEFAULT_SETTINGS.company,
        tagline: 'Bâtiments, ouvrages et routes livrés dans les délais, partout en Guinée.',
      },
      keyFigures: [
        { value: 14, unit: 'ans', label: 'd’activité' },
        { value: 86, unit: '', label: 'projets livrés' },
        { value: 38200, unit: 'm²', label: 'construits' },
        { value: 27, unit: 'km', label: 'de routes' },
      ],
      contact: { ...DEFAULT_SETTINGS.contact, address: 'Kaloum, Conakry', hours: 'Lundi – samedi, 8 h – 17 h' },
    };
    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue },
        // Les paramètres déjà saisis dans l'admin ne sont jamais écrasés.
        update: {},
      });
    }

    console.log(
      `✓ ${CATEGORIES.length} catégories, ${EXPERTISES.length} domaines, ${PROJECTS.length} projets (brouillons), parcours et paramètres.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main();
