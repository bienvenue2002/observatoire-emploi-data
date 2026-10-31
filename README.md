# Élan MSI · Du master aux métiers

Un portail étudiant consacré aux débouchés du Master Management des Systèmes d’Information : rechercher un stage ou une alternance, comparer les profils demandés et découvrir les parcours CMSI, Intelligence des données et ARAMIS. La recherche concerne uniquement les familles de métiers MSI, en France et à l’international.

- **Site public :** [Élan MSI](https://bienvenue2002.github.io/observatoire-emploi-data/).
- **Ressources pédagogiques :** [parcours, métiers et graphiques](https://bienvenue2002.github.io/observatoire-emploi-data/msi.html).
- **Actualisations :** [exécutions et état du workflow](https://github.com/bienvenue2002/observatoire-emploi-data/actions/workflows/pages.yml).
- **Porteuse du projet :** Abra-Bienvenue Tchakah, Grenoble IAE.

Projet personnel à visée pédagogique et de portfolio, indépendant de l’établissement et des recruteurs. Ce dépôt ne revendique ni partenariat ni validation académique officielle.

## Ce que propose le site

- **Métiers MSI :** analyse de données, BI, data engineering/science, Business Analysis, SI, conseil, audit IT, cybersécurité, gouvernance et autres familles reliées aux trois parcours. La famille « Gouvernance et qualité des données » n’assimile pas des stages de Data Quality ou des fonctions de Data Steward à un poste de Chief Data Officer ; CDO reste une perspective d’évolution.
- **Recherche :** famille métier, pays, contrat, études, source, région, compétences, parcours, tri et pagination. Les stages et alternances hors archives sont affichés par défaut ; les autres contrats restent accessibles dans le périmètre MSI.
- **Profil étudiant :** durée, niveau d’études demandé, avancement des études et extraits justificatifs. Une information absente reste « Non précisé » ; les études passées ne sont pas assimilées à un stage recherché.
- **International :** pays et territoires issus d’informations explicites. Une langue exigée n’est pas transformée en pays et un diplôme étranger n’est pas converti arbitrairement en niveau français.
- **Six langues :** français, anglais, espagnol, allemand, japonais et chinois simplifié pour l’interface. Les annonces et preuves restent dans leur langue d’origine ; la page de ressources pédagogiques reste en français.
- **Exports :** CSV et JSON de toute la sélection, pas seulement de la page affichée, avec profils, provenance, dates et statuts. Les cellules CSV pouvant être interprétées comme formules sont protégées.

L’ouverture à toutes les formations de la version 3 est abandonnée. Les deux pages partagent désormais le même corpus MSI actualisé ; la page de ressources n’est plus un instantané séparé de 81 annonces.

## D’où viennent les offres ?

**BPCE est la source principale**, enrichie d’une sélection éditoriale Deloitte, Capgemini, Welcome to the Jungle et JobTeaser. Sa part réelle et les volumes sont calculés à partir des fichiers publics plutôt que figés dans ce README ; ce corpus très bancaire ne représente pas tout le marché.

La collecte utilise l’[export public BPCE](https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json), décrit dans le [catalogue data.gouv.fr](https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques). La Licence Ouverte du jeu BPCE ne s’étend pas aux plateformes éditoriales ; les fiches manuelles utilisent des résumés originaux et renvoient aux pages d’origine.

Les huit fiches éditoriales comprennent deux exemples archivés. Les fermetures de Wiremind et Navigacom proviennent de la revue transmise par la propriétaire du projet ; la tentative de vérification automatisée n’a pas permis de les confirmer indépendamment. Elles portent « Offre fermée — exemple archivé », sont exclues des résultats par défaut et conservent l’origine de ce signalement.

« Présente dans le dernier export BPCE » ne signifie pas « candidature garantie ouverte ». Une fiche éditoriale importée lors d’une collecte n’est pas considérée comme fraîchement revérifiée ; ses propres dates sont conservées. Voir [la documentation des sources](docs/SOURCES.md).

## Actualisation quotidienne

Le [workflow GitHub Actions](https://github.com/bienvenue2002/observatoire-emploi-data/blob/master/.github/workflows/pages.yml) est programmé chaque jour à **04 h 17 UTC**, soit 05 h 17 en France métropolitaine en hiver et 06 h 17 en été. Il peut aussi être lancé manuellement depuis GitHub ; l’ordinateur personnel peut rester éteint.

1. Télécharger l’export BPCE et valider le schéma, les descriptions, les URL et les dates.
2. Retenir les métiers MSI, regrouper les localisations et importer les fiches éditoriales sans changer leur date de vérification.
3. Refuser une baisse supérieure à 50 % des références BPCE sans validation humaine explicite.
4. Préparer et contrôler les nouveaux fichiers avant de remplacer l’instantané, avec sauvegarde et restauration en cas d’échec de remplacement.
5. Exécuter les tests Python, JavaScript et navigateur, versionner les données puis publier GitHub Pages dans le même workflow.

Une collecte refusée conserve le dernier corpus valide et sa date de succès ; un fichier séparé signale la tentative échouée. Si la suite de tests ou l’infrastructure GitHub tombe en panne avant publication, le site public reste sur son dernier déploiement : consulter alors l’historique du workflow.

Ce n’est pas du temps réel : de nouvelles offres apparaissent après leur présence dans l’export et une collecte réussie. GitHub précise que les [exécutions programmées peuvent être retardées et désactivées après 60 jours d’inactivité d’un dépôt public](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

Les fiches éditoriales ne sont pas revérifiées automatiquement. Aucun robot ne contourne les accès de Welcome to the Jungle ou JobTeaser, et aucun compte candidat ou CV n’est demandé.

## Lancer et vérifier

Python 3.10+ sert le site et exécute le pipeline standard-library. Node.js 22 et Playwright sont utilisés pour la recette navigateur reproductible.

```bash
python -m http.server 8000 --directory site
# Ouvrir http://localhost:8000

python -m unittest discover -s tests -v
node --check site/app.js
node --check site/msi-app.js
node tests/test_i18n.cjs
npm ci
npx playwright install chromium
npx playwright test

# Collecte complète, validation et état d’actualisation
python scripts/refresh.py

# Rejouer un export local autorisé, sans appel réseau
python scripts/collect.py --input /chemin/export-bpce.json \
  --observed-at 2026-10-31T03:18:42+00:00 --scope msi-international
```

Ne pas publier l’export brut : seules les données normalisées de `site/data/` sont déployées. `--allow-large-drop` doit être réservé à une revue humaine d’une baisse réelle ; il ne désactive pas les autres validations.

## Organisation et preuves

- **Frontend :** `site/index.html`, `app.js`, `global.css`, `i18n.js` ; ressources françaises dans `msi.html` et `msi-app.js`.
- **Données :** `scripts/collect.py`, `taxonomy.py`, `global_scope.py` et `refresh.py` ; sélections dans `data/curated.json` et `data/international.json`.
- **Tests :** `tests/test_*.py`, `tests/test_i18n.cjs` et `tests/browser/site.spec.cjs`.
- **Explications :** [méthodologie](docs/METHODOLOGIE.md), [sources consultables](docs/SOURCES.md), [guide technique](docs/GUIDE_PEDAGOGIQUE.md) et [procédure de recette](QA.md).

Les rapports Playwright et captures desktop/mobile sont produits par une suite versionnée et conservés 14 jours comme artefacts du workflow, identifiés par le commit testé. Les anciens comptes rendus ne constituent pas une garantie de conformité actuelle ou une mesure d’accessibilité certifiée.

## Ma contribution et les outils utilisés

- **Choix du produit :** j’ai choisi le besoin étudiant, validé le nom Élan MSI et précisé le périmètre de ma formation, les langues, l’international, les profils demandés et l’actualisation souhaitée.
- **Mise en œuvre assistée :** le code HTML/CSS/JavaScript, le pipeline Python, les tests, la documentation et les workflows ont été élaborés avec l’aide de Perplexity Computer. Je ne présente pas ces éléments comme une réalisation entièrement autonome.
- **Démarche de portfolio :** le dépôt rend les règles, limites et tests consultables. La compréhension et l’explication personnelle du code restent distinctes de l’assistance reçue ; une soutenance ou une évaluation n’est pas attestée par ce README.
