import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AxisFrame } from '@/components/plan/AxisFrame';
import { Cartouche, StatusMark } from '@/components/plan/Cartouche';
import { DimensionLine } from '@/components/plan/DimensionLine';
import { PlanSurface } from '@/components/plan/PlanSurface';
import { ActionLink, Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SelectField, TextArea, TextField } from '@/components/ui/Field';
import { Icon, type IconName } from '@/components/ui/Icon';
import styles from './charte.module.css';

export const metadata: Metadata = {
  title: 'Charte graphique',
  robots: { index: false, follow: false },
};

// Page de contrôle du design system : jamais servie en production.
const COLORS = [
  { token: '--beton', hex: '#E4E2DD', role: 'Fond principal' },
  { token: '--beton-fonce', hex: '#C9C6BF', role: 'Bordures, séparateurs' },
  { token: '--acier', hex: '#2A3139', role: 'Texte principal — 11,9:1 sur béton' },
  { token: '--acier-doux', hex: '#5B6570', role: 'Texte secondaire — 4,6:1 sur béton' },
  { token: '--cyanotype', hex: '#1D4A73', role: 'Aplats forts — texte blanc 9,2:1' },
  { token: '--trait-plan', hex: '#F2F5F8', role: 'Traits et texte sur cyanotype' },
  { token: '--signal', hex: '#E0A526', role: 'Bouton devis et focus uniquement' },
  { token: '--alerte', hex: '#8F2016', role: 'Erreurs de formulaire — 6,8:1 sur béton' },
];

const SCALE = [
  { token: '--t-5', sample: 'Nom de l’entreprise', font: 'titre' },
  { token: '--t-4', sample: 'École primaire de Labé', font: 'titre' },
  { token: '--t-3', sample: 'Réalisations', font: 'titre' },
  { token: '--t-2', sample: 'Programme des travaux', font: 'titre' },
  { token: '--t-1', sample: 'Chapô : 12 salles de classe livrées en 14 mois.', font: 'texte' },
  { token: '--t-0', sample: 'Texte courant, interlignage 1,6, 70 caractères par ligne au plus.', font: 'texte' },
  { token: '--t--1', sample: 'Légende de cote, aide de champ — 2 400 m²', font: 'texte' },
] as const;

const ICONS: IconName[] = [
  'arrow-right',
  'arrow-left',
  'chevron-left',
  'chevron-right',
  'close',
  'menu',
  'plus',
  'check',
  'phone',
  'mail',
  'map-pin',
  'whatsapp',
];

export default function ChartePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main id="contenu" className={styles.page}>
      <Container>
        <h1>Charte graphique</h1>
        <p className={styles.lead}>
          Design system « Le plan d’exécution ». Page de contrôle, visible en développement uniquement.
        </p>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="couleurs">
        <h2 id="couleurs">Couleurs</h2>
        <ul className={styles.swatches}>
          {COLORS.map((c) => (
            <li key={c.token} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(${c.token})` }} />
              <code>{c.token}</code>
              <span className="num">{c.hex}</span>
              <span className={styles.muted}>{c.role}</span>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="typo">
        <h2 id="typo">Typographie</h2>
        <ul className={styles.scale}>
          {SCALE.map((s) => (
            <li key={s.token}>
              <code className={styles.muted}>{s.token}</code>
              <p
                style={{
                  fontSize: `var(${s.token})`,
                  fontFamily: s.font === 'titre' ? 'var(--font-titre)' : 'var(--font-texte)',
                  fontWeight: s.font === 'titre' ? 700 : 400,
                  lineHeight: s.font === 'titre' ? 'var(--interligne-titre)' : undefined,
                }}
              >
                {s.sample}
              </p>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="boutons">
        <h2 id="boutons">Boutons et liens</h2>
        <div className={styles.row}>
          <Button href="/contact" variant="devis">
            Demander un devis
          </Button>
          <Button variant="plein">Envoyer la demande</Button>
          <Button variant="trait">Voir le chantier</Button>
          <Button variant="plein" disabled>
            Publier
          </Button>
          <ActionLink href="/realisations">Voir les réalisations</ActionLink>
        </div>
        <PlanSurface className={styles.planDemo}>
          <div className={styles.row}>
            <Button href="/contact" variant="devis">
              Demander un devis
            </Button>
            <Button variant="plan" icon="whatsapp">
              Écrire sur WhatsApp
            </Button>
            <ActionLink href="/realisations">Voir les réalisations</ActionLink>
          </div>
        </PlanSurface>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="champs">
        <h2 id="champs">Champs de formulaire</h2>
        <form className={styles.form}>
          <TextField name="nom" label="Nom" autoComplete="name" />
          <TextField
            name="telephone"
            label="Téléphone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            hint="Numéro guinéen, avec ou sans +224."
            defaultValue="622 12"
            error="Numéro incomplet : il faut 9 chiffres. Exemple : 622 12 34 56."
          />
          <TextField name="email" label="Email" type="email" optional autoComplete="email" />
          <SelectField
            name="type"
            label="Type de projet"
            placeholder="Choisir…"
            options={[
              { value: 'batiment', label: 'Bâtiment' },
              { value: 'genie-civil', label: 'Génie civil' },
              { value: 'routes-vrd', label: 'Routes & VRD' },
              { value: 'renovation', label: 'Rénovation' },
            ]}
          />
          <TextArea name="message" label="Votre projet" hint="Nature des travaux, surface, délai souhaité." />
        </form>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="cotes">
        <h2 id="cotes">Lignes de cote</h2>
        <div className={styles.dimDemo}>
          <DimensionLine draw>48,00 m</DimensionLine>
          <div className={styles.dimBox}>
            <div className={styles.fakePhoto}>Photo du projet</div>
            <DimensionLine orientation="vertical" draw delay={0.3}>
              22,50 m
            </DimensionLine>
          </div>
        </div>
        <PlanSurface grid className={styles.figures}>
          <DimensionLine tone="plan" size="chiffre" length={0.4}>
            14 <span className={styles.figureLabel}>ans d’activité</span>
          </DimensionLine>
          <DimensionLine tone="plan" size="chiffre" length={0.7}>
            86 <span className={styles.figureLabel}>projets livrés</span>
          </DimensionLine>
          <DimensionLine tone="plan" size="chiffre" length={1}>
            38 200 m² <span className={styles.figureLabel}>construits</span>
          </DimensionLine>
          <DimensionLine tone="plan" size="chiffre" length={0.55}>
            27 km <span className={styles.figureLabel}>de routes</span>
          </DimensionLine>
        </PlanSurface>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="cartouche">
        <h2 id="cartouche">Cartouche</h2>
        <div className={styles.cartoucheDemo}>
          <Cartouche
            title="Fiche technique"
            reference="PRJ-2022-014"
            sheet="Feuille 1/1"
            rows={[
              { label: 'Maître d’ouvrage', value: 'Maître d’ouvrage public' },
              { label: 'Lieu', value: 'Labé' },
              { label: 'Année', value: 2022 },
              { label: 'Durée', value: '14 mois' },
              { label: 'Surface', value: '2 400 m²' },
              { label: 'Montant', value: null },
              { label: 'Statut', value: <StatusMark delivered /> },
            ]}
          />
          <PlanSurface className={styles.planDemo}>
            <Cartouche
              tone="plan"
              title="Coordonnées"
              rows={[
                { label: 'Adresse', value: 'Kaloum, Conakry' },
                { label: 'Horaires', value: 'Lundi – samedi, 8 h – 17 h' },
                { label: 'Statut', value: <StatusMark delivered={false} /> },
              ]}
            />
          </PlanSurface>
        </div>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="axes">
        <h2 id="axes">Trame d’axes</h2>
        <AxisFrame columns={['A', 'B', 'C', 'D']} rows={['1', '2']}>
          <div className={styles.axisContent}>Contenu du hero ou de la page À propos</div>
        </AxisFrame>
      </Container>

      <Container as="section" className={styles.section} aria-labelledby="icones">
        <h2 id="icones">Icônes</h2>
        <ul className={styles.icons}>
          {ICONS.map((name) => (
            <li key={name}>
              <Icon name={name} size={28} />
              <code className={styles.muted}>{name}</code>
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
