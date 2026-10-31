# Comprendre et défendre Élan MSI

Ce projet est une base de travail à étudier, modifier et expliquer. Il ne faut pas présenter comme acquises des notions que l’on ne sait pas encore reproduire.

La version 3 ouvre le moteur à toutes les formations et à l’international, avec six langues d’interface. Le corpus reste partiel ; l’espace pédagogique MSI historique est conservé séparément en français. Les traductions d’interface ne traduisent pas les annonces et n’établissent aucune équivalence de diplôme ou de contrat.

## Correspondance avec le cours

| Partie du cours | Application dans Élan MSI |
|---|---|
| Internet et Web | Requête HTTP GET sur un export public, hébergement statique |
| HTML | Structure sémantique, formulaires, tableau, liens, dialogue |
| CSS | Variables, Flexbox, Grid, media queries et responsive |
| JSON / CSV / API | Lecture JSON source, transformation Python, exports, durée et niveau d’études accompagnés de preuves |
| Python | Variables, listes, dictionnaires, fonctions, conditions, boucles et fichiers |
| Collecte web | Consommation d’un export public plutôt que scraping non autorisé |

JavaScript interactif, expressions régulières avancées, tests et GitHub Actions dépassent les bases décrites dans le cours ; ils sont documentés comme approfondissements, pas comme prérequis.

## Lire les fichiers dans cet ordre

1. `site/index.html` : repérer header, navigation, filtres, résultats, dialogue et footer.
2. `site/style.css` et `site/global.css` : comprendre les variables, grilles et adaptations mobiles.
3. `site/data/meta.json` : expliquer pourquoi 1 888 lignes deviennent 1 547 références BPCE après exclusion d’une entrée administrative, puis 1 555 annonces avec les huit fiches éditoriales.
4. `scripts/collect.py` : suivre `main`, `transform`, puis `export`.
5. `site/app.js` : comprendre `filterJobs`, `renderResults`, `renderDetail` et les exports.
6. `tests/test_collect.py` : modifier une règle et observer les tests.
7. `site/data/catalog.json` et `scripts/taxonomy.py` : vérifier la cohérence des familles métiers et des trois parcours.
8. `data/curated.json`, `data/international.json` et `docs/SOURCES.md` : distinguer import éditorial, collecte automatisée et lien externe.
9. `site/i18n.js` et `tests/test_i18n.cjs` : comparer les six dictionnaires, les variables et les textes conservés en langue d’origine.
10. `scripts/global_scope.py` : expliquer la classification indicative et les pays explicites.
11. `site/msi.html`, `msi-app.js`, `data/msi-jobs.json` : retrouver les graphiques, cinq vues et 81 annonces historiques.

## Exercices pour t’approprier le projet

- Ajouter une courte introduction personnelle en HTML sans casser la hiérarchie des titres.
- Modifier l’accent visuel dans les variables CSS et contrôler le contraste.
- Ajouter une variante orthographique de région et un test associé.
- Ajouter la détection d’une compétence, avec un exemple positif et un faux positif à éviter.
- Comparer le nombre de lignes par ville et le nombre d’annonces uniques.
- Annoter manuellement dix annonces et décrire les erreurs de classification constatées.
- Ajouter une fiche métier sourcée sans modifier la logique de rendu JavaScript.
- Expliquer pourquoi les résumés éditoriaux ne doivent pas entrer dans le dénominateur du graphique des compétences BPCE.

## Questions à préparer pour un entretien

- Pourquoi JSON pour la collecte et CSV pour l’export ?
- Quelle différence entre une référence d’annonce, une ligne et un poste à pourvoir ?
- Pourquoi la somme des régions peut-elle dépasser le nombre d’annonces ?
- Pourquoi « Power BI cité » ne veut-il pas forcément dire « Power BI exigé » ?
- Pourquoi ne pas calculer un salaire moyen dans cette version ?
- Pourquoi la source BPCE ne représente-t-elle pas le marché de toute la France ?
- Qu’est-ce qu’un test unitaire vérifie, et qu’est-ce qu’il ne vérifie pas ?
- Pourquoi un rattachement à ARAMIS ne signifie-t-il pas qu’une offre est un contrat doctoral ?
- Pourquoi ne pas afficher un logo d’entreprise comme si elle était partenaire de ce projet ?

## Pitch possible

« J’ai construit un portail web des débouchés du Master MSI. J’ai modélisé les trois parcours et les familles métiers, puis relié des offres Open Data et une sélection éditoriale multi-source. Le pipeline Python nettoie et regroupe les annonces ; le site propose des fiches métiers, des filtres et des exports. Je distingue les sources, les niveaux d’accès et les dénominateurs pour ne pas présenter des résultats trompeurs. »

À adapter à ce que tu as effectivement étudié et réalisé toi-même. La qualité du projet tient autant à la rigueur des données qu’au rendu du site.
