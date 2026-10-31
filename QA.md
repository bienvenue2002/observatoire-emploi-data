# Recette reproductible · Élan MSI

La version 4 recentre le site sur le MSI et introduit la collecte quotidienne protégée. Ce document décrit les contrôles exécutables et les preuves produites ; les chiffres et affirmations des recettes antérieures ne sont pas repris comme garanties de la version actuelle.

## Version et exécution

- **Périmètre testé :** code de cette révision, version de pipeline `4.0.0`, données publiques du dépôt. Le SHA exact est celui de l’exécution GitHub ; un renouvellement quotidien change les dates et peut changer les volumes.
- **Environnement :** Python 3.10+ local, Python 3.12 en CI, Node.js 22 en CI et Playwright verrouillé par `package-lock.json`.
- **Rapports :** `playwright-report/index.html`, résultats et captures dans `test-results/`. Le workflow les conserve 14 jours sous `recette-navigateur-<SHA>` ; ces fichiers temporaires ne sont pas inclus dans le site public.

```bash
python -m unittest discover -s tests -v
node --check site/app.js
node --check site/msi-app.js
node tests/test_i18n.cjs
npm ci
npx playwright install chromium
npx playwright test
# Le serveur local est lancé automatiquement par la configuration.
```

Pour rejouer contre un déploiement, définir `ELAN_BASE_URL` sur son URL complète ; le serveur local n’est alors pas lancé. Les preuves du [workflow public](https://github.com/bienvenue2002/observatoire-emploi-data/actions/workflows/pages.yml) permettent de relier une recette à sa révision.

## Tests Python et JavaScript

- **Extraction :** normalisation, déduplication, pays explicites, familles MSI, durées, niveaux, variantes de fin d’études et exclusions d’expérience passée.
- **Protection :** URL ou description absente, date invalide, schéma incomplet et chemin éditorial manquant provoquent un refus.
- **Actualisation :** échec de source ou validation sans modification des anciens fichiers, date de succès conservée, baisse supérieure à 50 % refusée, succès et miroirs cohérents.
- **Langues :** six dictionnaires, clés identiques, variables de substitution cohérentes et clés HTML reconnues ; les traductions ne font pas l’objet d’une certification linguistique native.

Les cas réels `BPCE_INFO01955` et `BPCE_INFO01938` ont aussi été contrôlés sur le corpus du 31 octobre 2026 : leur avancement est « Fin d’études ». Les tests unitaires conservent des exemples indépendants des futures suppressions d’annonces.

## Suite navigateur versionnée

`tests/browser/site.spec.cjs` vérifie :

- **Profils et archives :** résultats étudiants par défaut, absence d’archives, détail fin d’études, filtre archives, statuts et exports JSON de toute la sélection.
- **International et langues :** stage Capgemini en Pologne, six langues, sélection préservée, quatre vues et liens d’origine, parcours ID.
- **Navigation et affichage :** pagination, tri, filtres, réinitialisation, raccourci régional, captures desktop 1440 px et allemand 375 px ; vérification du débordement horizontal.
- **Ressources MSI :** cinq vues, navigation mobile et exclusion de l’exemple Wiremind des résultats.
- **Mode dégradé :** réponse d’actualisation en échec, dernière date de succès visible, données encore utilisables, changement de langue et stockage local bloqué.
- **Robustesse :** chargement HTTP 503 puis réessai réussi, HTML injecté affiché comme texte, lien `javascript:` absent et formule neutralisée dans un CSV réellement téléchargé.
- **Typographie :** chargement réel de Source Sans 3 depuis le site, tailles minimales des textes, six langues à 320 px, deux pages à 1440/768/375/320 px et agrandissement de la taille racine à 200 % sans débordement horizontal.

Les captures sont générées par le scénario « filtres, tri, pagination et captures desktop/mobile » et peuvent être inspectées manuellement. Une assertion d’absence de débordement ne prouve pas à elle seule la qualité visuelle de toutes les langues ou tailles d’écran.

## Limites et historique

Les anciens comptes rendus mentionnaient notamment 52 assertions et un contraste minimal précis sans suite correspondante versionnée. Ils constituent des notes historiques accessibles dans Git, pas des preuves reproductibles ni une certification actuelle ; aucun score de contraste ou de conformité complet n’est revendiqué ici.

Les tests ne garantissent pas la disponibilité des annonces tierces, l’exhaustivité du corpus, une conformité RGAA/WCAG complète ni le respect de l’horaire par GitHub. Une panne de GitHub avant déploiement peut empêcher l’affichage d’un nouvel avertissement ; l’ancien site reste publié et l’historique du workflow fait foi pour l’exécution.

## Recette réalisée le 31 octobre 2026

La révision applicative `949d0fe` a passé 41 tests Python, le contrôle des six dictionnaires et les six scénarios Playwright. Les mêmes six scénarios ont ensuite réussi contre le site GitHub Pages en contexte navigateur neuf ; les captures desktop et allemand mobile ont été inspectées visuellement, sans revendication de certification d’accessibilité.

La [publication initiale](https://github.com/bienvenue2002/observatoire-emploi-data/actions/runs/41164411936) et le [cycle réel collecte → tests → commit → déploiement](https://github.com/bienvenue2002/observatoire-emploi-data/actions/runs/41164441639) ont réussi. Ce dernier a produit la révision de données `6861e35` et l’artefact `recette-navigateur-6861e35991aabc12a2033df0881d4895c25b3e2c`, avec rapports, captures et métadonnées ; la dernière collecte réussie correspondante est `2026-10-31T03:28:02+00:00`.

L’aperçu hébergé a aussi été rechargé dans un nouveau contexte : interface japonaise, filtre Pologne, stage international et téléchargement CSV réels ont fonctionné. Ces résultats attestent cette recette datée, pas l’état futur des annonces tierces.
