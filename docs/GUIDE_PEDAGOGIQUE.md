# Guide technique · Élan MSI

Ce projet applique HTML, CSS, données web et Python au besoin d’orientation et de recherche de stages d’une formation MSI. Le JavaScript interactif, les tests navigateur et l’intégration continue constituent des approfondissements ; ils ne sont pas présentés comme des compétences déjà évaluées dans le cours.

## Architecture à expliquer

- **Structure :** `site/index.html` définit navigation, filtres, liste, états d’actualisation et dialogue.
- **Présentation :** `site/global.css` et `site/style.css` gèrent les styles, grilles et adaptations mobiles.
- **Interaction :** `site/app.js` filtre les données en mémoire, rend les résultats et exporte toute la sélection.
- **Langues :** `site/i18n.js` contient les six dictionnaires d’interface ; les contenus des recruteurs ne sont pas traduits automatiquement.
- **Données :** `scripts/collect.py` valide, normalise et regroupe les annonces ; `taxonomy.py` rattache les familles MSI aux parcours.
- **Actualisation :** `scripts/refresh.py` prépare un candidat, contrôle les écarts, sauvegarde l’ancien instantané et publie un état de succès ou d’échec.
- **Ressources :** `site/msi.html` et `msi-app.js` présentent métiers, parcours et graphiques sur le même corpus actualisé, hors archives.

## Points de raisonnement

- **Ligne ou annonce :** une référence peut être répétée pour plusieurs villes. La déduplication évite de compter plusieurs fois le même poste ; la somme des territoires peut encore dépasser le total de références.
- **Éligibilité :** un rattachement à un parcours n’est pas une garantie d’accès. Les niveaux, durées et preuves sont affichés sans inventer d’équivalences.
- **Statut :** présence dans une source, disponibilité à vérifier et fermeture signalée sont des informations différentes. La dernière collecte BPCE ne rafraîchit pas artificiellement les fiches manuelles.
- **Qualité :** une annonce sans URL ou description valide fait échouer la collecte plutôt que remplacer silencieusement les données.
- **Automatisation :** une tâche quotidienne n’est pas une notification en temps réel. Les tests conditionnent la publication ; le workflow reste consultable.
- **Sécurité :** les textes sont échappés, les liens filtrés et les cellules CSV potentiellement exécutables neutralisées. Une erreur réseau ou un stockage local interdit ne doit pas produire une page inutilisable.

## Expériences reproductibles

1. Exécuter les tests Python puis modifier temporairement une variante « fin d’études » pour observer une régression.
2. Fournir un fichier éditorial introuvable ou une annonce sans description et vérifier le refus avant écriture.
3. Comparer les deux exports miroirs et leurs métadonnées.
4. Exécuter Playwright pour suivre archives, langues, profils, exports, navigation et état d’échec.
5. Consulter les captures desktop/mobile et distinguer contrôle visuel, assertion automatique et garantie non démontrée.

Les commandes figurent dans le [README](../README.md) et les scénarios dans [QA.md](../QA.md). Ce guide accompagne la lecture du code et l’explication des choix techniques du projet.
