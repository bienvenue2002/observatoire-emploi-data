# Comprendre et défendre DataScope

Ce projet est une base de travail à étudier, modifier et expliquer. Il ne faut pas présenter comme acquises des notions que l’on ne sait pas encore reproduire.

## Correspondance avec le cours

| Partie du cours | Application dans DataScope |
|---|---|
| Internet et Web | Requête HTTP GET sur un export public, hébergement statique |
| HTML | Structure sémantique, formulaires, tableau, liens, dialogue |
| CSS | Variables, Flexbox, Grid, media queries et responsive |
| JSON / CSV / API | Lecture JSON source, transformation Python, exports |
| Python | Variables, listes, dictionnaires, fonctions, conditions, boucles et fichiers |
| Collecte web | Consommation d’un export public plutôt que scraping non autorisé |

JavaScript interactif, expressions régulières avancées, tests et GitHub Actions dépassent les bases décrites dans le cours ; ils sont documentés comme approfondissements, pas comme prérequis.

## Lire les fichiers dans cet ordre

1. `site/index.html` : repérer header, navigation, filtres, graphiques, tableau, footer.
2. `site/style.css` : comprendre les variables, les grilles et la media query mobile.
3. `site/data/meta.json` : expliquer pourquoi 1 888 lignes deviennent 52 annonces.
4. `scripts/collect.py` : suivre `main`, `transform`, puis `export`.
5. `site/app.js` : comprendre `filterJobs`, `renderMetrics`, `renderTable`.
6. `tests/test_collect.py` : modifier une règle et observer les tests.

## Six exercices pour t’approprier le projet

- Ajouter une courte introduction personnelle en HTML sans casser la hiérarchie des titres.
- Modifier l’accent visuel dans les variables CSS et contrôler le contraste.
- Ajouter une variante orthographique de région et un test associé.
- Ajouter la détection d’une compétence, avec un exemple positif et un faux positif à éviter.
- Comparer le nombre de lignes par ville et le nombre d’annonces uniques.
- Annoter manuellement dix annonces et décrire les erreurs de classification constatées.

## Questions à préparer pour un entretien

- Pourquoi JSON pour la collecte et CSV pour l’export ?
- Quelle différence entre une référence d’annonce, une ligne et un poste à pourvoir ?
- Pourquoi la somme des régions peut-elle dépasser le nombre d’annonces ?
- Pourquoi « Power BI cité » ne veut-il pas forcément dire « Power BI exigé » ?
- Pourquoi ne pas calculer un salaire moyen dans cette version ?
- Pourquoi la source BPCE ne représente-t-elle pas le marché de toute la France ?
- Qu’est-ce qu’un test unitaire vérifie, et qu’est-ce qu’il ne vérifie pas ?

## Pitch possible

« J’ai construit un observatoire web à partir d’un export Open Data d’offres d’emploi. Le pipeline Python nettoie les titres, normalise les contrats et regroupe les annonces multi-localisées. Le site permet d’explorer les métiers, les compétences citées et les régions, puis d’exporter une sélection. J’ai documenté la provenance, les limites et les tests pour que les chiffres soient explicables. »

À adapter à ce que tu as effectivement étudié et réalisé toi-même. La qualité du projet tient autant à la rigueur des données qu’au rendu du site.
