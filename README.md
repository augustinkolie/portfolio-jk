# Portfolio BTP

Site vitrine et espace d'administration d'une entreprise de BTP en Guinée.
Le cahier des charges complet se trouve dans [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

| Dossier | Rôle |
|---|---|
| `apps/api` | API NestJS 12 (ESM), Prisma 7, PostgreSQL |
| `apps/web` | Site public et espace d'administration `/admin`, en Next.js 16 |
| `packages/shared` | Types et constantes partagés entre l'API et le site |

## Prérequis

- Node.js 22 ou plus récent (développé avec Node 24)
- PostgreSQL 15 ou plus récent. Le plus simple est Docker (`docker compose`) ; une installation locale de PostgreSQL convient aussi.

## Installation

```bash
npm install
cp apps/api/.env.example apps/api/.env   # puis remplir les valeurs (voir ci-dessous)
npm run db:up                            # démarre PostgreSQL via Docker
npm run db:migrate                       # crée les tables
npm run seed:admin                       # crée le premier compte administrateur
npm run seed:content                     # contenu de démonstration (facultatif)
npm run dev:api                          # API sur http://localhost:4000
                                         # documentation Swagger : http://localhost:4000/docs
cp apps/web/.env.example apps/web/.env.local
npm run dev:web                          # site sur http://localhost:3000
                                         # charte graphique : http://localhost:3000/charte (développement uniquement)
```

**Sans Docker ni PostgreSQL installé** (développement uniquement) : Prisma fournit une base locale.
`npm run db:dev` la démarre en arrière-plan et affiche son adresse (`postgres://postgres:postgres@localhost:51214/template1?sslmode=disable`),
à mettre dans `DATABASE_URL` avec `DATABASE_POOL_MAX=1` (cette base ne gère qu'une connexion à la fois).
À relancer après chaque redémarrage de l'ordinateur. En production, utilisez un vrai serveur PostgreSQL.

## Variables d'environnement (`apps/api/.env`)

| Variable | Obligatoire | Description |
|---|---|---|
| `NODE_ENV` | non | `development` (défaut), `production` ou `test` |
| `PORT` | non | Port de l'API, 4000 par défaut |
| `DATABASE_URL` | oui | Chaîne de connexion PostgreSQL |
| `DATABASE_POOL_MAX` | non | Connexions simultanées, 10 par défaut (1 avec `npm run db:dev`) |
| `WEB_ORIGIN` | oui | Adresse du site Next.js, seule origine autorisée par CORS |
| `JWT_ACCESS_SECRET` | oui | Secret de signature des jetons, 32 caractères minimum |
| `JWT_ACCESS_TTL_SECONDS` | non | Durée de vie d'un access token, 900 s par défaut |
| `REFRESH_TOKEN_TTL_DAYS` | non | Durée d'une session admin, 30 jours par défaut |
| `TRUST_PROXY` | non | `1` derrière un reverse proxy, pour que la limitation de débit voie la vraie IP |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` | pour le seed | Compte créé par `npm run seed:admin` |

## Variables d'environnement du site (`apps/web/.env.local`)

| Variable | Description |
|---|---|
| `API_URL` | Adresse de l'API vue par le serveur Next.js (génération des pages) |
| `NEXT_PUBLIC_API_URL` | Adresse de l'API vue par le navigateur (filtres des réalisations, formulaire de contact) |
| `NEXT_PUBLIC_SITE_URL` | Adresse publique du site : URLs canoniques, sitemap, Open Graph |
| `REVALIDATE_SECRET` | Identique à celui de l'API : protège la route `/api/revalidate` |

Les pages publiques sont générées à partir de l'API : elle doit tourner pendant `npm run build` du site.
Une publication dans l'admin régénère seulement les pages concernées (étiquettes de cache `projects`, `project:<slug>`, `settings`…).

Au démarrage, l'API vérifie ces variables. S'il en manque une, elle refuse de démarrer et indique laquelle.

Pour générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Espace d'administration

Adresse : `http://localhost:3000/admin` (redirige vers `/admin/connexion` sans session).

| Page | Rôle |
|---|---|
| Tableau de bord | Projets publiés / brouillons, derniers messages non lus |
| Réalisations | Liste, recherche, filtres ; création en deux temps (informations, puis photos) ; publication |
| Messages | Demandes du formulaire de contact, réponse WhatsApp ou email, statut « traité » |
| Formations | Formations (AutoCAD, Revit…) : fiche, prix, prochaine session, photo de couverture, extrait vidéo |
| Inscriptions | Demandes d'inscription aux formations, suivi (nouvelle → contacté → inscrit / annulée), réponse WhatsApp |
| Plans | Plans de conception en vitrine ; filigrane « © nom de l'entreprise » ajouté automatiquement aux images ; dossier PDF (30 Mo au plus) lu sur le site dans une liseuse intégrée (pdf.js, version legacy pour les navigateurs pas à jour), sans bouton de téléchargement, la page 1 servant d'aperçu. La liseuse lit le PDF par `GET /plans/:slug/lecture` (type neutre, sans « .pdf ») : Internet Download Manager et les outils semblables capturent sinon le fichier et la liseuse reste vide |
| Parcours | Étapes de la frise « À propos » |
| Domaines | Domaines d'intervention et catégorie de projets associée |
| Paramètres | Nom, chiffres clés, coordonnées, WhatsApp, réseaux sociaux, photo et présentation du dirigeant |
| Mon compte | Changement de mot de passe, déconnexion |

Les photos sont réduites à 2 400 px dans le navigateur avant l'envoi. Le texte alternatif est obligatoire.
Les extraits vidéo des formations sont stockés tels quels (MP4 H.264 ou WebM, 80 Mo au plus, sans conversion) :
exportez-les en 720p, 1 à 3 minutes. Sur le site, la vidéo ne se télécharge qu'au clic sur « lecture ».
Le paiement des formations se fait hors site : l'admin reçoit la demande, rappelle l'élève et le passe en « Inscrit ».
Un projet ne peut être publié qu'avec au moins une photo ; la publication met à jour le site en quelques secondes.

## Compte administrateur

Il n'y a pas d'inscription publique. `npm run seed:admin` crée le compte à partir de `ADMIN_EMAIL`, `ADMIN_NAME` et `ADMIN_PASSWORD` (12 caractères minimum).
Supprimez `ADMIN_PASSWORD` du fichier `.env` une fois le compte créé. Le mot de passe se change ensuite depuis l'admin.

Après 5 tentatives de connexion échouées, le compte est verrouillé pendant 15 minutes.

## Authentification (API)

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/auth/login` | `{ email, password }` renvoie un access token ; le refresh token est posé en cookie httpOnly |
| `POST` | `/auth/refresh` | Échange le cookie contre un nouvel access token (rotation du refresh token) |
| `POST` | `/auth/logout` | Ferme la session courante |
| `GET` | `/admin/account` | Profil de l'administrateur connecté |
| `PATCH` | `/admin/account/password` | `{ currentPassword, newPassword }` ; ferme toutes les autres sessions |

Les routes `/admin/*` exigent l'en-tête `Authorization: Bearer <accessToken>`.

## Tests

```bash
npm test
```

## Déploiement

Cette section sera complétée en phase 6 (hébergement, stockage S3, reverse proxy).
En production : `NODE_ENV=production` (le cookie de session est alors marqué `Secure` et impose HTTPS), `TRUST_PROXY=1` derrière Nginx ou Caddy, et l'API et le site servis sous le même domaine racine (par exemple `api.exemple.gn` et `exemple.gn`).
