# DataScope · Observatoire de l’emploi data en France

Un site d’exploration des offres data et Business Analyst, avec une chaîne Python reproductible : collecte JSON, nettoyage, classification, déduplication, export et visualisation web.

**Édition initiale : échantillon Groupe BPCE.** Il ne s’agit pas d’un recensement du marché français. Les offres proviennent d’un seul groupe bancaire, à une date donnée ; leur disponibilité actuelle doit être vérifiée chez l’employeur.

Projet académique pour le M1 Management des systèmes d’information, Grenoble IAE. Compte GitHub : [bienvenue2002](https://github.com/bienvenue2002).

## Ce que le site permet

- Explorer les annonces par mot-clé, famille de métiers, région, contrat et compétence.
- Isoler les stages et alternances ou les offres en Auvergne-Rhône-Alpes.
- Comparer les mentions de compétences et la répartition géographique.
- Ouvrir une annonce détaillée, sa description, ses villes, sa référence et son lien source.
- Exporter la sélection filtrée en CSV ou JSON, avec dates et provenance.
- Lire la méthodologie et l’audit de collecte dans le site.

## Données réelles, limites explicites

L’instantané initial du **31 octobre 2026** contient :

| Étape | Volume |
|---|---:|
| Lignes téléchargées | 1 888 |
| Lignes situées en France | 1 785 |
| Lignes retenues après filtrage métier | 102 |
| Annonces uniques après regroupement par référence | 52 |
| Annonces avec champ salarial structuré renseigné | 0 |

Ces volumes sont ceux du fichier `site/data/meta.json`. Les prochaines collectes peuvent les modifier.

**Source et droit de réutilisation :** [Groupe BPCE, offres emploi publiques sur data.gouv.fr](https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques), publié sous Licence Ouverte / Open Licence 2.0.

**Export public documenté :**
<https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json>

Le script consomme cet export public sans clé. Il ne scrape pas les sites de recrutement et ne contourne aucune authentification.

L’API Offres d’emploi France Travail a été envisagée mais n’est pas intégrée à cette V1 : [sa fiche data.gouv.fr indique qu’elle n’est plus exposée en libre-service](https://www.data.gouv.fr/dataservices/api-offres-demploi). Aucune connexion France Travail n’est simulée.

## Lancer le projet

Pré-requis : Python 3.10 ou plus. Le pipeline n’utilise que la bibliothèque standard.

```bash
git clone https://github.com/bienvenue2002/observatoire-emploi-data.git
cd observatoire-emploi-data
python3 -m http.server 8000 --directory site
```

Ouvrir `http://localhost:8000`. Pour un usage personnel local, le serveur Python suffit ; aucun serveur n’est nécessaire une fois le site hébergé.

Ne pas ouvrir `index.html` par double-clic : le navigateur bloque généralement la lecture JSON via `fetch()` depuis `file://`.

## Actualiser les données

```bash
# Télécharge un export JSON public et régénère les données nettoyées :
python3 scripts/collect.py

# Rejoue un téléchargement existant :
python3 scripts/collect.py --input data/raw/bpce.json \
  --observed-at 2026-10-31T01:48:12+00:00

# Vérifie les règles de transformation :
python3 -m unittest discover -s tests -v
```

Le téléchargement brut initial n’est pas versionné, car il contient des champs de contact recruteur et des postes hors périmètre. Le pipeline peut travailler entièrement en mémoire sans enregistrer le brut. Les champs nom et email recruteur ne sont pas exportés ; emails et numéros français présents dans les descriptions sont masqués par des règles simples.

La date `observed_at` doit être celle du téléchargement pour une reprise locale : l’option `--observed-at` permet de la préserver. Ce n’est pas une date de publication d’annonce.

Si la source est vide, change de schéma ou ne donne aucune annonce pertinente, le script échoue avant de remplacer les fichiers du site. Il n’introduit jamais de données fictives.

## Structure du dépôt

```text
observatoire-emploi-data/
├── scripts/
│   └── collect.py             # Collecte et transformations Python
├── tests/
│   └── test_collect.py        # Tests unitaires, hors réseau
├── site/                      # Seul dossier à héberger
│   ├── index.html             # HTML sémantique, contenu et méthodologie
│   ├── base.css
│   ├── style.css              # Mise en page responsive
│   ├── app.js                 # Filtres, agrégations, exports, détails
│   └── data/
│       ├── jobs.json          # Annonces nettoyées et métadonnées
│       ├── jobs.csv           # Export complet
│       └── meta.json          # Audit du dernier instantané
├── docs/
│   ├── METHODOLOGIE.md
│   └── GUIDE_PEDAGOGIQUE.md
├── .github/workflows/ci.yml   # Tests sur push et pull request
└── README.md
```

## Choix techniques

- **HTML5 / CSS3 :** structure sémantique, formulaires étiquetés, navigation clavier, responsive mobile.
- **Python :** `urllib.request`, `json`, `csv`, `re`, `datetime`, tests `unittest`.
- **JavaScript natif :** filtre les données localement et met à jour les comptes, sans dépendance de framework.
- **Graphiques HTML/CSS :** barres interactives avec libellés et chiffres lisibles, sans bibliothèque externe.
- **Site statique :** pas de backend, pas de secret à exposer, pas de base utilisateur.
- **Confidentialité :** pas de cookies, stockage navigateur, suivi analytique ou collecte de candidatures.

Les polices Manrope et IBM Plex Mono sont chargées via Google Fonts ; leurs fontes système de secours s’appliquent si le réseau est indisponible. Le fichier de données et toutes les fonctions métier sont locaux au site.

## Méthodologie en bref

Une référence = une annonce, même si elle existe dans plusieurs villes. Les statistiques de compétences comptent des annonces uniques ; les villes sont conservées pour filtrer les régions. Une annonce peut compter dans plusieurs régions : le graphique géographique n’est pas additif.

Les familles de métiers sont des classifications par règles sur le titre, pas une vérité labellisée manuellement. Les compétences sont des mentions dans les titres/descriptions, pas forcément des exigences. Aucun salaire ni niveau de télétravail n’est estimé.

Lire [la méthodologie détaillée](docs/METHODOLOGIE.md).

## Héberger

Le dossier `site/` fonctionne sur tout hébergement statique. Pour GitHub Pages, une possibilité simple est de publier les fichiers de `site/` à la racine d’une branche dédiée ou d’utiliser un workflow de déploiement Pages.

**Rien n’active automatiquement GitHub Pages dans cette V1.** Un dépôt privé peut nécessiter un abonnement GitHub compatible pour Pages. Le passage du dépôt en public et l’activation de Pages doivent être décidés explicitement.

Le workflow inclus ne fait que lancer les tests. Aucune collecte récurrente ni publication automatique n’a été activée.

## Présenter le projet sur un CV

À utiliser une fois le projet étudié et compris :

> Développement d’un observatoire web des offres data : collecte d’un export Open Data en Python, normalisation et déduplication multi-localisations, extraction de mentions de compétences, filtres interactifs et exports CSV/JSON. Documentation des biais et tests unitaires.

Ne pas prétendre avoir analysé « tout le marché français » ni présenté des salaires moyens : les données ne le permettent pas.

## Évolutions possibles

- Ajouter un deuxième producteur avec une licence et un schéma compatibles.
- Constituer des instantanés successifs pour comparer les évolutions, avec périmètre constant.
- Annoter manuellement un échantillon pour mesurer précision et rappel de la classification.
- Ajouter des salaires uniquement si devise, période et unité sont fiables.
- Enrichir le contrôle qualité et comparer les biais entre sources.
