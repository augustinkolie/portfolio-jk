# Cahier des charges — Portfolio BTP de [NOM_DU_CLIENT]

> Document de référence pour Claude Code. Lis-le entièrement avant d'écrire la moindre ligne de code.
> Chaque décision ici est volontaire : ne la remplace pas par un choix « par défaut ».
> En cas d'ambiguïté, pose une question au lieu d'improviser.

---

## 1. Contexte et objectifs

**Client** : [NOM_DU_CLIENT], entreprise / professionnel du BTP (bâtiment, génie civil, routes, rénovation) basé en Guinée.

**Objectifs du site** :
1. Prouver la solidité et le sérieux de l'entreprise à des maîtres d'ouvrage (État, ONG, promoteurs, particuliers).
2. Montrer les réalisations de manière concrète : chiffres, lieux, photos avant/après, fiche technique.
3. Générer des demandes de devis (formulaire + WhatsApp).
4. Permettre au client de publier lui-même ses nouvelles réalisations et expériences via un espace d'administration simple, sans toucher au code.

**Contrainte majeure** : une partie importante des visiteurs navigue sur mobile avec une connexion 3G/4G instable. La performance n'est pas un bonus, c'est une exigence fonctionnelle.

---

## 2. Stack technique (imposée)

| Couche | Technologie |
|---|---|
| Backend / API | **NestJS** (dernière version stable), TypeScript strict |
| Base de données | **PostgreSQL** + **Prisma** ORM |
| Frontend public + admin | **Next.js** (App Router), TypeScript strict, rendu statique (SSG) + revalidation à la demande (ISR) |
| Styles | CSS Modules + variables CSS (design tokens). **Pas de Tailwind, pas de librairie UI (MUI, shadcn, Chakra…)** |
| Traitement d'images | **sharp** côté NestJS |
| Stockage médias | Dossier local `uploads/` en développement, stockage compatible S3 en production (abstraction via un service `StorageService`) |
| Authentification admin | JWT (access token court + refresh token en cookie httpOnly), mots de passe hachés avec **argon2** |
| Validation | `class-validator` / `class-transformer` côté API, `zod` côté frontend |
| Documentation API | Swagger (`@nestjs/swagger`) accessible uniquement en développement |

**Structure du dépôt (monorepo)** :

```
/
├── apps/
│   ├── api/        # NestJS
│   └── web/        # Next.js (site public + /admin)
├── packages/
│   └── shared/     # types TypeScript partagés (DTO, enums)
├── CAHIER_DES_CHARGES.md
└── docker-compose.yml   # PostgreSQL pour le développement
```

**Interdictions** : n'ajoute aucune dépendance non listée ici sans le justifier et demander. Pas de Framer Motion, pas de jQuery, pas de carrousel tiers, pas de librairie d'icônes complète (utiliser des SVG inline ciblés).

---

## 3. Direction artistique

### 3.1 Ce qu'il faut absolument éviter

- Le cliché BTP : bandes jaunes et noires de chantier, casques de stock photo, orange « sécurité » partout, bleu corporate fade.
- Le look template généré : dégradés violet/bleu, grille de 3 cartes identiques arrondies avec la même ombre grise, polices Inter / Roboto / Poppins, fond crème avec accent terracotta, fond presque noir avec un seul accent fluo.
- Les petits labels en CAPITALES espacées au-dessus de chaque titre.
- La numérotation décorative « 01 / 02 / 03 » sur du contenu qui n'est pas une séquence.
- Les animations « fondu + glissement vers le haut » sur chaque section et chaque carte.
- Mettre un seul mot du titre en couleur ou en italique.

### 3.2 Concept : « Le plan d'exécution »

Le site emprunte son langage visuel aux **plans techniques d'architecte et d'ingénieur** : lignes de cote, trames d'axes, cartouches, tirages bleus (cyanotypes). C'est le vocabulaire quotidien du BTP, et il communique précision et rigueur sans aucun cliché.

Les éléments graphiques ne sont pas décoratifs, ils portent de l'information :
- les **lignes de cote** indiquent de vraies dimensions (ex. « 2 400 m² », « 12 km de route ») ;
- le **cartouche** (le bloc d'information en bas à droite d'un plan) sert de fiche technique pour chaque projet ;
- la **trame d'axes** (A, B, C… / 1, 2, 3…) structure discrètement la grille de mise en page du hero et de la page À propos uniquement.

### 3.3 Palette (design tokens)

```css
:root {
  --beton:        #E4E2DD; /* fond principal, gris béton clair */
  --beton-fonce:  #C9C6BF; /* bordures, séparateurs */
  --acier:        #2A3139; /* texte principal, anthracite acier */
  --acier-doux:   #5B6570; /* texte secondaire */
  --cyanotype:    #1D4A73; /* couleur signature : bleu des tirages de plans */
  --trait-plan:   #F2F5F8; /* traits blancs sur fond cyanotype */
  --signal:       #E0A526; /* accent rare : jaune signalisation, uniquement pour CTA principal et focus */
  --blanc:        #FFFFFF;
}
```

Règles d'usage :
- Le fond `--beton` domine. Le `--cyanotype` est utilisé en **grands aplats** pour les sections fortes (hero secondaire, bloc chiffres, pied de page), avec des traits de plan blancs fins par-dessus.
- `--signal` n'apparaît **que** sur le bouton « Demander un devis » et les états de focus clavier. Jamais en décoration.
- Contraste texte minimum WCAG AA partout.

### 3.4 Typographie

Une seule famille, déclinée en largeurs contrastées :
- **Barlow Condensed** (600 et 700) pour les titres. Famille inspirée de la signalisation routière : pertinent pour le BTP. Titres très grands, interlignage serré (1.0 à 1.1).
- **Barlow** (400 et 500) pour le texte courant, interlignage 1.6, longueur de ligne max 70 caractères.
- Chiffres techniques : Barlow avec `font-variant-numeric: tabular-nums`. **Pas de police monospace.**
- Échelle typographique : ratio 1.333 (quarte), base 17px mobile / 18px desktop.
- Polices **auto-hébergées** via `next/font`, sous-ensemble latin + caractères français uniquement, `font-display: swap`.

### 3.5 Formes et matières

- Rayons de bordure : 0 à 2px maximum. Le BTP, c'est des arêtes nettes.
- Pas d'ombres floues. La hiérarchie passe par les bordures (`1px solid var(--beton-fonce)`), les aplats de couleur et l'échelle typographique.
- Photos : grandes, franches, souvent pleine largeur. Légère texture de grain uniquement sur les aplats cyanotype (SVG noise inline, pas d'image).

### 3.6 Mouvement

- **Un seul moment orchestré** : au chargement de la page d'accueil, des lignes de cote SVG se « tracent » autour de la photo du hero (animation `stroke-dashoffset`, 1,2 s), puis la cote affiche sa valeur. C'est la signature du site.
- Ailleurs, le mouvement répond uniquement aux actions de l'utilisateur : ouverture de la galerie, curseur avant/après, filtres, menu mobile.
- Tout en CSS ou avec `IntersectionObserver` natif. Respect strict de `prefers-reduced-motion` (aucune animation si activé).

### 3.7 Rédaction

- Ton direct, factuel, sûr de lui. On montre des faits (surfaces, délais, lieux), pas des adjectifs (« excellence », « passion », « leader »).
- Boutons à verbe d'action précis : « Voir le chantier », « Demander un devis », « Envoyer la demande ». Le même mot d'un bout à l'autre du parcours (bouton « Publier » → message « Projet publié »).
- Messages d'erreur clairs sur ce qui s'est passé et comment corriger, sans excuses vagues.

---

## 4. Site public : pages et contenu

### 4.1 Accueil `/`
1. **Hero** : grande photo du projet phare avec lignes de cote animées (cf. 3.6), nom de l'entreprise en Barlow Condensed très grand, une phrase de positionnement, bouton « Demander un devis » + lien « Voir les réalisations ».
2. **Bloc chiffres** sur aplat cyanotype : 3 à 4 données réelles (années d'expérience, projets livrés, m² construits, km de routes), présentées comme des cotes de plan, pas comme des cartes.
3. **Réalisations à la une** : mosaïque irrégulière (un grand projet + plusieurs plus petits), tailles décidées par le champ `enVedette` du projet.
4. **Domaines d'intervention** : liste typographique (pas de cartes à icônes), chaque domaine avec une courte description et un lien vers les projets filtrés.
5. **Méthode de travail** : étapes réelles (Étude → Conception → Exécution → Livraison). Ici la numérotation est légitime car c'est une séquence.
6. **Appel à l'action final** + coordonnées.

### 4.2 Réalisations `/realisations`
- Filtres par catégorie (Bâtiment, Génie civil, Routes & VRD, Rénovation) et par année, sans rechargement de page, avec URL synchronisée (`?categorie=routes`).
- Grille irrégulière, images avec placeholder flou (blur) pendant le chargement.
- Pagination ou « Charger plus » (12 projets par lot).

### 4.3 Détail d'un projet `/realisations/[slug]`
- Photo principale pleine largeur.
- **Cartouche technique** (inspiré du cartouche de plan) : maître d'ouvrage, lieu, année, durée des travaux, surface / linéaire, montant (optionnel, masquable), statut (livré / en cours).
- Description (texte riche limité : titres, gras, listes).
- **Curseur avant/après** si des photos « avant » existent (composant maison, accessible au clavier).
- Galerie avec visionneuse plein écran (composant maison, navigation clavier et swipe mobile).
- Liens « Projet précédent / suivant » + CTA devis.

### 4.4 Domaines d'intervention `/expertises`
Détail de chaque domaine, avec les projets associés.

### 4.5 À propos `/a-propos`
- Histoire de l'entreprise sous forme de **frise chronologique** (séquence réelle : numérotation autorisée).
- Parcours et expériences du dirigeant / de l'équipe (géré depuis l'admin).
- Moyens matériels, agréments, certifications, partenaires (logos en SVG ou WebP légers).

### 4.6 Contact `/contact`
- Formulaire : nom, téléphone (format guinéen +224 accepté), email (optionnel), type de projet, localisation du chantier, message. Protection anti-spam par champ honeypot + limitation de débit côté API.
- Bouton **WhatsApp** (lien `wa.me`) très visible : canal prioritaire en Guinée.
- Adresse, horaires, carte statique légère (image) avec lien vers Google Maps. **Pas d'iframe Google Maps chargée par défaut** (trop lourde).

### 4.7 Pages techniques
- 404 personnalisée dans le même style.
- Mentions légales.

---

## 5. Espace d'administration `/admin`

Interface sobre et efficace, même design system mais plus dense. Priorité : **simplicité pour un utilisateur non technique**, utilisable sur téléphone.

### 5.1 Authentification
- Page `/admin/connexion`. Pas d'inscription publique : le premier compte administrateur est créé par un script de seed (`npm run seed:admin`).
- Verrouillage temporaire après 5 tentatives échouées.
- Déconnexion, changement de mot de passe.

### 5.2 Tableau de bord
Nombre de projets publiés / brouillons, derniers messages de contact non lus, raccourci « Ajouter un projet ».

### 5.3 Gestion des réalisations (cœur de l'admin)
- Liste avec recherche, filtre par statut (brouillon / publié) et catégorie.
- Formulaire de création / modification : tous les champs du cartouche, description (éditeur de texte riche léger, ex. Tiptap avec un jeu d'options réduit), catégorie, année, `enVedette`, ordre d'affichage.
- **Upload de photos** : glisser-déposer multiple, prévisualisation, réordonnancement par glisser-déposer, choix de la photo principale, marquage « avant » / « après », texte alternatif obligatoire (accessibilité + SEO).
- Compression côté navigateur avant envoi (redimensionnement à 2400px max) pour économiser la bande passante du client.
- Statut brouillon / publié. La publication déclenche la revalidation des pages concernées sur Next.js.
- Suppression avec confirmation.

### 5.4 Gestion des expériences / parcours
CRUD des entrées de la frise « À propos » : période, intitulé, structure, lieu, description.

### 5.5 Gestion des domaines d'intervention
CRUD : nom, description, ordre.

### 5.6 Messages de contact
Liste, lecture, marquer comme lu / traité, lien direct pour répondre par WhatsApp ou email.

### 5.7 Paramètres du site
Chiffres clés de l'accueil, coordonnées, numéro WhatsApp, réseaux sociaux, texte de présentation.

---

## 6. Backend NestJS

### 6.1 Modules
`AuthModule`, `UsersModule`, `ProjectsModule`, `CategoriesModule`, `ExpertisesModule`, `ExperiencesModule`, `MediaModule`, `MessagesModule`, `SettingsModule`, `RevalidationModule`.

### 6.2 Modèle de données (Prisma, à affiner)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  order    Int       @default(0)
  projects Project[]
}

model Project {
  id            String        @id @default(cuid())
  title         String
  slug          String        @unique
  summary       String
  description   String        // HTML nettoyé côté serveur
  client        String?
  location      String
  year          Int
  duration      String?
  size          String?       // ex. "2 400 m²", "12 km"
  budget        String?
  showBudget    Boolean       @default(false)
  status        ProjectStatus @default(DELIVERED)
  featured      Boolean       @default(false)
  published     Boolean       @default(false)
  order         Int           @default(0)
  category      Category      @relation(fields: [categoryId], references: [id])
  categoryId    String
  media         Media[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Media {
  id        String    @id @default(cuid())
  project   Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String?
  alt       String
  kind      MediaKind @default(GALLERY) // COVER, GALLERY, BEFORE, AFTER
  order     Int       @default(0)
  width     Int
  height    Int
  blurData  String    // placeholder base64 très léger
  variants  Json      // URLs des tailles générées (avif + webp)
}

model Experience {
  id          String  @id @default(cuid())
  period      String
  title       String
  organization String?
  location    String?
  description String?
  order       Int     @default(0)
}

model Expertise {
  id          String @id @default(cuid())
  name        String
  slug        String @unique
  description String
  order       Int    @default(0)
}

model ContactMessage {
  id          String        @id @default(cuid())
  name        String
  phone       String
  email       String?
  projectType String?
  location    String?
  message     String
  status      MessageStatus @default(NEW)
  createdAt   DateTime      @default(now())
}

model Setting {
  key   String @id
  value Json
}

enum ProjectStatus { DELIVERED IN_PROGRESS }
enum MediaKind     { COVER GALLERY BEFORE AFTER }
enum MessageStatus { NEW READ HANDLED }
```

### 6.3 Traitement des images
À chaque upload, `MediaService` :
1. vérifie le type MIME réel (pas seulement l'extension) et la taille (15 Mo max) ;
2. supprime les métadonnées EXIF (confidentialité + poids) ;
3. génère les variantes **400, 800, 1200, 1920 px** en **AVIF et WebP** ;
4. génère un placeholder flou de moins de 1 Ko ;
5. enregistre dimensions et variantes en base.

### 6.4 API
- Routes publiques en lecture seule : `GET /projects`, `GET /projects/:slug`, `GET /categories`, `GET /expertises`, `GET /experiences`, `GET /settings/public`, `POST /contact`.
- Routes admin préfixées `/admin/*`, protégées par `JwtAuthGuard`.
- Réponses publiques mises en cache (en-têtes `Cache-Control` adaptés).
- Pagination, filtres et tri gérés côté API.

### 6.5 Sécurité
`helmet`, CORS limité au domaine du site, `@nestjs/throttler` (limite stricte sur `/auth` et `/contact`), validation globale (`ValidationPipe` avec `whitelist` et `forbidNonWhitelisted`), nettoyage du HTML de description (sanitize), variables sensibles uniquement dans `.env` (fournir un `.env.example`).

### 6.6 Revalidation
Lors de la publication, modification ou suppression d'un projet, l'API appelle une route Next.js protégée par un secret (`/api/revalidate`) pour régénérer uniquement les pages concernées.

---

## 7. Performance (exigences mesurables)

| Indicateur | Cible (mobile, 4G simulée) |
|---|---|
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibilité, Bonnes pratiques, SEO | ≥ 95 |
| LCP | < 2,0 s |
| CLS | < 0,05 |
| INP | < 200 ms |
| JavaScript envoyé sur une page publique | < 90 Ko compressé |
| Poids total de la page d'accueil | < 900 Ko au premier chargement |

Moyens imposés :
- Pages publiques générées statiquement, revalidées à la demande.
- Composants serveur par défaut ; composants client uniquement quand l'interactivité l'exige (filtres, galerie, avant/après, formulaire).
- Images via `next/image` avec `sizes` corrects, AVIF/WebP, placeholder flou, `priority` uniquement sur l'image du hero.
- Toutes les dimensions d'images réservées (zéro décalage de mise en page).
- Polices auto-hébergées et préchargées, sous-ensembles uniquement.
- Aucun script tiers bloquant. Statistiques (si demandées plus tard) : solution légère et chargée après l'interaction.
- Code de l'admin séparé du bundle public (il ne doit jamais être chargé par un visiteur).

---

## 8. SEO et partage

- Métadonnées uniques par page (titre, description), balises Open Graph avec image générée par projet.
- `sitemap.xml` et `robots.txt` dynamiques (l'admin est exclu).
- Données structurées JSON-LD : `GeneralContractor` (ou `LocalBusiness`) sur l'accueil, `CreativeWork` / `Project` sur chaque réalisation.
- URLs lisibles en français (`/realisations/ecole-primaire-labe`).
- Langue du document : `fr`.

---

## 9. Accessibilité

- Navigation complète au clavier, focus visible (`--signal`).
- Textes alternatifs obligatoires sur toutes les images (imposé par l'admin).
- Structure de titres logique, landmarks HTML5, liens d'évitement.
- Galerie et curseur avant/après utilisables au clavier et annoncés correctement aux lecteurs d'écran.
- Responsive de 320 px à 1920 px et plus.

---

## 10. Méthode de travail pour Claude Code

Travaille **par phases**, et à la fin de chaque phase, arrête-toi, résume ce qui a été fait et attends validation :

1. **Phase 0 — Plan de design** : avant tout code, présente le système de tokens (couleurs, typo, espacements), des wireframes ASCII de l'accueil, d'une page projet et de l'admin. Relis-les par rapport à la section 3 : si un élément ressemble à un choix générique, corrige-le et explique pourquoi.
2. **Phase 1 — Socle** : monorepo, Docker PostgreSQL, Prisma, modules NestJS, authentification, seed admin.
3. **Phase 2 — API complète** : tous les modules, traitement d'images, sécurité, Swagger.
4. **Phase 3 — Design system frontend** : tokens CSS, typographie, composants de base (boutons, champs, cartouche, lignes de cote SVG).
5. **Phase 4 — Site public** : toutes les pages de la section 4.
6. **Phase 5 — Admin** : toutes les fonctions de la section 5.
7. **Phase 6 — Optimisation et contrôle** : audit Lighthouse, correction jusqu'à atteindre les cibles de la section 7, tests d'accessibilité.

Règles permanentes :
- TypeScript strict, pas de `any`.
- Code et noms de fichiers en anglais ; contenu affiché, commentaires métier et messages d'interface en français.
- Contenus de démonstration réalistes pour la Guinée (projets à Conakry, Labé, Kankan, Kindia…), jamais de « Lorem ipsum ».
- Si tu dois faire un choix non couvert par ce document, choisis ce qui sert le sujet (le BTP, la rigueur, la clarté), pas l'option par défaut, et signale-le.
- Relis-toi : avant de conclure une page, vérifie-la sur mobile (capture d'écran si possible) et retire un élément décoratif superflu.

---

## 11. Critères d'acceptation

Le projet est terminé quand :
- [ ] Le client peut se connecter, créer un projet avec photos, le publier, et le voir en ligne en moins d'une minute sans intervention technique.
- [ ] Les cibles de performance de la section 7 sont atteintes sur l'accueil, la liste des réalisations et une page projet.
- [ ] Le site est entièrement utilisable au clavier et sur un écran de 320 px.
- [ ] Aucun des éléments listés en 3.1 n'apparaît dans le site.
- [ ] Le formulaire de contact enregistre les messages et ils apparaissent dans l'admin.
- [ ] Un fichier `README.md` explique l'installation, les variables d'environnement, le seed admin et le déploiement.

---

## 12. Informations à compléter par le client

- Nom exact de l'entreprise, logo (SVG de préférence)
- Chiffres clés réels
- Liste des projets avec photos (avant/après si disponibles)
- Parcours / expériences du dirigeant
- Coordonnées, numéro WhatsApp, adresse
- Nom de domaine et hébergement souhaités