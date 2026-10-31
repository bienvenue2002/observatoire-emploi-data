# Horizon MSI · Du master aux métiers

Un portail d’orientation et d’exploration des offres liées au Master Management des Systèmes d’Information de Grenoble IAE. Anciennement DataScope, le projet ne se limite plus aux métiers data : il couvre conseil, ERP, business analysis, produit, projets, cybersécurité, audit, données et recherche.

Projet académique indépendant, non affilié à l’école ni aux recruteurs. Auteur : Abra-Bienvenue Tchakah, [bienvenue2002](https://github.com/bienvenue2002). Le nom historique du dépôt est conservé pour ne pas casser ses liens.

Le dépôt est privé. Son passage en public et GitHub Pages ne sont pas activés sans décision explicite.

## Ce que l’on peut explorer

- **Trois parcours :** CMSI, Intelligence des données et ARAMIS, avec rattachements indicatifs aux métiers.
- **Dix-sept fiches :** débouchés et perspectives cités dans la brochure, complétés de deux métiers data connexes explicitement signalés.
- **Des repères de niveau :** stage/junior, évolution avec expérience, ou poursuite en doctorat.
- **Des offres sourcées :** recherche, parcours, métier, région, contrat, compétence et source.
- **Des interactions :** graphiques cliquables, raccourcis stage/région, tri, pagination et fiches détaillées.
- **Des exports :** CSV et JSON de la sélection, avec parcours, provenance, date et mode de collecte.
- **Une méthode lisible :** déduplication, protection des coordonnées, limites du corpus et statut des sources.

## Formation : le périmètre de référence

La brochure `MSI-20WEB.pdf` fournie, page 3, est la référence principale. Les pages officielles permettent de consulter les parcours :

- [Conseil et Management des Systèmes d’Information](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-conseil-et-management-des-systemes-dinformation).
- [Intelligence des Données](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-intelligence-des-donnees).
- [Advanced Research in Management of Information Systems](https://iae.grenoble-inp.fr/en/our-programs/master-2-advanced-research-in-management-of-information-system).

Les missions et idées de projets sont des reformulations pédagogiques. Un rattachement ne garantit pas l’admission à un parcours ou l’éligibilité à une offre. Chief Data Officer est une perspective de direction, pas un premier emploi promis ; l’enseignement-recherche nécessite une poursuite en doctorat puis un recrutement.

## Deux modes de données, pas de fausse intégration

L’instantané du 31 octobre 2026 contient **81 annonces** : 74 issues de l’export BPCE reclassé sur le périmètre MSI et 7 fiches éditoriales.

| Origine | Fiches | Mode |
|---|---:|---|
| Groupe BPCE | 74 | Export Open Data, transformation Python |
| Deloitte, via Welcome to the Jungle | 2 | Sélection éditoriale datée |
| Capgemini, site carrières | 1 | Sélection éditoriale datée |
| Welcome to the Jungle, autres employeurs | 2 | Sélection éditoriale datée |
| JobTeaser, annonces publiques Capgemini | 2 | Sélection éditoriale datée |

Ces comptes décrivent le corpus du projet, pas les volumes totaux des plateformes. Le détail factuel de chaque fiche et son URL se trouvent dans `data/curated.json` ; les pages effectivement consultées et les exclusions figurent dans [le journal des sources](docs/SOURCES.md).

BPCE : 1 888 lignes initiales, 1 785 situées en France, 192 retenues par les règles MSI, puis 74 références uniques. Les 52 annonces de la première version ont toutes été conservées ; certaines ont changé de famille métier.

Seul [l’export public BPCE](https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques) est collecté automatiquement. Aucune API Deloitte, Capgemini, WTTJ ou JobTeaser n’est branchée ; aucun Career Center privé n’est consulté. Les fiches éditoriales utilisent des informations factuelles, un lien et une synthèse originale, pas les descriptions intégrales.

**Statistiques de compétences :** les résumés éditoriaux ne sont pas comparables aux descriptions complètes. Le graphique et le mot-clé dominant sont donc calculés uniquement sur les offres BPCE sélectionnées. Les tags éditoriaux restent filtrables.

## Lancer le site

Python 3.10 ou plus ; aucune dépendance Python tierce.

```bash
git clone https://github.com/bienvenue2002/observatoire-emploi-data.git
cd observatoire-emploi-data
python3 -m http.server 8000 --directory site
```

Ouvrir `http://localhost:8000`. Ce serveur suffit à un usage personnel local. Éviter le double-clic `file://`, qui empêche généralement `fetch()` de lire les données JSON.

## Actualiser et tester

```bash
# Actualiser BPCE et importer la sélection éditoriale locale :
python3 scripts/collect.py

# Rejouer un export brut conservé localement :
python3 scripts/collect.py --input data/raw/bpce.json \
  --observed-at 2026-10-31T01:48:12+00:00

# Utiliser une autre sélection éditoriale :
python3 scripts/collect.py --curated data/curated.json

python3 -m unittest discover -s tests -v
node --check site/app.js
```

La date `--observed-at` doit correspondre au téléchargement réel du brut. Les fiches éditoriales conservent chacune leur propre date de consultation ; relancer le script ne revérifie pas leurs liens et ne modifie pas cette date.

Le brut n’est pas versionné : il contient des contacts recruteurs et des offres hors périmètre. La collecte par défaut travaille en mémoire. Une source vide ou au schéma inattendu fait échouer la commande avant export. Les fiches éditoriales sont validées avant remplacement : identifiants/URLs uniques, HTTPS et domaines admis.

## Structure

```text
scripts/collect.py          Collecte BPCE, nettoyage, classement et exports
scripts/taxonomy.py         Rattachement familles / parcours
data/curated.json           Sept références éditoriales, liens et dates
tests/test_collect.py      Quinze tests unitaires hors réseau
site/index.html            Les cinq vues du site
site/style.css             Responsive, cartes métiers et sources
site/app.js                Filtres, calculs, navigation, détails et exports
site/data/catalog.json     Parcours, fiches métiers et statut des sources
site/data/jobs.json        Corpus complet et métadonnées
site/data/jobs.csv         Export complet
site/data/meta.json        Audit du corpus
docs/METHODOLOGIE.md        Règles, définitions et limites
docs/SOURCES.md             Journal des sources et exclusions
docs/GUIDE_PEDAGOGIQUE.md  Appropriation du projet et exercices
site.FLOWS.md              Recette des parcours, hors déploiement
QA.md                      Résultats des vérifications
```

Héberger seulement `site/`. Les fiches métiers sont des données éditoriales : modifier `catalog.json` permet d’ajouter une fiche sans réécrire toute la page HTML.

## Choix techniques et confidentialité

HTML sémantique, CSS Grid/Flexbox, JavaScript natif et pipeline Python standard. Pas de framework, backend, clé API, stockage de candidature, cookies analytiques ou compte utilisateur. Les polices Manrope et IBM Plex Mono utilisent Google Fonts, avec fontes système de secours.

Les descriptions BPCE sont nettoyées et les emails/numéros français détectés sont masqués. Ce traitement ne constitue pas une garantie exhaustive d’anonymisation du texte libre. Les offres et liens restent des instantanés dont la disponibilité doit être vérifiée.

## Présenter le projet

Une fois le code étudié et les choix compris :

> Développement d’Horizon MSI, portail web des débouchés du Master MSI : modélisation de parcours et familles métiers, pipeline Open Data Python, intégration de références éditoriales multi-sources, déduplication, filtres interactifs, exports CSV/JSON et tests unitaires. Documentation des biais, de la provenance et des limites d’accès aux postes.

Ne pas revendiquer un partenariat avec les entreprises, une agrégation automatique des quatre plateformes ou une couverture représentative du marché.

## Déploiement

Le dossier `site/` fonctionne sur un hébergement statique. Le workflow GitHub inclus vérifie le code ; il n’active ni collecte récurrente ni publication automatique. Le dépôt reste privé et GitHub Pages n’est pas activé.
