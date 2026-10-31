# Élan MSI · Stages et alternances sans frontières

Un projet web étudiant pour chercher un stage ou une alternance, quelle que soit sa formation, en France ou à l’international. La marque Élan MSI est conservée ; le moteur principal n’est plus limité au Master MSI.

**Version 3.0.0, instantané du 31 octobre 2026 : 1 555 annonces, dont 229 stages/alternances, 19 pays ou territoires représentés et 13 catégories de domaines sélectionnables.** Le corpus contient 72 annonces hors France, dont 8 stages/alternances ; les autres contrats restent accessibles séparément. Ces volumes ne sont pas un décompte d’offres encore ouvertes.

- **Site public :** [ouvrir Élan MSI](https://bienvenue2002.github.io/observatoire-emploi-data/).
- **Dépôt public :** [bienvenue2002/observatoire-emploi-data](https://github.com/bienvenue2002/observatoire-emploi-data).
- **Auteur :** Abra-Bienvenue Tchakah, Grenoble IAE.

Projet indépendant, non affilié à l’école ou aux recruteurs. Toute formation peut utiliser l’outil ; cela ne signifie pas que toutes les formations, tous les pays ou tous les niveaux sont représentés, ni qu’un étudiant est éligible à chaque poste. Le corpus est majoritairement bancaire.

## Recherche et fonctionnalités

- **Domaines :** informatique/data, finance/comptabilité/assurance, commerce, RH, droit/risques/audit, marketing, gestion/conseil, ingénierie/logistique, santé/social, arts/design, enseignement/recherche, environnement/agriculture et autres. Une catégorie vide reste visible.
- **International :** pays/territoires issus de champs explicites, villes regroupées par référence, raccourci « Hors France ». Un pays inconnu n’est pas déduit d’une ville ou de la langue demandée.
- **Contrats :** stages/alternances affichés par défaut ; CDI, CDD et VIE accessibles en changeant le contrat ou le raccourci. VIE n’est assimilé ni à un stage ni à une alternance ; les catégories françaises ne valent pas équivalence juridique internationale.
- **Profil :** durée, niveau d’études d’origine, avancement d’études si explicite, notes et preuves. Les inconnues sont signalées, jamais inventées.
- **Filtres :** recherche libre, domaine, pays, contrat, études, source, région/zone, compétence et parcours MSI facultatif ; tri, pagination et réinitialisation.
- **Exports :** CSV/JSON de toute la sélection, pas seulement de la page, avec provenance, dates et preuves. Le CSV protège les cellules interprétables comme formules.

## Six langues, sans modifier les annonces

L’interface est disponible en français, anglais, espagnol, allemand, japonais et chinois simplifié. Navigation, filtres, domaines, compteurs, dates, pays, dialogues, erreurs et états vides sont traduits dans `site/i18n.js`, sans API externe.

Les titres, descriptions, diplômes, compétences, régions issues des sources et preuves gardent leur langue d’origine, explicitement signalée. Les ressources pédagogiques MSI restent en français. La langue d’interface n’est ni un filtre géographique ni une langue de travail promise ; changer de langue conserve la sélection.

Le choix de langue peut être mémorisé localement. Si le stockage est bloqué, le site fonctionne quand même en mémoire. Pas de compte, de CV envoyé ou de suivi publicitaire.

## D’où viennent les offres ?

| Origine | Annonces intégrées | Mode |
|---|---:|---|
| Groupe BPCE | 1 547 | Export public, transformation Python |
| Deloitte via Welcome to the Jungle | 2 | Fiches éditoriales |
| Capgemini, site carrières | 2 | Fiches éditoriales, dont une en Pologne |
| Welcome to the Jungle, autres employeurs | 2 | Fiches éditoriales |
| JobTeaser | 2 | Fiches éditoriales |

Le [catalogue BPCE](https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques) et son [export JSON](https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json) fournissent la base automatisable. La Licence Ouverte 2.0 concerne BPCE, pas les autres plateformes.

La fiche internationale ajoutée est [Intern Application Consultant, Capgemini, Pologne, référence 506269](https://careers.capgemini.com/job/Wroc%C5%82aw-Intern-Application-Consultant-(with-German)/1406556233/), vérifiée le 31 octobre 2026 : contrat source Internship, deuxième année d’études IT/mathématiques/physique ou première pratique/cours IT, anglais et allemand B2 ; durée non précisée. L’allemand exigé ne signifie pas que le poste est situé en Allemagne.

Les liens complémentaires vers [Welcome to the Jungle](https://www.welcometothejungle.com/fr/jobs), [JobTeaser](https://www.jobteaser.com/en/job-offers), [Capgemini](https://www.capgemini.com/careers/join-capgemini/job-search/?keyword=Internship&size=30) et [ErasmusIntern](https://erasmusintern.org/) ouvrent des plateformes externes. Ils ne sont pas comptés comme annonces intégrées ; il faut y appliquer ses propres filtres et respecter leurs conditions d’accès.

## Espace pédagogique MSI conservé

L’accès [Ressources MSI, en français](https://bienvenue2002.github.io/observatoire-emploi-data/msi.html) conserve les 17 fiches métiers, les trois parcours CMSI/ID/ARAMIS, les graphiques, les cinq vues et l’instantané historique de 81 annonces. Ses fichiers sont séparés du nouveau moteur ; toutes ses références restent aussi présentes dans le corpus élargi.

Références académiques Grenoble IAE : [CMSI](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-conseil-et-management-des-systemes-dinformation), [Intelligence des données](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-intelligence-des-donnees), [ARAMIS](https://iae.grenoble-inp.fr/en/our-programs/master-2-advanced-research-in-management-of-information-system). Les rattachements sont indicatifs, jamais une garantie d’admission ou d’éligibilité.

## Lancer et tester

Python 3.10+ suffit pour servir le site et générer les données. Le frontend utilise HTML, CSS et JavaScript sans framework ; Node.js vérifie sa syntaxe et les dictionnaires.

```bash
python -m http.server 8000 --directory site
# Ouvrir http://localhost:8000
python -m unittest discover -s tests -v
node --check site/app.js
node --check site/msi-app.js
node tests/test_i18n.cjs
```

## Régénérer les données

```bash
# Export public BPCE et import des fiches locales
python scripts/collect.py
# Rejouer un téléchargement en conservant sa vraie date
python scripts/collect.py --input data/raw/bpce.json \
  --observed-at 2026-10-31T01:48:12+00:00 --scope all
# Ancien périmètre MSI France dans un autre dossier
python scripts/collect.py --input data/raw/bpce.json --scope msi \
  --output /tmp/elan-msi-controle
```

Le mode par défaut `all` prend tous les domaines et pays de la source. Une entrée administrative « Background Check » sans métier est écartée ; 1 887 lignes BPCE deviennent 1 547 références, puis 8 fiches éditoriales sont ajoutées. Relancer le pipeline ne revérifie pas automatiquement les pages éditoriales et ne collecte pas les portails complémentaires.

Le brut, ignoré par Git, peut contenir des coordonnées de recruteurs et ne doit jamais être publié. Les fichiers nettoyés sont versionnés. Date source, date de collecte et date de vérification éditoriale restent distinctes.

## Structure et documentation

```text
site/index.html, global.css, app.js, i18n.js   moteur international
site/msi.html, msi-app.js, style.css          espace pédagogique conservé
site/data/jobs.json, jobs.csv, meta.json      corpus élargi
site/data/msi-jobs.*                         instantané MSI historique
scripts/collect.py, global_scope.py          collecte, nettoyage et domaines
scripts/taxonomy.py                         rattachements pédagogiques MSI
data/curated.json, international.json        8 fiches éditoriales datées
tests/                                      tests Python et traductions
docs/                                       sources, méthode et guide de cours
```

Voir [méthodologie](docs/METHODOLOGIE.md), [sources](docs/SOURCES.md), [guide pédagogique](docs/GUIDE_PEDAGOGIQUE.md) et [recette](QA.md). GitHub Actions vérifie le projet et publie uniquement `site/` ; aucune donnée brute ni clé privée n’est nécessaire au navigateur.
